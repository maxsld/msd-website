// Rapport hebdomadaire blog : GSC (90j vs 90j) + Google Trends + analyse Claude.
// Classe chaque article (garder / mettre à jour / fusionner / supprimer) et
// propose des sujets à créer selon les requêtes montantes. Livraison Telegram.
// Remplace content-decay-refresh (cron lundi) — cron samedi, voir blog-trends-weekly.yml.

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { JWT } from "google-auth-library";
import Anthropic from "@anthropic-ai/sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envFilePath = path.join(projectRoot, ".env.analytics");
const manifestPath = path.join(projectRoot, "blog", "articles-manifest.json");
const reportsDir = path.join(projectRoot, "seo-reports");

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const BLOG_PATH_MARKER = "/blog/articles/";
const PERIOD_DAYS = 90; // 90j récents vs 90j précédents
const MIN_PRIOR_IMPRESSIONS = 10;
const MAX_TREND_KEYWORDS = 15; // limite d'appels Google Trends (rate limit)
const ANTHROPIC_MODEL = "claude-sonnet-5";

const requiredEnvKeys = ["ANTHROPIC_API_KEY"];
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

// ─── GOOGLE SEARCH CONSOLE ──────────────────────────────────────────────────

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

function getPeriods() {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 2); // GSC a ~2 jours de latence
  const recentStart = new Date(end);
  recentStart.setUTCDate(recentStart.getUTCDate() - (PERIOD_DAYS - 1));
  const priorEnd = new Date(recentStart);
  priorEnd.setUTCDate(priorEnd.getUTCDate() - 1);
  const priorStart = new Date(priorEnd);
  priorStart.setUTCDate(priorStart.getUTCDate() - (PERIOD_DAYS - 1));
  return {
    recent: { startDate: formatDate(recentStart), endDate: formatDate(end) },
    prior: { startDate: formatDate(priorStart), endDate: formatDate(priorEnd) }
  };
}

function slugFromPage(page) {
  try {
    const parts = new URL(page).pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

async function fetchBlogPageStats(token, dateRange) {
  const report = await runGscQuery(token, {
    ...dateRange,
    dimensions: ["page"],
    dimensionFilterGroups: [
      { filters: [{ dimension: "page", operator: "contains", expression: BLOG_PATH_MARKER }] }
    ],
    rowLimit: 2000
  });
  const bySlug = new Map();
  for (const row of report.rows || []) {
    const page = row.keys?.[0];
    if (!page || !page.includes(BLOG_PATH_MARKER)) continue;
    const slug = slugFromPage(page);
    if (!slug) continue;
    const prev = bySlug.get(slug) || { clicks: 0, impressions: 0, position: 0 };
    bySlug.set(slug, {
      clicks: prev.clicks + Number(row.clicks || 0),
      impressions: prev.impressions + Number(row.impressions || 0),
      position: Number(row.position || 0)
    });
  }
  return bySlug;
}

// Requêtes site entier : sert à repérer les sujets montants sans article dédié.
async function fetchSiteQueries(token, dateRange, limit = 200) {
  const report = await runGscQuery(token, {
    ...dateRange,
    dimensions: ["query"],
    rowLimit: limit
  });
  return (report.rows || []).map((row) => ({
    query: row.keys?.[0] || "(not set)",
    clicks: Number(row.clicks || 0),
    impressions: Number(row.impressions || 0),
    position: Number(row.position || 0)
  }));
}

// ─── GOOGLE TRENDS (API widget non officielle, dégradation gracieuse) ──────

// Trends exige un cookie de session (NID) sinon il renvoie 429.
let trendsCookie = null;
async function getTrendsCookie() {
  if (trendsCookie) return trendsCookie;
  const resp = await fetch("https://trends.google.com/trends/explore?geo=FR&hl=fr", {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }
  });
  const setCookie = resp.headers.getSetCookie?.() || [];
  trendsCookie = setCookie.map((c) => c.split(";")[0]).join("; ") || null;
  return trendsCookie;
}

async function fetchTrendsBatch(keywords) {
  const cookie = await getTrendsCookie();
  // L'API explore accepte jusqu'à 5 mots-clés par requête de comparaison.
  const req = {
    comparisonItem: keywords.map((k) => ({ keyword: k, geo: "FR", time: "today 12-m" })),
    category: 0,
    property: ""
  };
  const exploreUrl =
    "https://trends.google.com/trends/api/explore?hl=fr&tz=-60&req=" +
    encodeURIComponent(JSON.stringify(req));
  const exploreResp = await fetch(exploreUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      ...(cookie ? { Cookie: cookie } : {})
    }
  });
  if (!exploreResp.ok) throw new Error(`Trends explore ${exploreResp.status}`);
  const exploreRaw = (await exploreResp.text()).replace(/^\)\]\}',?\s*/, "");
  const explore = JSON.parse(exploreRaw);
  const widget = (explore.widgets || []).find((w) => w.id === "TIMESERIES");
  if (!widget) throw new Error("Widget TIMESERIES introuvable");

  const dataUrl =
    "https://trends.google.com/trends/api/widgetdata/multiline?hl=fr&tz=-60" +
    `&req=${encodeURIComponent(JSON.stringify(widget.request))}` +
    `&token=${encodeURIComponent(widget.token)}`;
  const dataResp = await fetch(dataUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      ...(cookie ? { Cookie: cookie } : {})
    }
  });
  if (!dataResp.ok) throw new Error(`Trends multiline ${dataResp.status}`);
  const dataRaw = (await dataResp.text()).replace(/^\)\]\}',?\s*/, "");
  const data = JSON.parse(dataRaw);
  const timeline = data?.default?.timelineData || [];

  // Tendance = moyenne des 13 dernières semaines vs moyenne des 39 précédentes.
  const results = {};
  keywords.forEach((keyword, index) => {
    const values = timeline
      .map((point) => Number(point.value?.[index] ?? 0))
      .filter((v) => Number.isFinite(v));
    if (values.length < 20) {
      results[keyword] = { direction: "inconnue", ratio: null };
      return;
    }
    const cut = Math.max(values.length - 13, 1);
    const older = values.slice(0, cut);
    const recent = values.slice(cut);
    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
    const olderAvg = avg(older) || 1;
    const ratio = avg(recent) / olderAvg;
    const direction = ratio >= 1.15 ? "hausse" : ratio <= 0.85 ? "baisse" : "stable";
    results[keyword] = { direction, ratio: Number(ratio.toFixed(2)) };
  });
  return results;
}

