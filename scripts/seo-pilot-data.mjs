/**
 * seo-pilot-data.mjs
 *
 * Relevé Search Console pour le pilote SEO hebdomadaire (.github/workflows/seo-pilot.yml).
 * Compare les 28 derniers jours disponibles aux 28 jours précédents et écrit :
 *   - seo-pilot/data/<date>.json : les données brutes, gardées pour l'historique ;
 *   - seo-pilot/data/latest.md   : la synthèse que lit le pilote.
 *
 * Variables : GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, GSC_SITE_URL
 * (lues dans l'environnement, ou dans .env.analytics en local).
 */
import fs from 'node:fs';
import path from 'node:path';
import { JWT } from 'google-auth-library';

if (fs.existsSync('.env.analytics')) {
  for (const line of fs.readFileSync('.env.analytics', 'utf8').split(/\r?\n/)) {
    const eq = line.indexOf('=');
    if (eq === -1 || line.trim().startsWith('#')) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
    process.env[key] ??= value;
  }
}

const SITE = 'https://msd-media.com';
const DAY = 86400000;
// Search Console a environ 3 jours de retard : on s'arrête avant pour ne pas lire des jours incomplets.
const end = new Date(Date.now() - 3 * DAY);
const iso = (d) => d.toISOString().slice(0, 10);
const periods = {
  current: { startDate: iso(new Date(end - 27 * DAY)), endDate: iso(end) },
  previous: { startDate: iso(new Date(end - 55 * DAY)), endDate: iso(new Date(end - 28 * DAY)) },
};

const client = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
const { token } = await client.getAccessToken();

async function query(period, dimensions) {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(process.env.GSC_SITE_URL)}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...period, dimensions, rowLimit: 5000 }),
  });
  if (!res.ok) throw new Error(`Search Console ${res.status}: ${(await res.text()).slice(0, 300)}`);
  // Les ancres (#section) dupliquent la page : on les regroupe sur l'URL de la page.
  const rows = new Map();
  for (const r of (await res.json()).rows || []) {
    const keys = r.keys.map((k) => k.replace(SITE, '').replace(/#.*$/, '') || '/');
    const id = keys.join(' | ');
    const prev = rows.get(id);
    if (!prev || r.impressions > prev.impressions) rows.set(id, { keys, clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });
  }
  return [...rows.values()];
}

const data = { generatedAt: new Date().toISOString(), periods };
for (const [name, period] of Object.entries(periods)) {
  data[name] = { pages: await query(period, ['page']), queries: await query(period, ['page', 'query']) };
}

const dir = path.join('seo-pilot', 'data');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, `${iso(new Date())}.json`), JSON.stringify(data));

// Synthèse lisible : pages, évolution, et requêtes où un gain est à portée.
const prevPages = new Map(data.previous.pages.map((r) => [r.keys[0], r]));
const fmt = (n, d = 1) => Number(n).toFixed(d);
const sum = (rows, k) => rows.reduce((s, r) => s + r[k], 0);
const nonBrand = (rows) => rows.filter((r) => !/msd|maxens|soldan/i.test(r.keys[1]));
const lines = [
  `# Relevé Search Console du ${iso(new Date())}`,
  '',
  `Période : ${periods.current.startDate} → ${periods.current.endDate}, comparée à ${periods.previous.startDate} → ${periods.previous.endDate}.`,
  '',
  `Total : ${sum(data.current.pages, 'clicks')} clics (avant : ${sum(data.previous.pages, 'clicks')}), ${sum(data.current.pages, 'impressions')} impressions (avant : ${sum(data.previous.pages, 'impressions')}).`,
  '',
  // L'indicateur de la stratégie : les clics sur des recherches qui ne contiennent pas le nom de la marque.
  `Clics hors marque : ${sum(nonBrand(data.current.queries), 'clicks')} (avant : ${sum(nonBrand(data.previous.queries), 'clicks')}), sur ${sum(nonBrand(data.current.queries), 'impressions')} impressions (avant : ${sum(nonBrand(data.previous.queries), 'impressions')}).`,
  '',
  '## Pages (top 40 par impressions)',
  '',
  '| Page | Impr. | Δ impr. | Clics | Δ clics | CTR | Position | Δ position |',
  '|---|---|---|---|---|---|---|---|',
];
for (const r of [...data.current.pages].sort((a, b) => b.impressions - a.impressions).slice(0, 40)) {
  const p = prevPages.get(r.keys[0]);
  lines.push(`| ${r.keys[0]} | ${r.impressions} | ${p ? r.impressions - p.impressions : 'nouveau'} | ${r.clicks} | ${p ? r.clicks - p.clicks : '-'} | ${fmt(r.ctr * 100)} % | ${fmt(r.position)} | ${p ? fmt(p.position - r.position) : '-'} |`);
}
lines.push('', '_Δ position positif = la page est montée._', '', '## Requêtes à portée (position 4 à 20, au moins 15 impressions)', '', '| Requête | Page | Impr. | Clics | CTR | Position |', '|---|---|---|---|---|---|');
for (const r of data.current.queries.filter((q) => q.position >= 4 && q.position <= 20 && q.impressions >= 15).sort((a, b) => b.impressions - a.impressions).slice(0, 40)) {
  lines.push(`| ${r.keys[1]} | ${r.keys[0]} | ${r.impressions} | ${r.clicks} | ${fmt(r.ctr * 100)} % | ${fmt(r.position)} |`);
}
lines.push('', '## Pages en baisse (au moins 30 impressions avant, −25 % ou −3 places)', '');
const drops = data.current.pages.map((r) => [r, prevPages.get(r.keys[0])]).filter(([r, p]) => p && p.impressions >= 30 && (r.impressions < p.impressions * 0.75 || r.position - p.position >= 3));
lines.push(drops.length ? drops.map(([r, p]) => `- ${r.keys[0]} : ${p.impressions} → ${r.impressions} impressions, position ${fmt(p.position)} → ${fmt(r.position)}`).join('\n') : 'Aucune.');
fs.writeFileSync(path.join(dir, 'latest.md'), lines.join('\n') + '\n');
console.log(`Relevé écrit : ${data.current.pages.length} pages, ${data.current.queries.length} couples page/requête.`);
