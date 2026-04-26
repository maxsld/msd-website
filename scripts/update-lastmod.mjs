/**
 * update-lastmod.mjs
 *
 * Met à jour automatiquement les dates <lastmod> dans sitemap.xml et blog/sitemap.xml
 * en se basant sur la date de dernière modification réelle des fichiers HTML sur disque.
 *
 * Usage : node scripts/update-lastmod.mjs [--dry-run]
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const dryRun = process.argv.includes("--dry-run");
const log  = msg => console.log(`[lastmod] ${msg}`);

const SITE_URL = "https://msd-media.com";
const TODAY = new Date().toISOString().slice(0, 10);

// Convertit une URL en chemin de fichier local
function urlToFilePath(url) {
  const relative = url.replace(SITE_URL, "").replace(/^\//, "").replace(/\/$/, "");
  if (!relative) return path.join(ROOT, "index.html");
  return path.join(ROOT, relative, "index.html");
}

async function processsitemap(sitemapFile) {
  const sitemapPath = path.join(ROOT, sitemapFile);

  let xml;
  try {
    xml = await fs.readFile(sitemapPath, "utf-8");
  } catch {
    log(`⚠ Impossible de lire ${sitemapFile}`);
    return;
  }

  let updated = 0;
  let newXml = xml;

  // Trouver chaque bloc <url>...</url>
  const urlBlockPattern = /<url>([\s\S]*?)<\/url>/g;

  newXml = xml.replace(urlBlockPattern, (block) => {
    const locMatch = block.match(/<loc>(.*?)<\/loc>/);
    const lastmodMatch = block.match(/<lastmod>(.*?)<\/lastmod>/);

    if (!locMatch) return block;

    const url = locMatch[1].trim();
    const currentLastmod = lastmodMatch?.[1]?.trim() ?? null;
    const filePath = urlToFilePath(url);

    // On essaie de lire le mtime du fichier
    return block; // placeholder — on fait ça en async juste après
  });

  // Version async : on collecte tous les blocs et on les traite
  const urlBlocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)];
  const replacements = await Promise.all(
    urlBlocks.map(async (m) => {
      const block = m[0];
      const locMatch = block.match(/<loc>(.*?)<\/loc>/);
      const lastmodMatch = block.match(/<lastmod>(.*?)<\/lastmod>/);

      if (!locMatch) return { original: block, replacement: block };

      const url = locMatch[1].trim();
      const currentLastmod = lastmodMatch?.[1]?.trim() ?? null;
      const filePath = urlToFilePath(url);

      let mtime;
      try {
        const stat = await fs.stat(filePath);
        mtime = stat.mtime.toISOString().slice(0, 10);
      } catch {
        // Fichier non trouvé (page externe, etc.) — on ne touche pas
        return { original: block, replacement: block };
      }

      // Mettre à jour seulement si le fichier est plus récent que le lastmod actuel
      if (currentLastmod && mtime <= currentLastmod) {
        return { original: block, replacement: block };
      }

      let newBlock;
      if (lastmodMatch) {
        newBlock = block.replace(
          /<lastmod>.*?<\/lastmod>/,
          `<lastmod>${TODAY}</lastmod>`
        );
      } else {
        // Insérer lastmod après <loc>
        newBlock = block.replace(
          /(<loc>.*?<\/loc>)/,
          `$1\n    <lastmod>${TODAY}</lastmod>`
        );
      }

      updated++;
      log(`↺  ${url}  ${currentLastmod ?? "—"} → ${TODAY}`);
      return { original: block, replacement: newBlock };
    })
  );

  // Appliquer les remplacements dans l'ordre (évite les collisions de regex)
  let finalXml = xml;
  for (const { original, replacement } of replacements) {
    if (original !== replacement) {
      finalXml = finalXml.replace(original, replacement);
    }
  }

  if (updated === 0) {
    log(`${sitemapFile}: aucune mise à jour nécessaire.`);
    return;
  }

  log(`${sitemapFile}: ${updated} lastmod mis à jour.`);

  if (!dryRun) {
    await fs.writeFile(sitemapPath, finalXml, "utf-8");
  } else {
    log(`[dry-run] écriture annulée.`);
  }
}

async function main() {
  log(`Démarrage (dry-run: ${dryRun})`);
  await processsitemap("sitemap.xml");
  await processsitemap("blog/sitemap.xml");
  log("Terminé.");
}

main().catch(err => {
  console.error("[lastmod] Fatal:", err);
  process.exit(1);
});
