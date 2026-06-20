import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { JWT } from "google-auth-library";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envFilePath = path.join(projectRoot, ".env.analytics");

const EVENTS_OF_INTEREST = [
  "msd_page_view",
  "scroll_depth",
  "cta_click",
  "booking_intent",
  "booking_loaded",
  "booking_completed",
  "form_submit_attempt",
  "lead_submit_attempt",
  "lead_submit_success",
  "lead_submit_error",
  "lead_confirmed",
  "time_on_page"
];

const requiredEnvKeys = ["RESEND_API_KEY", "MAIL_TO"];

const googleEnvKeys = [
  "GA4_PROPERTY_ID",
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
  "GSC_SITE_URL"
];

function parseArgs(argv) {
  const args = {};
  for (const part of argv) {
    const match = part.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

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

function formatNumber(value) {
  return new Intl.NumberFormat("fr-FR").format(Number(value || 0));
}

function formatPercent(value) {
  return `${(Number(value || 0) * 100).toFixed(1)} %`;
}

function formatSeconds(value) {
  const total = Math.max(0, Math.round(Number(value || 0)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Minimal markdown -> HTML for the weekly digest (headings, lists, bold, links, paragraphs).
function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  let html = "";
  let inList = false;

  function inline(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#111;text-decoration:underline">$1</a>');
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    const listItem = line.match(/^[-*]\s+(.*)$/);

    if (heading) {
      if (inList) { html += "</ul>"; inList = false; }
      const level = Math.min(heading[1].length + 1, 4);
      const size = { 2: "18px", 3: "16px", 4: "15px" }[level] || "16px";
      html += `<h${level} style="font-size:${size};font-weight:700;margin:24px 0 8px;color:#111">${inline(escapeHtml(heading[2]))}</h${level}>`;
    } else if (listItem) {
      if (!inList) { html += "<ul style=\"margin:0 0 16px;padding-left:20px\">"; inList = true; }
      html += `<li style="color:#555;font-size:15px;line-height:1.6;margin-bottom:4px">${inline(escapeHtml(listItem[1]))}</li>`;
    } else if (line.trim() === "") {
      if (inList) { html += "</ul>"; inList = false; }
    } else {
      if (inList) { html += "</ul>"; inList = false; }
      html += `<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px">${inline(escapeHtml(line))}</p>`;
    }
  }
  if (inList) html += "</ul>";
  return html;
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

function readGaMetric(report, index) {
  return Number(report?.rows?.[0]?.metricValues?.[index]?.value || 0);
}

function mapGaRows(report, metricNames = []) {
  const rows = report?.rows || [];
  return rows.map((row) => {
    const dimensions = (row.dimensionValues || []).map((d) => d.value || "");
    const metrics = (row.metricValues || []).map((m) => Number(m.value || 0));
    const metricMap = {};
    metricNames.forEach((name, idx) => {
      metricMap[name] = metrics[idx] || 0;
    });
    return { dimensions, metrics: metricMap };
  });
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

function getDateRange(days) {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return {
    startDate: formatDate(start),
    endDate: formatDate(end)
  };
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
  <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;border:1px solid #e8e8e8">
    ${content}
    ${SIGNATURE}
  </div>
</body>
</html>`;
}

function buildEmailHtml({ startDate, endDate, weeklyDigestHtml, hasGoogleData, googleData }) {
  let googleSection = `<p style="color:#aaa;font-size:14px;margin:0 0 16px">Données GA4 / Search Console non configurées pour cette exécution.</p>`;

  if (hasGoogleData) {
    const { gaOverview, gscOverview, gscQueries, gscPages } = googleData;

    const gaRows = [
      ["Sessions", formatNumber(gaOverview.sessions)],
      ["Utilisateurs", formatNumber(gaOverview.totalUsers)],
      ["Pages vues", formatNumber(gaOverview.pageViews)],
      ["Engagement", formatPercent(gaOverview.engagementRate)],
      ["Durée moy.", formatSeconds(gaOverview.averageSessionDuration)],
      ["Événements", formatNumber(gaOverview.eventCount)]
    ];

    const gscRows = [
      ["Clics SEO", formatNumber(gscOverview.clicks)],
      ["Impressions", formatNumber(gscOverview.impressions)],
      ["CTR", `${Number(gscOverview.ctr || 0).toFixed(2)} %`],
      ["Position moy.", Number(gscOverview.position || 0).toFixed(2)]
    ];

    const queryRows = gscQueries.slice(0, 8).map((row) => [
      row.keys?.[0] || "(not set)",
      formatNumber(row.clicks),
      formatNumber(row.impressions),
      `${Number(row.ctr * 100 || 0).toFixed(2)} %`,
      Number(row.position || 0).toFixed(1)
    ]);

    const pageRows = gscPages.slice(0, 8).map((row) => [
      (row.keys?.[0] || "(not set)").replace("https://msd-media.com", ""),
      formatNumber(row.clicks),
      formatNumber(row.impressions),
      `${Number(row.ctr * 100 || 0).toFixed(2)} %`,
      Number(row.position || 0).toFixed(1)
    ]);

    googleSection = `
      <h3 style="font-size:15px;font-weight:700;margin:0 0 8px;color:#111">Google Analytics</h3>
      ${toTableHtml(["Indicateur", "Valeur"], gaRows)}
      <h3 style="font-size:15px;font-weight:700;margin:0 0 8px;color:#111">Search Console</h3>
      ${toTableHtml(["Indicateur", "Valeur"], gscRows)}
      <h3 style="font-size:15px;font-weight:700;margin:0 0 8px;color:#111">Top requêtes</h3>
      ${toTableHtml(["Requête", "Clics", "Impr.", "CTR", "Position"], queryRows)}
      <h3 style="font-size:15px;font-weight:700;margin:0 0 8px;color:#111">Top pages</h3>
      ${toTableHtml(["Page", "Clics", "Impr.", "CTR", "Position"], pageRows)}`;
  }

  return layout(`
    <h1 style="font-size:22px;font-weight:700;color:#111;margin:0 0 8px">
      Rapport SEO hebdomadaire
    </h1>
    <p style="color:#888;font-size:13px;margin:0 0 24px">Semaine du ${escapeHtml(startDate)} au ${escapeHtml(endDate)} — msd-media.com</p>

    ${weeklyDigestHtml || "<p style='color:#aaa;font-size:14px'>Aucune activité rapportée cette semaine.</p>"}

    <h2 style="font-size:18px;font-weight:700;color:#111;margin:24px 0 8px">Données de la semaine</h2>
    ${googleSection}
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

  const args = parseArgs(process.argv.slice(2));
  const days = Math.max(1, Number(process.env.REPORT_DAYS || 7));
  const { startDate, endDate } = getDateRange(days);

  let weeklyDigestMarkdown = "";
  if (args["summary-file"]) {
    weeklyDigestMarkdown = await fs.readFile(args["summary-file"], "utf8");
  } else if (args.summary) {
    weeklyDigestMarkdown = args.summary;
  }
  const weeklyDigestHtml = weeklyDigestMarkdown ? markdownToHtml(weeklyDigestMarkdown) : "";

  let hasGoogleData = false;
  let googleData = null;

  const missingGoogle = googleEnvKeys.filter((k) => !process.env[k]);
  if (missingGoogle.length) {
    console.warn(`[send-seo-weekly-report] Credentials Google manquants (${missingGoogle.join(", ")}). Section GA4/GSC ignorée.`);
  } else {
    const token = await getGoogleAccessToken();
    const baseDateRange = [{ startDate, endDate }];

    const [gaOverviewReport, gaChannelsReport, gaSourceReport, gaPagesReport, gaEventsReport, gscOverviewReport, gscQueryReport, gscPagesReport] = await Promise.all([
      runGaReport(token, { dateRanges: baseDateRange, metrics: [{ name: "totalUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "engagementRate" }, { name: "averageSessionDuration" }, { name: "eventCount" }] }),
      runGaReport(token, { dateRanges: baseDateRange, dimensions: [{ name: "sessionDefaultChannelGroup" }], metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "engagementRate" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: "10" }),
      runGaReport(token, { dateRanges: baseDateRange, dimensions: [{ name: "sessionSourceMedium" }], metrics: [{ name: "sessions" }, { name: "totalUsers" }], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: "12" }),
      runGaReport(token, { dateRanges: baseDateRange, dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }, { name: "sessions" }, { name: "averageSessionDuration" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: "12" }),
      runGaReport(token, { dateRanges: baseDateRange, dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }, { name: "totalUsers" }], dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: EVENTS_OF_INTEREST } } }, orderBys: [{ metric: { metricName: "eventCount" }, desc: true }], limit: "20" }),
      runGscQuery(token, { startDate, endDate, rowLimit: 1 }),
      runGscQuery(token, { startDate, endDate, dimensions: ["query"], rowLimit: 10 }),
      runGscQuery(token, { startDate, endDate, dimensions: ["page"], rowLimit: 10 })
    ]);

    const gaOverview = {
      totalUsers: readGaMetric(gaOverviewReport, 0),
      sessions: readGaMetric(gaOverviewReport, 1),
      pageViews: readGaMetric(gaOverviewReport, 2),
      engagementRate: readGaMetric(gaOverviewReport, 3),
      averageSessionDuration: readGaMetric(gaOverviewReport, 4),
      eventCount: readGaMetric(gaOverviewReport, 5)
    };
    const gscOverviewRow = gscOverviewReport.rows?.[0] || {};
    const gscOverview = {
      clicks: Number(gscOverviewRow.clicks || 0),
      impressions: Number(gscOverviewRow.impressions || 0),
      ctr: Number(gscOverviewRow.ctr || 0) * 100,
      position: Number(gscOverviewRow.position || 0)
    };

    googleData = {
      gaOverview,
      channels: mapGaRows(gaChannelsReport, ["sessions", "totalUsers", "engagementRate"]),
      sources: mapGaRows(gaSourceReport, ["sessions", "totalUsers"]),
      pages: mapGaRows(gaPagesReport, ["screenPageViews", "sessions", "averageSessionDuration"]),
      events: mapGaRows(gaEventsReport, ["eventCount", "totalUsers"]),
      gscOverview,
      gscQueries: gscQueryReport.rows || [],
      gscPages: gscPagesReport.rows || []
    };
    hasGoogleData = true;
  }

  const html = buildEmailHtml({ startDate, endDate, weeklyDigestHtml, hasGoogleData, googleData });

  const from = process.env.MAIL_FROM || "MSD Media <maxens.soldan@msd-media.com>";
  const to = process.env.MAIL_TO;
  const subject = `Rapport SEO hebdo — ${startDate} → ${endDate}`;

  const sent = await sendViaResend({ from, to, subject, html });
  console.log(`Email hebdo SEO envoyé: ${sent.id || JSON.stringify(sent)}`);
}

run().catch((error) => {
  console.error("[send-seo-weekly-report] Erreur:", error.message);
  process.exitCode = 1;
});
