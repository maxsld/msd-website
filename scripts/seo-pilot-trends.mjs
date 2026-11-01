/**
 * seo-pilot-trends.mjs
 *
 * Relevé Google Trends (France, 12 mois) pour la revue éditoriale mensuelle de
 * l'agence SEO. Écrit seo-pilot/data/trends.md :
 *   - la tendance de chaque sujet suivi (13 dernières semaines vs les 39 d'avant) ;
 *   - les recherches qui montent autour des sujets principaux.
 *
 * Google Trends n'a pas d'API officielle : on passe par l'API des widgets du
 * site, avec un cookie de session, et on dégrade proprement si elle refuse.
 * Lancé le 1er lundi du mois par .github/workflows/seo-pilot.yml.
 */
import fs from 'node:fs';
import path from 'node:path';

// Sujets suivis, par groupe de la stratégie. La santé esthétique est le cœur :
// ce que les patients cherchent dit aux médecins ce que leur site doit expliquer.
const TOPICS = {
  'Santé esthétique': [
    'médecine esthétique', 'acide hyaluronique', 'botox', 'skinbooster', 'polynucléotides',
    'biostimulateur', 'lifting sans chirurgie', 'chirurgie esthétique', 'épilation laser', 'dermatologue esthétique',
  ],
  'Landing page et sites': ['landing page', 'création site internet', 'refonte site internet', 'site vitrine', 'agence web'],
  'Visibilité IA': ['référencement chatgpt', 'référencement naturel', 'google business profile', 'avis google', 'seo local'],
};
// Sujets dont on relève les recherches montantes (une requête Trends chacun).
const RELATED_SEEDS = ['médecine esthétique', 'acide hyaluronique', 'chirurgie esthétique', 'site internet médecin', 'landing page', 'création site internet'];

const UA = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' };
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (raw) => JSON.parse(raw.replace(/^\)\]\}',?\s*/, ''));

// Trends exige un cookie de session (NID) sinon il renvoie 429.
let cookie = null;
async function headers() {
  if (cookie === null) {
    const res = await fetch('https://trends.google.com/trends/explore?geo=FR&hl=fr', { headers: UA });
    cookie = (res.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
  }
  return { ...UA, ...(cookie ? { Cookie: cookie } : {}) };
}

async function explore(keywords) {
  const req = { comparisonItem: keywords.map((keyword) => ({ keyword, geo: 'FR', time: 'today 12-m' })), category: 0, property: '' };
  const res = await fetch(`https://trends.google.com/trends/api/explore?hl=fr&tz=-60&req=${encodeURIComponent(JSON.stringify(req))}`, { headers: await headers() });
  if (!res.ok) throw new Error(`explore ${res.status}`);
  return strip(await res.text()).widgets || [];
}

async function widgetData(kind, widget) {
  const url = `https://trends.google.com/trends/api/widgetdata/${kind}?hl=fr&tz=-60&req=${encodeURIComponent(JSON.stringify(widget.request))}&token=${encodeURIComponent(widget.token)}`;
  const res = await fetch(url, { headers: await headers() });
  if (!res.ok) throw new Error(`${kind} ${res.status}`);
  return strip(await res.text());
}

// Tendance = moyenne des 13 dernières semaines rapportée à celle des 39 précédentes.
async function trendBatch(keywords) {
  const widget = (await explore(keywords)).find((w) => w.id === 'TIMESERIES');
  if (!widget) throw new Error('pas de série temporelle');
  const timeline = (await widgetData('multiline', widget)).default?.timelineData || [];
  const out = {};
  keywords.forEach((k, i) => {
    const v = timeline.map((p) => Number(p.value?.[i] ?? 0));
    if (v.length < 20) return (out[k] = null);
    const avg = (a) => a.reduce((s, x) => s + x, 0) / (a.length || 1);
    const recent = avg(v.slice(-13)), older = avg(v.slice(0, -13)) || 1;
    out[k] = { ratio: recent / older, level: Math.round(recent) };
  });
  return out;
}

async function rising(seed) {
  const widget = (await explore([seed])).find((w) => w.id === 'RELATED_QUERIES');
  if (!widget) return [];
  const lists = (await widgetData('relatedsearches', widget)).default?.rankedList || [];
  return (lists[1]?.rankedKeyword || []).slice(0, 8).map((k) => `${k.query} (${k.formattedValue})`);
}

const lines = [`# Google Trends du ${new Date().toISOString().slice(0, 10)} (France, 12 mois)`, '', 'Tendance : moyenne des 13 dernières semaines comparée aux 39 précédentes. Niveau : intérêt relatif récent (0 à 100) au sein de son groupe.', ''];
let failures = 0;
for (const [group, keywords] of Object.entries(TOPICS)) {
  lines.push(`## ${group}`, '', '| Sujet | Tendance | Niveau |', '|---|---|---|');
  for (let i = 0; i < keywords.length; i += 5) {
    const batch = keywords.slice(i, i + 5);
    try {
      const res = await trendBatch(batch);
      for (const k of batch) {
        const r = res[k];
        const dir = !r ? 'données insuffisantes' : r.ratio >= 1.15 ? `en hausse (×${r.ratio.toFixed(2)})` : r.ratio <= 0.85 ? `en baisse (×${r.ratio.toFixed(2)})` : 'stable';
        lines.push(`| ${k} | ${dir} | ${r ? r.level : '-'} |`);
      }
    } catch (e) {
      failures++;
      for (const k of batch) lines.push(`| ${k} | indisponible (${e.message}) | - |`);
    }
    await pause(3000);
  }
  lines.push('');
}
lines.push('## Recherches qui montent', '');
for (const seed of RELATED_SEEDS) {
  try {
    const list = await rising(seed);
    lines.push(`- **${seed}** : ${list.length ? list.join(', ') : 'rien de notable'}`);
  } catch (e) {
    failures++;
    lines.push(`- **${seed}** : indisponible (${e.message})`);
  }
  await pause(3000);
}

fs.mkdirSync(path.join('seo-pilot', 'data'), { recursive: true });
fs.writeFileSync(path.join('seo-pilot', 'data', 'trends.md'), lines.join('\n') + '\n');
console.log(`Relevé Google Trends écrit (${failures} appel(s) refusé(s)).`);
