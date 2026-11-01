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
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly', 'https://www.googleapis.com/auth/analytics.readonly'],
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

// GA4 : visites et demandes venues de Google. Un lead = formulaire confirmé
// (lead_confirmed) ou rendez-vous confirmé (booking_completed) ; une intention =
// clic vers la prise de rendez-vous ou tentative d'envoi du formulaire.
// GA4 ne voit que les visiteurs qui acceptent les cookies : les chiffres sont des minimums.
const LEAD_EVENTS = ['lead_confirmed', 'booking_completed'];
const INTENT_EVENTS = ['booking_intent', 'form_submit_attempt'];
async function ga4(period, body) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${process.env.GA4_PROPERTY_ID}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ dateRanges: [period], ...body }),
  });
  if (!res.ok) throw new Error(`GA4 ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return ((await res.json()).rows || []).map((r) => ({ keys: r.dimensionValues.map((d) => d.value), value: Number(r.metricValues[0].value) }));
}
const organic = { filter: { fieldName: 'sessionDefaultChannelGroup', stringFilter: { value: 'Organic Search' } } };
const eventsIn = (names) => ({ filter: { fieldName: 'eventName', inListFilter: { values: names } } });
if (process.env.GA4_PROPERTY_ID) {
  for (const [name, period] of Object.entries(periods)) {
    try {
      data[name].ga4 = {
        sessions: await ga4(period, { dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }] }),
        events: await ga4(period, { dimensions: [{ name: 'eventName' }, { name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'eventCount' }], dimensionFilter: eventsIn([...LEAD_EVENTS, ...INTENT_EVENTS]) }),
        landing: await ga4(period, { dimensions: [{ name: 'landingPage' }], metrics: [{ name: 'sessions' }], dimensionFilter: organic, limit: 20 }),
        leadPages: await ga4(period, { dimensions: [{ name: 'landingPage' }, { name: 'eventName' }], metrics: [{ name: 'eventCount' }], dimensionFilter: { andGroup: { expressions: [organic, eventsIn([...LEAD_EVENTS, ...INTENT_EVENTS])] } } }),
      };
    } catch (e) {
      console.warn(`GA4 indisponible (${name}) : ${e.message}`);
    }
  }
}

// Tests avant / après : clics et impressions par page et par jour sur 120 jours, pour mesurer
// chaque changement du journal face au reste du site (le témoin), qui absorbe saisonnalité et mises à jour Google.
async function dailyPages() {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(process.env.GSC_SITE_URL)}/searchAnalytics/query`;
  const rows = [];
  for (let startRow = 0; ; startRow += 25000) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: iso(new Date(end - 119 * DAY)), endDate: iso(end), dimensions: ['page', 'date'], rowLimit: 25000, startRow }),
    });
    if (!res.ok) throw new Error(`Search Console ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const batch = (await res.json()).rows || [];
    rows.push(...batch);
    if (batch.length < 25000) break;
  }
  // Les ancres (#section) s'additionnent sur la page.
  const daily = new Map();
  for (const r of rows) {
    const id = `${r.keys[0].replace(SITE, '').replace(/#.*$/, '') || '/'}|${r.keys[1]}`;
    const d = daily.get(id) || { page: id.split('|')[0], date: r.keys[1], clicks: 0, impressions: 0, posSum: 0 };
    d.clicks += r.clicks; d.impressions += r.impressions; d.posSum += r.position * r.impressions;
    daily.set(id, d);
  }
  return [...daily.values()];
}
// Pas gardé dans l'historique JSON : trop volumineux, et recalculable.
const daily = await dailyPages();

const dir = path.join('seo-pilot', 'data');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, `${iso(new Date())}.json`), JSON.stringify(data));

