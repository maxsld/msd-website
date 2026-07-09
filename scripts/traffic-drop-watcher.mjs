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
const SITE_URL = "https://msd-media.com";

// This week = the 7 days ending yesterday. Previous week = the 7 days before that.
const WEEK_DAYS = 7;

// Flag a page if sessions (GA4) or clicks (GSC) fell by this fraction or more.
const TRAFFIC_DROP_THRESHOLD = 0.2; // -20%

// Ignore tiny pages where a drop is just noise.
const MIN_PREVIOUS_SESSIONS = 10;
const MIN_PREVIOUS_CLICKS = 10;

const MAX_FLAGGED_PAGES = 15;
const TOP_QUERIES_PER_PAGE = 5;

const requiredEnvKeys = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"];
const googleEnvKeys = [
  "GA4_PROPERTY_ID",
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

function pct(value) {
  return `${(value * 100).toFixed(0)} %`;
}

async function getGoogleAccessToken() {
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n");
  const client = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/webmasters.readonly"
    ]
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

async function runGaReport(token, body) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runReport`;
  return googleApiRequest(url, token, body);
}

async function runGscQuery(token, body) {
  const siteUrl = encodeURIComponent(process.env.GSC_SITE_URL);
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`;
  return googleApiRequest(url, token, body);
}

function getWeeks() {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1); // yesterday
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (WEEK_DAYS - 1));

  const prevEnd = new Date(start);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevStart.getUTCDate() - (WEEK_DAYS - 1));

  return {
    current: { startDate: formatDate(start), endDate: formatDate(end) },
    previous: { startDate: formatDate(prevStart), endDate: formatDate(prevEnd) }
  };
}

