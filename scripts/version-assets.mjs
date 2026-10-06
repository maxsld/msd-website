#!/usr/bin/env node
// Ajoute ?v=<empreinte du fichier> à chaque référence vers assets/css/*.css et
// assets/js/*.js dans les pages HTML.
//
// Pourquoi : vercel.json met CSS et JS en cache 1 jour. Sans
// version dans l'URL, un visiteur déjà venu pourrait garder l'ancien fichier
// jusqu'à un jour. Avec ?v=<hash>, toute modification du fichier change l'URL
// et force le navigateur à télécharger la nouvelle version.
//
// Lancé par le hook pre-push, par le build du blog et par le workflow
// version-assets.yml à chaque push sur main.
//
// Usage : node scripts/version-assets.mjs [--check]
//   --check : n'écrit rien, sort en erreur si une page n'est pas à jour.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const CHECK = process.argv.includes("--check");
const SKIP_DIRS = new Set([".git", "node_modules", ".vscode", "graphify-out"]);

const hashes = {};
for (const dir of ["css", "js"]) {
  for (const file of fs.readdirSync(path.join(ROOT, "assets", dir))) {
    if (!file.endsWith(`.${dir}`)) continue;
    const content = fs.readFileSync(path.join(ROOT, "assets", dir, file));
    hashes[`assets/${dir}/${file}`] = crypto.createHash("md5").update(content).digest("hex").slice(0, 8);
  }
}

function* htmlFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith(".html")) yield full;
  }
}

// assets/css/style.css, suivi éventuellement d'un ?v=... existant
const REF = /(assets\/(?:css|js)\/[\w.-]+\.(?:css|js))(\?v=[\w.-]*)?(?=["'\s)>])/g;

let changed = 0;
for (const file of htmlFiles(ROOT)) {
  const html = fs.readFileSync(file, "utf8");
  const next = html.replace(REF, (match, asset) => (hashes[asset] ? `${asset}?v=${hashes[asset]}` : match));
  if (next !== html) {
    changed++;
    if (CHECK) console.log(`pas à jour : ${path.relative(ROOT, file)}`);
    else fs.writeFileSync(file, next);
  }
}

if (CHECK && changed) {
  console.error(`${changed} page(s) à mettre à jour : lancer node scripts/version-assets.mjs`);
  process.exit(1);
}
console.log(`${CHECK ? "Vérifié" : "Versionné"} : ${Object.keys(hashes).length} fichiers CSS/JS, ${changed} page(s) ${CHECK ? "à mettre à jour" : "modifiée(s)"}.`);
