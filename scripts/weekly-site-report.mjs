#!/usr/bin/env node
/**
 * weekly-site-report.mjs
 *
 * Rapport hebdomadaire du comportement des visiteurs, envoyé sur Telegram
 * chaque samedi (workflow weekly-site-report.yml).
 *
 * Sources :
 *   - GA4 (API Data) : trafic, sources/UTM, pages d'entrée, appareils, villes,
 *     événements, clics (msd_click), sections vues (section_view), défilement,
 *     entonnoir des formulaires (form_start / form_abandon / lead_*), FAQ.
 *   - Search Console : clics, impressions, requêtes, opportunités.
 *
 * Les événements sont émis par assets/js/script.js. Leurs paramètres
 * link_text / link_url / link_id / percent_scrolled sont des noms prédéfinis
 * GA4 : ils remplissent les dimensions linkText, linkUrl, linkId et
 * percentScrolled sans dimension personnalisée à créer.
 *
 * Claude analyse les chiffres et propose des actions. Sans clé Anthropic (ou
 * si l'appel échoue), un résumé chiffré sans recommandations est envoyé.
 *
 * Variables : GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
 *   GA4_PROPERTY_ID, GSC_SITE_URL, ANTHROPIC_API_KEY (optionnelle),
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 *
 * Usage : node scripts/weekly-site-report.mjs [--dry-run] [--mock]
 *   --dry-run : affiche le rapport sans l'envoyer
 *   --mock    : données fictives, pour tester la mise en forme sans accès Google
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { JWT } from "google-auth-library";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFilePath = path.join(path.resolve(__dirname, ".."), ".env.analytics");

const DRY_RUN = process.argv.includes("--dry-run");
const MOCK = process.argv.includes("--mock");
const ANTHROPIC_MODEL = "claude-opus-5-5";
const GSC_LAG_DAYS = 3; // Search Console publie ses données avec ~2-3 jours de retard

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
  } catch (_) {
    // Pas de fichier local : en CI les variables viennent des secrets.
  }
}

// ─── DATES ──────────────────────────────────────────────────────────────────

const iso = (date) => date.toISOString().slice(0, 10);

function weekWindows(lagDays) {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - lagDays);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  const prevEnd = new Date(start);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevStart.getUTCDate() - 6);
  return {
    current: { startDate: iso(start), endDate: iso(end) },
    previous: { startDate: iso(prevStart), endDate: iso(prevEnd) }
  };
}

// ─── GOOGLE ─────────────────────────────────────────────────────────────────

async function getGoogleToken() {
  const client = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: [
      "https://www.googleapis.com/auth/analytics.readonly",
      "https://www.googleapis.com/auth/webmasters.readonly"
    ]
  });
  const { token } = await client.getAccessToken();
  if (!token) throw new Error("Impossible d'obtenir un access token Google.");
  return token;
}

async function postJson(url, token, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`API ${response.status}: ${raw.slice(0, 400)}`);
  return raw ? JSON.parse(raw) : {};
}

// Exécute un rapport GA4 et renvoie des lignes { dimName: valeur, metricName: nombre }.
async function ga(token, range, { dimensions = [], metrics, filter, orderBy, limit = 25 }) {
  const body = {
    dateRanges: [range],
    dimensions: dimensions.map((name) => ({ name })),
    metrics: metrics.map((name) => ({ name })),
    limit
  };
  if (filter) body.dimensionFilter = filter;
  if (orderBy) body.orderBys = [{ metric: { metricName: orderBy }, desc: true }];
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runReport`;
  const report = await postJson(url, token, body);
  return (report.rows || []).map((row) => {
    const out = {};
    dimensions.forEach((name, i) => (out[name] = row.dimensionValues?.[i]?.value ?? ""));
    metrics.forEach((name, i) => (out[name] = Number(row.metricValues?.[i]?.value ?? 0)));
    return out;
  });
}

const eventIs = (...names) =>
  names.length === 1
    ? { filter: { fieldName: "eventName", stringFilter: { value: names[0] } } }
    : { filter: { fieldName: "eventName", inListFilter: { values: names } } };

async function gsc(token, range, dimensions, rowLimit = 25) {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(process.env.GSC_SITE_URL)}/searchAnalytics/query`;
  const report = await postJson(url, token, { ...range, dimensions, rowLimit });
  return (report.rows || []).map((row) => {
    const out = { clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position };
    dimensions.forEach((name, i) => (out[name] = row.keys[i]));
    return out;
  });
}

// ─── COLLECTE ───────────────────────────────────────────────────────────────

async function collect() {
  const token = await getGoogleToken();
  const gaWeeks = weekWindows(1);
  const gscWeeks = weekWindows(GSC_LAG_DAYS);
  const errors = [];

  // Chaque bloc est indépendant : un échec n'empêche pas le reste du rapport.
  const safe = async (label, fn) => {
    try {
      return await fn();
    } catch (error) {
      errors.push(`${label} : ${error.message.slice(0, 160)}`);
      return null;
    }
  };

  const overviewMetrics = [
    "totalUsers", "newUsers", "sessions", "engagedSessions", "engagementRate",
    "averageSessionDuration", "screenPageViews", "keyEvents"
  ];
  const both = (spec) =>
    Promise.all([ga(token, gaWeeks.current, spec), ga(token, gaWeeks.previous, spec)]).then(([current, previous]) => ({ current, previous }));

  const data = {
    periode_ga4: gaWeeks,
    periode_search_console: gscWeeks,
    vue_ensemble: await safe("GA4 vue d'ensemble", () => both({ metrics: overviewMetrics })),
    canaux: await safe("GA4 canaux", () => both({ dimensions: ["sessionDefaultChannelGroup"], metrics: ["sessions", "engagementRate", "keyEvents"], orderBy: "sessions" })),
    sources_utm: await safe("GA4 sources", () =>
      ga(token, gaWeeks.current, { dimensions: ["sessionSource", "sessionMedium", "sessionCampaignName"], metrics: ["sessions", "engagedSessions", "keyEvents"], orderBy: "sessions", limit: 20 })),
    pages_entree: await safe("GA4 pages d'entrée", () =>
      ga(token, gaWeeks.current, { dimensions: ["landingPage"], metrics: ["sessions", "engagementRate", "averageSessionDuration", "keyEvents"], orderBy: "sessions", limit: 20 })),
    pages_vues: await safe("GA4 pages", () =>
      ga(token, gaWeeks.current, { dimensions: ["pagePath"], metrics: ["screenPageViews", "activeUsers", "userEngagementDuration"], orderBy: "screenPageViews", limit: 25 })),
    appareils: await safe("GA4 appareils", () =>
      ga(token, gaWeeks.current, { dimensions: ["deviceCategory"], metrics: ["sessions", "engagementRate", "averageSessionDuration", "keyEvents"], orderBy: "sessions" })),
    villes: await safe("GA4 villes", () =>
      ga(token, gaWeeks.current, { dimensions: ["country", "city"], metrics: ["sessions", "engagementRate"], orderBy: "sessions", limit: 12 })),
    evenements: await safe("GA4 événements", () => both({ dimensions: ["eventName"], metrics: ["eventCount", "totalUsers"], orderBy: "eventCount", limit: 40 })),
    clics: await safe("GA4 clics", () =>
      ga(token, gaWeeks.current, { dimensions: ["pagePath", "linkId", "linkText", "linkUrl"], metrics: ["eventCount", "totalUsers"], ...eventIs("msd_click"), orderBy: "eventCount", limit: 40 })),
    sections_vues: await safe("GA4 sections", () =>
      ga(token, gaWeeks.current, { dimensions: ["pagePath", "linkId"], metrics: ["totalUsers"], ...eventIs("section_view"), orderBy: "totalUsers", limit: 60 })),
    defilement: await safe("GA4 défilement", () =>
      ga(token, gaWeeks.current, { dimensions: ["pagePath", "percentScrolled"], metrics: ["totalUsers"], ...eventIs("scroll_depth"), orderBy: "totalUsers", limit: 60 })),
    formulaires: await safe("GA4 formulaires", () =>
      ga(token, gaWeeks.current, {
        dimensions: ["eventName", "pagePath", "linkText"],
        metrics: ["eventCount", "totalUsers"],
        ...eventIs("form_start", "form_abandon", "lead_submit_attempt", "lead_submit_success", "lead_submit_error", "lead_confirmed", "booking_intent", "booking_completed"),
        orderBy: "eventCount",
        limit: 40
      })),
    faq: await safe("GA4 FAQ", () =>
      ga(token, gaWeeks.current, { dimensions: ["pagePath", "linkText"], metrics: ["eventCount"], ...eventIs("faq_open"), orderBy: "eventCount", limit: 15 })),
    search_console: await safe("Search Console", async () => {
      const [totalNow, totalPrev, queries, pages] = await Promise.all([
        gsc(token, gscWeeks.current, [], 1),
        gsc(token, gscWeeks.previous, [], 1),
        gsc(token, gscWeeks.current, ["query"], 200),
        gsc(token, gscWeeks.current, ["page"], 20)
      ]);
      const round = (row) => ({ ...row, ctr: Math.round(row.ctr * 1000) / 10, position: Math.round(row.position * 10) / 10 });
      return {
        total: { current: totalNow[0] || null, previous: totalPrev[0] || null },
        top_requetes: queries.slice(0, 20).map(round),
        // Requêtes déjà proches du top 3 qui rapportent peu : les moins chères à gagner.
        opportunites: queries
          .filter((q) => q.position >= 4 && q.position <= 20 && q.impressions >= 20)
          .sort((a, b) => b.impressions - a.impressions)
          .slice(0, 12)
          .map(round),
        top_pages: pages.map(round)
      };
    })
  };
  data.erreurs_collecte = errors;
  return data;
}

function mockData() {
  const range = weekWindows(1);
  const row = (o) => o;
  return {
    periode_ga4: range,
    periode_search_console: weekWindows(GSC_LAG_DAYS),
    vue_ensemble: {
      current: [row({ totalUsers: 142, newUsers: 121, sessions: 171, engagedSessions: 88, engagementRate: 0.51, averageSessionDuration: 74, screenPageViews: 310, keyEvents: 3 })],
      previous: [row({ totalUsers: 118, newUsers: 101, sessions: 140, engagedSessions: 66, engagementRate: 0.47, averageSessionDuration: 69, screenPageViews: 255, keyEvents: 1 })]
    },
    canaux: { current: [row({ sessionDefaultChannelGroup: "Organic Search", sessions: 90, engagementRate: 0.55, keyEvents: 2 })], previous: [] },
    sources_utm: [row({ sessionSource: "google", sessionMedium: "organic", sessionCampaignName: "(organic)", sessions: 90, engagedSessions: 50, keyEvents: 2 })],
    pages_entree: [row({ landingPage: "/", sessions: 80, engagementRate: 0.5, averageSessionDuration: 61, keyEvents: 1 })],
    pages_vues: [row({ pagePath: "/", screenPageViews: 120, activeUsers: 90, userEngagementDuration: 4100 })],
    appareils: [row({ deviceCategory: "mobile", sessions: 100, engagementRate: 0.42, averageSessionDuration: 40, keyEvents: 0 })],
    villes: [row({ country: "France", city: "Annecy", sessions: 30, engagementRate: 0.6 })],
    evenements: { current: [row({ eventName: "msd_click", eventCount: 210, totalUsers: 80 })], previous: [] },
    clics: [row({ pagePath: "/", linkId: "hero", linkText: "Réserver un appel", linkUrl: "https://cal.com/msd", eventCount: 12, totalUsers: 10 })],
    sections_vues: [row({ pagePath: "/", linkId: "faq", totalUsers: 18 })],
    defilement: [row({ pagePath: "/", percentScrolled: "50", totalUsers: 40 })],
    formulaires: [row({ eventName: "form_abandon", pagePath: "/contact/", linkText: "telephone", eventCount: 4, totalUsers: 4 })],
    faq: [],
    search_console: { total: { current: { clicks: 25, impressions: 2100, ctr: 0.012, position: 21 }, previous: null }, top_requetes: [], opportunites: [], top_pages: [] },
    erreurs_collecte: []
  };
}

// ─── ANALYSE ────────────────────────────────────────────────────────────────

const SITE_CONTEXT = `Site : msd-media.com, agence web MSD Media (Annecy, Haute-Savoie), fondée par Maxens Soldan.
Offre : landing pages et sites vitrine sur mesure livrés en 21 jours, SEO local, GEO. Cibles : PME, indépendants,
professions libérales (médecins, avocats, artisans...), startups. Conversions : demande via /contact/ (formulaire),
appel réservé sur Cal.com, WhatsApp, téléphone. Pages clés : accueil, /tarifs/, /realisations/, pages ville
(/agence-web-annecy/...), pages métier (/site-web-medecin/...), blog.
Événements maison : msd_click (tout clic ; linkId = section de la page), section_view (linkId = id de la section),
scroll_depth (percentScrolled), form_start / form_abandon (linkText = dernier champ touché), lead_submit_success,
booking_intent / booking_completed, faq_open (linkText = question), video_play, ai_referral.`;

async function analyzeWithClaude(data) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompt = `${SITE_CONTEXT}

Voici les données de la semaine (GA4 : 7 derniers jours complets vs les 7 précédents ; Search Console décalée de ${GSC_LAG_DAYS} jours) :

${JSON.stringify(data)}

Rédige le rapport hebdomadaire envoyé à Maxens sur Telegram, en français, en texte brut (pas de Markdown, pas de tableaux ; emojis sobres autorisés comme repères de section). 3 500 caractères maximum.

Structure :
1. 📊 La semaine en chiffres : visiteurs, sessions, taux d'engagement, durée moyenne, conversions (demandes, appels), clics et impressions Google, chaque fois avec l'évolution vs la semaine précédente.
2. 🧭 D'où viennent les visiteurs : canaux et sources/UTM qui comptent, trafic IA s'il y en a.
3. 👀 Comportement : pages qui retiennent ou font fuir, sections réellement vues, jusqu'où on défile, clics les plus fréquents, champs où les formulaires sont abandonnés, différences mobile/ordinateur.
4. 🎯 5 actions max pour la semaine prochaine, classées par impact attendu sur les demandes de contact. Pour chacune : quoi changer exactement (page, section, élément), pourquoi (le chiffre qui le justifie), effort (faible/moyen/fort).
5. ⚠️ Fiabilité : signale les volumes trop faibles pour conclure et toute anomalie de mesure (événement à zéro qui ne devrait pas l'être, erreurs de collecte listées dans erreurs_collecte).

Règles : chaque affirmation et chaque action doit s'appuyer sur un chiffre fourni. Avec quelques dizaines de sessions, une variation de quelques unités n'est pas une tendance : dis-le plutôt que d'en tirer une conclusion. N'invente aucune donnée absente.`;

  const response = await anthropic.beta.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 16000,
    output_config: { effort: "high" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [{ role: "user", content: prompt }]
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`refus du modèle (${response.stop_details?.category || "sans catégorie"})`);
  }
  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
  if (!text) throw new Error(`réponse vide (stop_reason=${response.stop_reason})`);
  return text;
}

// Résumé chiffré sans IA, utilisé si Claude n'est pas disponible.
function summaryWithoutClaude(data) {
  const fmt = (n) => (n === null || n === undefined ? "—" : Math.round(n).toLocaleString("fr-FR"));
  const pct = (n) => (n === null || n === undefined ? "—" : `${Math.round(n * 1000) / 10} %`);
  const delta = (a, b) => (a !== undefined && b ? ` (${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)} %)` : "");
  const now = data.vue_ensemble?.current?.[0] || {};
  const prev = data.vue_ensemble?.previous?.[0] || {};
  const gscNow = data.search_console?.total?.current || {};
  const gscPrev = data.search_console?.total?.previous || {};
  const lines = [
    "📊 La semaine en chiffres",
    `Visiteurs : ${fmt(now.totalUsers)}${delta(now.totalUsers, prev.totalUsers)}`,
    `Sessions : ${fmt(now.sessions)}${delta(now.sessions, prev.sessions)} · engagement ${pct(now.engagementRate)}`,
    `Durée moyenne : ${fmt(now.averageSessionDuration)} s · conversions : ${fmt(now.keyEvents)}`,
    `Google : ${fmt(gscNow.clicks)} clics${delta(gscNow.clicks, gscPrev.clicks)} · ${fmt(gscNow.impressions)} impressions`,
    "",
    "🧭 Top sources",
    ...(data.sources_utm || []).slice(0, 5).map((r) => `- ${r.sessionSource} / ${r.sessionMedium} : ${fmt(r.sessions)} sessions`),
    "",
    "👆 Clics les plus fréquents",
    ...(data.clics || []).slice(0, 5).map((r) => `- ${r.linkText} (${r.pagePath}, ${r.linkId}) : ${fmt(r.eventCount)}`),
    "",
    "ℹ️ Analyse et recommandations indisponibles cette semaine (Claude non joignable)."
  ];
  if (data.erreurs_collecte?.length) lines.push("", "⚠️ Erreurs de collecte :", ...data.erreurs_collecte.map((e) => `- ${e}`));
  return lines.join("\n");
}

// ─── TELEGRAM ───────────────────────────────────────────────────────────────

function splitForTelegram(text, max = 3900) {
  const chunks = [];
  let current = "";
  for (const line of text.split("\n")) {
    if ((current + "\n" + line).length > max && current) {
      chunks.push(current);
      current = line;
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function sendTelegram(text) {
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_CHAT_ID: chatId } = process.env;
  if (!token || !chatId) throw new Error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID manquants.");
  const chunks = splitForTelegram(text);
  for (const [index, chunk] of chunks.entries()) {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: chunk, disable_web_page_preview: true })
    });
    if (!response.ok) {
      throw new Error(`Telegram ${response.status} (message ${index + 1}/${chunks.length}) : ${(await response.text()).slice(0, 300)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1100)); // 1 message/s par chat
  }
  console.log(`[site-report] ${chunks.length} message(s) Telegram envoyé(s).`);
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function run() {
  await loadEnvFile(envFilePath);

  let data;
  if (MOCK) {
    data = mockData();
  } else {
    const missing = ["GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY", "GA4_PROPERTY_ID", "GSC_SITE_URL"].filter((k) => !process.env[k]);
    if (missing.length) throw new Error(`Variables manquantes : ${missing.join(", ")}`);
    data = await collect();
  }
  if (data.erreurs_collecte.length) console.warn(`[site-report] Erreurs de collecte :\n- ${data.erreurs_collecte.join("\n- ")}`);

  let body;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      body = await analyzeWithClaude(data);
    } catch (error) {
      console.warn(`[site-report] Analyse Claude impossible : ${error.message}`);
      body = summaryWithoutClaude(data);
    }
  } else {
    body = summaryWithoutClaude(data);
  }

  const { startDate, endDate } = data.periode_ga4.current;
  const report = `📈 Rapport site msd-media.com\nSemaine du ${startDate} au ${endDate}\n\n${body}`;

  if (DRY_RUN) {
    console.log(report);
    return;
  }
  await sendTelegram(report);
}

run().catch((error) => {
  console.error(`[site-report] ${error.message}`);
  process.exit(1);
});
