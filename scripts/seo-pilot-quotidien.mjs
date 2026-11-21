/**
 * seo-pilot-quotidien.mjs
 *
 * Veille quotidienne Search Console (workflow .github/workflows/seo-quotidien.yml, chaque matin).
 * Demandée par Maxens le 2026-11-21 après la « baisse » du 19 novembre : surveiller chaque jour,
 * et que l'agence SEO en tienne compte le lundi.
 *
 * Écrit seo-pilot/data/quotidien.md : les 28 derniers jours, jour par jour (total, ordinateur, mobile),
 * et les alertes des 7 derniers jours complets, chacune classée :
 *   - « bruit » : variation portée par des pages au-delà de la position 30 (pages 4 et plus de Google,
 *     surtout vues par des outils SEO), ou retour à la normale après un pic ;
 *   - « à suivre » : baisse réelle sur 1 ou 2 jours ;
 *   - « confirmée » : baisse sur 3 jours complets d'affilée, à traiter par l'agence le lundi.
 * Aucun appel à une IA : coût nul, pas de quota.
 *
 * Variables : GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, GSC_SITE_URL
 * (lues dans l'environnement, ou dans .env.analytics en local).
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
const iso = (d) => d.toISOString().slice(0, 10);
// Search Console complète les chiffres pendant 2 à 3 jours : les 3 derniers jours sont provisoires.
const dernierComplet = iso(new Date(Date.now() - 3 * DAY));
const debut = iso(new Date(Date.now() - 45 * DAY));
const fin = iso(new Date(Date.now() - 1 * DAY));

const client = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});
const { token } = await client.getAccessToken();

async function q(dimensions, extra = {}) {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(process.env.GSC_SITE_URL)}/searchAnalytics/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate: debut, endDate: fin, dimensions, rowLimit: 25000, dataState: 'all', ...extra }),
  });
  if (!res.ok) throw new Error(`Search Console ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()).rows || [];
}

const parJour = new Map();
const jour = (d) => parJour.get(d) || parJour.set(d, { clics: 0, impr: 0, pos: 0, desktop: 0, mobile: 0, profond: 0 }).get(d);
for (const r of await q(['date'])) Object.assign(jour(r.keys[0]), { clics: r.clicks, impr: r.impressions, pos: r.position });
for (const r of await q(['date', 'device'])) {
  if (r.keys[1] === 'DESKTOP') jour(r.keys[0]).desktop = r.impressions;
  if (r.keys[1] === 'MOBILE') jour(r.keys[0]).mobile = r.impressions;
}
// Pages par jour : sert à savoir si une variation vient du fond du classement (position > 30).
const pagesJour = new Map();
for (const r of await q(['date', 'page'])) {
  const [d, p] = [r.keys[0], r.keys[1].replace(SITE, '').replace(/#.*$/, '') || '/'];
  if (!pagesJour.has(d)) pagesJour.set(d, new Map());
  const m = pagesJour.get(d);
  const x = m.get(p) || { impr: 0, clics: 0, pos: r.position };
  if (r.impressions > x.impr) x.pos = r.position;
  x.impr = Math.max(x.impr, r.impressions); // les ancres dupliquent la page : on garde la plus forte ligne
  x.clics = Math.max(x.clics, r.clicks);
  m.set(p, x);
}
for (const [d, m] of pagesJour) jour(d).profond = [...m.values()].filter((x) => x.pos > 30).reduce((s, x) => s + x.impr, 0);

const dates = [...parJour.keys()].sort();
const mediane = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s[(s.length - 1) >> 1] + s[s.length >> 1]) / 2 : 0; };
const ref = (d, champ) => mediane(dates.filter((x) => x < d).slice(-14).map((x) => parJour.get(x)[champ]));

// Pages qui expliquent l'écart d'un jour par rapport à la médiane de ses 14 jours précédents.
function pagesEnCause(d) {
  const avant = dates.filter((x) => x < d).slice(-14);
  const toutes = new Set([...(pagesJour.get(d)?.keys() || []), ...avant.flatMap((x) => [...(pagesJour.get(x)?.keys() || [])])]);
  return [...toutes].map((p) => {
    const base = mediane(avant.map((x) => pagesJour.get(x)?.get(p)?.impr || 0));
    const auj = pagesJour.get(d)?.get(p);
    const posBase = mediane(avant.map((x) => pagesJour.get(x)?.get(p)?.pos).filter(Boolean));
    return { p, base, auj: auj?.impr || 0, pos: auj?.pos, posBase, ecart: (auj?.impr || 0) - base };
  }).sort((a, b) => a.ecart - b.ecart);
}

// Alertes sur les 7 derniers jours complets.
const complets = dates.filter((d) => d <= dernierComplet);
const alertes = [];
const baisse = (d) => { const j = parJour.get(d), r = ref(d, 'impr'); return r > 0 && j.impr < r * 0.75; };
for (const d of complets.slice(-7)) {
  const j = parJour.get(d);
  const rImpr = ref(d, 'impr'), rProf = ref(d, 'profond'), rPos = ref(d, 'pos');
  const varImpr = rImpr ? j.impr / rImpr - 1 : 0;
  if (Math.abs(varImpr) < 0.25) continue;
  const veille = parJour.get(dates[dates.indexOf(d) - 1]);
  const partProfond = (j.impr - rImpr) !== 0 ? (j.profond - rProf) / (j.impr - rImpr) : 0;
  const idx = complets.indexOf(d);
  const troisJours = idx >= 2 && [complets[idx - 2], complets[idx - 1], d].every(baisse);
  let niveau, raison;
  if (varImpr > 0) { niveau = 'info'; raison = 'hausse'; }
  else if (partProfond >= 0.6) { niveau = 'bruit'; raison = `${Math.round(partProfond * 100)} % de l'écart vient de pages au-delà de la position 30`; }
  else if (veille && veille.impr > rImpr * 1.25 && j.impr >= rImpr * 0.85) { niveau = 'bruit'; raison = 'retour à la normale après un pic'; }
  else if (troisJours) { niveau = 'confirmée'; raison = '3 jours complets d\'affilée sous 75 % de la normale'; }
  else { niveau = 'à suivre'; raison = j.pos > rPos + 3 ? `position moyenne en recul (${rPos.toFixed(1)} → ${j.pos.toFixed(1)})` : 'baisse sur moins de 3 jours'; }
  const enCause = pagesEnCause(d);
  const top = (varImpr < 0 ? enCause : [...enCause].reverse()).filter((x) => Math.abs(x.ecart) >= 5).slice(0, 4);
  alertes.push({ d, niveau, raison, j, rImpr, varImpr, top });
}

// Clics : 3 jours complets sans clic alors que la normale en a.
const derniers3 = complets.slice(-3);
const sansClic = derniers3.length === 3 && derniers3.every((d) => parJour.get(d).clics === 0) && ref(derniers3[0], 'clics') >= 2;

const n = (x) => Math.round(x).toLocaleString('fr-FR');
const pct = (x) => `${x > 0 ? '+' : ''}${Math.round(x * 100)} %`;
let md = `# Veille quotidienne Search Console\n\n`;
md += `Mise à jour le ${iso(new Date())} (workflow seo-quotidien.yml, chaque matin). Jours complets jusqu'au ${dernierComplet} ; les jours suivants sont provisoires (Search Console les complète en 2 à 3 jours) et ne déclenchent pas d'alerte.\n\n`;
md += `Règle pour l'agence : seule une alerte **confirmée** (3 jours complets d'affilée sous 75 % de la médiane des 14 jours précédents, hors bruit) justifie une action le lundi. Une alerte « bruit » ou « à suivre » se mentionne au plus en une ligne dans le compte rendu, jamais comme une chute.\n\n`;
md += `## Alertes des 7 derniers jours complets\n\n`;
if (!alertes.length && !sansClic) md += `Aucune : tous les jours sont à moins de 25 % de la normale.\n\n`;
if (sansClic) md += `- **à suivre** · ${derniers3[0]} → ${derniers3[2]} : 3 jours complets sans aucun clic, alors que la normale en a ${ref(derniers3[0], 'clics')} par jour.\n`;
for (const a of alertes) {
  md += `- **${a.niveau}** · ${a.d} : ${n(a.j.impr)} impressions contre ${n(a.rImpr)} d'habitude (${pct(a.varImpr)}), ${a.j.clics} clic(s), position ${a.j.pos.toFixed(1)}. ${a.raison[0].toUpperCase() + a.raison.slice(1)}.\n`;
  for (const t of a.top) md += `  - ${t.p} : ${n(t.base)} → ${n(t.auj)} impressions${t.pos ? `, position ${t.posBase.toFixed(0)} → ${t.pos.toFixed(0)}` : ''}\n`;
}
md += `\n## Jour par jour (28 jours)\n\n| Jour | Impressions | Clics | Position | Ordinateur | Mobile | Au-delà de la pos. 30 |\n|---|---|---|---|---|---|---|\n`;
for (const d of dates.slice(-28).reverse()) {
  const j = parJour.get(d);
  md += `| ${d}${d > dernierComplet ? ' (provisoire)' : ''} | ${n(j.impr)} | ${j.clics} | ${j.pos.toFixed(1)} | ${n(j.desktop)} | ${n(j.mobile)} | ${n(j.profond)} |\n`;
}

fs.writeFileSync('seo-pilot/data/quotidien.md', md);
const resume = alertes.filter((a) => a.niveau === 'confirmée').length;
console.log(`quotidien.md écrit : ${alertes.length} alerte(s), dont ${resume} confirmée(s)${sansClic ? ', 3 jours sans clic' : ''}.`);
