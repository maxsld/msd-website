import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { JWT } from "google-auth-library";
import nodemailer from "nodemailer";

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

const requiredEnvKeys = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "MAIL_TO"
];

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
  if (!rows.length) return "<p style='margin:0;'>Aucune donnée.</p>";
  const thead = `<tr>${headers
    .map(
      (header) =>
        `<th style="text-align:left;padding:10px;border-bottom:1px solid #e6e6e6;">${escapeHtml(header)}</th>`
    )
    .join("")}</tr>`;
  const tbody = rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell) =>
              `<td style="padding:10px;border-bottom:1px solid #f1f1f1;vertical-align:top;">${escapeHtml(cell)}</td>`
          )
          .join("")}</tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;">${thead}${tbody}</table>`;
}

function getDateRange() {
  const days = Math.max(1, Number(process.env.REPORT_DAYS || 7));
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return {
    startDate: formatDate(start),
    endDate: formatDate(end)
  };
}

function buildEmailHtml({
  startDate,
  endDate,
  gaOverview,
  channels,
  sources,
  pages,
  events,
  gscOverview,
  gscQueries,
  gscPages
}) {
  const overviewCards = [
    ["Utilisateurs", formatNumber(gaOverview.totalUsers)],
    ["Sessions", formatNumber(gaOverview.sessions)],
    ["Pages vues", formatNumber(gaOverview.pageViews)],
    ["Engagement", formatPercent(gaOverview.engagementRate)],
    ["Durée session moyenne", formatSeconds(gaOverview.averageSessionDuration)],
    ["Événements", formatNumber(gaOverview.eventCount)]
  ];

  const cardsHtml = overviewCards
    .map(
      ([label, value]) =>
        `<div style="background:#ffffff;border:1px solid #ececec;border-radius:10px;padding:14px;">
          <div style="font-size:12px;color:#737373;">${escapeHtml(label)}</div>
          <div style="font-size:22px;font-weight:700;color:#111;margin-top:6px;">${escapeHtml(value)}</div>
        </div>`
    )
    .join("");

  const channelRows = channels.map((row) => [
    row.dimensions[0] || "(not set)",
    formatNumber(row.metrics.sessions),
    formatNumber(row.metrics.totalUsers),
    formatPercent(row.metrics.engagementRate)
  ]);

  const sourceRows = sources.map((row) => [
    row.dimensions[0] || "(direct)",
    formatNumber(row.metrics.sessions),
    formatNumber(row.metrics.totalUsers)
  ]);

  const pageRows = pages.map((row) => [
    row.dimensions[0] || "/",
    formatNumber(row.metrics.screenPageViews),
    formatNumber(row.metrics.sessions),
    formatSeconds(row.metrics.averageSessionDuration)
  ]);

  const eventRows = events.map((row) => [
    row.dimensions[0],
    formatNumber(row.metrics.eventCount),
    formatNumber(row.metrics.totalUsers)
  ]);

  const gscSummary = [
    ["Clics SEO", formatNumber(gscOverview.clicks)],
    ["Impressions SEO", formatNumber(gscOverview.impressions)],
    ["CTR SEO", `${Number(gscOverview.ctr || 0).toFixed(2)} %`],
    ["Position moyenne", Number(gscOverview.position || 0).toFixed(2)]
  ];

  const gscSummaryRows = gscSummary.map(([label, value]) => [label, value]);

  const gscQueryRows = gscQueries.map((row) => [
    row.keys?.[0] || "(not set)",
    formatNumber(row.clicks),
    formatNumber(row.impressions),
    `${Number(row.ctr * 100 || 0).toFixed(2)} %`,
    Number(row.position || 0).toFixed(2)
  ]);

  const gscPageRows = gscPages.map((row) => [
    row.keys?.[0] || "(not set)",
    formatNumber(row.clicks),
    formatNumber(row.impressions),
    `${Number(row.ctr * 100 || 0).toFixed(2)} %`,
    Number(row.position || 0).toFixed(2)
  ]);

  return `<!doctype html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f7f7f7;font-family:Inter,Arial,sans-serif;color:#111;">
  <div style="max-width:980px;margin:20px auto;background:#fff;border:1px solid #ececec;border-radius:12px;overflow:hidden;">
    <div style="padding:20px 24px;background:#111;color:#fff;">
      <h1 style="margin:0;font-size:24px;">Dashboard hebdo MSD Media</h1>
      <p style="margin:8px 0 0;color:#d4d4d4;">Période: ${escapeHtml(startDate)} → ${escapeHtml(endDate)}</p>
    </div>

    <div style="padding:20px 24px;">
      <h2 style="margin:0 0 12px;font-size:18px;">Vue d'ensemble (GA4)</h2>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;">
        ${cardsHtml}
      </div>
    </div>

    <div style="padding:0 24px 20px;">
      <h2 style="font-size:18px;">Canaux d'acquisition</h2>
      ${toTableHtml(["Canal", "Sessions", "Utilisateurs", "Engagement"], channelRows)}
    </div>

    <div style="padding:0 24px 20px;">
      <h2 style="font-size:18px;">Top sources / medium</h2>
      ${toTableHtml(["Source / Medium", "Sessions", "Utilisateurs"], sourceRows)}
    </div>

    <div style="padding:0 24px 20px;">
      <h2 style="font-size:18px;">Top pages</h2>
      ${toTableHtml(["Page", "Vues", "Sessions", "Durée moyenne"], pageRows)}
    </div>

    <div style="padding:0 24px 20px;">
      <h2 style="font-size:18px;">Événements conversion / funnel</h2>
      ${toTableHtml(["Événement", "Volume", "Utilisateurs"], eventRows)}
    </div>

    <div style="padding:0 24px 20px;">
      <h2 style="font-size:18px;">Vue d'ensemble SEO (Search Console)</h2>
      ${toTableHtml(["Indicateur", "Valeur"], gscSummaryRows)}
    </div>

    <div style="padding:0 24px 20px;">
      <h2 style="font-size:18px;">Top requêtes SEO</h2>
      ${toTableHtml(["Requête", "Clics", "Impressions", "CTR", "Position"], gscQueryRows)}
    </div>

    <div style="padding:0 24px 24px;">
      <h2 style="font-size:18px;">Top pages SEO</h2>
      ${toTableHtml(["Page", "Clics", "Impressions", "CTR", "Position"], gscPageRows)}
    </div>
  </div>
</body>
</html>`;
}