// Synthèse lisible : pages, évolution, et requêtes où un gain est à portée.
const prevPages = new Map(data.previous.pages.map((r) => [r.keys[0], r]));
const fmt = (n, d = 1) => Number(n).toFixed(d);
const sum = (rows, k) => rows.reduce((s, r) => s + r[k], 0);
const nonBrand = (rows) => rows.filter((r) => !/msd|maxens|soldan/i.test(r.keys[1]));
// Visibilité globale : combien de requêtes font apparaître le site, et à quelle hauteur
// (meilleure position du site sur chaque requête).
function visibility(name) {
  const best = new Map();
  for (const r of data[name].queries) if (!best.has(r.keys[1]) || r.position < best.get(r.keys[1])) best.set(r.keys[1], r.position);
  const pages = data[name].pages, impressions = sum(pages, 'impressions'), clicks = sum(pages, 'clicks');
  const positions = [...best.values()];
  return {
    impressions, clicks,
    ctr: impressions ? (clicks / impressions) * 100 : 0,
    position: impressions ? pages.reduce((s, r) => s + r.position * r.impressions, 0) / impressions : 0,
    queries: best.size, top10: positions.filter((p) => p <= 10).length, top3: positions.filter((p) => p <= 3).length, pages: pages.length,
  };
}
function visibilityRows() {
  const c = visibility('current'), p = visibility('previous');
  return [
    ['Impressions', c.impressions, p.impressions], ['Clics', c.clicks, p.clicks],
    ['Taux de clic', `${fmt(c.ctr, 2)} %`, `${fmt(p.ctr, 2)} %`], ['Position moyenne', fmt(c.position), fmt(p.position)],
    ['Requêtes où le site apparaît', c.queries, p.queries], ['Requêtes en top 10', c.top10, p.top10],
    ['Requêtes en top 3', c.top3, p.top3], ['Pages vues dans Google', c.pages, p.pages],
  ].map(([k, a, b]) => `| ${k} | ${a} | ${b} |`);
}
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
  '## Visibilité Google',
  '',
  '| Indicateur | Maintenant | Avant |',
  '|---|---|---|',
  ...visibilityRows(),
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
const g = (name) => data[name].ga4;
if (g('current')) {
  const count = (name, events, channel = 'Organic Search') => (g(name)?.events || []).filter((r) => events.includes(r.keys[0]) && r.keys[1] === channel).reduce((s, r) => s + r.value, 0);
  const sessions = (name) => (g(name)?.sessions || []).find((r) => r.keys[0] === 'Organic Search')?.value || 0;
  lines.push('', '## Conversions venues de Google (GA4, 28 jours)', '',
    `- Visites depuis Google : ${sessions('current')} (avant : ${sessions('previous')}).`,
    `- **Leads** (formulaire ou rendez-vous confirmés) : ${count('current', LEAD_EVENTS)} (avant : ${count('previous', LEAD_EVENTS)}).`,
    `- Intentions (clic vers la prise de rendez-vous, tentative de formulaire) : ${count('current', INTENT_EVENTS)} (avant : ${count('previous', INTENT_EVENTS)}).`,
    `- Tous canaux confondus : ${count('current', LEAD_EVENTS, 'Direct') + count('current', LEAD_EVENTS)} leads Google + direct.`,
    '', '_Minimums : GA4 ne compte que les visiteurs qui acceptent les cookies._', '',
    '### Pages d\'entrée depuis Google (visites) et ce qu\'elles produisent', '', '| Page | Visites | Intentions | Leads |', '|---|---|---|---|');
  for (const r of g('current').landing.slice(0, 15)) {
    const ev = g('current').leadPages.filter((x) => x.keys[0] === r.keys[0]);
    const n = (names) => ev.filter((x) => names.includes(x.keys[1])).reduce((s, x) => s + x.value, 0);
    lines.push(`| ${r.keys[0]} | ${r.value} | ${n(INTENT_EVENTS)} | ${n(LEAD_EVENTS)} |`);
  }
}

