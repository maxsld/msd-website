// Contrôle des retraits de pages faits par l'agence SEO, avant la mise en ligne.
//
// L'agence a le droit de retirer une page (fusion ou abandon) à trois conditions,
// vérifiées ici par rapport au dernier commit (HEAD) :
//   1. vercel.json ne change que par AJOUT de redirections permanentes
//      (aucune autre clé touchée, aucune redirection existante modifiée ou retirée) ;
//   2. chaque page supprimée (dossier/index.html, fichier .html, ou source d'article
//      blog/sources/*.md) a une redirection 301 depuis son URL, vers une page qui existe ;
//   3. aucune page protégée n'est supprimée.
//
// Usage : node scripts/check-retraits.mjs   (code de sortie 1 si une règle est enfreinte)

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = (cmd) => execSync(`git ${cmd}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1e8, stdio: ['pipe', 'pipe', 'ignore'] });

// Pages qui ne se retirent jamais sans Maxens : conversion, confiance, pages cibles de la stratégie.
const PROTECTED = [
  /^\/$/, /^\/tarifs\/$/, /^\/contact\/$/, /^\/reserver-un-appel\/$/, /^\/a-propos\/$/,
  /^\/realisations\//, /^\/presse\/$/, /^\/affiliation\/$/, /^\/recrutement\/$/, /^\/outils\//,
  /^\/terms\//, /^\/en\//, /^\/blog\/$/, /^\/plan-du-site\/$/, /^\/confirmation-/, /^\/404/,
  /^\/creation-landing-page\/$/, /^\/creation-site-web-annecy\/$/, /^\/agence-web-annecy\/$/,
  /^\/site-web-medecine-esthetique\/$/, /^\/site-web-medecin\/$/, /^\/site-web-dentiste\/$/,
  /^\/site-web-chirurgie-esthetique\/$/, /^\/site-web-dermatologue\/$/, /^\/site-web-centre-laser\/$/,
  /^\/agence-web-munich\/$/, /^\/template-landing-page\/$/, /^\/configurateur\/$/,
];

const errors = [];
const norm = (p) => (p.endsWith('/') ? p : p + '/');
const stripHost = (d) => String(d || '').replace(/^https?:\/\/(www\.)?msd-media\.com/, '') || '/';

// 1. vercel.json : seulement des redirections ajoutées
const before = JSON.parse(git('show HEAD:vercel.json'));
const after = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
  if (key === 'redirects') continue;
  if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) errors.push(`vercel.json : la clé « ${key} » a changé (seules les redirections peuvent être ajoutées).`);
}
const oldR = before.redirects || [], newR = after.redirects || [];
oldR.forEach((r, i) => {
  if (JSON.stringify(r) !== JSON.stringify(newR[i])) errors.push(`vercel.json : la redirection existante n°${i + 1} (${r.source}) a été modifiée ou retirée.`);
});
const added = newR.slice(oldR.length);
for (const r of added) {
  if (r.permanent !== true) errors.push(`vercel.json : la redirection ${r.source} doit être permanente (permanent: true).`);
  if (r.has || /[:*(]/.test(r.source || '')) errors.push(`vercel.json : la redirection ${r.source} doit être une URL simple, sans motif.`);
  if (!/^\/[a-z0-9/_.-]*$/i.test(r.source || '')) errors.push(`vercel.json : source invalide « ${r.source} ».`);
}

// Une URL du site existe-t-elle encore dans le dépôt ?
const exists = (urlPath) => {
  const p = norm(urlPath.split(/[?#]/)[0]);
  if (p === '/') return fs.existsSync(path.join(ROOT, 'index.html'));
  const rel = p.slice(1, -1);
  return fs.existsSync(path.join(ROOT, rel, 'index.html')) || fs.existsSync(path.join(ROOT, rel + '.html'));
};
// Les redirections de normalisation (/slug -> /slug/) ne comptent pas : elles mènent à la page retirée.
const redirectFor = (urlPath) => newR.find((r) => norm(r.source) === norm(urlPath) && norm(stripHost(r.destination)) !== norm(urlPath));

for (const r of added) {
  const dest = stripHost(r.destination);
  if (!dest.startsWith('/')) errors.push(`vercel.json : ${r.source} redirige hors du site (${r.destination}).`);
  else if (norm(dest) === '/') errors.push(`vercel.json : ${r.source} redirige vers l'accueil. Choisir la page la plus proche du sujet.`);
  else if (!exists(dest)) errors.push(`vercel.json : ${r.source} redirige vers ${dest}, qui n'existe pas.`);
}

// 2 et 3. Fichiers supprimés
const deleted = git('diff --name-status HEAD').split('\n').filter((l) => l.startsWith('D\t')).map((l) => l.slice(2).trim());
for (const f of deleted) {
  let url = null;
  let m;
  if ((m = /^blog\/sources\/(.+)\.md$/.exec(f))) {
    const src = git(`show HEAD:${f}`);
    const slug = (/^slug:\s*"?([^"\n]+)"?/m.exec(src) || [])[1] || m[1];
    url = `/blog/articles/${slug.trim()}/`;
  } else if ((m = /^(.+)\/index\.html$/.exec(f))) url = `/${m[1]}/`;
  else if ((m = /^(.+)\.html$/.exec(f))) url = `/${m[1]}`;
  else { errors.push(`Fichier supprimé hors page : ${f}. Seules des pages se retirent.`); continue; }

  if (PROTECTED.some((re) => re.test(norm(url)))) { errors.push(`Page protégée supprimée : ${url}. Elle ne se retire qu'avec l'accord de Maxens.`); continue; }
  const r = redirectFor(url);
  if (!r) errors.push(`Page supprimée sans redirection 301 : ${url}.`);
}

if (errors.length) {
  console.error('❌ Retraits de pages non conformes :\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log(`✅ Retraits conformes : ${deleted.length} fichier(s) supprimé(s), ${added.length} redirection(s) ajoutée(s).`);
