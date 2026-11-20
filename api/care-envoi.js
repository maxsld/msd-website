// api/care-envoi.js
// Approbation de l'envoi d'un rapport MSD Care au client (2026-11-21).
// Le bouton « Envoyer au client » du message Telegram ouvre cette page :
//   GET  : vérifie la signature et affiche une confirmation (un lien ouvert par erreur n'envoie rien) ;
//   POST : vérifie à nouveau, puis déclenche le workflow « Envoi du rapport » du dépôt privé maxsld/msd-care
//          (repository_dispatch), qui envoie le PDF au client par email et confirme sur Telegram.
// Variables Vercel : CARE_APPROVAL_SECRET (le même que le secret GitHub de msd-care),
//                    CARE_GH_TOKEN (jeton GitHub avec accès en écriture « Contents » à maxsld/msd-care).
import crypto from 'crypto';

const REPO = 'maxsld/msd-care';

function signature(slug, mois) {
  return crypto.createHmac('sha256', process.env.CARE_APPROVAL_SECRET).update(`${slug}:${mois}`).digest('hex').slice(0, 40);
}

function valide(slug, mois, t) {
  if (!process.env.CARE_APPROVAL_SECRET) return false;
  if (!/^[a-z0-9-]{1,80}$/.test(slug || '') || !/^\d{4}-\d{2}$/.test(mois || '') || !/^[a-f0-9]{40}$/.test(t || '')) return false;
  return crypto.timingSafeEqual(Buffer.from(signature(slug, mois)), Buffer.from(t));
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function page(titre, texte, action = '') {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(titre)} · MSD Care</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f4f5f7;color:#2b2f38;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:16px}
.c{background:#fff;border:1px solid #e3e5ea;max-width:440px;width:100%;padding:32px}.l{font-weight:700;font-size:24px;letter-spacing:-1px;color:#040815;margin-bottom:24px}
h1{font-size:20px;color:#040815;margin-bottom:10px}p{line-height:1.55;color:#5b606c}button{margin-top:24px;width:100%;padding:14px;background:#040815;color:#fff;border:0;font-size:16px;font-weight:600;cursor:pointer}</style></head>
<body><div class="c"><div class="l">msd.</div><h1>${esc(titre)}</h1><p>${texte}</p>${action}</div></body></html>`;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const { c: slug, m: mois, t } = req.query || {};
  if (!valide(slug, mois, t)) return res.status(403).send(page('Lien invalide', 'Ce lien d’envoi n’est pas valide.'));

  const nomMois = new Date(`${mois}-15T12:00:00Z`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  if (req.method === 'GET') {
    const action = `<form method="post" action="/api/care-envoi?c=${encodeURIComponent(slug)}&m=${mois}&t=${t}"><button type="submit">Envoyer le rapport au client</button></form>`;
    return res.status(200).send(page('Envoyer le rapport ?', `Rapport de <b>${esc(nomMois)}</b> du client <b>${esc(slug)}</b>. Le mail part de ton adresse, avec le PDF en pièce jointe, au contact enregistré dans le registre MSD Care.`, action));
  }
  if (req.method !== 'POST') return res.status(405).send(page('Méthode non autorisée', ''));

  const token = process.env.CARE_GH_TOKEN || process.env.GH_PAT;
  const r = await fetch(`https://api.github.com/repos/${REPO}/dispatches`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'msd-media-care' },
    body: JSON.stringify({ event_type: 'envoyer-rapport', client_payload: { slug, mois } }),
  }).catch(() => null);

  if (!r || r.status !== 204) {
    return res.status(502).send(page('Envoi non lancé', `GitHub a refusé la demande (${r ? r.status : 'réseau'}). Vérifie le jeton CARE_GH_TOKEN dans Vercel, ou lance le workflow « Envoi du rapport » à la main dans le dépôt msd-care.`));
  }
  return res.status(200).send(page('Envoi lancé', `Le rapport de ${esc(nomMois)} part dans une minute environ. Tu reçois la confirmation sur Telegram.`));
}
