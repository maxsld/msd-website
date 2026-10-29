import fs from 'node:fs';
import path from 'node:path';
import { transform } from 'esbuild';
import postcss from 'postcss';
import crypto from 'node:crypto';

export const STYLE_PROFILES = {
  home: ['home'], blog: ['blog'], case: ['blog', 'case'], pricing: ['pricing'],
  affiliation: ['affiliation'], tools: ['home', 'tools'], landing: ['pricing', 'landing']
};

export function styleProfile(html) {
  const classes = html.match(/<body\b[^>]*class="([^"]*)"/i)?.[1]?.split(/\s+/) || [];
  if (classes.includes('landing-service-page')) return 'landing';
  if (classes.includes('case-study-page')) return 'case';
  if (classes.some(c => ['blog-article-page', 'blog-index-page'].includes(c))) return 'blog';
  // Les pages outils portent aussi home-page : leur profil contient les deux.
  if (classes.includes('tools-page')) return 'tools';
  if (classes.includes('home-page')) return 'home';
  if (classes.includes('pricing-page')) return 'pricing';
  if (classes.includes('affiliation-page')) return 'affiliation';
  return '';
}

function scopedGroup(selector) {
  const match = selector.trim().match(/^\.(home-page|blog-article-page|blog-index-page|case-study-page|pricing-page|affiliation-page|tools-page|landing-service-page|landing-service-section|landing-service-grid|landing-service-steps|blog-service-cta)(?=[\s.:#>+~[]|$)/);
  if (!match) return null;
  const name = match[1];
  if (name.startsWith('blog-')) return 'blog';
  if (name.startsWith('landing-')) return 'landing';
  return name.split('-')[0];
}

function cssForProfile(source, groups) {
  const root = postcss.parse(source);
  root.walkRules(rule => {
    const required = rule.selectors.map(scopedGroup);
    if (required.every(Boolean) && !required.some(group => groups.includes(group))) rule.remove();
  });
  root.walkAtRules(rule => { if (rule.nodes && !rule.nodes.length) rule.remove(); });
  return root.toString();
}

// Garder les sources lisibles ; servir les versions minifiées et versionnées.
// Appelé par version-assets.mjs, y compris dans les workflows et le hook Git.
export async function buildAssets({ check = false } = {}) {
  const generated = new Map();
  const stale = [];
  for (const type of ['css', 'js']) {
    const dir = path.join(process.cwd(), 'assets', type);
    for (const name of fs.readdirSync(dir).sort((a, b) => (a === 'script.js') - (b === 'script.js'))) {
      if (!name.endsWith(`.${type}`) || name.endsWith(`.min.${type}`)) continue;
      const file = path.join(dir, name);
      let source = fs.readFileSync(file, 'utf8');
      if (type === 'js') {
        source = source.replace(/marketing\.min\.js(?:\?v=[a-f0-9]+)?/g, () => {
          const content = generated.get('marketing.min.js') || fs.readFileSync(path.join(dir, 'marketing.min.js'));
          return `marketing.min.js?v=${crypto.createHash('md5').update(content).digest('hex').slice(0, 8)}`;
        });
      }
      const variants = name === 'style.css'
        ? [['', cssForProfile(source, [])], ...Object.entries(STYLE_PROFILES).map(([profile, groups]) => [`.${profile}`, cssForProfile(source, groups)])]
        : [['', source]];
      for (const [suffix, input] of variants) {
        const { code, warnings } = await transform(input, {
          loader: type, minify: true, legalComments: 'none', charset: 'utf8',
          target: type === 'js' ? 'es2020' : ['chrome100', 'safari15', 'firefox100'],
          sourcefile: name
        });
        if (warnings.length) throw new Error(`${name}: ${warnings.map(w => w.text).join('; ')}`);
        const output = file.replace(new RegExp(`\\.${type}$`), `${suffix}.min.${type}`);
        generated.set(path.basename(output), code);
        if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== code) {
          if (check) stale.push(path.relative(process.cwd(), output));
          else fs.writeFileSync(output, code);
        }
      }
    }
  }
  if (stale.length) throw new Error(`Fichiers minifiés obsolètes : ${stale.join(', ')}. Lancer npm run assets:build.`);
}