// Chaque changement du journal, mesuré : 28 jours avant le changement contre la période qui commence
// 3 jours après (le temps que Google relise la page), en moyenne par jour, face au témoin.
const journal = fs.existsSync('seo-pilot/journal.md') ? fs.readFileSync('seo-pilot/journal.md', 'utf8') : '';
const changes = new Map();
for (const m of journal.matchAll(/^### (\d{4}-\d{2}-\d{2}) : (\/\S*)/gm)) if (!changes.has(m[2])) changes.set(m[2], m[1]);
const addDays = (d, n) => iso(new Date(new Date(d) - -n * DAY));
function windowStats(filter, from, to) {
  const rows = daily.filter((r) => r.date >= from && r.date <= to && filter(r.page));
  const days = Math.round((new Date(to) - new Date(from)) / DAY) + 1;
  const impressions = sum(rows, 'impressions'), clicks = sum(rows, 'clicks');
  return { days, impressions, clicks, perDay: impressions / days, ctr: impressions ? clicks / impressions : 0, position: impressions ? sum(rows, 'posSum') / impressions : 0 };
}
const pct = (a, b) => (b ? `${a >= b ? '+' : ''}${fmt(((a - b) / b) * 100, 0)} %` : '-');
const tested = [...changes.keys()];
const testRows = [];
for (const [page, date] of changes) {
  const afterStart = addDays(date, 3), afterEnd = [addDays(date, 30), iso(end)].sort()[0];
  if (afterStart > iso(end) || addDays(date, 90) < iso(end)) continue;
  const beforeFrom = addDays(date, -28), beforeTo = addDays(date, -1);
  const isPage = (p) => p === page;
  // Témoin : les pages qui n'ont pas été modifiées dans le journal.
  const isControl = (p) => !tested.includes(p);
  const b = windowStats(isPage, beforeFrom, beforeTo), a = windowStats(isPage, afterStart, afterEnd);
  const cb = windowStats(isControl, beforeFrom, beforeTo), ca = windowStats(isControl, afterStart, afterEnd);
  // Effet net : l'évolution de la page, corrigée de celle du témoin sur les mêmes dates.
  const net = b.perDay && cb.perDay && ca.perDay ? ((a.perDay / b.perDay) / (ca.perDay / cb.perDay) - 1) * 100 : null;
  const elapsed = Math.round((end - new Date(date)) / DAY);
  const status = elapsed < 21 ? `en cours (J+${elapsed})` : a.impressions < 300 ? `trop peu de données (${a.impressions} impr.)` : 'mesurable';
  testRows.push(`| ${page} | ${date} | ${fmt(b.perDay)} → ${fmt(a.perDay)} (${pct(a.perDay, b.perDay)}) | ${pct(ca.perDay, cb.perDay)} | ${net === null ? '-' : `${net >= 0 ? '+' : ''}${fmt(net, 0)} %`} | ${fmt(b.ctr * 100)} → ${fmt(a.ctr * 100)} % (témoin ${fmt(cb.ctr * 100)} → ${fmt(ca.ctr * 100)} %) | ${b.impressions ? fmt(b.position) : '-'} → ${a.impressions ? fmt(a.position) : '-'} | ${status} |`);
}
lines.push('', '## Tests en cours : changements du journal mesurés avant / après, face au témoin', '',
  'Avant = 28 jours précédant le changement ; après = à partir de J+3, jusqu\'à 28 jours. Valeurs par jour. Le témoin = toutes les pages jamais modifiées dans le journal.', '',
  '| Page | Changement | Impressions / jour | Témoin | Effet net | Taux de clic | Position | Statut |', '|---|---|---|---|---|---|---|---|',
  ...(testRows.length ? testRows : ['| Aucun changement de moins de 90 jours | | | | | | | |']),
  '', '_Effet net = évolution de la page divisée par celle du témoin. Le taux de clic ne se compare qu\'à position proche (moins d\'une place d\'écart) : sinon, c\'est la position qui l\'explique._');
fs.writeFileSync(path.join(dir, 'latest.md'), lines.join('\n') + '\n');
console.log(`Relevé écrit : ${data.current.pages.length} pages, ${data.current.queries.length} couples page/requête.`);
