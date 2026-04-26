/**
 * google-index.mjs
 *
 * À chaque déploiement :
 *   1. Ping les sitemaps Google + Bing (aucun credential requis)
 *   2. Soumet les URLs récentes via IndexNow (Bing, Yandex…)
 *
 * Usage : node scripts/google-index.mjs [--days=7] [--dry-run]
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Config ────────────────────────────────────────────────────────────────────

const SITE = "msd-media.com";
const SITE_URL = `https://${SITE}`;

const SITEMAPS = [
  `${SITE_URL}/sitemap.xml`,
  `${SITE_URL}/blog/sitemap.xml`,
];

const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "efce413a0bd22c8ad04ad561e64371e9";

// IndexNow endpoint (soumet à Bing, Yandex, Seznam, Google via réseau partagé)
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

// Arg parsing
const args = process.argv.slice(2);
const days = parseInt(args.find(a => a.startsWith("--days="))?.split("=")[1] ?? "7");
const dryRun = args.includes("--dry-run");

// ── Helpers ───────────────────────────────────────────────────────────────────

const log  = msg => console.log(`[index] ${msg}`);
const warn = msg => console.warn(`[index] ⚠  ${msg}`);

async function readLocalSitemap(filename) {
  try {
    return await fs.readFile(path.join(ROOT, filename), "utf-8");
  } catch {
    warn(`Cannot read ${filename}`);
    return null;
  }
}

function parseRecentUrls(xml) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const locs    = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1].trim());
  const lastmods = [...xml.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map(m => m[1].trim());

  return locs.filter((_, i) => {
    const d = lastmods[i] ? new Date(lastmods[i]) : null;
    return !d || d >= cutoff;
  });
}

// ── Step 1 : Sitemap pings ────────────────────────────────────────────────────

async function pingSitemaps() {
  const engines = [
    url => `https://www.google.com/ping?sitemap=${encodeURIComponent(url)}`,
    url => `https://www.bing.com/ping?sitemap=${encodeURIComponent(url)}`,
  ];

  for (const sitemap of SITEMAPS) {
    for (const buildPing of engines) {
      const ping = buildPing(sitemap);
      if (dryRun) { log(`[dry-run] ping → ${ping}`); continue; }
      try {
        const res = await fetch(ping);
        log(`ping ${new URL(ping).hostname} ${sitemap} → ${res.status}`);
      } catch (err) {
        warn(`ping failed: ${err.message}`);
      }
    }
  }
}

// ── Step 2 : IndexNow ─────────────────────────────────────────────────────────

async function submitIndexNow(urls) {
  if (urls.length === 0) { log("IndexNow: aucune URL récente."); return; }

  const payload = {
    host: SITE,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };

  if (dryRun) {
    log(`[dry-run] IndexNow payload:\n${JSON.stringify(payload, null, 2)}`);
    return;
  }

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });

    // 200 = ok, 202 = accepted (normal)
    if (res.ok || res.status === 202) {
      log(`IndexNow ✓ — ${urls.length} URL(s) soumises (HTTP ${res.status})`);
    } else {
      const body = await res.text();
      warn(`IndexNow HTTP ${res.status}: ${body.slice(0, 300)}`);
    }
  } catch (err) {
    warn(`IndexNow error: ${err.message}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log(`Démarrage — fenêtre: ${days} jour(s), dry-run: ${dryRun}`);

  // 1. Ping sitemaps
  await pingSitemaps();

  // 2. Collecter URLs récentes depuis sitemaps locaux
  const urlSet = new Set();
  for (const file of ["sitemap.xml", "blog/sitemap.xml"]) {
    const xml = await readLocalSitemap(file);
    if (!xml) continue;
    const urls = parseRecentUrls(xml);
    log(`${file}: ${urls.length} URL(s) dans les ${days} derniers jours`);
    urls.forEach(u => urlSet.add(u));
  }

  // 3. IndexNow (max 10 000 URLs par requête — largement suffisant)
  await submitIndexNow([...urlSet]);

  log("Terminé.");
}

main().catch(err => {
  console.error("[index] Fatal:", err);
  process.exit(1);
});
