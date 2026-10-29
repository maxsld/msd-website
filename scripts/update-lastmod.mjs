/**
 * update-lastmod.mjs
 *
 * Met à jour les dates <lastmod> de sitemap.xml et blog/sitemap.xml uniquement
 * quand le CONTENU éditorial d'une page change, pas à chaque retouche technique.
 *
 * Avant, la date suivait le mtime du fichier : le versionnage des CSS/JS
 * (?v=hash), une carte « Articles liés » ou un build touchaient des dizaines
 * de pages et les datait toutes du jour. Google déconseille explicitement de
 * changer la date d'une page dont le contenu n'a pas réellement changé, et
 * finit par ignorer un lastmod qui n'est pas fiable.
 *
 * Désormais : empreinte (sha1) du texte de la page — tout le <body>, sans scripts, styles, nav, header, footer, cartes d'articles liés
 * ni paramètres de version — stockée dans lastmod-fingerprints.json. Le
 * lastmod ne passe à la date du jour que si l'empreinte change. Une page vue
 * pour la première fois enregistre son empreinte sans changer sa date.
 *
 * Usage : node scripts/update-lastmod.mjs [--dry-run]
 */

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FINGERPRINTS_FILE = path.join(ROOT, "lastmod-fingerprints.json");

const dryRun = process.argv.includes("--dry-run");
const log = (msg) => console.log(`[lastmod] ${msg}`);

const SITE_URL = "https://msd-media.com";
const TODAY = new Date().toISOString().slice(0, 10);

function urlToFilePath(url) {
  const relative = url.replace(SITE_URL, "").replace(/^\//, "").replace(/\/$/, "");
  if (!relative) return path.join(ROOT, "index.html");
  if (relative.endsWith(".html")) return path.join(ROOT, relative);
  return path.join(ROOT, relative, "index.html");
}

// Texte éditorial de la page : ce qui change quand on modifie vraiment le contenu.
function editorialFingerprint(html) {
  let s = html;
  // Tout le <body> : sur certaines pages, <main> n'entoure que l'introduction (la FAQ est en dehors).
  const body = s.match(/<body\b[\s\S]*<\/body>/i);
  if (body) s = body[0];
  s = s
    .replace(/<(script|style|noscript|nav|header|footer|iframe)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<div class="(?:cookie-consent|top-announcement)[\s\S]*?<\/div>/gi, " ")
    .replace(/<section class="blog-related"[\s\S]*?<\/section>/gi, " ")
    .replace(/<aside class="blog-service-cta"[\s\S]*?<\/aside>/gi, " ")
    .replace(/<p class="blog-article-meta"[\s\S]*?<\/p>/gi, " ")
    .replace(/\?v=[0-9a-f]+/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Le <title> et la meta description font aussi partie du contenu visible dans Google.
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "";
  const desc = (html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1] || "";
  return crypto.createHash("sha1").update(`${title}\n${desc}\n${s}`).digest("hex");
}

async function processSitemap(sitemapFile, fingerprints) {
  const sitemapPath = path.join(ROOT, sitemapFile);
  let xml;
  try {
    xml = await fs.readFile(sitemapPath, "utf-8");
  } catch {
    log(`⚠ Impossible de lire ${sitemapFile}`);
    return;
  }

  let updated = 0;
  const blocks = [...xml.matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) => m[0]);
  let finalXml = xml;

  for (const block of blocks) {
    const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1]?.trim();
    if (!loc) continue;
    let html;
    try {
      html = await fs.readFile(urlToFilePath(loc), "utf-8");
    } catch {
      continue; // page externe ou introuvable : on ne touche pas
    }
    const fp = editorialFingerprint(html);
    const previous = fingerprints[loc];
    fingerprints[loc] = fp;
    if (!previous || previous === fp) continue; // première vue, ou contenu inchangé

    const current = block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1]?.trim() ?? null;
    // Le blog possède une date éditoriale explicite : une retouche du gabarit
    // ne doit pas transformer tous les articles en publications du jour.
    const articleModified = loc.includes('/blog/articles/')
      ? html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/)?.[1]
      : null;
    const lastmod = articleModified || TODAY;
    if (current === lastmod) continue;
    const newBlock = current
      ? block.replace(/<lastmod>.*?<\/lastmod>/, `<lastmod>${lastmod}</lastmod>`)
      : block.replace(/(<loc>.*?<\/loc>)/, `$1\n    <lastmod>${lastmod}</lastmod>`);
    finalXml = finalXml.replace(block, newBlock);
    updated += 1;
    log(`↺  ${loc}  ${current ?? "—"} → ${lastmod} (contenu modifié)`);
  }

  if (!updated) {
    log(`${sitemapFile}: aucun contenu modifié, dates inchangées.`);
    return;
  }
  log(`${sitemapFile}: ${updated} lastmod mis à jour.`);
  if (!dryRun) await fs.writeFile(sitemapPath, finalXml, "utf-8");
}

async function main() {
  log(`Démarrage (dry-run: ${dryRun})`);
  let fingerprints = {};
  try {
    fingerprints = JSON.parse(await fs.readFile(FINGERPRINTS_FILE, "utf-8"));
  } catch {
    log("Aucune empreinte enregistrée : initialisation (aucune date modifiée cette fois).");
  }
  await processSitemap("sitemap.xml", fingerprints);
  await processSitemap("blog/sitemap.xml", fingerprints);
  if (!dryRun) {
    const sorted = Object.fromEntries(Object.entries(fingerprints).sort(([a], [b]) => a.localeCompare(b)));
    await fs.writeFile(FINGERPRINTS_FILE, JSON.stringify(sorted, null, 2) + "\n", "utf-8");
  }
  log("Terminé.");
}

main().catch((err) => {
  console.error("[lastmod] Fatal:", err);
  process.exit(1);
});
