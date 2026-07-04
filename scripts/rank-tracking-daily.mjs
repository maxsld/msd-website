import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { JWT } from "google-auth-library";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envFilePath = path.join(projectRoot, ".env.analytics");

// ─── CONFIG ─────────────────────────────────────────────────────────────────
// GSC data has a rolling lag of ~2-3 days before numbers are "final" (not just
// fresh/partial), and single-day windows are noisy (bots, weekday cycles,
// SERP volatility). To keep the daily flag low-noise we compare two 3-day
// rolling windows, both starting 3 days back from "today" so we never touch
// the still-settling most recent days:
//   current  = [today-5 .. today-3]
//   previous = [today-8 .. today-6]
const LAG_DAYS = 3;
const WINDOW_DAYS = 3;

// Flag a query/page if its average position worsens (gets numerically higher)
// by at least this many positions between the two windows.
const POSITION_DROP_THRESHOLD = 3;

// Ignore near-zero-visibility query/page pairs — not worth flagging noise.
const MIN_IMPRESSIONS = 5;

// How many rows to pull per window, ranked by impressions after the fact.
const ROW_LIMIT = 5000;

// Cap how many dropped rows we list in the email so it stays scannable.
const MAX_ROWS_IN_REPORT = 30;

const requiredEnvKeys = ["RESEND_API_KEY", "MAIL_TO"];
const googleEnvKeys = [
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
  "GSC_SITE_URL"
];

async function loadEnvFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const equalIndex = trimmed.indexOf("=");
      if (equalIndex === -1) continue;
      const key = trimmed.slice(0, equalIndex).trim();
      let value = trimmed.slice(equalIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function assertEnvVars(keys) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Variables manquantes: ${missing.join(", ")}`);
  }
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function getGoogleAccessToken() {
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n");
  const client = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"]
  });
  const token = await client.getAccessToken();
  if (!token.token) {
    throw new Error("Impossible d'obtenir un access token Google.");
  }
  return token.token;
}

async function googleApiRequest(url, token, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Erreur API ${response.status} ${response.statusText}: ${raw.slice(0, 1000)}`);
  }
  return raw ? JSON.parse(raw) : {};
}

async function runGscQuery(token, body) {
  const siteUrl = encodeURIComponent(process.env.GSC_SITE_URL);
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`;
  return googleApiRequest(url, token, body);
}

function getWindows() {
  const today = new Date();

  const currentEnd = new Date(today);
  currentEnd.setUTCDate(currentEnd.getUTCDate() - LAG_DAYS);
  const currentStart = new Date(currentEnd);
  currentStart.setUTCDate(currentStart.getUTCDate() - (WINDOW_DAYS - 1));

  const previousEnd = new Date(currentStart);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - (WINDOW_DAYS - 1));

  return {
    current: { startDate: formatDate(currentStart), endDate: formatDate(currentEnd) },
    previous: { startDate: formatDate(previousStart), endDate: formatDate(previousEnd) }
  };
}

function rowsToMap(rows) {
  const map = new Map();
  for (const row of rows) {
    const [query, page] = row.keys || [];
    if (!query || !page) continue;
    map.set(`${query}||${page}`, {
      query,
      page,
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      position: Number(row.position || 0)
    });
  }
  return map;
}

function buildDrops(currentMap, previousMap) {
  const drops = [];
  for (const [key, current] of currentMap.entries()) {
    const previous = previousMap.get(key);
    if (!previous) continue; // new query/page pair, nothing to compare
    if (current.impressions < MIN_IMPRESSIONS) continue;

    const delta = current.position - previous.position; // positive = worse
    if (delta >= POSITION_DROP_THRESHOLD) {
      drops.push({
        query: current.query,
        page: current.page,
        impressions: current.impressions,
        prevPosition: previous.position,
        currPosition: current.position,
        delta
      });
    }
  }
  drops.sort((a, b) => b.impressions - a.impressions);
  return drops;
}

function toTableHtml(headers, rows) {
  if (!rows.length) return "<p style='color:#aaa;font-size:13px;margin:0 0 16px'>Aucune donnée.</p>";
  const thead = `<tr>${headers
    .map(
      (header) =>
        `<th style="text-align:left;padding-bottom:6px;font-size:11px;color:#aaa;font-weight:600;text-transform:uppercase;letter-spacing:.04em">${escapeHtml(header)}</th>`
    )
    .join("")}</tr>`;
  const tbody = rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell, idx) =>
              `<td style="padding:8px 12px 8px 0;font-size:13px;color:${idx === 0 ? "#111" : "#444"};border-bottom:1px solid #f0f0ee">${escapeHtml(cell)}</td>`
          )
          .join("")}</tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin:0 0 20px">${thead}${tbody}</table>`;
}