function buildEmailText({
  startDate,
  endDate,
  gaOverview,
  gscOverview
}) {
  return [
    `Dashboard hebdo MSD Media (${startDate} -> ${endDate})`,
    "",
    `Utilisateurs: ${formatNumber(gaOverview.totalUsers)}`,
    `Sessions: ${formatNumber(gaOverview.sessions)}`,
    `Pages vues: ${formatNumber(gaOverview.pageViews)}`,
    `Engagement: ${formatPercent(gaOverview.engagementRate)}`,
    `Durée session moyenne: ${formatSeconds(gaOverview.averageSessionDuration)}`,
    `Événements: ${formatNumber(gaOverview.eventCount)}`,
    "",
    `SEO - Clics: ${formatNumber(gscOverview.clicks)}`,
    `SEO - Impressions: ${formatNumber(gscOverview.impressions)}`,
    `SEO - CTR: ${Number(gscOverview.ctr || 0).toFixed(2)} %`,
    `SEO - Position moyenne: ${Number(gscOverview.position || 0).toFixed(2)}`
  ].join("\n");
}

async function run() {
  await loadEnvFile(envFilePath);
  assertEnvVars(requiredEnvKeys);

  const { startDate, endDate } = getDateRange();

  const missingGoogle = googleEnvKeys.filter((k) => !process.env[k]);
  if (missingGoogle.length) {
    console.warn(
      `[weekly-analytics-report] Credentials Google manquants (${missingGoogle.join(", ")}). ` +
      `Configurez ces secrets GitHub pour activer le rapport GA4/GSC. Rapport ignoré.`
    );
    return;
  }

  const token = await getGoogleAccessToken();

  const baseDateRange = [{ startDate, endDate }];

  const [
    gaOverviewReport,
    gaChannelsReport,
    gaSourceReport,
    gaPagesReport,
    gaEventsReport,
    gscOverviewReport,
    gscQueryReport,
    gscPagesReport
  ] = await Promise.all([
    runGaReport(token, {
      dateRanges: baseDateRange,
      metrics: [
        { name: "totalUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "engagementRate" },
        { name: "averageSessionDuration" },
        { name: "eventCount" }
      ]
    }),
    runGaReport(token, {
      dateRanges: baseDateRange,
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "engagementRate" }
      ],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: "10"
    }),
    runGaReport(token, {
      dateRanges: baseDateRange,
      dimensions: [{ name: "sessionSourceMedium" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: "12"
    }),
    runGaReport(token, {
      dateRanges: baseDateRange,
      dimensions: [{ name: "pagePath" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "sessions" },
        { name: "averageSessionDuration" }
      ],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: "12"
    }),
    runGaReport(token, {
      dateRanges: baseDateRange,
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          inListFilter: {
            values: EVENTS_OF_INTEREST
          }
        }
      },
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: "20"
    }),
    runGscQuery(token, {
      startDate,
      endDate,
      rowLimit: 1
    }),
    runGscQuery(token, {
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: 10
    }),
    runGscQuery(token, {
      startDate,
      endDate,
      dimensions: ["page"],
      rowLimit: 10
    })
  ]);

  const gaOverview = {
    totalUsers: readGaMetric(gaOverviewReport, 0),
    sessions: readGaMetric(gaOverviewReport, 1),
    pageViews: readGaMetric(gaOverviewReport, 2),
    engagementRate: readGaMetric(gaOverviewReport, 3),
    averageSessionDuration: readGaMetric(gaOverviewReport, 4),
    eventCount: readGaMetric(gaOverviewReport, 5)
  };

  const channels = mapGaRows(gaChannelsReport, ["sessions", "totalUsers", "engagementRate"]);
  const sources = mapGaRows(gaSourceReport, ["sessions", "totalUsers"]);
  const pages = mapGaRows(gaPagesReport, ["screenPageViews", "sessions", "averageSessionDuration"]);
  const events = mapGaRows(gaEventsReport, ["eventCount", "totalUsers"]);

  const gscOverviewRow = gscOverviewReport.rows?.[0] || {};
  const gscOverview = {
    clicks: Number(gscOverviewRow.clicks || 0),
    impressions: Number(gscOverviewRow.impressions || 0),
    ctr: Number(gscOverviewRow.ctr || 0) * 100,
    position: Number(gscOverviewRow.position || 0)
  };

  const gscQueries = gscQueryReport.rows || [];
  const gscPages = gscPagesReport.rows || [];

  const html = buildEmailHtml({
    startDate,
    endDate,
    gaOverview,
    channels,
    sources,
    pages,
    events,
    gscOverview,
    gscQueries,
    gscPages
  });

  const text = buildEmailText({
    startDate,
    endDate,
    gaOverview,
    gscOverview
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const from = process.env.MAIL_FROM || "agence@msd-media.com";
  const to = process.env.MAIL_TO;
  const subject = `MSD Media - Dashboard hebdo (${startDate} -> ${endDate})`;

  const sent = await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text
  });

  console.log(`Email hebdo envoye: ${sent.messageId}`);
}

run().catch((error) => {
  console.error("[weekly-analytics-report] Erreur:", error.message);
  process.exitCode = 1;
});
