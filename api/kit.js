// api/kit.js
// Endpoint des pages « kit partenaire » : ouverture de la page, copie de l'article,
// URL de l'article publié (avec vérification du lien vers MSD Media) et proposition
// de description pour la fiche. Chaque événement est notifié sur Telegram.
// Variables Vercel requises : TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.

import { KITS } from './_kits.js';

const LABELS = {
  open: '👀 a ouvert son kit',
  copy: "📋 a copié l'article",
  publish: '✅ a publié son article',
  fiche: '✏️ propose une description pour sa fiche',
};

async function notify(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  return res.ok;
}

// Vérifie que la page publiée contient un lien vers msd-media.com, et s'il est en nofollow.
async function checkLink(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'MSD-Media-Kit/1.0' } });
    clearTimeout(timer);
    const html = await res.text();
    const links = html.match(/<a\b[^>]*href="https?:\/\/(?:www\.)?msd-media\.com[^"]*"[^>]*>/gi) || [];
    return { linkFound: links.length > 0, nofollow: links.some((a) => /rel="[^"]*(nofollow|sponsored|ugc)/i.test(a)) };
  } catch {
    return { linkFound: false, nofollow: false, unreachable: true };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const { kit, action } = body;
  const entry = KITS[kit];
  if (!entry || !LABELS[action]) return res.status(400).json({ ok: false, error: 'Requête invalide' });

  let details = '';
  let result = {};

  if (action === 'publish') {
    const url = String(body.url || '').trim();
    if (!/^https?:\/\/[^\s]{4,300}$/.test(url)) return res.status(400).json({ ok: false, error: 'Adresse invalide' });
    result = await checkLink(url);
    details = `\n${url}\nLien vers MSD Media : ${result.linkFound ? (result.nofollow ? 'trouvé, mais en nofollow ⚠️' : 'trouvé, dofollow ✅') : 'introuvable ❌'}`;
  }

  if (action === 'fiche') {
    const text = String(body.text || '').trim().slice(0, 1500);
    if (text.length < 10) return res.status(400).json({ ok: false, error: 'Description trop courte' });
    details = `\n« ${text} »`;
  }

  await notify(`Kit ${entry.partner} — ${entry.contact} ${LABELS[action]}${details}\nhttps://msd-media.com/kit/${kit}/`).catch(() => false);
  return res.status(200).json({ ok: true, ...result });
}
