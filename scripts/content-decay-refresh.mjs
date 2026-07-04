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
const SITE_URL = "https://msd-media.com";
const BLOG_PATH_MARKER = "/blog/articles/";

// 90 days of GSC history, split into two 45-day halves to compare decay.
const HALF_DAYS = 45;

// Skip articles with too little visibility to draw a real conclusion from.
const MIN_PREVIOUS_IMPRESSIONS = 10;

const ANTHROPIC_MODEL = "claude-sonnet-4-6";

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

function getHalves() {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1); // yesterday (GSC lag)

  const recentStart = new Date(end);
  recentStart.setUTCDate(recentStart.getUTCDate() - (HALF_DAYS - 1));

  const priorEnd = new Date(recentStart);
  priorEnd.setUTCDate(priorEnd.getUTCDate() - 1);
  const priorStart = new Date(priorEnd);
  priorStart.setUTCDate(priorStart.getUTCDate() - (HALF_DAYS - 1));

  return {
    recent: { startDate: formatDate(recentStart), endDate: formatDate(end) },
    prior: { startDate: formatDate(priorStart), endDate: formatDate(priorEnd) }
  };
}

function isBlogArticlePage(page) {
  return typeof page === "string" && page.includes(BLOG_PATH_MARKER);
}

function slugFromPage(page) {
  try {
    const pathname = new URL(page).pathname;
    const parts = pathname.split("/").filter(Boolean);
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
  const byPage = new Map();
  for (const row of report.rows || []) {
    const page = row.keys?.[0];
    if (!isBlogArticlePage(page)) continue;
    byPage.set(page, {
      page,
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      position: Number(row.position || 0)
    });
  }
  return byPage;
}

async function fetchTopQueriesForPage(token, page, dateRange, limit = 10) {
  const report = await runGscQuery(token, {
    ...dateRange,
    dimensions: ["query"],
    dimensionFilterGroups: [
      { filters: [{ dimension: "page", operator: "equals", expression: page }] }
    ],
    rowLimit: limit
  });
  return (report.rows || []).map((row) => ({
    query: row.keys?.[0] || "(not set)",
    clicks: Number(row.clicks || 0),
    impressions: Number(row.impressions || 0),
    position: Number(row.position || 0)
  }));
}

function findWorstDecay(recentByPage, priorByPage) {
  const decaying = [];
  for (const [page, recent] of recentByPage.entries()) {
    const prior = priorByPage.get(page);
    if (!prior) continue;
    if (prior.impressions < MIN_PREVIOUS_IMPRESSIONS) continue;

    const clicksDelta = recent.clicks - prior.clicks; // negative = decay
    const positionDelta = recent.position - prior.position; // positive = worse

    // Only consider genuine decay: fewer clicks or a worse average position.
    if (clicksDelta >= 0 && positionDelta <= 0) continue;

    decaying.push({ page, recent, prior, clicksDelta, positionDelta });
  }

  // Rank by biggest click loss first, tie-broken by biggest position regression.
  decaying.sort((a, b) => {
    if (a.clicksDelta !== b.clicksDelta) return a.clicksDelta - b.clicksDelta;
    return b.positionDelta - a.positionDelta;
  });

  return decaying;
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function loadArticleFromManifest(slug) {
  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw);
    const article = manifest.find((a) => a.slug === slug);
    return { article, manifest };
  } catch (error) {
    console.warn(`[content-decay-refresh] Impossible de lire le manifest: ${error.message}`);
    return { article: null, manifest: [] };
  }
}

async function callAnthropicForOutline({ article, queryDiff, manifest }) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const bodyText = article?.html ? stripHtml(article.html).slice(0, 6000) : "(contenu introuvable, se baser sur le titre et les mots-clés)";

  const otherArticles = manifest
    .filter((a) => a.slug !== article?.slug)
    .slice(0, 40)
    .map((a) => `- ${a.title} — /blog/articles/${a.slug}/`)
    .join("\n");

  const queryLines = queryDiff
    .map(
      (q) =>
        `- "${q.query}": clics ${q.prevClicks} → ${q.currClicks}, position ${q.prevPosition.toFixed(1)} → ${q.currPosition.toFixed(1)}`
    )
    .join("\n");

  const prompt = `Tu es expert SEO pour MSD Media, agence web à Annecy (France) spécialisée en landing pages et sites sur-mesure B2B/SaaS.

L'article de blog suivant perd du terrain sur Google Search Console (moins de clics et/ou position moyenne qui se dégrade sur les 45 derniers jours vs les 45 précédents) :

TITRE ACTUEL : ${article?.title || "(inconnu)"}
DESCRIPTION : ${article?.description || "(inconnue)"}
SLUG : ${article?.slug || "(inconnu)"}

REQUÊTES EN BAISSE (query, clics avant → après, position avant → après) :
${queryLines || "(pas de détail requête disponible)"}

CONTENU ACTUEL DE L'ARTICLE (texte brut, tronqué) :
"""
${bodyText}
"""

AUTRES ARTICLES DU BLOG DISPONIBLES POUR LE MAILLAGE INTERNE :
${otherArticles || "(aucun autre article listé)"}

Rédige une note d'action concrète pour rafraîchir cet article et regagner en position. Retourne UNIQUEMENT du markdown, structuré ainsi :

## Diagnostic
[2-3 phrases sur pourquoi l'article décroche probablement, en te basant sur les requêtes en baisse]

## Nouvelles sections à ajouter
[Liste de 3-5 nouveaux H2/H3 concrets avec 1 phrase de contenu prévu chacun, qui répondent mieux aux requêtes en baisse]

## Entités et sujets à couvrir
[Liste d'entités/concepts/mots-clés sémantiquement liés à intégrer pour renforcer l'E-E-A-T et la couverture topique]

## Maillage interne recommandé
[Liste de 3-6 liens internes précis à ajouter, en piochant dans la liste des autres articles fournie, avec l'ancre de texte suggérée]

## Autres actions rapides
[2-3 actions rapides: mise à jour de la date, ajout de FAQ, mise à jour de stats/chiffres, etc.]

Sois concret et actionnable, pas générique. Ne réécris pas l'article entier, seulement le plan de mise à jour.`;

  const response = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }]
  });

  return response.content[0].text;
}

