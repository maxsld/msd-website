/**
 * weekly-seo-report.mjs
 *
 * Rapport SEO hebdomadaire consolidé — remplace rank-tracking-daily.mjs +
 * cwv-report.mjs + traffic-drop-watcher.mjs (crons désactivés le 2026-08-18)
 * par UN seul rapport complet en PDF, envoyé par email chaque dimanche.
 *
 * (Upload Google Drive envisagé puis abandonné : un compte de service n'a
 * aucun quota de stockage et ne peut pas écrire dans un dossier Drive
 * personnel classique, seulement dans un Drive partagé — complexité jugée
 * non justifiée pour ce besoin.)
 *
 * Sections : synthèse GSC (clics/impressions 7j vs 7j), top requêtes,
 * baisses de position (logique reprise de rank-tracking-daily.mjs), pages en
 * baisse de trafic GA4+GSC (logique reprise de traffic-drop-watcher.mjs),
 * Core Web Vitals par page (logique reprise de cwv-report.mjs).
 *
 * Trafic IA (visiteurs ChatGPT/Perplexity/Claude...) : NON INCLUS. Le
 * payload envoyé à app.msd-media.com/api/track ne transmet pas la source IA
 * détectée côté client (voir scripts/templates/tracking-block.html), donc
 * aucune donnée réelle n'est disponible ici — pas de chiffre inventé.
 *
 * Variables d'environnement :
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 *   GSC_SITE_URL, GA4_PROPERTY_ID
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO
 *   PAGESPEED_API_KEY (optionnel)
 *
 * Usage : node scripts/weekly-seo-report.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { JWT } from "google-auth-library";
import nodemailer from "nodemailer";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const envFilePath = path.join(ROOT, ".env.analytics");
const HISTORY_FILE = path.join(ROOT, "scripts", ".cwv-history.json");

const log = (msg) => console.log(`[weekly-seo-report] ${msg}`);
const warn = (msg) => console.warn(`[weekly-seo-report] ⚠ ${msg}`);

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const SITE_URL = "https://msd-media.com";
const WEEK_DAYS = 7;
const LAG_DAYS = 3; // décalage GSC pour les données "finales" (rank-tracking-daily.mjs)
const POSITION_DROP_THRESHOLD = 3;
const MIN_IMPRESSIONS = 5;
const TRAFFIC_DROP_THRESHOLD = 0.2;
const MIN_PREVIOUS_SESSIONS = 10;
const MIN_PREVIOUS_CLICKS = 10;
const MAX_FLAGGED_PAGES = 10;
const TOP_QUERIES_PER_PAGE = 5;
const TOP_QUERIES_OVERVIEW = 15;

const CWV_PAGES = [
  { url: "https://msd-media.com/", label: "Homepage" },
  { url: "https://msd-media.com/agence-web-annecy/", label: "Annecy" },
  { url: "https://msd-media.com/agence-web-strasbourg/", label: "Strasbourg" },
  { url: "https://msd-media.com/agence-web-alsace/", label: "Alsace" },
  { url: "https://msd-media.com/blog/", label: "Blog" }
];
const CWV_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  ttfb: { good: 800, poor: 1800 }
};

const requiredEnvKeys = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_TO"];
const googleEnvKeys = ["GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", "GSC_SITE_URL"];

// ─── ENV / AUTH ─────────────────────────────────────────────────────────────

async function loadEnvFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
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
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

function assertEnvVars(keys) {
  const missing = keys.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Variables manquantes: ${missing.join(", ")}`);
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function pct(value) {
  return `${(value * 100).toFixed(0)} %`;
}

// Client JWT (google-auth-library) pour les appels fetch bruts (GSC/GA4/PSI) —
// scope union webmasters+analytics.
function buildJwtClient() {
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n");
  return new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/analytics.readonly"
    ]
  });
}

async function googleApiRequest(url, token, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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

async function runGaReport(token, body) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runReport`;
  return googleApiRequest(url, token, body);
}

// ─── FENÊTRES DE DATES ──────────────────────────────────────────────────────

// Fenêtre "semaine" standard pour la vue d'ensemble et les baisses de trafic.
function getWeeks() {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1); // hier
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

// Fenêtres décalées de LAG_DAYS pour les baisses de position (données GSC
// "finales" seulement — cf. rank-tracking-daily.mjs).
function getRankWindows() {
  const today = new Date();
  const currentEnd = new Date(today);
  currentEnd.setUTCDate(currentEnd.getUTCDate() - LAG_DAYS);
  const currentStart = new Date(currentEnd);
  currentStart.setUTCDate(currentStart.getUTCDate() - (WEEK_DAYS - 1));
  const previousEnd = new Date(currentStart);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - (WEEK_DAYS - 1));
  return {
    current: { startDate: formatDate(currentStart), endDate: formatDate(currentEnd) },
    previous: { startDate: formatDate(previousStart), endDate: formatDate(previousEnd) }
  };
}

// ─── SECTION 1 : SYNTHÈSE + TOP REQUÊTES (GSC) ─────────────────────────────

async function fetchGscTotals(token, dateRange) {
  const report = await runGscQuery(token, { ...dateRange, rowLimit: 1 });
  const row = (report.rows || [])[0];
  return {
    clicks: Number(row?.clicks || 0),
    impressions: Number(row?.impressions || 0),
    position: row?.position ? Number(row.position) : null
  };
}

async function fetchTopQueries(token, dateRange, limit = 200) {
  const report = await runGscQuery(token, { ...dateRange, dimensions: ["query"], rowLimit: limit });
  return (report.rows || []).map((row) => ({
    query: row.keys?.[0] || "(not set)",
    clicks: Number(row.clicks || 0),
    impressions: Number(row.impressions || 0),
    position: Number(row.position || 0)
  }));
}

// ─── SECTION 2 : BAISSES DE POSITION (repris de rank-tracking-daily.mjs) ───

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

function buildPositionDrops(currentMap, previousMap) {
  const drops = [];
  for (const [key, current] of currentMap.entries()) {
    const previous = previousMap.get(key);
    if (!previous) continue;
    if (current.impressions < MIN_IMPRESSIONS) continue;
    const delta = current.position - previous.position;
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

// ─── SECTION 3 : BAISSES DE TRAFIC (repris de traffic-drop-watcher.mjs) ────

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

async function fetchGaTotalSessions(token, current, previous) {
  const report = await runGaReport(token, {
    dateRanges: [
      { startDate: current.startDate, endDate: current.endDate, name: "date_range_0" },
      { startDate: previous.startDate, endDate: previous.endDate, name: "date_range_1" }
    ],
    dimensions: [{ name: "dateRange" }],
    metrics: [{ name: "sessions" }]
  });
  let curr = 0;
  let prev = 0;
  for (const row of report.rows || []) {
    const rangeName = row.dimensionValues?.[0]?.value;
    const sessions = Number(row.metricValues?.[0]?.value || 0);
    if (rangeName === "date_range_0") curr += sessions;
    else if (rangeName === "date_range_1") prev += sessions;
  }
  return { current: curr, previous: prev };
}

async function fetchGscClicksByPage(token, dateRange) {
  const report = await runGscQuery(token, { ...dateRange, dimensions: ["page"], rowLimit: 2000 });
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
    dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "equals", expression: page }] }],
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
    .sort((a, b) => a.currClicks - a.prevClicks - (b.currClicks - b.prevClicks))
    .slice(0, TOP_QUERIES_PER_PAGE);
}

function computeDrop(prevValue, currValue) {
  if (!prevValue) return null;
  return (prevValue - currValue) / prevValue;
}

async function findTrafficDrops(token, current, previous) {
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
      severity: Math.max(sessionsDrop || 0, clicksDrop || 0)
    });
  }
  candidates.sort((a, b) => b.severity - a.severity);
  const top = candidates.slice(0, MAX_FLAGGED_PAGES);

  const flagged = [];
  for (const candidate of top) {
    const [currentQueries, previousQueries] = await Promise.all([
      fetchTopQueriesForPage(token, candidate.page, current),
      fetchTopQueriesForPage(token, candidate.page, previous)
    ]);
    flagged.push({ ...candidate, queryDiff: buildQueryDiff(currentQueries, previousQueries) });
  }
  return flagged;
}

// ─── SECTION 4 : CORE WEB VITALS (repris de cwv-report.mjs) ────────────────

async function loadCwvHistory() {
  try {
    return JSON.parse(await fs.readFile(HISTORY_FILE, "utf8"));
  } catch {
    return {};
  }
}

async function saveCwvHistory(data) {
  try {
    await fs.writeFile(HISTORY_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch {}
}

async function fetchPageSpeed(url) {
  const apiKey = process.env.PAGESPEED_API_KEY;
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", "mobile");
  endpoint.searchParams.set("category", "performance");
  if (apiKey) endpoint.searchParams.set("key", apiKey);
  const res = await fetch(endpoint.toString());
  if (!res.ok) throw new Error(`PSI API HTTP ${res.status}`);
  return res.json();
}

function extractCwvMetrics(data) {
  const audits = data?.lighthouseResult?.audits ?? {};
  const cat = data?.lighthouseResult?.categories?.performance?.score ?? null;
  const ms = (key) => {
    const v = audits[key]?.numericValue;
    return v != null ? Math.round(v) : null;
  };
  return {
    score: cat != null ? Math.round(cat * 100) : null,
    lcp: ms("largest-contentful-paint"),
    cls: audits["cumulative-layout-shift"]?.numericValue != null
      ? Math.round(audits["cumulative-layout-shift"].numericValue * 1000) / 1000
      : null,
    fcp: ms("first-contentful-paint"),
    ttfb: ms("server-response-time")
  };
}

function rateCwvMetric(key, value) {
  if (value == null) return "unknown";
  const t = CWV_THRESHOLDS[key];
  if (!t) return "unknown";
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}

async function runCwvChecks() {
  const history = await loadCwvHistory();
  const results = [];
  for (const { url, label } of CWV_PAGES) {
    try {
      const data = await fetchPageSpeed(url);
      results.push({ label, url, metrics: extractCwvMetrics(data) });
    } catch (err) {
      warn(`CWV ${label}: ${err.message}`);
      results.push({ label, url, metrics: null, error: err.message });
    }
    await new Promise((r) => setTimeout(r, 2000)); // rate limit PSI
  }
  const newHistory = { ...history };
  for (const r of results) if (r.metrics) newHistory[r.url] = r.metrics;
  await saveCwvHistory(newHistory);
  return { results, history };
}

// ─── RAPPORT HTML ───────────────────────────────────────────────────────────

function fmtNum(n) {
  return Number(n || 0).toLocaleString("fr-FR");
}

function deltaLabel(current, previous, { inverse = false } = {}) {
  if (previous == null || current == null) return "";
  const diff = current - previous;
  if (diff === 0) return `<span style="color:#9ca3af">± 0</span>`;
  const good = inverse ? diff < 0 : diff > 0;
  const color = good ? "#16a34a" : "#dc2626";
  const sign = diff > 0 ? "+" : "";
  return `<span style="color:${color}">${sign}${Number.isInteger(diff) ? diff : diff.toFixed(1)}</span>`;
}

function buildHtmlReport({ weekLabel, gscTotals, topQueries, positionDrops, trafficDrops, cwv, gaTotals }) {
  const kpiCards = [
    { label: "Clics GSC (7j)", value: fmtNum(gscTotals.current.clicks), delta: deltaLabel(gscTotals.current.clicks, gscTotals.previous.clicks) },
    { label: "Impressions GSC (7j)", value: fmtNum(gscTotals.current.impressions), delta: deltaLabel(gscTotals.current.impressions, gscTotals.previous.impressions) },
    { label: "Position moyenne", value: gscTotals.current.position ? gscTotals.current.position.toFixed(1) : "—", delta: deltaLabel(gscTotals.current.position, gscTotals.previous.position, { inverse: true }) },
    { label: "Sessions GA4 (7j)", value: gaTotals ? fmtNum(gaTotals.current) : "—", delta: gaTotals ? deltaLabel(gaTotals.current, gaTotals.previous) : "" }
  ].map((k) => `
    <div style="flex:1;min-width:140px;background:#f9fafb;border-radius:10px;padding:16px;text-align:center">
      <div style="font-size:22px;font-weight:700;color:#111">${k.value}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:2px">${k.label}</div>
      <div style="font-size:12px;margin-top:4px">${k.delta}</div>
    </div>`).join("");

  const topQueriesRows = topQueries.slice(0, TOP_QUERIES_OVERVIEW).map((q) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6">${q.query}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:center">${fmtNum(q.clicks)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:center">${fmtNum(q.impressions)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:center">${q.position.toFixed(1)}</td>
    </tr>`).join("") || `<tr><td colspan="4" style="padding:12px;color:#9ca3af">Aucune donnée.</td></tr>`;

  const positionDropsRows = positionDrops.slice(0, 15).map((d) => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6">« ${d.query} »<br><small style="color:#9ca3af">${d.page.replace(SITE_URL, "")}</small></td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:center;color:#dc2626">${d.prevPosition.toFixed(1)} → ${d.currPosition.toFixed(1)} (+${d.delta.toFixed(1)})</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:center">${fmtNum(d.impressions)}</td>
    </tr>`).join("") || `<tr><td colspan="3" style="padding:12px;color:#16a34a">Aucune baisse de position ≥ ${POSITION_DROP_THRESHOLD} détectée.</td></tr>`;

  const trafficDropsBlocks = trafficDrops.map((p) => `
    <div style="background:#fef2f2;border-radius:8px;padding:12px 16px;margin-bottom:10px">
      <strong>${p.path}</strong><br>
      ${p.sessionsDrop !== null ? `<span style="font-size:13px">Sessions GA4 : ${fmtNum(p.prevSessions)} → ${fmtNum(p.currSessions)} (-${pct(p.sessionsDrop)})</span><br>` : ""}
      ${p.clicksDrop !== null ? `<span style="font-size:13px">Clics GSC : ${fmtNum(p.prevClicks)} → ${fmtNum(p.currClicks)} (-${pct(p.clicksDrop)})</span><br>` : ""}
      ${p.queryDiff.length ? `<span style="font-size:12px;color:#6b7280">Requêtes en cause : ${p.queryDiff.slice(0, 3).map((q) => `« ${q.query} » (${q.prevClicks}→${q.currClicks})`).join(", ")}</span>` : ""}
    </div>`).join("") || `<p style="color:#16a34a">Aucune page en baisse de trafic ≥ ${pct(TRAFFIC_DROP_THRESHOLD)}.</p>`;

  const cwvRows = cwv.results.map(({ label, url, metrics, error }) => {
    if (error) {
      return `<tr><td style="padding:8px 10px;border-bottom:1px solid #f3f4f6"><strong>${label}</strong></td><td colspan="5" style="padding:8px 10px;border-bottom:1px solid #f3f4f6;color:#dc2626">Erreur : ${error}</td></tr>`;
    }
    const prev = cwv.history[url];
    const scoreColor = metrics.score >= 90 ? "#16a34a" : metrics.score >= 50 ? "#d97706" : "#dc2626";
    const cell = (key, fmt) => {
      const rating = rateCwvMetric(key, metrics[key]);
      const color = { good: "#16a34a", "needs-improvement": "#d97706", poor: "#dc2626", unknown: "#9ca3af" }[rating];
      return `<td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:center;color:${color};font-weight:600">${fmt(metrics[key])}</td>`;
    };
    return `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6"><strong>${label}</strong><br><small style="color:#9ca3af">${url}</small></td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:center"><span style="background:${scoreColor};color:#fff;border-radius:6px;padding:2px 10px;font-weight:700">${metrics.score ?? "—"}</span>${prev?.score ? `<br><small>${deltaLabel(metrics.score, prev.score)}</small>` : ""}</td>
      ${cell("lcp", (v) => (v != null ? `${v} ms` : "—"))}
      ${cell("cls", (v) => (v != null ? v.toFixed(3) : "—"))}
      ${cell("fcp", (v) => (v != null ? `${v} ms` : "—"))}
      ${cell("ttfb", (v) => (v != null ? `${v} ms` : "—"))}
    </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><title>Rapport SEO hebdo — ${weekLabel}</title></head>
<body style="font-family:Inter,Arial,sans-serif;background:#fff;margin:0;padding:32px;color:#111">
  <div style="max-width:760px;margin:auto">
    <div style="margin-bottom:24px">
      <h1 style="margin:0;font-size:24px">📊 Rapport SEO hebdomadaire</h1>
      <p style="margin:4px 0 0;color:#6b7280;font-size:14px">${weekLabel} · msd-media.com</p>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:32px;flex-wrap:wrap">${kpiCards}</div>

    <h2 style="font-size:16px;border-bottom:2px solid #111;padding-bottom:6px">Top requêtes (Search Console)</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:28px">
      <thead><tr style="background:#f3f4f6"><th style="padding:8px 10px;text-align:left">Requête</th><th style="padding:8px 10px">Clics</th><th style="padding:8px 10px">Impressions</th><th style="padding:8px 10px">Position</th></tr></thead>
      <tbody>${topQueriesRows}</tbody>
    </table>

    <h2 style="font-size:16px;border-bottom:2px solid #111;padding-bottom:6px">Baisses de position (≥ ${POSITION_DROP_THRESHOLD})</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:28px">
      <thead><tr style="background:#f3f4f6"><th style="padding:8px 10px;text-align:left">Requête / page</th><th style="padding:8px 10px">Évolution</th><th style="padding:8px 10px">Impressions</th></tr></thead>
      <tbody>${positionDropsRows}</tbody>
    </table>

    <h2 style="font-size:16px;border-bottom:2px solid #111;padding-bottom:6px">Pages en baisse de trafic (≥ ${pct(TRAFFIC_DROP_THRESHOLD)})</h2>
    <div style="margin-bottom:28px">${trafficDropsBlocks}</div>

    <h2 style="font-size:16px;border-bottom:2px solid #111;padding-bottom:6px">Core Web Vitals (mobile)</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:28px">
      <thead><tr style="background:#f3f4f6"><th style="padding:8px 10px;text-align:left">Page</th><th style="padding:8px 10px">Score</th><th style="padding:8px 10px">LCP</th><th style="padding:8px 10px">CLS</th><th style="padding:8px 10px">FCP</th><th style="padding:8px 10px">TTFB</th></tr></thead>
      <tbody>${cwvRows}</tbody>
    </table>

    <h2 style="font-size:16px;border-bottom:2px solid #111;padding-bottom:6px">Trafic IA (ChatGPT, Perplexity, Claude...)</h2>
    <p style="font-size:13px;color:#6b7280;margin-bottom:28px">Non disponible dans ce rapport : la source IA détectée côté site n'est pas encore transmise au backend analytics (limitation technique connue, pas encore corrigée). Aucune donnée fabriquée ici.</p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
    <p style="color:#9ca3af;font-size:11px">MSD Media — Rapport généré automatiquement (Search Console, GA4, PageSpeed Insights).</p>
  </div>
</body>
</html>`;
}

// ─── PDF ────────────────────────────────────────────────────────────────────

async function renderPdf(html) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    return await page.pdf({ format: "A4", printBackground: true, margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" } });
  } finally {
    await browser.close();
  }
}

// ─── EMAIL ──────────────────────────────────────────────────────────────────

async function sendEmail({ pdfBuffer, filename, weekLabel, kpiSummary }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
    to: process.env.MAIL_TO,
    subject: `📊 [MSD Media] Rapport SEO hebdo — ${weekLabel}`,
    html: `<p>Rapport SEO complet en pièce jointe (PDF).</p><p style="color:#6b7280;font-size:13px">${kpiSummary}</p>`,
    attachments: [{ filename, content: pdfBuffer, contentType: "application/pdf" }]
  });
  log(`Email envoyé à ${process.env.MAIL_TO}.`);
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function run() {
  await loadEnvFile(envFilePath);
  assertEnvVars(requiredEnvKeys);
  const missingGoogle = googleEnvKeys.filter((k) => !process.env[k]);
  if (missingGoogle.length) {
    throw new Error(`Credentials Google manquants: ${missingGoogle.join(", ")}`);
  }

  const jwtClient = buildJwtClient();
  const token = (await jwtClient.getAccessToken()).token;
  if (!token) throw new Error("Impossible d'obtenir un access token Google.");

  const weeks = getWeeks();
  const rankWindows = getRankWindows();
  const weekLabel = `${weeks.current.startDate} → ${weeks.current.endDate}`;

  log("Synthèse GSC...");
  const [gscCurrentTotals, gscPreviousTotals, topQueries] = await Promise.all([
    fetchGscTotals(token, weeks.current),
    fetchGscTotals(token, weeks.previous),
    fetchTopQueries(token, weeks.current)
  ]);
  topQueries.sort((a, b) => b.clicks - a.clicks);

  let gaTotals = null;
  if (process.env.GA4_PROPERTY_ID) {
    log("Sessions GA4...");
    gaTotals = await fetchGaTotalSessions(token, weeks.current, weeks.previous);
  } else {
    warn("GA4_PROPERTY_ID absent — KPI sessions/pages en baisse GA4 ignorés.");
  }

  log("Baisses de position...");
  const [rankCurrent, rankPrevious] = await Promise.all([
    runGscQuery(token, { ...rankWindows.current, dimensions: ["query", "page"], rowLimit: 5000 }),
    runGscQuery(token, { ...rankWindows.previous, dimensions: ["query", "page"], rowLimit: 5000 })
  ]);
  const positionDrops = buildPositionDrops(rowsToMap(rankCurrent.rows || []), rowsToMap(rankPrevious.rows || []));

  let trafficDrops = [];
  if (process.env.GA4_PROPERTY_ID) {
    log("Baisses de trafic (GA4 + GSC)...");
    trafficDrops = await findTrafficDrops(token, weeks.current, weeks.previous);
  }

  log("Core Web Vitals (PageSpeed Insights)...");
  const cwv = await runCwvChecks();

  const html = buildHtmlReport({
    weekLabel,
    gscTotals: { current: gscCurrentTotals, previous: gscPreviousTotals },
    topQueries,
    positionDrops,
    trafficDrops,
    cwv,
    gaTotals
  });

  log("Génération du PDF...");
  const pdfBuffer = await renderPdf(html);
  const filename = `rapport-seo-hebdo-${weeks.current.endDate}.pdf`;

  const kpiSummary = `Clics GSC ${gscCurrentTotals.clicks} (préc. ${gscPreviousTotals.clicks}) · ${positionDrops.length} baisse(s) de position · ${trafficDrops.length} page(s) en baisse de trafic.`;

  await sendEmail({ pdfBuffer, filename, weekLabel, kpiSummary });

  log("Terminé.");
}

run().catch((error) => {
  console.error("[weekly-seo-report] Erreur:", error);
  process.exitCode = 1;
});
