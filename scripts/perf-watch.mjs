/**
 * perf-watch.mjs
 *
 * Surveillance des Core Web Vitals via l'API PageSpeed Insights, tous les
 * 3 jours. Mesure, diagnostique, applique les corrections mecaniquement sures
 * et alerte sur Telegram.
 *
 * Ce script ne corrige QUE ce qui ne peut ni changer le contenu ni le design :
 * aujourd'hui les dimensions declarees des images. Tout le reste est
 * diagnostique et remonte, jamais applique — compresser une image, differer un
 * script ou extraire du CSS critique demande un arbitrage qu'un automate ne
 * peut pas rendre sans risque.
 *
 * Variables : PAGESPEED_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 * Usage : node scripts/perf-watch.mjs [--no-fix]
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const HISTORY = path.join(ROOT, "seo-reports", "perf-history.json");

const SITE = "https://msd-media.com";
const PAGES = [
  { url: `${SITE}/`, label: "Accueil" },
  { url: `${SITE}/tarifs/`, label: "Tarifs" },
  { url: `${SITE}/agence-web-annecy/`, label: "Agence Annecy" },
  { url: `${SITE}/realisations/`, label: "Realisations" },
  { url: `${SITE}/blog/articles/maxens-soldan/`, label: "Article blog" },
];

const TARGET = 90;
const RUNS = 3; // Lighthouse est bruite : 70, 88 puis 72 sur la meme page.

// ─── MESURE ─────────────────────────────────────────────────────────────────

async function psi(url, strategy) {
  const ep = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  ep.searchParams.set("url", url);
  ep.searchParams.set("strategy", strategy);
  for (const c of ["performance", "seo", "accessibility", "best-practices"]) {
    ep.searchParams.append("category", c);
  }
  if (process.env.PAGESPEED_API_KEY) ep.searchParams.set("key", process.env.PAGESPEED_API_KEY);

  const res = await fetch(ep, { signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`PSI ${res.status} sur ${url}`);
  const j = await res.json();
  const lr = j.lighthouseResult;
  const cat = (id) => Math.round((lr.categories[id]?.score ?? 0) * 100);
  return {
    performance: cat("performance"),
    seo: cat("seo"),
    accessibility: cat("accessibility"),
    bestPractices: cat("best-practices"),
    lcp: lr.audits["largest-contentful-paint"]?.numericValue ?? 0,
    tbt: lr.audits["total-blocking-time"]?.numericValue ?? 0,
    cls: lr.audits["cumulative-layout-shift"]?.numericValue ?? 0,
    audits: lr.audits,
  };
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

async function measure(page) {
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    try {
      runs.push(await psi(page.url, "mobile"));
    } catch (e) {
      console.warn(`  [${page.label}] passe ${i + 1} echouee : ${e.message}`);
    }
    if (i < RUNS - 1) await new Promise((r) => setTimeout(r, 4000));
  }
  if (!runs.length) return null;
  // La mediane sur trois passes evite de reagir au bruit de mesure.
  const pick = (k) => median(runs.map((r) => r[k]));
  const best = runs[runs.findIndex((r) => r.performance === pick("performance"))] ?? runs[0];
  return {
    label: page.label,
    url: page.url,
    runs: runs.map((r) => r.performance),
    performance: pick("performance"),
    seo: pick("seo"),
    accessibility: pick("accessibility"),
    bestPractices: pick("bestPractices"),
    lcp: pick("lcp"),
    tbt: pick("tbt"),
    cls: pick("cls"),
    audits: best.audits,
  };
}

// ─── DIAGNOSTIC ─────────────────────────────────────────────────────────────

const OPPORTUNITIES = [
  ["render-blocking-resources", "Ressources bloquant le rendu"],
  ["unused-javascript", "JavaScript inutilise"],
  ["unused-css-rules", "CSS inutilise"],
  ["uses-responsive-images", "Images surdimensionnees"],
  ["uses-optimized-images", "Images a recompresser"],
  ["modern-image-formats", "Formats d'image modernes"],
  ["uses-text-compression", "Compression texte"],
  ["server-response-time", "Temps de reponse serveur"],
  ["uses-long-cache-ttl", "Durees de cache"],
];

function diagnose(result) {
  const out = [];
  for (const [id, label] of OPPORTUNITIES) {
    const a = result.audits[id];
    if (!a || a.score === null || a.score >= 0.9) continue;
    const kb = (a.details?.overallSavingsBytes ?? 0) / 1024;
    const ms = a.details?.overallSavingsMs ?? 0;
    if (kb < 20 && ms < 150) continue;
    out.push({ label, kb: Math.round(kb), ms: Math.round(ms) });
  }
  return out.sort((a, b) => b.kb - a.kb);
}

// ─── CORRECTION SURE ────────────────────────────────────────────────────────

/**
 * Seule correction appliquee automatiquement : les dimensions declarees des
 * images. Une image sans width/height, ou dont le rapport declare ne
 * correspond pas au fichier, fait reserver au navigateur un bloc de la
 * mauvaise forme. Corriger ces attributs ne peut ni deplacer un element ni
 * modifier un pixel affiche — c'est la seule categorie dont on puisse
 * l'affirmer.
 */
