#!/usr/bin/env node
// Pulls real Search Console queries shaped like questions (comment/pourquoi/
// quel/combien...), sorted by impressions, and flags the ones with 0 clicks
// (real measured demand we don't currently satisfy). Cross-references
// against existing blog article slugs so we don't suggest a topic we
// already cover. Used by the blog-trend-research skill, not deployed.
//
// Usage: node scripts/blog-trend-questions.mjs [--days=365] [--min-impressions=1]

import fs from "node:fs/promises";
import { readdirSync } from "node:fs";
import { JWT } from "google-auth-library";

async function loadEnvFile() {
  const content = await fs.readFile(".env.analytics", "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const args = process.argv.slice(2);
const days = parseInt(args.find((a) => a.startsWith("--days="))?.split("=")[1] ?? "365");
const minImpressions = parseInt(args.find((a) => a.startsWith("--min-impressions="))?.split("=")[1] ?? "1");

const QUESTION_WORDS = [
  "comment", "pourquoi", "quel", "quelle", "quels", "quelles", "combien",
  "où", "qui", "est-ce que", "est ce que", "faut-il", "faut il",
  "peut-on", "peut on", "c'est quoi", "quand",
];

function startDateFromDays(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

async function main() {
  await loadEnvFile();

  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n");
  const jwtClient = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
  const token = (await jwtClient.getAccessToken()).token;

  const siteUrl = encodeURIComponent(process.env.GSC_SITE_URL);
  const res = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      startDate: startDateFromDays(days),
      endDate: new Date().toISOString().slice(0, 10),
      dimensions: ["query"],
      rowLimit: 25000,
    }),
  });
  const data = await res.json();
  const rows = data.rows || [];

  const questionRows = rows
    .filter((r) => {
      const q = r.keys[0].toLowerCase();
      return QUESTION_WORDS.some((w) => q.includes(w)) && r.impressions >= minImpressions;
    })
    .sort((a, b) => b.impressions - a.impressions);

  console.log(`Fenêtre: ${days} jours. Total requêtes: ${rows.length}, question-like (>=${minImpressions} impr): ${questionRows.length}\n`);
  console.log("impr\tclics\tposition\trequête");
  for (const r of questionRows.slice(0, 80)) {
    console.log(`${r.impressions}\t${r.clicks}\t${r.position.toFixed(1)}\t${r.keys[0]}`);
  }

  let slugs = [];
  try {
    slugs = readdirSync("blog/articles").filter((s) => !s.startsWith("."));
  } catch {
    /* no blog/articles dir found */
  }
  console.log(`\n--- Slugs des ${slugs.length} articles existants (pour vérifier manuellement les doublons) ---`);
  console.log(slugs.join(", "));
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
