import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JWT } from "google-auth-library";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const envFilePath = path.join(projectRoot, ".env.analytics");

async function loadEnvFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

await loadEnvFile(envFilePath);
const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n");
const client = new JWT({ email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, key: privateKey, scopes: ["https://www.googleapis.com/auth/analytics.readonly"] });
const token = (await client.getAccessToken()).token;

const url = `https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runReport`;
const body = {
  dateRanges: [{ startDate: "2026-06-06", endDate: "2026-07-03" }],
  dimensions: [{ name: "sessionDefaultChannelGroup" }],
  metrics: [{ name: "sessions" }, { name: "totalUsers" }]
};
const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
console.log(await res.text());
