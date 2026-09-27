#!/usr/bin/env node
/**
 * Inventaire des années codées en dur dans le site.
 *
 * Pourquoi ce script plutôt qu'un `new Date().getFullYear()` partout :
 * une année dans un <title>, un H1 ou une URL est une promesse de fraîcheur.
 * La changer toute seule pendant que le contenu, lui, reste celui de l'an
 * dernier, c'est promettre au visiteur (et à Google) une mise à jour qui n'a
 * pas eu lieu. Google cible explicitement ce procédé. Et une URL ne peut de
 * toute façon pas se réécrire en JS.
 *
 * Le script ne modifie donc rien : il liste, une fois par an, tout ce qui
 * porte une année, pour décider article par article quoi réellement mettre à
 * jour (contenu + titre + URL + redirection 301 depuis l'ancienne).
 *
 * Usage :
 *   node scripts/check-years.mjs              # année courante par défaut
 *   node scripts/check-years.mjs --year=2027  # préparer la bascule
 *   node scripts/check-years.mjs --json
 */

import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const IGNORE = new Set(["node_modules", ".git", "graphify-out", "seo-reports", "scripts"]);

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const yearArg = args.find((a) => a.startsWith("--year="));
const TARGET = yearArg ? Number(yearArg.split("=")[1]) : new Date().getFullYear();

async function htmlFiles(dir, acc = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || IGNORE.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await htmlFiles(full, acc);
    else if (e.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

const YEAR = /\b(20[2-9]\d)\b/g;
const pick = (html, re) => {
  const m = html.match(re);
  return m ? m[1].replace(/\s+/g, " ").trim() : null;
};

const findings = [];

for (const file of await htmlFiles(ROOT)) {
  const rel = path.relative(ROOT, file);
  const html = readFileSync(file, "utf8");

  const title = pick(html, /<title>([\s\S]*?)<\/title>/i);
  const h1 = pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const desc = pick(html, /<meta\s+name="description"\s+content="([^"]*)"/i);

  const hits = [];
  const scan = (label, text) => {
    if (!text) return;
    const years = [...new Set([...text.matchAll(YEAR)].map((m) => m[1]))];
    for (const y of years) if (Number(y) < TARGET) hits.push({ label, year: y, text });
  };

  scan("title", title);
  scan("h1", h1 ? h1.replace(/<[^>]+>/g, "") : null);
  scan("description", desc);

  const urlYears = [...new Set([...rel.matchAll(YEAR)].map((m) => m[1]))];
  for (const y of urlYears) if (Number(y) < TARGET) hits.push({ label: "URL", year: y, text: rel });

  if (hits.length) findings.push({ file: rel, hits });
}

if (asJson) {
  console.log(JSON.stringify({ target: TARGET, findings }, null, 2));
  process.exit(0);
}

if (!findings.length) {
  console.log(`Aucune année antérieure à ${TARGET} trouvée. Rien à faire.`);
  process.exit(0);
}

const urlCount = findings.filter((f) => f.hits.some((h) => h.label === "URL")).length;

console.log(`\nAnnées antérieures à ${TARGET} — ${findings.length} page(s)\n`);
for (const { file, hits } of findings) {
  console.log(file);
  for (const h of hits) {
    const t = h.text.length > 88 ? h.text.slice(0, 88) + "…" : h.text;
    console.log(`   [${h.label}] ${h.year} — ${t}`);
  }
  console.log("");
}

console.log("─".repeat(72));
console.log(`${findings.length} page(s), dont ${urlCount} avec l'année dans l'URL.\n`);
console.log("Pour chaque page, trois issues possibles :");
console.log("  1. Actualiser pour de vrai  — reprendre le contenu, puis titre + H1 (+ URL");
console.log("                                 et redirection 301 si l'année y figure).");
console.log("  2. Rendre intemporel        — retirer l'année du titre quand le contenu");
console.log("                                 n'en dépend pas ; plus rien à maintenir.");
console.log("  3. Assumer l'archive        — laisser l'année, c'est un instantané daté.\n");
console.log("Ce que le script ne fait pas : décider à votre place, ni réécrire une année");
console.log("sans que le contenu ait bougé.\n");
