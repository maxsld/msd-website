#!/usr/bin/env node
/**
 * build-light-theme.mjs
 *
 * Refonte 2026 : le site passe d'un thème sombre à un thème clair (celui de la home, theme-v2.css).
 * Les pages autres que l'accueil gardent leurs composants (style.css, responsive.css), dont les
 * couleurs sont écrites en dur pour un fond noir. Ce script en tire assets/css/light-v1.css : les
 * mêmes sélecteurs, avec les couleurs inversées vers la palette claire et les polices de la refonte.
 *
 * Il se relance après toute modification de style.css ou responsive.css (npm run theme:light),
 * avant version-assets. Ne pas modifier light-v1.css à la main : corriger ici, ou dans theme-v2.css.
 * Les pages qui ont leurs propres blocs <style> ont été converties une fois avec --inline <fichiers>.
 */
import fs from 'node:fs';
import postcss from 'postcss';

const SOURCES = ['assets/css/style.css', 'assets/css/responsive.css'];
const OUTPUT = 'assets/css/light-v1.css';

// Composants déjà stylés par theme-v2.css, ou qui restent sombres : texte blanc sur photo (cartes et
// carrousels du blog et des réalisations), vidéo, footer.
const KEEP = /site-footer|footer-|cookie-consent|cal-float|cal-modal|msd-chat|msd-ask|msd-chip|navbar|nav-|lang-switch|top-announcement|whatsapp-nav|contact-button|eco-card|eco-section__|review-video|project-preview|video-hero-controls|video-hero__|tile-mock|founder-video|hero-video|dark-quote|blog-card|blog-hero-carousel|realisations-page-carousel|video-hero::before/;

const COLOR_PROPS = new Set(['color', 'fill', 'stroke', 'caret-color', '-webkit-text-fill-color', 'text-decoration-color', 'outline-color', 'column-rule-color']);
const BG_PROPS = new Set(['background', 'background-color', 'background-image']);
const BORDER_PROPS = /^border(-top|-right|-bottom|-left)?(-color)?$|^border-(block|inline)(-start|-end)?(-color)?$/;

const NAMED = { white: [255, 255, 255, 1], black: [0, 0, 0, 1], '#fff': [255, 255, 255, 1], '#000': [0, 0, 0, 1] };
const COLOR_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|rgba?\([^)]*\)|(?<![\w-])(?:white|black)(?![\w-])/g;

function parse(c) {
  const lc = c.toLowerCase();
  if (NAMED[lc]) return NAMED[lc];
  if (lc.startsWith('#')) {
    let h = lc.slice(1);
    if (h.length <= 4) h = [...h].map((x) => x + x).join('');
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1];
  }
  const parts = lc.replace(/rgba?\(|\)/g, '').split(/[\s,/]+/).filter(Boolean).map((x) => (x.endsWith('%') ? parseFloat(x) * 2.55 : parseFloat(x)));
  return [parts[0], parts[1], parts[2], parts[3] ?? 1];
}
const ch = (x) => Math.max(0, Math.min(255, Math.round(x)));
const fmt = ([r, g, b, a]) => (a >= 1 ? `rgb(${ch(r)}, ${ch(g)}, ${ch(b)})` : `rgba(${ch(r)}, ${ch(g)}, ${ch(b)}, ${+a.toFixed(3)})`);
const isGray = ([r, g, b]) => Math.max(r, g, b) - Math.min(r, g, b) < 28;
const light = ([r, g, b]) => (0.299 * r + 0.587 * g + 0.114 * b);