/**
 * Lecture des dimensions directement dans l'en-tete du fichier : PNG, JPEG et
 * WebP. Evite toute dependance, et surtout fonctionne sur Ubuntu — sips
 * n'existe que sur macOS et le workflow tourne sur un runner Linux.
 */
async function imageSize(file) {
  let buf;
  try { buf = await fs.readFile(file); } catch { return null; }
  if (buf.length < 32) return null;

  // PNG : largeur et hauteur en big-endian dans le chunk IHDR.
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }

  // WebP : trois variantes de chunk, chacune encode ses dimensions autrement.
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const kind = buf.toString("ascii", 12, 16);
    if (kind === "VP8X") {
      return { w: (buf.readUIntLE(24, 3) & 0xffffff) + 1, h: (buf.readUIntLE(27, 3) & 0xffffff) + 1 };
    }
    if (kind === "VP8 ") {
      return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    }
    if (kind === "VP8L") {
      const b = buf.readUInt32LE(21);
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
    }
    return null;
  }

  // JPEG : on parcourt les marqueurs jusqu'au SOF, qui porte les dimensions.
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

/**
 * Seule correction appliquee automatiquement : les dimensions declarees des
 * images. Une image sans width/height, ou dont le rapport declare ne
 * correspond pas au fichier, fait reserver au navigateur un bloc de la
 * mauvaise forme. Corriger ces attributs ne peut ni deplacer un element ni
 * modifier un pixel affiche — c'est la seule categorie dont on puisse
 * l'affirmer sans reserve.
 */
async function fixImageDimensions() {
  const { execSync } = await import("node:child_process");
  const htmlFiles = execSync(
    `find ${JSON.stringify(ROOT)} -name "*.html" -not -path "*/node_modules/*" -not -path "*/graphify-out/*"`,
    { encoding: "utf8" }
  ).trim().split("\n").filter(Boolean);

  const cache = new Map();
  const changes = [];
  const reports = [];

  for (const file of htmlFiles) {
    const original = await fs.readFile(file, "utf8");
    const tags = original.match(/<img\b[^>]*>/g) ?? [];
    let src = original;

    for (const tag of tags) {
      const m = tag.match(/src="([^"]+)"/);
      if (!m) continue;
      const rel = m[1].replace(`${SITE}/`, "").replace(/^\//, "");
      if (!rel.startsWith("assets/")) continue;

      if (!cache.has(rel)) cache.set(rel, await imageSize(path.join(ROOT, rel)));
      const dim = cache.get(rel);
      if (!dim || !dim.w || !dim.h) continue;

      const dw = tag.match(/width="(\d+)"/);
      const dh = tag.match(/height="(\d+)"/);
      let next = null;

      if (dw && dh) {
        // Rapport incoherent : on le signale sans y toucher. Sur certaines
        // images ces attributs servent de taille d'affichage et le CSS ne les
        // neutralise pas toujours — les corriger pourrait deplacer un element.
        const ratioDeclared = +dw[1] / +dh[1];
        const ratioReal = dim.w / dim.h;
        if (Math.abs(ratioDeclared - ratioReal) / ratioReal >= 0.02) {
          reports.push(`${path.basename(rel)} — rapport declare ${dw[1]}x${dh[1]}, fichier ${dim.w}x${dim.h}`);
        }
        continue;
      } else if (!dw && !dh) {
        next = tag.replace("<img", `<img width="${dim.w}" height="${dim.h}"`);
        changes.push(`${path.basename(rel)} — dimensions absentes, ajoutees en ${dim.w}x${dim.h}`);
      } else {
        continue; // une seule des deux : on ne devine pas, on laisse.
      }
      src = src.split(tag).join(next);
    }

    if (src !== original) await fs.writeFile(file, src);
  }
  return { changes: [...new Set(changes)], reports: [...new Set(reports)] };
}

