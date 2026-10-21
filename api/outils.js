// api/outils.js
// Outils gratuits du site (/outils/) : lit une page publique et renvoie ce qu'il faut pour
//   ?action=audit  → audit express (SEO on-page, technique, signaux IA)
//   ?action=ia     → « ChatGPT peut-il lire mon site ? » (robots.txt, llms.txt, rendu sans JS…)
//   ?action=site   → pré-remplissage du générateur de llms.txt (titre, description, liens)
//   ?action=speed  → vitesse mobile via Google PageSpeed Insights (15 à 30 s, d'où les 60 s dans vercel.json)
// Variable Vercel : PAGESPEED_API_KEY (clé gratuite Google Cloud ; sans elle, le quota partagé de Google est vite épuisé).
//
// Sécurité : on ne lit que des adresses publiques (pas de localhost ni de réseau privé, vérifié après
// résolution DNS et à chaque redirection), avec un délai et une taille maximum.

import dns from 'node:dns/promises';
import net from 'node:net';

const TIMEOUT = 8000;
const MAX_BYTES = 1_500_000;
const UA = 'Mozilla/5.0 (compatible; MSDMediaOutils/1.0; +https://msd-media.com/outils/)';

// Robots des IA vérifiés dans robots.txt, avec à quoi ils servent.
const AI_BOTS = [
  { name: 'GPTBot', owner: 'OpenAI', role: "entraînement des modèles d'OpenAI" },
  { name: 'OAI-SearchBot', owner: 'OpenAI', role: 'résultats de recherche de ChatGPT' },
  { name: 'ChatGPT-User', owner: 'OpenAI', role: 'pages ouvertes par ChatGPT pendant une conversation' },
  { name: 'ClaudeBot', owner: 'Anthropic', role: 'entraînement des modèles Claude' },
  { name: 'Claude-SearchBot', owner: 'Anthropic', role: 'recherche web de Claude' },
  { name: 'PerplexityBot', owner: 'Perplexity', role: 'index de recherche de Perplexity' },
  { name: 'Google-Extended', owner: 'Google', role: 'Gemini et les modèles de Google' },
  { name: 'CCBot', owner: 'Common Crawl', role: 'base de données utilisée par de nombreuses IA' },
];

// ---------- Limite par adresse IP ----------
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 15;
}

// ---------- Lecture sécurisée d'une URL ----------
function privateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
      || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith('::ffff:')) return privateIp(v6.slice(7));
  return v6 === '::1' || v6 === '::' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80');
}

async function assertPublic(url) {
  if (!/^https?:$/.test(url.protocol)) throw new Error('Adresse invalide : utilisez http:// ou https://');
  if (url.username || url.password) throw new Error('Adresse invalide');
  if (url.port && !['80', '443'].includes(url.port)) throw new Error('Port non autorisé');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || !host.includes('.')) {
    throw new Error('Adresse non publique');
  }
  const ips = net.isIP(host) ? [host] : (await dns.lookup(host, { all: true })).map((r) => r.address);
  if (!ips.length || ips.some(privateIp)) throw new Error('Adresse non publique');
}

async function safeFetch(rawUrl, { accept = 'text/html,*/*' } = {}) {
  let url = new URL(rawUrl);
  const started = Date.now();
  for (let hop = 0; hop < 4; hop++) {
    await assertPublic(url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    let r;
    try {
      r = await fetch(url, { redirect: 'manual', signal: controller.signal, headers: { 'User-Agent': UA, Accept: accept } });
    } finally {
      clearTimeout(timer);
    }
    if ([301, 302, 303, 307, 308].includes(r.status) && r.headers.get('location')) {
      url = new URL(r.headers.get('location'), url);
      continue;
    }
    // Lecture plafonnée en taille.
    const reader = r.body?.getReader();
    const chunks = [];
    let size = 0;
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) { await reader.cancel(); break; }
      chunks.push(value);
    }
    const text = new TextDecoder('utf-8').decode(Buffer.concat(chunks.map((c) => Buffer.from(c))));
    return { status: r.status, url: url.href, headers: r.headers, text, ms: Date.now() - started, bytes: size };
  }
  throw new Error('Trop de redirections');
}

async function tryFetch(url, opts) {
  try { return await safeFetch(url, opts); } catch { return null; }
}