// Encre foncée de la refonte (titres) : #040815.
const INK = [4, 8, 21];
// ctx décrit la règle d'origine : fond blanc opaque, texte foncé, fond de couleur (bleu…).
// Fond blanc + texte foncé dans la même règle = bouton blanc de l'ancien thème : il devient noir.
// Principe : l'ancien site était sombre, avec quelques zones déjà claires (corps des articles,
// tableaux…). Un texte clair était forcément sur fond sombre : il devient foncé. Un texte foncé était
// forcément sur fond clair : il reste tel quel, sauf sur un bouton blanc qui devient noir.
function mapColor(rgba, role, ctx) {
  const [, , , a] = rgba;
  if (!isGray(rgba)) return null; // bleu, vert, rouge… : couleurs de marque, inchangées
  const v = light(rgba);
  const invertButton = ctx.whiteBg && ctx.darkText;
  if (role === 'text') {
    if (ctx.coloredBg) return null; // texte sur fond bleu, vert… : inchangé
    if (v >= 128) {
      if (v >= 240) return [...INK, a];
      const t = Math.min(122, 4 + (255 - v) * 2.3);
      return [t, t, t + 6, a]; // gris clairs → gris de texte (#71717b environ)
    }
    return invertButton ? [255, 255, 255, a] : null;
  }
  if (role === 'bg') {
    if (v >= 200) {
      if (a < 0.8) return [...INK, a * 0.6]; // voile blanc translucide → voile foncé léger (un blanc à 95 % reste une surface blanche)
      return invertButton ? [15, 15, 15, a] : null; // fond blanc : bouton → noir, zone claire → inchangée
    }
    if (v < 128) {
      const t = 255 - v * 0.26;
      return [t, t, t - 2, a]; // surfaces sombres → gris très clairs (#111 → #fbfbf9)
    }
    return null;
  }
  // Bordures
  if (v >= 200) {
    if (a < 0.8) return [...INK, Math.min(1, a * 0.9)];
    return invertButton ? [15, 15, 15, a] : null;
  }
  if (v < 128) { const t = 255 - v * 0.35; return [t, t, t + 2, a]; }
  return null;
}

function convertValue(value, role, ctx) {
  let changed = false;
  const out = value.replace(COLOR_RE, (m) => {
    const mapped = mapColor(parse(m), role, ctx);
    if (!mapped) return m;
    changed = true;
    return fmt(mapped);
  });
  return changed ? out : null;
}

// Les variables de couleur de style.css sont remplacées par leur valeur avant conversion :
// une même variable sert de texte sur fond sombre et de texte sur bouton blanc.
const VAR_VALUES = {};
for (const m of fs.readFileSync(SOURCES[0], 'utf8').matchAll(/(--global-color-[\w-]+)\s*:\s*([^;]+);/g)) VAR_VALUES[m[1]] = m[2].trim();
const resolveVars = (value) => value.replace(/var\((--global-color-[\w-]+)\)/g, (m, name) => VAR_VALUES[name] || m);
const colorsOf = (value) => (value.match(COLOR_RE) || []).map(parse).filter(isGray);

function fontFor(selector, value) {
  if (/Instrument Serif|Outfit|Inter Tight/i.test(value) || /\bh[1-6]\b|title|heading|__name|-name\b/i.test(selector)) return 'var(--font-heading)';
  if (/btn|button/i.test(selector)) return 'Inter, sans-serif';
  if (/Inter|Manrope|sans-serif/i.test(value)) return 'var(--font-body)';
  return null;
}

// Logos et icônes passés en blanc par filtre (« brightness(0) invert(1) ») : en noir sur le thème clair.
// Les filtres de teinte (invert(18%) sepia(…) hue-rotate(…)) servent à colorer en bleu : inchangés.
function lightFilter(value) {
  if (!/invert\(\s*(1|100%)\s*\)/.test(value) || /sepia|hue-rotate/.test(value)) return null;
  const rest = value.replace(/invert\(\s*(1|100%)\s*\)/, '').replace(/brightness\(\s*1\.0?\d*\s*\)/, '').trim();
  return rest || 'none';
}