const SIGNATURE = `
  <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e8e8e8">
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse">
      <tr>
        <td style="padding-right:20px;vertical-align:middle;border-right:2px solid #e8e8e8">
          <img src="https://msd-media.com/assets/img/logo-black.webp" alt="MSD Media" height="32" style="display:block"/>
        </td>
        <td style="padding-left:20px;vertical-align:middle">
          <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#111">L'équipe MSD Media</p>
          <p style="margin:0;font-size:13px;color:#555;line-height:1.7">
            <a href="https://msd-media.com" style="color:#555;text-decoration:none">msd-media.com</a><br/>
            <a href="mailto:maxens.soldan@msd-media.com" style="color:#555;text-decoration:none">maxens.soldan@msd-media.com</a>
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;font-size:11px;color:#aaa;line-height:1.5">
      MSD Media – Agence web de création de sites web et de landing pages · Entreprise individuelle – Maxens Soldan · SIRET : 988 083 416 00012 · Annecy, France
    </p>
  </div>
`;

function layout(content) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="font-family:Inter,Arial,sans-serif;background:#f9f9f7;margin:0;padding:32px">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8e8e8">
    ${content}
    ${SIGNATURE}
  </div>
</body>
</html>`;
}

function buildEmailHtml({ current, previous, drops }) {
  const rows = drops.slice(0, MAX_ROWS_IN_REPORT).map((d) => [
    d.query,
    d.page.replace("https://msd-media.com", ""),
    String(d.impressions),
    d.prevPosition.toFixed(1),
    d.currPosition.toFixed(1),
    `+${d.delta.toFixed(1)}`
  ]);

  return layout(`
    <h1 style="font-size:22px;font-weight:700;color:#111;margin:0 0 8px">Alerte positions — baisse détectée</h1>
    <p style="color:#888;font-size:13px;margin:0 0 24px">
      Fenêtre actuelle: ${escapeHtml(current.startDate)} → ${escapeHtml(current.endDate)}
      &nbsp;vs&nbsp; précédente: ${escapeHtml(previous.startDate)} → ${escapeHtml(previous.endDate)}
    </p>
    <p style="color:#555;font-size:14px;margin:0 0 20px">
      ${drops.length} paire(s) requête/page ont perdu ${POSITION_DROP_THRESHOLD}+ positions (impressions ≥ ${MIN_IMPRESSIONS}).
    </p>
    ${toTableHtml(["Requête", "Page", "Impr.", "Pos. avant", "Pos. après", "Delta"], rows)}
  `);
}

async function sendViaResend({ from, to, subject, html }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to, subject, html })
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Erreur Resend ${response.status}: ${raw.slice(0, 500)}`);
  }
  return raw ? JSON.parse(raw) : {};
}

async function run() {
  await loadEnvFile(envFilePath);
  assertEnvVars(requiredEnvKeys);

  const missingGoogle = googleEnvKeys.filter((k) => !process.env[k]);
  if (missingGoogle.length) {
    console.warn(`[rank-tracking-daily] Credentials Google manquants (${missingGoogle.join(", ")}). Arrêt.`);
    return;
  }

  const token = await getGoogleAccessToken();
  const { current, previous } = getWindows();

  const [currentReport, previousReport] = await Promise.all([
    runGscQuery(token, { ...current, dimensions: ["query", "page"], rowLimit: ROW_LIMIT }),
    runGscQuery(token, { ...previous, dimensions: ["query", "page"], rowLimit: ROW_LIMIT })
  ]);

  const currentMap = rowsToMap(currentReport.rows || []);
  const previousMap = rowsToMap(previousReport.rows || []);
  const drops = buildDrops(currentMap, previousMap);

  if (!drops.length) {
    console.log(`[rank-tracking-daily] Aucune baisse de position >= ${POSITION_DROP_THRESHOLD} détectée. Aucun email envoyé.`);
    return;
  }

  const html = buildEmailHtml({ current, previous, drops });
  const from = process.env.MAIL_FROM || "MSD Media <maxens.soldan@msd-media.com>";
  const to = process.env.MAIL_TO;
  const subject = `⚠️ Rank tracking — ${drops.length} baisse(s) de position (${current.startDate} → ${current.endDate})`;

  const sent = await sendViaResend({ from, to, subject, html });
  console.log(`[rank-tracking-daily] Email envoyé (${drops.length} baisses): ${sent.id || JSON.stringify(sent)}`);
}

run().catch((error) => {
  console.error("[rank-tracking-daily] Erreur:", error.message);
  process.exitCode = 1;
});
