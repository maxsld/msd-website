/**
 * seo-pilot-clarity.mjs
 *
 * Relevé Microsoft Clarity pour l'agence SEO (.github/workflows/seo-pilot.yml) : ce que font
 * les visiteurs une fois sur la page (défilement, temps actif, clics morts, clics de rage,
 * retours rapides), par page, par source et par appareil. Complète la Search Console (avant le clic)
 * et GA4 (les leads). Écrit :
 *   - seo-pilot/data/clarity-<date>.json : les données brutes, gardées pour l'historique ;
 *   - seo-pilot/data/clarity.md          : la synthèse que lit l'agence.
 *
 * L'API Clarity ne donne que les 3 derniers jours, 10 appels par jour : on en fait 3.
 * Les semaines s'additionnent dans l'historique.
 *
 * Variable : CLARITY_API_TOKEN (Clarity > Paramètres > Exportation de données), lue dans
 * l'environnement, ou dans .env.analytics en local.
 */
import fs from 'node:fs';
import path from 'node:path';

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

const dir = path.join('seo-pilot', 'data');
const today = new Date().toISOString().slice(0, 10);
fs.mkdirSync(dir, { recursive: true });

if (!process.env.CLARITY_API_TOKEN) {
  fs.writeFileSync(path.join(dir, 'clarity.md'), `# Relevé Clarity du ${today}\n\nNon disponible : la clé CLARITY_API_TOKEN n'est pas configurée.\n`);
  console.log('Clarity : pas de clé, relevé ignoré.');
  process.exit(0);
}

async function insights(dimensions) {
  const params = new URLSearchParams({ numOfDays: '3' });
  dimensions.forEach((d, i) => params.set(`dimension${i + 1}`, d));
  const res = await fetch(`https://www.clarity.ms/export-data/api/v1/project-live-insights?${params}`, {
    headers: { Authorization: `Bearer ${process.env.CLARITY_API_TOKEN}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Clarity ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

const data = { generatedAt: new Date().toISOString(), byUrl: await insights(['URL']), bySource: await insights(['Source']), byDevice: await insights(['Device']) };
fs.writeFileSync(path.join(dir, `clarity-${today}.json`), JSON.stringify(data));

// Chaque métrique renvoie une ligne par valeur de dimension. On ramène tout à une table
// « valeur de dimension → indicateurs », en lisant les noms de champs sans tenir compte de la casse.
const pick = (o, name) => o[Object.keys(o).find((k) => k.toLowerCase() === name.toLowerCase())];
const num = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
const METRICS = {
  Traffic: ['sessions', 'totalSessionCount'],
  ScrollDepth: ['scroll', 'averageScrollDepth'],
  EngagementTime: ['active', 'activeTime'],
  DeadClickCount: ['dead', 'sessionsWithMetricPercentage'],
  RageClickCount: ['rage', 'sessionsWithMetricPercentage'],
  QuickbackClick: ['quickback', 'sessionsWithMetricPercentage'],
  ExcessiveScroll: ['excessive', 'sessionsWithMetricPercentage'],
  ScriptErrorCount: ['errors', 'sessionsWithMetricPercentage'],
};
function table(result, dimension, normalize = (v) => v) {
  const rows = new Map();
  for (const metric of result) {
    const spec = METRICS[metric.metricName];
    if (!spec) continue;
    for (const info of metric.information || []) {
      const key = normalize(String(pick(info, dimension) || 'direct ou inconnu'));
      const row = rows.get(key) || { key };
      const value = num(pick(info, spec[1]));
      // Plusieurs URL peuvent tomber sur la même page (paramètres, ancres) : on additionne les sessions
      // et, pour les autres indicateurs, on garde la valeur la plus forte (la plus prudente).
      row[spec[0]] = spec[0] === 'sessions' ? (row.sessions || 0) + (value || 0) : Math.max(row[spec[0]] ?? -Infinity, value ?? -Infinity);
      rows.set(key, row);
    }
  }
  return [...rows.values()].map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v === -Infinity ? null : v]))).filter((r) => r.sessions !== 0).sort((a, b) => (b.sessions || 0) - (a.sessions || 0));
}
const toPath = (url) => {
  try { return new URL(url).pathname; } catch { return url.replace(/[?#].*$/, ''); }
};
const f = (v, unit = '') => (v === null || v === undefined || Number.isNaN(v) ? '-' : `${Math.round(v * 10) / 10}${unit}`);
const row = (r) => `| ${r.key} | ${f(r.sessions)} | ${f(r.scroll, ' %')} | ${f(r.active, ' s')} | ${f(r.dead, ' %')} | ${f(r.rage, ' %')} | ${f(r.quickback, ' %')} | ${f(r.errors, ' %')} |`;
const header = (label) => [`| ${label} | Sessions | Défilement moyen | Temps actif | Clics morts | Clics de rage | Retours rapides | Erreurs JS |`, '|---|---|---|---|---|---|---|---|'];

const pages = table(data.byUrl, 'URL', toPath);
const lines = [
  `# Relevé Clarity du ${today} (3 derniers jours)`,
  '',
  'Ce que font les visiteurs sur les pages. Clarity ne voit que les visiteurs qui acceptent les cookies, comme GA4. Les pourcentages de clics morts, de rage, de retours rapides et d\'erreurs = part des sessions concernées. Retour rapide = le visiteur repart aussitôt d\'une page qu\'il vient d\'ouvrir. Sur 3 jours les volumes sont faibles : comparer avec les relevés précédents (`seo-pilot/data/clarity-*.json`) avant de conclure.',
  '',
  '## Par page (top 25 par sessions)',
  '',
  ...header('Page'),
  ...pages.slice(0, 25).map(row),
  '',
  '## Par source',
  '',
  ...header('Source'),
  ...table(data.bySource, 'Source').slice(0, 10).map(row),
  '',
  '## Par appareil',
  '',
  ...header('Appareil'),
  ...table(data.byDevice, 'Device').map(row),
  '',
  '## Signaux à regarder',
  '',
];
// Une page qui décroche : on lit peu (défilement < 40 %) ou on bute (clics morts ou de rage ≥ 10 %).
const flags = pages.filter((r) => (r.sessions || 0) >= 5 && ((r.scroll ?? 100) < 40 || (r.dead ?? 0) >= 10 || (r.rage ?? 0) >= 10 || (r.quickback ?? 0) >= 20));
lines.push(flags.length ? flags.map((r) => `- ${r.key} : ${f(r.sessions)} sessions, défilement ${f(r.scroll, ' %')}, clics morts ${f(r.dead, ' %')}, rage ${f(r.rage, ' %')}, retours rapides ${f(r.quickback, ' %')}`).join('\n') : 'Aucun signal net sur 3 jours.');
fs.writeFileSync(path.join(dir, 'clarity.md'), lines.join('\n') + '\n');
console.log(`Relevé Clarity écrit : ${pages.length} pages.`);