function normalizePath(pathname) {
  if (!pathname) return "/";
  const clean = pathname.split(/[?#]/)[0];
  return clean.endsWith("/") || clean === "" ? clean || "/" : `${clean}/`;
}

function gscPageToPath(page) {
  try {
    return normalizePath(new URL(page).pathname);
  } catch {
    return normalizePath(page);
  }
}

// GA4 supports multiple date ranges in one runReport call: rows come back
// tagged with an auto-added "dateRange" dimension ("date_range_0" = first
// range passed, "date_range_1" = second). We use that instead of two calls.
async function fetchGaSessionsByPage(token, current, previous) {
  const report = await runGaReport(token, {
    dateRanges: [
      { startDate: current.startDate, endDate: current.endDate, name: "date_range_0" },
      { startDate: previous.startDate, endDate: previous.endDate, name: "date_range_1" }
    ],
    dimensions: [{ name: "pagePath" }, { name: "dateRange" }],
    metrics: [{ name: "sessions" }],
    limit: "2000"
  });

  const byPath = new Map();
  for (const row of report.rows || []) {
    const pagePath = normalizePath(row.dimensionValues?.[0]?.value);
    const rangeName = row.dimensionValues?.[1]?.value;
    const sessions = Number(row.metricValues?.[0]?.value || 0);
    if (!byPath.has(pagePath)) byPath.set(pagePath, { current: 0, previous: 0 });
    const entry = byPath.get(pagePath);
    if (rangeName === "date_range_0") entry.current += sessions;
    else if (rangeName === "date_range_1") entry.previous += sessions;
  }
  return byPath;
}

async function fetchGscClicksByPage(token, dateRange) {
  const report = await runGscQuery(token, {
    ...dateRange,
    dimensions: ["page"],
    rowLimit: 2000
  });
  const byPath = new Map();
  for (const row of report.rows || []) {
    const page = row.keys?.[0];
    if (!page) continue;
    byPath.set(gscPageToPath(page), {
      page,
      clicks: Number(row.clicks || 0),
      position: Number(row.position || 0)
    });
  }
  return byPath;
}

async function fetchTopQueriesForPage(token, page, dateRange) {
  const report = await runGscQuery(token, {
    ...dateRange,
    dimensions: ["query"],
    dimensionFilterGroups: [
      { filters: [{ dimension: "page", operator: "equals", expression: page }] }
    ],
    rowLimit: TOP_QUERIES_PER_PAGE * 4
  });
  return (report.rows || [])
    .map((row) => ({
      query: row.keys?.[0] || "(not set)",
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      position: Number(row.position || 0)
    }))
    .sort((a, b) => b.clicks - a.clicks);
}

function buildQueryDiff(currentQueries, previousQueries) {
  const prevByQuery = new Map(previousQueries.map((q) => [q.query, q]));
  return currentQueries
    .map((cur) => {
      const prev = prevByQuery.get(cur.query);
      return {
        query: cur.query,
        currClicks: cur.clicks,
        prevClicks: prev?.clicks || 0,
        currPosition: cur.position,
        prevPosition: prev?.position ?? null
      };
    })
    .sort((a, b) => (a.currClicks - a.prevClicks) - (b.currClicks - b.prevClicks))
    .slice(0, TOP_QUERIES_PER_PAGE);
}

// Une seule notification Telegram groupée par run (jamais une notif par page).
function buildTelegramText({ current, previous, flagged }) {
  const lines = [];
  lines.push(`📉 Trafic — ${flagged.length} page(s) en baisse`);
  lines.push(`Semaine ${current.startDate} → ${current.endDate} vs ${previous.startDate} → ${previous.endDate} (seuil: -${pct(TRAFFIC_DROP_THRESHOLD)})`);
  for (const page of flagged) {
    lines.push("");
    lines.push(`• ${page.path}`);
    if (page.sessionsDrop !== null) {
      lines.push(`   Sessions GA4: ${page.prevSessions} → ${page.currSessions} (-${pct(page.sessionsDrop)})`);
    }
    if (page.clicksDrop !== null) {
      lines.push(`   Clics GSC: ${page.prevClicks} → ${page.currClicks} (-${pct(page.clicksDrop)})`);
    }
    const topQueries = page.queryDiff.slice(0, 3);
    if (topQueries.length) {
      lines.push(`   Requêtes en cause:`);
      for (const q of topQueries) {
        const pos = q.prevPosition !== null
          ? `${q.prevPosition.toFixed(1)} → ${q.currPosition.toFixed(1)}`
          : `— → ${q.currPosition.toFixed(1)}`;
        lines.push(`   · « ${q.query} » clics ${q.prevClicks} → ${q.currClicks}, pos ${pos}`);
      }
    }
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

function computeDrop(prevValue, currValue) {
  if (!prevValue) return null;
  return (prevValue - currValue) / prevValue;
}

async function run() {
  await loadEnvFile(envFilePath);
  assertEnvVars(requiredEnvKeys);

  const missingGoogle = googleEnvKeys.filter((k) => !process.env[k]);
  if (missingGoogle.length) {
    console.warn(`[traffic-drop-watcher] Credentials Google manquants (${missingGoogle.join(", ")}). Arrêt.`);
    return;
  }

  const token = await getGoogleAccessToken();
  const { current, previous } = getWeeks();

  const [gaByPath, gscCurrentByPath, gscPreviousByPath] = await Promise.all([
    fetchGaSessionsByPage(token, current, previous),
    fetchGscClicksByPage(token, current),
    fetchGscClicksByPage(token, previous)
  ]);

  const allPaths = new Set([...gaByPath.keys(), ...gscCurrentByPath.keys(), ...gscPreviousByPath.keys()]);

  const candidates = [];
  for (const p of allPaths) {
    const ga = gaByPath.get(p) || { current: 0, previous: 0 };
    const gscCurr = gscCurrentByPath.get(p);
    const gscPrev = gscPreviousByPath.get(p);
    const currClicks = gscCurr?.clicks || 0;
    const prevClicks = gscPrev?.clicks || 0;

    const sessionsDrop = computeDrop(ga.previous, ga.current);
    const clicksDrop = computeDrop(prevClicks, currClicks);

    const sessionsFlagged = ga.previous >= MIN_PREVIOUS_SESSIONS && sessionsDrop !== null && sessionsDrop >= TRAFFIC_DROP_THRESHOLD;
    const clicksFlagged = prevClicks >= MIN_PREVIOUS_CLICKS && clicksDrop !== null && clicksDrop >= TRAFFIC_DROP_THRESHOLD;

    if (!sessionsFlagged && !clicksFlagged) continue;

    candidates.push({
      path: p,
      page: gscCurr?.page || gscPrev?.page || `${SITE_URL}${p}`,
      currSessions: ga.current,
      prevSessions: ga.previous,
      sessionsDrop,
      currClicks,
      prevClicks,
      clicksDrop,
      // rank worst-first by whichever signal dropped most in absolute terms
      severity: Math.max(sessionsDrop || 0, clicksDrop || 0)
    });
  }

  candidates.sort((a, b) => b.severity - a.severity);
  const topCandidates = candidates.slice(0, MAX_FLAGGED_PAGES);

  if (!topCandidates.length) {
    console.log(`[traffic-drop-watcher] Aucune page en baisse de ${pct(TRAFFIC_DROP_THRESHOLD)}+. Aucune notification envoyée.`);
    return;
  }

  const flagged = [];
  for (const candidate of topCandidates) {
    const [currentQueries, previousQueries] = await Promise.all([
      fetchTopQueriesForPage(token, candidate.page, current),
      fetchTopQueriesForPage(token, candidate.page, previous)
    ]);
    flagged.push({
      ...candidate,
      queryDiff: buildQueryDiff(currentQueries, previousQueries)
    });
  }

  const text = buildTelegramText({ current, previous, flagged });
  await sendViaTelegram(text);
  console.log(`[traffic-drop-watcher] Notification Telegram envoyée (${flagged.length} pages, 1 message groupé).`);
}

run().catch((error) => {
  console.error("[traffic-drop-watcher] Erreur:", error.message);
  process.exitCode = 1;
});