async function run() {
  await loadEnvFile(envFilePath);
  assertEnvVars(requiredEnvKeys);

  const missingGoogle = googleEnvKeys.filter((k) => !process.env[k]);
  if (missingGoogle.length) {
    console.warn(`[content-decay-refresh] Credentials Google manquants (${missingGoogle.join(", ")}). Arrêt.`);
    return;
  }

  const token = await getGoogleAccessToken();
  const { recent, prior } = getHalves();

  const [recentByPage, priorByPage] = await Promise.all([
    fetchBlogPageStats(token, recent),
    fetchBlogPageStats(token, prior)
  ]);

  const decaying = findWorstDecay(recentByPage, priorByPage);

  if (!decaying.length) {
    console.log("[content-decay-refresh] Aucun article de blog en décroissance détecté sur la fenêtre 90 jours.");
    return;
  }

  const worst = decaying[0];
  const slug = slugFromPage(worst.page);
  console.log(`[content-decay-refresh] Article le plus en décroissance: ${worst.page} (slug=${slug})`);
  console.log(`  clics: ${worst.prior.clicks} -> ${worst.recent.clicks} | position: ${worst.prior.position.toFixed(1)} -> ${worst.recent.position.toFixed(1)}`);

  const [currentQueries, priorQueries] = await Promise.all([
    fetchTopQueriesForPage(token, worst.page, recent),
    fetchTopQueriesForPage(token, worst.page, prior)
  ]);

  const priorByQuery = new Map(priorQueries.map((q) => [q.query, q]));
  const queryDiff = currentQueries
    .map((q) => {
      const before = priorByQuery.get(q.query);
      return {
        query: q.query,
        currClicks: q.clicks,
        prevClicks: before?.clicks || 0,
        currPosition: q.position,
        prevPosition: before?.position ?? q.position
      };
    })
    .sort((a, b) => (a.currClicks - a.prevClicks) - (b.currClicks - b.prevClicks))
    .slice(0, 8);

  const { article, manifest } = await loadArticleFromManifest(slug);

  const outline = await callAnthropicForOutline({ article, queryDiff, manifest });

  const isoDate = formatDate(new Date());
  const reportFileName = `content-decay-${isoDate}.md`;
  const reportPath = path.join(reportsDir, reportFileName);

  const reportHeader = `# Content decay report — ${isoDate}

Article le plus en décroissance sur les 90 derniers jours (comparaison 45j vs 45j précédents) :

- URL: ${worst.page}
- Titre: ${article?.title || "(inconnu)"}
- Clics: ${worst.prior.clicks} → ${worst.recent.clicks} (${worst.clicksDelta >= 0 ? "+" : ""}${worst.clicksDelta})
- Position moyenne: ${worst.prior.position.toFixed(1)} → ${worst.recent.position.toFixed(1)} (${worst.positionDelta >= 0 ? "+" : ""}${worst.positionDelta.toFixed(1)})
- Fenêtre récente: ${recent.startDate} → ${recent.endDate}
- Fenêtre précédente: ${prior.startDate} → ${prior.endDate}

Autres articles en décroissance détectés cette fois (pour les prochaines passes) :
${decaying
  .slice(1, 10)
  .map((d) => `- ${d.page} (clics ${d.prior.clicks} → ${d.recent.clicks}, position ${d.prior.position.toFixed(1)} → ${d.recent.position.toFixed(1)})`)
  .join("\n") || "(aucun autre)"}

---

`;

  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(reportPath, reportHeader + outline, "utf8");
  console.log(`[content-decay-refresh] Rapport écrit: ${reportPath}`);

  // Optional low-noise notification, same Resend pattern as the other loops.
  if (process.env.RESEND_API_KEY && process.env.MAIL_TO) {
    const from = process.env.MAIL_FROM || "MSD Media <maxens.soldan@msd-media.com>";
    const to = process.env.MAIL_TO;
    const subject = `Content decay — nouveau rapport prêt (${article?.title || slug})`;
    const html = `<!DOCTYPE html>
<html lang="fr"><body style="font-family:Inter,Arial,sans-serif;background:#f9f9f7;margin:0;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e8e8e8">
    <h1 style="font-size:18px;color:#111;margin:0 0 12px">Rapport de decay de contenu généré</h1>
    <p style="font-size:14px;color:#555;line-height:1.6">
      Article le plus en décroissance : <strong>${article?.title || slug}</strong><br/>
      Clics: ${worst.prior.clicks} → ${worst.recent.clicks} · Position: ${worst.prior.position.toFixed(1)} → ${worst.recent.position.toFixed(1)}
    </p>
    <p style="font-size:13px;color:#888">Fichier: <code>seo-reports/${reportFileName}</code> (à committer/consulter dans le repo).</p>
  </div>
</body></html>`;

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
      console.warn(`[content-decay-refresh] Echec envoi email de notification: ${response.status} ${raw.slice(0, 300)}`);
    } else {
      console.log("[content-decay-refresh] Email de notification envoyé.");
    }
  }
}

run().catch((error) => {
  console.error("[content-decay-refresh] Erreur:", error.message);
  process.exitCode = 1;
});