// Arrondis de la home : 0,4 rem pour les boutons, champs et étiquettes, 0,75 rem pour les cartes et blocs.
// Seuls les petits arrondis de l'ancien thème (0,2 rem, 2 à 4 px) sont concernés ; ronds et pilules restent.
const SMALL_RADIUS = /^(0?\.2rem|0?\.25rem|[2-4]px)$/;
const CONTROL = /btn|button|tag|badge|chip|pill|input|select|textarea|field|tab\b|tabs?__|-tab|toggle|control|search|label|link|icon|kbd|code/i;
function homeRadius(selector, value) {
  if (!SMALL_RADIUS.test(value.trim())) return null;
  return CONTROL.test(selector) ? 'var(--btn-radius)' : 'var(--radius)';
}

// Couleurs converties d'une règle : liste de déclarations, vide si rien ne change.
function convertRule(rule) {
  const decls = [];
  const ctx = { whiteBg: false, darkText: false, coloredBg: false };
  rule.walkDecls((d) => {
    const p = d.prop.toLowerCase();
    const value = resolveVars(d.value);
    if (BG_PROPS.has(p) && !/url\(/.test(value)) {
      const all = (value.match(COLOR_RE) || []).map(parse);
      if (all.some((c) => isGray(c) && light(c) >= 200 && c[3] >= 1)) ctx.whiteBg = true;
      if (all.some((c) => !isGray(c) && c[3] >= 0.5)) ctx.coloredBg = true;
    }
    if (p === 'color' && colorsOf(value).some((c) => light(c) < 128)) ctx.darkText = true;
  });
  rule.walkDecls((d) => {
    const prop = d.prop.toLowerCase();
    const raw = resolveVars(d.value);
    let value = null;
    if (COLOR_PROPS.has(prop)) value = convertValue(raw, 'text', ctx);
    else if (BG_PROPS.has(prop)) value = /url\(/.test(raw) && !/gradient/.test(raw) ? null : convertValue(raw, 'bg', ctx);
    else if (BORDER_PROPS.test(prop)) value = convertValue(raw, 'border', ctx);
    else if (prop === 'font-family') value = fontFor(rule.selector, d.value);
    else if (prop === 'filter') value = lightFilter(d.value);
    else if (prop === 'border-radius') value = homeRadius(rule.selector, d.value);
    if (value) decls.push([d, value]);
  });
  return decls;
}
const skipRule = (rule) => (rule.parent.type === 'atrule' && /keyframes/i.test(rule.parent.name)) || KEEP.test(rule.selector);

// Mode --inline <page.html>… : convertit sur place les blocs <style> propres à une page.
const inlineIndex = process.argv.indexOf('--inline');
if (inlineIndex !== -1) {
  for (const file of process.argv.slice(inlineIndex + 1)) {
    const html = fs.readFileSync(file, 'utf8');
    const next = html.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/g, (full, open, css, close) => {
      const root = postcss.parse(css);
      root.walkRules((rule) => { if (!skipRule(rule)) for (const [d, value] of convertRule(rule)) d.value = value; });
      return open + root.toString() + close;
    });
    if (next !== html) fs.writeFileSync(file, next);
    console.log(`${file} : styles de la page convertis.`);
  }
  process.exit(0);
}

const out = postcss.root();
for (const file of SOURCES) {
  const root = postcss.parse(fs.readFileSync(file, 'utf8'), { from: file });
  root.walkRules((rule) => {
    if (skipRule(rule)) return;
    const decls = convertRule(rule).map(([d, value]) => postcss.decl({ prop: d.prop, value, important: d.important }));
    if (!decls.length) return;
    const copy = postcss.rule({ selector: rule.selector, nodes: decls });
    // Recréer la chaîne de @media / @supports autour de la règle.
    let node = copy;
    for (let p = rule.parent; p && p.type === 'atrule'; p = p.parent) node = postcss.atRule({ name: p.name, params: p.params, nodes: [node] });
    out.append(node);
  });
}

const header = `/* Généré par scripts/build-light-theme.mjs à partir de style.css et responsive.css : ne pas modifier à la main.\n   Version claire des composants hérités (refonte 2026), chargée avant theme-v2.css sur les pages hors accueil. */\n`;
fs.writeFileSync(OUTPUT, header + out.toString() + '\n');
console.log(`${OUTPUT} : ${out.nodes.length} règles.`);