async function fetchAllTrends(keywords) {
  const trends = {};
  for (let i = 0; i < keywords.length; i += 5) {
    const batch = keywords.slice(i, i + 5);
    try {
      Object.assign(trends, await fetchTrendsBatch(batch));
      // Pause entre les batchs pour rester sous le rate limit Trends.
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error) {
      console.warn(`[blog-trends] Google Trends indisponible pour [${batch.join(", ")}]: ${error.message}`);
      for (const k of batch) trends[k] = { direction: "indisponible", ratio: null };
    }
  }
  return trends;
}

// ─── ANALYSE CLAUDE ─────────────────────────────────────────────────────────

async function analyzeWithClaude({ articles, risingQueries, periods }) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Tu es le consultant SEO de MSD Media (agence web à Annecy : sites sur-mesure, landing pages, SEO/GEO).
Voici les données du blog (${articles.length} articles), comparaison GSC ${periods.prior.startDate}→${periods.prior.endDate} (avant) vs ${periods.recent.startDate}→${periods.recent.endDate} (récent), plus la tendance Google Trends France 12 mois du mot-clé principal de chaque article.

## Articles
${JSON.stringify(articles, null, 1)}

## Requêtes site en croissance (GSC, potentiels nouveaux sujets)
${JSON.stringify(risingQueries, null, 1)}

Produis un rapport en français, format markdown, avec EXACTEMENT ces sections :

# Rapport blog hebdo — ${formatDate(new Date())}

## 1. Synthèse (5 lignes max)
Trafic blog global avant/après, dynamique générale, le fait marquant de la semaine.

## 2. Articles à SUPPRIMER ou FUSIONNER
Tableau : article | clics avant→récent | tendance sujet | verdict (supprimer/fusionner avec X) | pourquoi.
Critères : quasi zéro impressions sur 6 mois, sujet en baisse durable sur Trends, ou cannibalisation avec un autre article. Sois exigeant : ne propose une suppression que si les données la justifient. S'il n'y en a aucun, dis-le.

## 3. Articles à METTRE À JOUR en priorité
Top 5 max. Tableau : article | signal (perte clics/position, tendance) | action concrète (1 ligne).

## 4. Articles à CRÉER
3 à 5 sujets, basés sur : les requêtes GSC en croissance sans article dédié, et les tendances. Pour chaque sujet : titre proposé | mot-clé | justification data (chiffres).

## 5. Ce qui performe (à ne pas toucher)
3 lignes max.

