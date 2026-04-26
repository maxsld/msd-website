/**
 * cwv-report.mjs
 *
 * Rapport hebdomadaire Core Web Vitals via l'API PageSpeed Insights.
 * Teste les pages clés et envoie un rapport email avec scores et tendances.
 *
 * Variables d'environnement :
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO
 *   PAGESPEED_API_KEY (optionnel — augmente les quotas)
 *
 * Usage : node scripts/cwv-report.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import nodemailer from "nodemailer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const log  = msg => console.log(`[cwv] ${msg}`);
const warn = msg => console.warn(`[cwv] ⚠  ${msg}`);

// ── Config ────────────────────────────────────────────────────────────────────

const PAGES = [
  { url: "https://msd-media.com/",                       label: "Homepage" },
  { url: "https://msd-media.com/agence-web-annecy/",      label: "Annecy" },
  { url: "https://msd-media.com/agence-web-strasbourg/",  label: "Strasbourg" },
  { url: "https://msd-media.com/agence-web-alsace/",      label: "Alsace" },
  { url: "https://msd-media.com/blog/",                   label: "Blog" },
];

// Seuils officiels Google (mobile, qui est la référence)
const THRESHOLDS = {
  lcp:  { good: 2500, poor: 4000 },   // ms
  cls:  { good: 0.1,  poor: 0.25 },   // score
  fcp:  { good: 1800, poor: 3000 },   // ms
  ttfb: { good: 800,  poor: 1800 },   // ms
  inp:  { good: 200,  poor: 500 },    // ms
};

// Fichier pour stocker les résultats précédents (comparaison semaine sur semaine)
const HISTORY_FILE = path.join(ROOT, "scripts/.cwv-history.json");

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loadEnvFile() {
  try {
    const raw = await fs.readFile(path.join(ROOT, ".env.analytics"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}

async function loadHistory() {
  try {
    return JSON.parse(await fs.readFile(HISTORY_FILE, "utf-8"));
  } catch {
    return {};
  }
}

async function saveHistory(data) {
  try {
    await fs.writeFile(HISTORY_FILE, JSON.stringify(data, null, 2), "utf-8");
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

function extractMetrics(data) {
  const audits = data?.lighthouseResult?.audits ?? {};
  const cat    = data?.lighthouseResult?.categories?.performance?.score ?? null;

  function ms(key) {
    const v = audits[key]?.numericValue;
    return v != null ? Math.round(v) : null;
  }

  return {
    score:  cat != null ? Math.round(cat * 100) : null,
    lcp:    ms("largest-contentful-paint"),
    cls:    audits["cumulative-layout-shift"]?.numericValue != null
              ? Math.round(audits["cumulative-layout-shift"].numericValue * 1000) / 1000
              : null,
    fcp:    ms("first-contentful-paint"),
    ttfb:   ms("server-response-time"),
    inp:    ms("interaction-to-next-paint"),
  };
}

function rateMetric(key, value) {
  if (value == null) return "unknown";
  const t = THRESHOLDS[key];
  if (!t) return "unknown";
  if (value <= t.good) return "good";
  if (value <= t.poor) return "needs-improvement";
  return "poor";
}

function formatMetric(key, value) {
  if (value == null) return "—";
  if (key === "cls") return value.toFixed(3);
  return `${value.toLocaleString("fr-FR")} ms`;
}

function delta(current, previous) {
  if (current == null || previous == null) return "";
  const diff = current - previous;
  if (diff === 0) return "";
  const sign = diff > 0 ? "+" : "";
  return ` (${sign}${diff})`;
}

function colorFor(rating) {
  return { good: "#16a34a", "needs-improvement": "#d97706", poor: "#dc2626", unknown: "#9ca3af" }[rating];
}

function badgeFor(rating) {
  return { good: "✓ Bon", "needs-improvement": "⚠ À améliorer", poor: "✗ Mauvais", unknown: "—" }[rating];
}

// ── Email ─────────────────────────────────────────────────────────────────────

function buildEmail(results, history) {
  const date = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const pageRows = results.map(({ label, url, metrics, error }) => {
    if (error) {
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6"><strong>${label}</strong><br><small style="color:#9ca3af">${url}</small></td>
        <td colspan="5" style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#dc2626">Erreur : ${error}</td>
      </tr>`;
    }

    const prev = history[url];
    const scoreRating = metrics.score >= 90 ? "good" : metrics.score >= 50 ? "needs-improvement" : "poor";

    const metricCells = ["lcp", "cls", "fcp", "ttfb"].map(key => {
      const rating = rateMetric(key, metrics[key]);
      const d = prev ? delta(metrics[key], prev[key]) : "";
      return `<td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center">
        <span style="color:${colorFor(rating)};font-weight:600">${formatMetric(key, metrics[key])}</span>
        ${d ? `<br><small style="color:#9ca3af">${d}</small>` : ""}
      </td>`;
    }).join("");

    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6">
        <strong>${label}</strong><br><small style="color:#9ca3af">${url}</small>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;text-align:center">
        <span style="display:inline-block;background:${colorFor(scoreRating)};color:#fff;border-radius:6px;padding:2px 10px;font-weight:700;font-size:16px">${metrics.score ?? "—"}</span>
        ${prev?.score ? `<br><small style="color:#9ca3af">${delta(metrics.score, prev.score)}</small>` : ""}
      </td>
      ${metricCells}
    </tr>`;
  }).join("");

  const allScores = results.filter(r => r.metrics?.score != null).map(r => r.metrics.score);
  const avgScore = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null;

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="font-family:Inter,Arial,sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:700px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
      <div>
        <h1 style="margin:0;font-size:20px;color:#111">⚡ Core Web Vitals — Rapport hebdomadaire</h1>
        <p style="margin:4px 0 0;color:#6b7280;font-size:14px">${date} · msd-media.com</p>
      </div>
      ${avgScore != null ? `<div style="text-align:center">
        <div style="font-size:36px;font-weight:700;color:${avgScore >= 90 ? "#16a34a" : avgScore >= 50 ? "#d97706" : "#dc2626"}">${avgScore}</div>
        <div style="font-size:12px;color:#6b7280">Score moyen</div>
      </div>` : ""}
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="background:#f3f4f6">
          <th style="padding:10px 12px;text-align:left">Page</th>
          <th style="padding:10px 12px;text-align:center">Score</th>
          <th style="padding:10px 12px;text-align:center">LCP</th>
          <th style="padding:10px 12px;text-align:center">CLS</th>
          <th style="padding:10px 12px;text-align:center">FCP</th>
          <th style="padding:10px 12px;text-align:center">TTFB</th>
        </tr>
      </thead>
      <tbody>${pageRows}</tbody>
    </table>

    <div style="margin-top:20px;padding:16px;background:#f9fafb;border-radius:8px;font-size:13px;color:#6b7280">
      <strong>Seuils Google (mobile) :</strong><br>
      LCP : ≤ 2,5s ✓ · ≤ 4s ⚠ · > 4s ✗ &nbsp;|&nbsp;
      CLS : ≤ 0,1 ✓ · ≤ 0,25 ⚠ · > 0,25 ✗ &nbsp;|&nbsp;
      FCP : ≤ 1,8s ✓ &nbsp;|&nbsp;
      TTFB : ≤ 800ms ✓
    </div>

    <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb" />
    <p style="color:#9ca3af;font-size:12px;margin:0">
      MSD Media CWV Bot · Données : Google PageSpeed Insights API (mobile)<br>
      Pour plus de détails : <a href="https://pagespeed.web.dev/" style="color:#6b7280">pagespeed.web.dev</a>
    </p>
  </div>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await loadEnvFile();

  const requiredVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_TO"];
  const missing = requiredVars.filter(k => !process.env[k]);
  if (missing.length) throw new Error(`Variables manquantes : ${missing.join(", ")}`);

  const history = await loadHistory();

  log(`Analyse de ${PAGES.length} pages via PageSpeed Insights…`);

  const results = [];
  for (const { url, label } of PAGES) {
    log(`→ ${label}`);
    try {
      const data = await fetchPageSpeed(url);
      const metrics = extractMetrics(data);
      log(`  Score: ${metrics.score} | LCP: ${formatMetric("lcp", metrics.lcp)} | CLS: ${formatMetric("cls", metrics.cls)}`);
      results.push({ label, url, metrics });
    } catch (err) {
      warn(`  Erreur : ${err.message}`);
      results.push({ label, url, metrics: null, error: err.message });
    }
    // Pause pour respecter les rate limits PSI
    await new Promise(r => setTimeout(r, 2000));
  }

  // Sauvegarder les métriques actuelles comme historique
  const newHistory = { ...history };
  for (const r of results) {
    if (r.metrics) newHistory[r.url] = r.metrics;
  }
  await saveHistory(newHistory);

  // Envoyer le rapport
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const allScores = results.filter(r => r.metrics?.score != null).map(r => r.metrics.score);
  const avgScore = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : "?";

  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
    to: process.env.MAIL_TO,
    subject: `⚡ [MSD Media] Core Web Vitals — Score moyen : ${avgScore}/100`,
    html: buildEmail(results, history),
  });

  log(`Rapport envoyé à ${process.env.MAIL_TO} ✓`);
}

main().catch(err => {
  console.error("[cwv] Fatal:", err);
  process.exit(1);
});
