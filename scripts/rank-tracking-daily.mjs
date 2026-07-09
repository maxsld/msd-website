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

// Cap how many dropped rows we list in the Telegram message so it stays scannable.
const MAX_ROWS_IN_REPORT = 15;

const requiredEnvKeys = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"];
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

// Une seule notification Telegram groupée par run (jamais une notif par baisse).
function buildTelegramText({ current, previous, drops }) {
  const lines = [];
  lines.push(`📉 Rank tracking — ${drops.length} baisse(s) de position`);
  lines.push(`Fenêtre ${current.startDate} → ${current.endDate} vs ${previous.startDate} → ${previous.endDate} (seuil: -${POSITION_DROP_THRESHOLD} positions, impressions ≥ ${MIN_IMPRESSIONS})`);
  lines.push("");
  for (const d of drops.slice(0, MAX_ROWS_IN_REPORT)) {
    const page = d.page.replace("https://msd-media.com", "") || "/";
    lines.push(`• « ${d.query} » — ${page}`);
    lines.push(`   ${d.prevPosition.toFixed(1)} → ${d.currPosition.toFixed(1)} (+${d.delta.toFixed(1)}) · ${d.impressions} impr.`);
  }
  if (drops.length > MAX_ROWS_IN_REPORT) {
    lines.push("");
    lines.push(`… et ${drops.length - MAX_ROWS_IN_REPORT} autre(s) baisse(s) moins visibles.`);
  }
  // Telegram limite un message à 4096 caractères.
  return lines.join("\n").slice(0, 4000);
}

async function sendViaTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Erreur Telegram ${response.status}: ${raw.slice(0, 500)}`);
  }
  return JSON.parse(raw);
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
    console.log(`[rank-tracking-daily] Aucune baisse de position >= ${POSITION_DROP_THRESHOLD} détectée. Aucune notification envoyée.`);
    return;
  }

  const text = buildTelegramText({ current, previous, drops });
  await sendViaTelegram(text);
  console.log(`[rank-tracking-daily] Notification Telegram envoyée (${drops.length} baisses, 1 message groupé).`);
}

run().catch((error) => {
  console.error("[rank-tracking-daily] Erreur:", error.message);
  process.exitCode = 1;
});