Règles : appuie chaque recommandation sur les chiffres fournis, pas de généralités. Vérifie qu'un "sujet à créer" n'existe pas déjà dans la liste des articles.`;

  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }]
  });

  return response.content[0].text;
}

// ─── TELEGRAM ───────────────────────────────────────────────────────────────

// Envoie le rapport directement en texte (pas de pièce jointe), découpé en
// messages de moins de 4096 caractères (limite Telegram), coupés sur les
// frontières de sections pour rester lisibles.
function splitForTelegram(text, maxLength = 3900) {
  const chunks = [];
  let current = "";
  for (const block of text.split(/\n(?=## )/)) {
    const candidate = current ? `${current}\n${block}` : block;
    if (candidate.length <= maxLength) {
      current = candidate;
      continue;
    }
    if (current) chunks.push(current);
    if (block.length <= maxLength) {
      current = block;
    } else {
      // Section trop longue à elle seule : coupe par lignes.
      current = "";
      for (const line of block.split("\n")) {
        if ((current + "\n" + line).length > maxLength) {
          chunks.push(current);
          current = line;
        } else {
          current = current ? `${current}\n${line}` : line;
        }
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function sendTelegram(report, summaryLines) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.warn("[blog-trends] TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID absents — pas de notification.");
    return;
  }
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const chunks = [summaryLines.join("\n"), ...splitForTelegram(report)];
  for (const [index, chunk] of chunks.entries()) {
    const msgResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: chunk.slice(0, 4096) })
    });
    if (!msgResponse.ok) {
      console.warn(`[blog-trends] Echec message Telegram ${index + 1}/${chunks.length}: ${msgResponse.status} ${(await msgResponse.text()).slice(0, 300)}`);
    }
    // Petite pause pour respecter le rate limit Telegram (1 msg/s par chat).
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }
  console.log(`[blog-trends] Notification Telegram envoyée (${chunks.length} messages).`);
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function run() {
  await loadEnvFile(envFilePath);
  assertEnvVars(requiredEnvKeys);
  const missingGoogle = googleEnvKeys.filter((k) => !process.env[k]);
  if (missingGoogle.length) {
    console.warn(`[blog-trends] Credentials Google manquants (${missingGoogle.join(", ")}). Arrêt.`);
    return;
  }

  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const periods = getPeriods();
  const token = await getGoogleAccessToken();

  console.log(`[blog-trends] GSC ${periods.prior.startDate}→${periods.recent.endDate}, ${manifest.length} articles au manifest.`);
  const [recentStats, priorStats, recentQueries, priorQueries] = await Promise.all([
    fetchBlogPageStats(token, periods.recent),
    fetchBlogPageStats(token, periods.prior),
    fetchSiteQueries(token, periods.recent),
    fetchSiteQueries(token, periods.prior)
  ]);

  // Requêtes en croissance : impressions récentes > 1,3× la période précédente
  // (ou nouvelles), avec assez de volume pour être signifiantes.
  const priorByQuery = new Map(priorQueries.map((q) => [q.query, q]));
  const risingQueries = recentQueries
    .filter((q) => {
      const prior = priorByQuery.get(q.query);
      if (q.impressions < 20) return false;
      if (!prior) return true;
      return prior.impressions < MIN_PRIOR_IMPRESSIONS || q.impressions > prior.impressions * 1.3;
    })
    .slice(0, 40)
    .map((q) => {
      const prior = priorByQuery.get(q.query);
      return {
        query: q.query,
        impressions: `${prior?.impressions ?? 0}→${q.impressions}`,
        clicks: q.clicks,
        position: Number(q.position.toFixed(1))
      };
    });

  // Tendances : mots-clés des articles les plus visibles (limite rate limit Trends).
  const rankedSlugs = [...recentStats.entries()]
    .sort((a, b) => b[1].impressions - a[1].impressions)
    .map(([slug]) => slug);
  const keywordBySlug = new Map(manifest.map((a) => [a.slug, a.keyword || a.title]));
  const trendKeywords = [];
  for (const slug of rankedSlugs) {
    const keyword = keywordBySlug.get(slug);
    if (keyword && !trendKeywords.includes(keyword)) trendKeywords.push(keyword);
    if (trendKeywords.length >= MAX_TREND_KEYWORDS) break;
  }
  console.log(`[blog-trends] Google Trends sur ${trendKeywords.length} mots-clés...`);
  const trends = await fetchAllTrends(trendKeywords);

  // Dataset compact par article pour l'analyse.
  const articles = manifest.map((a) => {
    const recent = recentStats.get(a.slug) || { clicks: 0, impressions: 0, position: null };
    const prior = priorStats.get(a.slug) || { clicks: 0, impressions: 0, position: null };
    const trend = trends[a.keyword || a.title];
    return {
      slug: a.slug,
      title: a.title,
      date: a.date,
      keyword: a.keyword || null,
      gsc: {
        clicks: `${prior.clicks}→${recent.clicks}`,
        impressions: `${prior.impressions}→${recent.impressions}`,
        position: recent.position ? Number(recent.position.toFixed(1)) : null
      },
      trend: trend ? `${trend.direction}${trend.ratio ? ` (×${trend.ratio})` : ""}` : "non mesurée"
    };
  });

  console.log("[blog-trends] Analyse Claude...");
  const report = await analyzeWithClaude({ articles, risingQueries, periods });

  const reportPath = path.join(reportsDir, `blog-trends-${formatDate(new Date())}.md`);
  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(reportPath, report, "utf8");
  console.log(`[blog-trends] Rapport écrit: ${reportPath}`);

  const totalRecent = [...recentStats.values()].reduce((a, s) => a + s.clicks, 0);
  const totalPrior = [...priorStats.values()].reduce((a, s) => a + s.clicks, 0);
  await sendTelegram(report, [
    "📊 Rapport blog hebdo — tendances & recommandations",
    `Clics blog 90j : ${totalPrior} → ${totalRecent}`,
    `Articles suivis : ${manifest.length} · Requêtes en croissance : ${risingQueries.length}`,
    "",
    "Rapport complet dans les messages suivants ⬇️"
  ]);
}

run().catch((error) => {
  console.error(`[blog-trends] Erreur: ${error.message}`);
  process.exit(1);
});
