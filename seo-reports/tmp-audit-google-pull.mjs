import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { JWT } from "google-auth-library";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const envFilePath = path.join(projectRoot, ".env.analytics");

async function loadEnvFile(filePath) {
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
    if (!process.env[key]) process.env[key] = value;
  }
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getDateRange(daysAgoStart, daysAgoEnd) {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - daysAgoEnd);
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - daysAgoStart);
  return { startDate: formatDate(start), endDate: formatDate(end) };
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
  if (!token.token) throw new Error("Impossible d'obtenir un access token Google.");
  return token.token;
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

async function runGaReport(token, body) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runReport`;
  return googleApiRequest(url, token, body);
}

async function runGscQuery(token, body) {
  const siteUrl = encodeURIComponent(process.env.GSC_SITE_URL);
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`;
  return googleApiRequest(url, token, body);
}

const ANNECY_PAGES = [
  "https://msd-media.com/agence-web-annecy/",
  "https://msd-media.com/creation-site-web-annecy/",
  "https://msd-media.com/landing-page-annecy/",
  "https://msd-media.com/seo-local-annecy/",
  "https://msd-media.com/refonte-site-web-annecy/",
  "https://msd-media.com/audit-seo-annecy/",
  "https://msd-media.com/faq-seo-annecy/",
  "https://msd-media.com/glossaire-web-seo-annecy/",
  "https://msd-media.com/creation-site-vitrine-annecy/",
  "https://msd-media.com/creation-site-internet-annecy/",
  "https://msd-media.com/agence-web-annecy-le-vieux/"
];

async function run() {
  await loadEnvFile(envFilePath);
  const token = await getGoogleAccessToken();

  const range28 = getDateRange(28, 3); // GSC has ~2-3 day lag
  const last14 = getDateRange(16, 3);
  const prior14 = getDateRange(30, 17);

  const ga28 = getDateRange(28, 1); // GA4 ~1 day lag
  const gaPrior28 = getDateRange(56, 29);

  const out = {};

  // 1. Queries containing "annecy" over 28 days
  out.annecyQueries28 = await runGscQuery(token, {
    startDate: range28.startDate,
    endDate: range28.endDate,
    dimensions: ["query"],
    dimensionFilterGroups: [
      { filters: [{ dimension: "query", operator: "contains", expression: "annecy" }] }
    ],
    rowLimit: 250
  });

  // exact query "agence web annecy" - last 14 days
  out.exactQueryLast14 = await runGscQuery(token, {
    startDate: last14.startDate,
    endDate: last14.endDate,
    dimensions: ["query"],
    dimensionFilterGroups: [
      { filters: [{ dimension: "query", operator: "equals", expression: "agence web annecy" }] }
    ],
    rowLimit: 10
  });

  // exact query "agence web annecy" - prior 14 days
  out.exactQueryPrior14 = await runGscQuery(token, {
    startDate: prior14.startDate,
    endDate: prior14.endDate,
    dimensions: ["query"],
    dimensionFilterGroups: [
      { filters: [{ dimension: "query", operator: "equals", expression: "agence web annecy" }] }
    ],
    rowLimit: 10
  });

  // exact query "agence web annecy" per-page breakdown (cannibalization) - 28 days
  out.exactQueryByPage28 = await runGscQuery(token, {
    startDate: range28.startDate,
    endDate: range28.endDate,
    dimensions: ["page"],
    dimensionFilterGroups: [
      { filters: [{ dimension: "query", operator: "equals", expression: "agence web annecy" }] }
    ],
    rowLimit: 25
  });

  // 2. Page-level data for the 10(11) annecy pages - 28 days
  out.annecyPages28 = await runGscQuery(token, {
    startDate: range28.startDate,
    endDate: range28.endDate,
    dimensions: ["page"],
    dimensionFilterGroups: [
      { filters: [{ dimension: "page", operator: "contains", expression: "annecy" }] }
    ],
    rowLimit: 250
  });

  // per-page query breakdown for each of the 11 target pages (to check which queries drive them, incl "agence web annecy")
  out.perPageQueries = {};
  for (const pageUrl of ANNECY_PAGES) {
    // eslint-disable-next-line no-await-in-loop
    out.perPageQueries[pageUrl] = await runGscQuery(token, {
      startDate: range28.startDate,
      endDate: range28.endDate,
      dimensions: ["query"],
      dimensionFilterGroups: [
        { filters: [{ dimension: "page", operator: "equals", expression: pageUrl }] }
      ],
      rowLimit: 25
    });
  }

  // 3. Site-wide top 20 queries and pages
  out.top20Queries = await runGscQuery(token, {
    startDate: range28.startDate,
    endDate: range28.endDate,
    dimensions: ["query"],
    rowLimit: 20
  });

  out.top20Pages = await runGscQuery(token, {
    startDate: range28.startDate,
    endDate: range28.endDate,
    dimensions: ["page"],
    rowLimit: 20
  });

  // 5. Pages with impressions (count) - use rowLimit max and dimension page
  out.allPagesWithImpressions = await runGscQuery(token, {
    startDate: range28.startDate,
    endDate: range28.endDate,
    dimensions: ["page"],
    rowLimit: 5000
  });

  // 4. GA4 organic sessions trend 28d vs prior 28d
  out.gaOrganic28 = await runGaReport(token, {
    dateRanges: [{ startDate: ga28.startDate, endDate: ga28.endDate }],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "engagementRate" }],
    dimensionFilter: {
      filter: {
        fieldName: "sessionDefaultChannelGroup",
        stringFilter: { value: "Organic Search" }
      }
    }
  });

  out.gaOrganicPrior28 = await runGaReport(token, {
    dateRanges: [{ startDate: gaPrior28.startDate, endDate: gaPrior28.endDate }],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "engagementRate" }],
    dimensionFilter: {
      filter: {
        fieldName: "sessionDefaultChannelGroup",
        stringFilter: { value: "Organic Search" }
      }
    }
  });

  out.gaTopOrganicLandingPages = await runGaReport(token, {
    dateRanges: [{ startDate: ga28.startDate, endDate: ga28.endDate }],
    dimensions: [{ name: "landingPage" }, { name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "engagementRate" }],
    dimensionFilter: {
      filter: {
        fieldName: "sessionDefaultChannelGroup",
        stringFilter: { value: "Organic Search" }
      }
    },
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: "20"
  });

  out.meta = { range28, last14, prior14, ga28, gaPrior28 };

  await fs.writeFile(
    path.join(projectRoot, "seo-reports", "tmp-audit-google-raw.json"),
    JSON.stringify(out, null, 2)
  );
  console.log("DONE");
  console.log(JSON.stringify(out.meta, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