// ---------- Analyse HTML (expressions régulières : suffisant pour un audit express) ----------
const decode = (s = '') => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const attr = (tag, name) => { const m = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')); return m ? decode(m[2] ?? m[3] ?? m[4] ?? '') : null; };
function meta(html, key) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const k = (attr(tag, 'name') || attr(tag, 'property') || '').toLowerCase();
    if (k === key) return attr(tag, 'content');
  }
  return null;
}
function linkRel(html, rel) {
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    if ((attr(tag, 'rel') || '').toLowerCase().split(/\s+/).includes(rel)) return attr(tag, 'href');
  }
  return null;
}
function jsonLdTypes(html) {
  const types = new Set();
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (o) => {
        if (Array.isArray(o)) return o.forEach(walk);
        if (o && typeof o === 'object') {
          [].concat(o['@type'] || []).forEach((t) => types.add(String(t)));
          Object.values(o).forEach(walk);
        }
      };
      walk(JSON.parse(m[1]));
    } catch { types.add('JSON-LD invalide'); }
  }
  return [...types];
}
function visibleText(html) {
  return decode(html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' '));
}

function analyse(page) {
  const html = page.text;
  const title = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decode(m[1].replace(/<[^>]+>/g, ' ')));
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const words = visibleText(html).split(' ').filter((w) => w.length > 1).length;
  return {
    finalUrl: page.url,
    status: page.status,
    https: page.url.startsWith('https://'),
    responseMs: page.ms,
    htmlKb: Math.round(page.bytes / 1024),
    title,
    description: meta(html, 'description') || '',
    lang: attr(html.match(/<html\b[^>]*>/i)?.[0] || '', 'lang') || '',
    viewport: !!meta(html, 'viewport'),
    canonical: linkRel(html, 'canonical') || '',
    robotsMeta: (meta(html, 'robots') || '').toLowerCase(),
    h1s,
    h2Count: (html.match(/<h2\b/gi) || []).length,
    imgCount: imgs.length,
    imgNoAlt: imgs.filter((t) => attr(t, 'alt') === null).length,
    ogTitle: !!meta(html, 'og:title'),
    ogImage: !!meta(html, 'og:image'),
    schema: jsonLdTypes(html),
    words,
  };
}

// ---------- robots.txt ----------
function parseRobots(txt) {
  const groups = [];
  let current = null;
  for (const raw of txt.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === 'user-agent') {
      if (!current || current.rules.length) groups.push(current = { agents: [], rules: [] });
      current.agents.push(val.toLowerCase());
    } else if ((key === 'disallow' || key === 'allow') && current) {
      current.rules.push({ type: key, path: val });
    }
  }
  return groups;
}
// Le robot peut-il lire la page d'accueil ? Règle la plus précise d'abord, comme Google.
function botAllowed(groups, bot) {
  const name = bot.toLowerCase();
  const group = groups.find((g) => g.agents.includes(name)) || groups.find((g) => g.agents.includes('*'));
  if (!group) return { allowed: true, explicit: false };
  const matching = group.rules.filter((r) => r.path && '/'.startsWith(r.path.replace(/\*$/, '').replace(/\$$/, '')));
  if (!matching.length) return { allowed: true, explicit: group.agents.includes(name) };
  const best = matching.sort((a, b) => b.path.length - a.path.length || (a.type === 'allow' ? -1 : 1))[0];
  return { allowed: best.type === 'allow', explicit: group.agents.includes(name) };
}

// ---------- Actions ----------
async function actionAudit(url) {
  const page = await safeFetch(url);
  const a = analyse(page);
  const origin = new URL(page.url).origin;
  const [robots, llms, sitemap] = await Promise.all([
    tryFetch(`${origin}/robots.txt`, { accept: 'text/plain' }),
    tryFetch(`${origin}/llms.txt`, { accept: 'text/plain' }),
    tryFetch(`${origin}/sitemap.xml`, { accept: 'application/xml,text/xml' }),
  ]);
  return {
    ...a,
    robotsTxt: !!(robots && robots.status === 200),
    llmsTxt: !!(llms && llms.status === 200 && !/<html/i.test(llms.text)),
    sitemap: !!(sitemap && sitemap.status === 200 && /<(urlset|sitemapindex)/i.test(sitemap.text)),
  };
}

