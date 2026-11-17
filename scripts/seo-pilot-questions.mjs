/**
 * seo-pilot-questions.mjs
 *
 * Les questions longues tapées sur Google (2026-11-17, méthode « GEO hack » transmise par Maxens) : dans Search Console,
 * 3 derniers mois, filtre de requête par expression régulière ^(?:\S+\s+){7,}\S+$, soit 8 mots ou plus.
 * Ce sont des questions complètes, formulées comme on parle à ChatGPT ; une partie vient d'agents IA
 * et d'outils de veille qui interrogent Google à la place des gens.
 *
 * Écrit seo-pilot/data/questions.md : chaque requête avec sa page, ses impressions et sa position,
 * triée en « bruit » (requêtes booléennes de veille, textes de plus de 40 mots) ou « à classer »
 * par l'agence selon la stratégie (cible, zone, intention). Priorité : beaucoup d'impressions, peu de clics ;
 * on ajoute une réponse directe sur la page qui se classe déjà. Lancé le dimanche par seo-pilot.yml.
 *
 * Variables : GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, GSC_SITE_URL
 * (environnement, ou .env.analytics en local).
 */
import fs from 'node:fs';
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
const REGEX = '^(?:\\S+\\s+){7,}\\S+$';
const end = new Date(Date.now() - 3 * DAY);
const iso = (d) => d.toISOString().slice(0, 10);
const period = { startDate: iso(new Date(end - 90 * DAY)), endDate: iso(end) };

const client = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
const { token } = await client.getAccessToken();

const res = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(process.env.GSC_SITE_URL)}/searchAnalytics/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...period,
    type: 'web',
    dimensions: ['query', 'page'],
    dimensionFilterGroups: [{ filters: [{ dimension: 'query', operator: 'includingRegex', expression: REGEX }] }],
    rowLimit: 1000,
  }),
});
if (!res.ok) throw new Error(`Search Console ${res.status}: ${(await res.text()).slice(0, 300)}`);
const rows = ((await res.json()).rows || []).map((r) => ({
  query: r.keys[0].replace(/\s+/g, ' ').trim(),
  page: r.keys[1].replace(SITE, '').replace(/#.*$/, '') || '/',
  impressions: r.impressions,
  clicks: r.clicks,
  position: Math.round(r.position * 10) / 10,
}));

// Bruit : requêtes de veille (opérateurs booléens, site:, inurl:) ou prompts collés de plus de 40 mots.
const isNoise = (q) => /\b(or|and|not)\b.*\b(or|and)\b|(^|\s)-?site:|inurl:|intitle:/i.test(q) || q.split(' ').length > 40;
// Page retirée (redirigée) : plus de fichier dans le site.
const redirected = { has: (page) => !fs.existsSync(page === '/' ? 'index.html' : `${page.replace(/^\//, '').replace(/\/$/, '')}/index.html`) && !fs.existsSync(page.replace(/^\//, '')) };

rows.sort((a, b) => b.impressions - a.impressions || a.position - b.position);
const keep = rows.filter((r) => !isNoise(r.query));
const noise = rows.filter((r) => isNoise(r.query));
const cell = (s) => s.replace(/\|/g, '/');
const line = (r) => `| ${cell(r.query)} | \`${r.page}\`${redirected.has(r.page) ? ' (redirigée)' : ''} | ${r.impressions} | ${r.clicks} | ${r.position} |`;

const out = [
  '# Questions longues tapées sur Google',
  '',
  `Relevé automatique de \`scripts/seo-pilot-questions.mjs\` : requêtes de 8 mots ou plus (Search Console, recherche web, ${period.startDate} → ${period.endDate}, filtre \`${REGEX}\`). ` +
    `${rows.length} couples requête × page, ${keep.length} à classer, ${noise.length} écartés comme bruit. ` +
    'Mode d\'emploi : `seo-pilot/PROMPT.md`, point 10.',
  '',
  '## À classer',
  '',
  '| Question | Page | Impressions | Clics | Position |',
  '|---|---|---|---|---|',
  ...keep.map(line),
  '',
  '## Bruit (requêtes de veille ou prompts collés, ignorés)',
  '',
  '| Requête | Page | Impressions | Clics | Position |',
  '|---|---|---|---|---|',
  ...noise.map((r) => line({ ...r, query: r.query.length > 140 ? r.query.slice(0, 139) + '…' : r.query })),
  '',
];
fs.mkdirSync('seo-pilot/data', { recursive: true });
fs.writeFileSync('seo-pilot/data/questions.md', out.join('\n'));
console.log(`seo-pilot/data/questions.md : ${rows.length} requêtes longues, ${keep.length} à classer, ${noise.length} bruit`);
