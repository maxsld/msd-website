// Génère les versions anglaises (/en/...) des pages commerciales à partir des pages françaises.
//
//   node scripts/build-en-pages.mjs            construit les pages /en/ (échoue s'il manque des traductions)
//   node scripts/build-en-pages.mjs --extract  écrit dans scripts/i18n/en-missing.json les textes à traduire
//
// Les traductions sont dans scripts/i18n/en-pages.json (texte français -> texte anglais, HTML inline conservé).
// Le header, le bandeau, les cookies et le footer viennent de /en/index.html, déjà en anglais.
// Le script met aussi à jour les pages françaises (hreflang, lien EN du sélecteur), les liens de
// /en/index.html et /en/munich/ vers ces pages, le sitemap, et la table de redirection du middleware.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://msd-media.com';
const DICT_FILE = path.join(ROOT, 'scripts/i18n/en-pages.json');
const MISSING_FILE = path.join(ROOT, 'scripts/i18n/en-missing.json');
const EXTRACT = process.argv.includes('--extract');

// Page française -> page anglaise (chemins d'URL)
export const PAGES = {
  '/tarifs/': '/en/pricing/',
  '/a-propos/': '/en/about/',
  '/contact/': '/en/contact/',
  '/reserver-un-appel/': '/en/book-a-call/',
  '/creation-landing-page/': '/en/landing-page-design/',
  '/outils/': '/en/tools/',
  '/affiliation/': '/en/referral-program/',
  '/realisations/': '/en/work/',
  '/realisations/agence-3xl/': '/en/work/agence-3xl/',
  '/realisations/aristoi-academia/': '/en/work/aristoi-academia/',
  '/realisations/carroz-sports/': '/en/work/carroz-sports/',
  '/realisations/em-motors/': '/en/work/em-motors/',
  '/realisations/hairtattoo/': '/en/work/hairtattoo/',
  '/realisations/laurence-daien-maestripieri/': '/en/work/laurence-daien-maestripieri/',
  '/realisations/marie-troccaz/': '/en/work/marie-troccaz/',
  '/realisations/maxime-sciare/': '/en/work/maxime-sciare/',
  '/realisations/merz-radiesse/': '/en/work/merz-radiesse/',
  '/realisations/merz-ultherapy-prime/': '/en/work/merz-ultherapy-prime/',
  '/realisations/nation-startup/': '/en/work/nation-startup/',
  '/terms/mentions.html': '/en/legal/legal-notice.html',
  '/terms/cgv.html': '/en/legal/terms-of-sale.html',
  '/terms/politique-confidentialite.html': '/en/legal/privacy-policy.html',
};
// Pages anglaises écrites à la main, pour les liens et le sélecteur de langue
const EXISTING = { '/': '/en/', '/agence-web-munich/': '/en/munich/' };
const LINK_MAP = { ...EXISTING, ...PAGES };
const REVERSE = Object.fromEntries(Object.entries(LINK_MAP).map(([fr, en]) => [en, fr]));

const fileOf = (urlPath) => path.join(ROOT, urlPath.endsWith('/') ? urlPath + 'index.html' : urlPath);
const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const norm = (s) => s.replace(/\s+/g, ' ').trim();

