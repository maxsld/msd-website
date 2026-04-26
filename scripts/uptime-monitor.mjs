/**
 * uptime-monitor.mjs
 *
 * Vérifie que msd-media.com répond correctement.
 * Si le site est down (timeout ou code != 200), envoie une alerte email.
 *
 * Variables d'environnement (mêmes secrets que weekly-analytics-report) :
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO
 *
 * Usage : node scripts/uptime-monitor.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import nodemailer from "nodemailer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const log  = msg => console.log(`[uptime] ${msg}`);
const warn = msg => console.warn(`[uptime] ⚠  ${msg}`);

// ── Config ────────────────────────────────────────────────────────────────────

const CHECKS = [
  { url: "https://msd-media.com/",                  label: "Homepage" },
  { url: "https://msd-media.com/agence-web-annecy/", label: "Annecy" },
  { url: "https://msd-media.com/agence-web-strasbourg/", label: "Strasbourg" },
  { url: "https://msd-media.com/blog/",              label: "Blog" },
];

const TIMEOUT_MS = 10_000;

// Fichier d'état pour ne pas alerter en boucle si le site est down longtemps.
// En CI (GitHub Actions), ce fichier n'existe pas entre les runs → alerte à chaque échec.
// En local, il persiste entre deux lancements.
const STATE_FILE = path.join(ROOT, "scripts/.uptime-state.json");

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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}

async function checkUrl({ url, label }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "MSD-UptimeBot/1.0" },
    });
    clearTimeout(timer);

    if (res.ok) {
      log(`✓ ${label} — HTTP ${res.status}`);
      return { ok: true, label, url, status: res.status };
    } else {
      warn(`✗ ${label} — HTTP ${res.status}`);
      return { ok: false, label, url, status: res.status, reason: `HTTP ${res.status}` };
    }
  } catch (err) {
    clearTimeout(timer);
    const reason = err.name === "AbortError" ? `Timeout (${TIMEOUT_MS / 1000}s)` : err.message;
    warn(`✗ ${label} — ${reason}`);
    return { ok: false, label, url, status: null, reason };
  }
}

async function loadState() {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { lastAlertAt: null, consecutiveFailures: 0 };
  }
}

async function saveState(state) {
  try {
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch {}
}

function buildEmailHtml(failures) {
  const now = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
  const rows = failures.map(f => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee"><strong>${f.label}</strong></td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee"><a href="${f.url}">${f.url}</a></td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#dc2626">${f.reason ?? `HTTP ${f.status}`}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="font-family:Inter,Arial,sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)">
    <h1 style="color:#dc2626;margin:0 0 8px">🚨 msd-media.com est DOWN</h1>
    <p style="color:#6b7280;margin:0 0 24px">Détecté le ${now}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="background:#f3f4f6">
          <th style="padding:8px 12px;text-align:left">Page</th>
          <th style="padding:8px 12px;text-align:left">URL</th>
          <th style="padding:8px 12px;text-align:left">Erreur</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb" />
    <p style="color:#6b7280;font-size:13px;margin:0">
      Vérifier Vercel : <a href="https://vercel.com/dashboard">vercel.com/dashboard</a><br>
      MSD Media Uptime Bot — checks automatiques toutes les 10 min
    </p>
  </div>
</body>
</html>`;
}

async function sendAlert(failures) {
  const requiredVars = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_TO"];
  const missing = requiredVars.filter(k => !process.env[k]);
  if (missing.length) {
    warn(`Variables SMTP manquantes (${missing.join(", ")}) — alerte email impossible.`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const pageList = failures.map(f => `${f.label} (${f.reason ?? `HTTP ${f.status}`})`).join(", ");

  await transporter.sendMail({
    from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
    to: process.env.MAIL_TO,
    subject: `🚨 [MSD Media] Site DOWN — ${pageList}`,
    html: buildEmailHtml(failures),
  });

  log(`Alerte email envoyée à ${process.env.MAIL_TO}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await loadEnvFile();

  log(`Vérification de ${CHECKS.length} URL(s)…`);
  const results = await Promise.all(CHECKS.map(checkUrl));
  const failures = results.filter(r => !r.ok);

  if (failures.length === 0) {
    log("Tout est opérationnel ✓");
    // Réinitialiser l'état
    await saveState({ lastAlertAt: null, consecutiveFailures: 0 });
    return;
  }

  // Vérifier si on a déjà alerté récemment (évite le spam : 1 alerte / heure max)
  const state = await loadState();
  const now = Date.now();
  const lastAlert = state.lastAlertAt ? new Date(state.lastAlertAt).getTime() : 0;
  const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 heure

  state.consecutiveFailures = (state.consecutiveFailures ?? 0) + 1;

  if (now - lastAlert > ALERT_COOLDOWN_MS) {
    warn(`${failures.length} page(s) en erreur — envoi alerte…`);
    await sendAlert(failures);
    state.lastAlertAt = new Date().toISOString();
  } else {
    const minLeft = Math.ceil((ALERT_COOLDOWN_MS - (now - lastAlert)) / 60000);
    warn(`${failures.length} page(s) en erreur — alerte déjà envoyée, prochaine dans ~${minLeft} min.`);
  }

  await saveState(state);
  // Sortir avec code 1 pour que le workflow GitHub Actions marque le job en failed (visible)
  process.exit(1);
}

main().catch(err => {
  console.error("[uptime] Fatal:", err);
  process.exit(1);
});