async function actionIa(url) {
  const page = await safeFetch(url);
  const a = analyse(page);
  const origin = new URL(page.url).origin;
  const [robots, llms] = await Promise.all([
    tryFetch(`${origin}/robots.txt`, { accept: 'text/plain' }),
    tryFetch(`${origin}/llms.txt`, { accept: 'text/plain' }),
  ]);
  const robotsOk = robots && robots.status === 200 && !/<html/i.test(robots.text);
  const groups = robotsOk ? parseRobots(robots.text) : [];
  const llmsOk = !!(llms && llms.status === 200 && !/<html/i.test(llms.text) && llms.text.trim().length > 20);
  return {
    finalUrl: a.finalUrl,
    status: a.status,
    robotsTxt: !!robotsOk,
    bots: AI_BOTS.map((b) => ({ ...b, ...botAllowed(groups, b.name) })),
    llmsTxt: llmsOk,
    llmsPreview: llmsOk ? llms.text.trim().slice(0, 400) : '',
    noindex: /noindex/.test(a.robotsMeta),
    noai: /noai|noimageai/.test(a.robotsMeta),
    words: a.words,
    title: a.title,
    description: a.description,
    h1s: a.h1s,
    schema: a.schema,
    lang: a.lang,
  };
}

async function actionSpeed(url) {
  const target = new URL(url);
  await assertPublic(target);
  const key = process.env.PAGESPEED_API_KEY ? `&key=${encodeURIComponent(process.env.PAGESPEED_API_KEY)}` : '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000);
  try {
    const r = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(target.href)}&strategy=mobile&category=performance${key}`, { signal: controller.signal });
    const d = await r.json();
    const lh = d.lighthouseResult;
    if (!lh) {
      console.error('[outils] PageSpeed :', r.status, d.error?.message?.slice(0, 200));
      return { error: 'La vitesse n’a pas pu être mesurée cette fois.' };
    }
    const audit = (id) => lh.audits?.[id]?.displayValue || '';
    return { score: (lh.categories?.performance?.score ?? 0) * 100, lcp: audit('largest-contentful-paint'), cls: audit('cumulative-layout-shift'), tbt: audit('total-blocking-time') };
  } finally {
    clearTimeout(timer);
  }
}

async function actionSite(url) {
  const page = await safeFetch(url);
  const a = analyse(page);
  const base = new URL(page.url);
  const links = [];
  const seen = new Set();
  // Menu et pied de page d'abord : ce sont les pages que le site met lui-même en avant.
  const zones = [...page.text.matchAll(/<(nav|header|footer)\b[\s\S]*?<\/\1>/gi)].map((m) => m[0]).join(' ') + ' ' + page.text;
  const GENERIC = /^(en savoir plus|lire la suite|lire|voir|voir plus|découvrir.*|cliquez ici|ici|plus|more|read more|learn more|accueil|home)$/i;
  for (const m of zones.matchAll(/<a\b[^>]*href\s*=\s*["']([^"'#]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let href;
    try { href = new URL(decode(m[1]), base); } catch { continue; }
    if (href.origin !== base.origin || /\.(jpg|jpeg|png|webp|gif|svg|pdf|zip)$/i.test(href.pathname)) continue;
    href.search = ''; href.hash = '';
    const label = decode(m[2].replace(/<[^>]+>/g, ' '));
    if (!label || label.length > 60 || GENERIC.test(label) || seen.has(href.href) || href.href === base.origin + '/') continue;
    seen.add(href.href);
    links.push({ title: label, url: href.href });
    if (links.length >= 25) break;
  }
  const name = (a.title.split(/\s[|–—-]\s/)[0] || base.hostname).trim();
  return { finalUrl: page.url, name, title: a.title, description: a.description, links };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'inconnue';
  if (limited(ip)) return res.status(429).json({ error: 'Beaucoup d’analyses d’un coup : réessayez dans quelques minutes.' });

  const action = String(req.query?.action || '');
  let raw = String(req.query?.url || '').trim();
  if (!raw) return res.status(400).json({ error: 'Indiquez l’adresse d’un site.' });
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

  try {
    const run = { audit: actionAudit, ia: actionIa, site: actionSite, speed: actionSpeed }[action];
    if (!run) return res.status(400).json({ error: 'Outil inconnu' });
    const data = await run(raw);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(data);
  } catch (err) {
    const msg = err?.name === 'AbortError' ? 'Le site met trop de temps à répondre.'
      : /ENOTFOUND|EAI_AGAIN/.test(String(err?.code || err?.message)) ? 'Ce site est introuvable : vérifiez l’adresse.'
      : /Adresse|Port|redirections/.test(err?.message || '') ? err.message
      : 'Impossible de lire ce site pour le moment.';
    return res.status(200).json({ error: msg });
  }
}