// ---------- Mini parseur HTML : arbre d'éléments avec positions dans la source ----------
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style', 'textarea']);
function parse(html) {
  const root = { tag: '#root', attrs: '', children: [], start: 0, end: html.length, innerStart: 0, innerEnd: html.length };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<!doctype[^>]*>|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
  let m, last = 0;
  const text = (a, b) => { if (b > a) stack[stack.length - 1].children.push({ tag: '#text', start: a, end: b }); };
  while ((m = re.exec(html))) {
    text(last, m.index);
    last = re.lastIndex;
    if (m[0].startsWith('<!')) continue;
    if (m[1]) {
      const tag = m[1].toLowerCase();
      let i = stack.length - 1;
      while (i > 0 && stack[i].tag !== tag) i--;
      if (i === 0) continue;
      for (let j = stack.length - 1; j >= i; j--) { stack[j].innerEnd ??= m.index; stack[j].end ??= j === i ? re.lastIndex : m.index; }
      stack[i].innerEnd = m.index; stack[i].end = re.lastIndex;
      stack.length = i;
      continue;
    }
    const tag = m[2].toLowerCase();
    const el = { tag, attrs: m[3], children: [], start: m.index, innerStart: re.lastIndex, parent: stack[stack.length - 1] };
    stack[stack.length - 1].children.push(el);
    if (VOID.has(tag) || /\/\s*$/.test(m[3])) { el.innerEnd = el.end = re.lastIndex; continue; }
    if (RAW.has(tag)) {
      const close = html.toLowerCase().indexOf(`</${tag}`, re.lastIndex);
      el.innerEnd = close;
      el.end = html.indexOf('>', close) + 1;
      re.lastIndex = last = el.end;
      continue;
    }
    stack.push(el);
  }
  text(last, html.length);
  return root;
}
const attr = (el, name) => { const m = el.attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i')); return m ? (m[2] ?? m[3]) : null; };
const hasClass = (el, c) => (` ${attr(el, 'class') || ''} `).includes(` ${c} `);

// ---------- Repérage des textes à traduire ----------
const BLOCK = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'summary', 'button', 'td', 'th', 'label', 'figcaption', 'blockquote', 'dt', 'dd', 'option', 'legend', 'caption', 'title', 'a']);
const INLINE = new Set(['a', 'strong', 'b', 'em', 'i', 'span', 'br', 'small', 'sup', 'sub', 'mark', 'abbr', 'code', 'time', 'u', 's', 'img', 'q', 'cite', 'svg', 'use', 'path', 'wbr', 'del', 'ins']);
const SKIP_TAGS = new Set(['script', 'style', 'svg', 'noscript', 'textarea', 'iframe', 'template']);
const ATTRS = ['alt', 'title', 'aria-label', 'placeholder', 'data-placeholder', 'data-tooltip', 'data-label'];
const META_TRANSLATE = /^(description|og:title|og:description|og:image:alt|twitter:title|twitter:description|twitter:image:alt|title|keywords)$/;
const hasLetters = (s) => /[A-Za-zÀ-ÿ]{2}/.test(s.replace(/&[a-z#0-9]+;/gi, ''));

// Zones remplacées en bloc par celles de /en/index.html : pas de traduction à faire dedans
// (footer du site seulement : les pages légales ont aussi un <footer class="card"> à traduire)
const isReplacedZone = (el) => (el.tag === 'header' && attr(el, 'id') === 'nav') || (el.tag === 'footer' && hasClass(el, 'site-footer'))
  || hasClass(el, 'top-announcement') || attr(el, 'id') === 'cookie-consent' || hasClass(el, 'lang-switch');

// Icônes et images d'un bloc : remplacées par {{0}}, {{1}}… dans le texte à traduire, remises ensuite
function protect(inner) {
  const slots = [];
  const key = norm(inner.replace(/<svg[\s\S]*?<\/svg>|<img\b[^>]*>|<i\b[^>]*><\/i>|<picture[\s\S]*?<\/picture>/gi, (m) => `{{${slots.push(m) - 1}}}`));
  return { key, slots };
}
function restore(text, slots, t) {
  return text.replace(/\{\{(\d+)\}\}/g, (m, i) => (slots[i] ?? m).replace(new RegExp(`(\\s(?:${ATTRS.join('|')})=")([^"]*)(")`, 'g'), (a, p, v, s) => (hasLetters(v) ? p + t(norm(v)).replace(/"/g, '&quot;') + s : a)));
}

function inlineOnly(el) {
  return el.children.every((c) => c.tag === '#text' || (INLINE.has(c.tag) && c.tag !== 'a' ? inlineOnly(c) : c.tag === 'a' ? inlineOnly(c) : false));
}

// Renvoie la liste des remplacements {start, end, key, kind}
function collect(html, tree) {
  const units = [];
  const visit = (el) => {
    if (el.tag !== '#root' && isReplacedZone(el)) return;
    if (el.tag !== '#text' && el.tag !== '#root') {
      for (const name of ATTRS) {
        const v = attr(el, name);
        if (v && hasLetters(v)) units.push({ kind: 'attr', el, name, key: norm(v) });
      }
      if (el.tag === 'meta') {
        const n = attr(el, 'name') || attr(el, 'property') || '';
        const c = attr(el, 'content');
        if (META_TRANSLATE.test(n) && c && hasLetters(c)) units.push({ kind: 'attr', el, name: 'content', key: norm(c) });
        return;
      }
      if (el.tag === 'script' && /ld\+json/i.test(attr(el, 'type') || '')) { units.push({ kind: 'jsonld', el }); return; }
      if (el.tag === 'input' && /^(submit|button)$/i.test(attr(el, 'type') || '')) {
        const v = attr(el, 'value');
        if (v && hasLetters(v)) units.push({ kind: 'attr', el, name: 'value', key: norm(v) });
      }
      if (SKIP_TAGS.has(el.tag)) return;
      // Bloc qui ne contient que du texte et des balises inline : on le traduit en entier
      const inner = html.slice(el.innerStart, el.innerEnd);
      if ((BLOCK.has(el.tag) || (INLINE.has(el.tag) && el.parent && !BLOCK.has(el.parent.tag) && !INLINE.has(el.parent.tag))) && inlineOnly(el) && hasLetters(inner.replace(/<svg[\s\S]*?<\/svg>|<[^>]+>/g, ' '))) {
        const { key, slots } = protect(inner);
        units.push({ kind: 'inner', el, key, slots });
        // les attributs des icônes et images mises de côté (alt, aria-label) sont traduits à part
        for (const s of slots) for (const name of ATTRS) { const m = s.match(new RegExp(`\\s${name}="([^"]*)"`)); if (m && hasLetters(m[1])) units.push({ kind: 'slot-attr', key: norm(m[1]) }); }
        return;
      }
    }
    for (const c of el.children || []) {
      if (c.tag === '#text') {
        const t = html.slice(c.start, c.end);
        if (hasLetters(t)) units.push({ kind: 'text', el: c, key: norm(t) });
      } else visit(c);
    }
  };
  visit(tree);
  return units;
}

// Chaînes à traduire dans un JSON-LD
const LD_SKIP_KEYS = new Set(['@context', '@type', '@id', 'url', 'image', 'logo', 'sameAs', 'item', 'telephone', 'email', 'priceCurrency', 'price', 'inLanguage', 'contentUrl', 'embedUrl', 'thumbnailUrl', 'datePublished', 'dateModified', 'uploadDate', 'addressCountry', 'postalCode', 'duration', 'availability', 'currenciesAccepted', 'openingHours', 'latitude', 'longitude', 'ratingValue', 'bestRating', 'worstRating', 'reviewCount', 'ratingCount']);
function ldStrings(node, out = [], key = '') {
  if (typeof node === 'string') { if (!LD_SKIP_KEYS.has(key) && hasLetters(node) && !/^https?:/.test(node)) out.push(norm(node)); }
  else if (Array.isArray(node)) node.forEach((n) => ldStrings(n, out, key));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) ldStrings(v, out, k);
  return out;
}
function ldTranslate(node, t, key = '') {
  if (typeof node === 'string') return !LD_SKIP_KEYS.has(key) && hasLetters(node) && !/^https?:/.test(node) ? t(norm(node)) : node;
  if (Array.isArray(node)) return node.map((n) => ldTranslate(n, t, key));
  if (node && typeof node === 'object') return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, ldTranslate(v, t, k)]));
  return node;
}

// ---------- Liens et chemins ----------
// URL de la page française -> URL équivalente depuis la page anglaise
function relocate(value, frPath, enPath) {
  if (!value || /^(#|mailto:|tel:|javascript:|data:|\{|\$)/i.test(value)) return value;
  let u;
  try { u = new URL(value, SITE + frPath); } catch { return value; }
  if (u.origin !== SITE) return value;
  const mapped = LINK_MAP[u.pathname] || (u.pathname === '/index.html' ? '/en/' : null);
  if (mapped) return SITE + mapped + u.search + u.hash;
  const absolute = /^(https?:)?\/\//i.test(value) || value.startsWith('/');
  if (absolute) return value;
  // chemin relatif (assets) : recalculé depuis le dossier de la page anglaise
  const from = path.posix.dirname(enPath.endsWith('/') ? enPath + 'x' : enPath);
  let rel = path.posix.relative(from, u.pathname) || '.';
  if (u.pathname.endsWith('/') && !rel.endsWith('/')) rel += '/';
  return rel + u.search + u.hash;
}
const URL_ATTR_RE = /(\s(?:href|src|data-src|poster|action|content)=")([^"]*)(")/g;
const SRCSET_RE = /(\s(?:srcset|data-srcset)=")([^"]*)(")/g;
function relocateAll(html, frPath, enPath) {
  return html
    .replace(URL_ATTR_RE, (m, a, v, b) => (/content="$/.test(a) && !/^(https?:|\/|\.\.?\/|assets\/)/.test(v) ? m : a + relocate(v, frPath, enPath) + b))
    .replace(SRCSET_RE, (m, a, v, b) => a + v.split(',').map((part) => { const [u, ...rest] = part.trim().split(/\s+/); return [relocate(u, frPath, enPath), ...rest].join(' '); }).join(', ') + b);
}

// Sélecteur de langue : FR -> page française, EN -> page anglaise
function setLangSwitch(html, frUrl, enUrl, current) {
  return html
    .replace(/(<a href=")[^"]*(" data-lang="fr")/g, `$1${frUrl}$2`)
    .replace(/(<a href=")[^"]*(" data-lang="en")/g, `$1${enUrl}$2`)
    .replace(/(<a href="[^"]*" data-lang="(?:fr|en)"[^>]*?) aria-current="true"/g, '$1')
    .replace(new RegExp(`(<a href="[^"]*" data-lang="${current}")`, 'g'), '$1 aria-current="true"');
}
function hreflangBlock(frUrl, enUrl) {
  return `<link rel="alternate" hreflang="fr" href="${frUrl}" />\n  <link rel="alternate" hreflang="en" href="${enUrl}" />\n  <link rel="alternate" hreflang="x-default" href="${frUrl}" />`;
}
function setHreflang(html, frUrl, enUrl) {
  const block = hreflangBlock(frUrl, enUrl);
  const cleaned = html.replace(/[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*"\s*\/?>\n?/g, '');
  return cleaned.replace(/([ \t]*)(<link rel="canonical"[^>]*>)/, (m, ind, tag) => `${ind}${tag}\n${ind}${block.replace(/\n  /g, '\n' + ind)}`);
}

// ---------- Construction ----------
const dict = fs.existsSync(DICT_FILE) ? JSON.parse(fs.readFileSync(DICT_FILE, 'utf8')) : {};
const missing = {};
const enHome = read(fileOf('/en/'));
const homeTree = parse(enHome);
const findEl = (tree, test) => { let found = null; const walk = (e) => { if (found || e.tag === '#text') return; if (test(e)) { found = e; return; } (e.children || []).forEach(walk); }; walk(tree); return found; };
const enBlock = (test) => { const el = findEl(homeTree, test); if (!el) throw new Error('bloc introuvable dans /en/index.html'); return enHome.slice(el.start, el.end); };
const EN_PARTS = {
  header: enBlock((e) => e.tag === 'header' && attr(e, 'id') === 'nav'),
  footer: enBlock((e) => e.tag === 'footer' && hasClass(e, 'site-footer')),
  // Le bandeau affiliation n'est plus sur la home : sa version anglaise vit dans un gabarit.
  announcement: read(path.join(ROOT, 'scripts', 'templates', 'announcement-en.html')).trim(),
  cookie: enBlock((e) => attr(e, 'id') === 'cookie-consent'),
};

const t = (key, where) => {
  if (dict[key] !== undefined) return dict[key];
  (missing[where] ??= []).includes(key) || missing[where].push(key);
  return key;
};

let built = 0;
for (const [frPath, enPath] of Object.entries(PAGES)) {
  const frFile = fileOf(frPath);
  if (!fs.existsSync(frFile)) { console.warn('absent :', frPath); continue; }
  const frUrl = SITE + frPath, enUrl = SITE + enPath;
  // Blocs « MSD Media en bref » des pages légales : écrits directement en anglais par scripts/build-ai-doors.py
  let html = read(frFile).replace(/(<!-- ai-door(?:-ld)?:start -->)[\s\S]*?(<!-- ai-door(?:-ld)?:end -->)/g, '$1$2');
  const tree = parse(html);
  const units = collect(html, tree);

  // Remplacements de la fin vers le début pour garder les positions valides
  const edits = [];
  for (const u of units) {
    if (u.kind === 'inner') {
      const inner = html.slice(u.el.innerStart, u.el.innerEnd);
      const lead = inner.match(/^\s*/)[0], trail = inner.match(/\s*$/)[0];
      const en = t(u.key, frPath);
      if (dict[u.key] !== undefined && u.slots.some((s, i) => !en.includes(`{{${i}}}`))) throw new Error(`traduction sans {{n}} : ${u.key.slice(0, 80)}`);
      edits.push({ start: u.el.innerStart, end: u.el.innerEnd, value: lead + restore(en, u.slots, (k) => t(k, frPath)) + trail, nested: true });
    } else if (u.kind === 'slot-attr') {
      t(u.key, frPath);
    } else if (u.kind === 'text') {
      const raw = html.slice(u.el.start, u.el.end);
      const lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
      edits.push({ start: u.el.start, end: u.el.end, value: lead + t(u.key, frPath) + trail });
    } else if (u.kind === 'attr') {
      const tagSrc = html.slice(u.el.start, u.el.innerStart);
      const re = new RegExp(`((?:^|\\s)${u.name}\\s*=\\s*)("[^"]*"|'[^']*')`, 'i');
      const m = tagSrc.match(re);
      if (!m) continue;
      const at = u.el.start + m.index + m[1].length;
      const en = t(u.key, frPath).replace(/"/g, '&quot;');
      edits.push({ start: at, end: at + m[2].length, value: `"${en}"` });
    } else if (u.kind === 'jsonld') {
      const src = html.slice(u.el.innerStart, u.el.innerEnd);
      let data;
      try { data = JSON.parse(src); } catch { continue; }
      const out = ldTranslate(data, (k) => t(k, frPath));
      fixLd(out, frUrl, enUrl);
      edits.push({ start: u.el.innerStart, end: u.el.innerEnd, value: JSON.stringify(out, null, 2) });
    }
  }
  // Les attributs à l'intérieur d'un bloc traduit en entier sont déjà dans sa traduction
  const blocks = edits.filter((e) => e.nested);
  const final = edits.filter((e) => e.nested || !blocks.some((b) => e.start >= b.start && e.end <= b.end));
  final.sort((a, b) => b.start - a.start);
  for (const e of final) html = html.slice(0, e.start) + e.value + html.slice(e.end);

  if (EXTRACT) continue;

  // Zones communes reprises de la home anglaise
  const swapZone = (test, part) => { const el = findEl(parse(html), test); if (el) html = html.slice(0, el.start) + part + html.slice(el.end); };
  swapZone((e) => e.tag === 'header' && attr(e, 'id') === 'nav', relocateAll(EN_PARTS.header, '/en/', enPath));
  swapZone((e) => e.tag === 'footer' && hasClass(e, 'site-footer'), relocateAll(EN_PARTS.footer, '/en/', enPath));
  swapZone((e) => hasClass(e, 'top-announcement'), relocateAll(EN_PARTS.announcement, '/en/', enPath));
  swapZone((e) => attr(e, 'id') === 'cookie-consent', relocateAll(EN_PARTS.cookie, '/en/', enPath));

  // <head> : langue, canonical, hreflang, Open Graph
  html = html.replace(/<html lang="[^"]*"/, '<html lang="en"')
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${enUrl}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${enUrl}$2`)
    .replace(/(<meta property="og:locale" content=")[^"]*(")/, '$1en_US$2')
    .replace(/<meta name="geo\.[^>]*>\n?|<meta name="ICBM"[^>]*>\n?/g, (m) => m);
  html = setHreflang(html, frUrl, enUrl);
  html = relocateAll(html, frPath, enPath);
  // le canonical et l'og:url ont été remappés par relocateAll ; on les remet sur la page anglaise
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${enUrl}$2`).replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${enUrl}$2`);
  html = setHreflang(html, frUrl, enUrl);
  html = setLangSwitch(html, frUrl, enUrl, 'en');
  // lien « Version française » du footer : vers la page française correspondante
  html = html.replace(/<a href="[^"]*"( hreflang="fr" lang="fr">)/g, `<a href="${frUrl}"$1`);

  const out = fileOf(enPath);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  built++;

  // Page française : hreflang + lien EN du sélecteur
  let fr = read(frFile);
  fr = setHreflang(fr, frUrl, enUrl);
  fr = setLangSwitch(fr, frUrl, enUrl, 'fr');
  fr = fr.replace(/<a href="https:\/\/msd-media\.com\/en\/" hreflang="en" lang="en">English version<\/a>/g, `<a href="${enUrl}" hreflang="en" lang="en">English version</a>`);
  fs.writeFileSync(frFile, fr);
}

function fixLd(node, frUrl, enUrl) {
  if (Array.isArray(node)) return node.forEach((n) => fixLd(n, frUrl, enUrl));
  if (!node || typeof node !== 'object') return;
  for (const [k, v] of Object.entries(node)) {
    if (typeof v === 'string' && v.startsWith(SITE)) {
      const u = new URL(v);
      const mapped = LINK_MAP[u.pathname];
      if (mapped) node[k] = SITE + mapped + u.hash;
    } else if (k === 'inLanguage' && typeof v === 'string') node[k] = 'en';
    else fixLd(v, frUrl, enUrl);
  }
}

if (EXTRACT) {
  const count = Object.values(missing).reduce((n, l) => n + l.length, 0);
  const chars = Object.values(missing).flat().reduce((n, s) => n + s.length, 0);
  fs.writeFileSync(MISSING_FILE, JSON.stringify(missing, null, 1));
  console.log(`${count} textes à traduire (${chars} caractères) -> ${path.relative(ROOT, MISSING_FILE)}`);
  process.exit(0);
}
if (Object.keys(missing).length) {
  const count = Object.values(missing).reduce((n, l) => n + l.length, 0);
  console.error(`${count} traductions manquantes : lancez --extract puis complétez scripts/i18n/en-pages.json`);
  process.exit(1);
}

// Liens des pages anglaises écrites à la main vers les nouvelles pages
for (const enPath of Object.values(EXISTING)) {
  const f = fileOf(enPath);
  const html = read(f).replace(/(href=")https:\/\/msd-media\.com(\/[^"#?]*)([^"]*")/g, (m, a, p, rest) => (PAGES[p] && !REVERSE[p] ? a + SITE + PAGES[p] + rest : m));
  fs.writeFileSync(f, html);
}

// Sitemap : une entrée par page anglaise
const sitemapFile = path.join(ROOT, 'sitemap.xml');
let sitemap = read(sitemapFile);
const today = new Date().toISOString().slice(0, 10);
for (const enPath of Object.values(PAGES)) {
  const loc = SITE + enPath;
  if (sitemap.includes(`<loc>${loc}</loc>`)) continue;
  sitemap = sitemap.replace('</urlset>', `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.60</priority>\n  </url>\n</urlset>`);
}
fs.writeFileSync(sitemapFile, sitemap);

// Table du middleware (redirection des visiteurs étrangers)
const mwFile = path.join(ROOT, 'middleware.js');
const mw = read(mwFile);
const routes = `// ROUTES:START\nconst ROUTES = ${JSON.stringify(LINK_MAP, null, 2)};\n// ROUTES:END`;
fs.writeFileSync(mwFile, mw.replace(/\/\/ ROUTES:START[\s\S]*?\/\/ ROUTES:END/, routes));
console.log(`${built} pages anglaises générées`);