// ─── TELEGRAM ───────────────────────────────────────────────────────────────

async function notify(text) {
  const t = process.env.TELEGRAM_BOT_TOKEN, c = process.env.TELEGRAM_CHAT_ID;
  if (!t || !c) return console.warn("[perf-watch] Telegram non configure.");
  for (let i = 0; i < text.length; i += 4000) {
    await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: c, text: text.slice(i, i + 4000), parse_mode: "HTML" }),
    }).catch(() => {});
  }
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
  const noFix = process.argv.includes("--no-fix");
  let history = [];
  try { history = JSON.parse(await fs.readFile(HISTORY, "utf8")); } catch {}
  const previous = history.at(-1);

  const results = [];
  for (const page of PAGES) {
    console.log(`Mesure de ${page.label}...`);
    const r = await measure(page);
    if (r) { results.push(r); console.log(`  ${r.performance}/100 (passes : ${r.runs.join(", ")})`); }
  }
  if (!results.length) throw new Error("Aucune mesure exploitable.");

  const { changes: fixes, reports: ratioWarnings } = noFix
    ? { changes: [], reports: [] }
    : await fixImageDimensions();

  const lines = [`<b>Performance — ${new Date().toLocaleDateString("fr-FR")}</b>`, ""];
  let below = 0;
  for (const r of results) {
    const prev = previous?.pages?.find((p) => p.url === r.url);
    const delta = prev ? r.performance - prev.performance : null;
    const arrow = delta === null ? "" : delta > 0 ? ` (+${delta})` : delta < 0 ? ` (${delta})` : " (=)";
    const flag = r.performance < TARGET ? " ⚠" : "";
    lines.push(`${esc(r.label)} : <b>${r.performance}</b>${arrow}${flag}`);
    lines.push(`  LCP ${(r.lcp / 1000).toFixed(1)}s · TBT ${Math.round(r.tbt)}ms · CLS ${r.cls.toFixed(3)}`);
    if (r.performance < TARGET) below++;
  }

  const worst = [...results].sort((a, b) => a.performance - b.performance)[0];
  const issues = diagnose(worst);
  if (issues.length) {
    lines.push("", `<b>À corriger en priorité — ${esc(worst.label)}</b>`);
    for (const i of issues.slice(0, 5)) {
      lines.push(`• ${esc(i.label)}${i.kb ? ` — ${i.kb} Ko` : ""}${i.ms ? ` — ${i.ms} ms` : ""}`);
    }
  }

  if (fixes.length) {
    lines.push("", `<b>Corrections appliquées (${fixes.length})</b>`);
    fixes.slice(0, 8).forEach((f) => lines.push(`• ${esc(f)}`));
    lines.push("", "Une pull request est ouverte : rien n'est publié sans ta relecture.");
  } else if (!noFix) {
    lines.push("", "Aucune correction automatique à appliquer.");
  }

  if (ratioWarnings.length) {
    lines.push("", `<b>Rapports d'image incohérents (${ratioWarnings.length}) — non corrigés</b>`);
    ratioWarnings.slice(0, 5).forEach((w) => lines.push(`• ${esc(w)}`));
    lines.push("Ces attributs servent parfois de taille d'affichage : à vérifier à la main.");
  }

  if (below) {
    lines.push("", `${below} page(s) sous ${TARGET}. Le reste demande un arbitrage — voir la liste ci-dessus.`);
  }

  await fs.mkdir(path.dirname(HISTORY), { recursive: true });
  history.push({
    date: new Date().toISOString(),
    pages: results.map(({ audits, ...r }) => r),
  });
  await fs.writeFile(HISTORY, JSON.stringify(history.slice(-40), null, 2));

  await notify(lines.join("\n"));
  console.log("\n" + lines.join("\n").replace(/<[^>]+>/g, ""));
  const os = await import("node:os");
  const outDir = process.env.RUNNER_TEMP || os.tmpdir();
  await fs.writeFile(path.join(outDir, "perf-fixes.txt"), fixes.join("\n"));
}

main().catch((e) => { console.error(e); process.exit(1); });
