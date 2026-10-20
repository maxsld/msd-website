// api/chat.js
// Assistant du site : reçoit la conversation, répond via l'API Groq (offre gratuite, compatible OpenAI)
// en s'appuyant uniquement sur la base de connaissances de api/_chat-knowledge.js.
// Variables Vercel : GROQ_API_KEY (obligatoire), GROQ_MODEL (facultatif).

import { SYSTEM_PROMPT } from './_chat-knowledge.js';

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = 'llama-3.1-8b-instant';
const FALLBACK =
  "Je ne peux pas répondre pour le moment. Le plus simple : [réservez un appel de 30 minutes](https://cal.com/maxens-soldan-msd-media/30min) avec Maxens, ou écrivez à maxens.soldan@msd-media.com.";

// Limite simple par adresse IP (par instance serverless) : 20 messages par tranche de 10 minutes.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 20;
}

async function ask(model, history) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    return await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 350,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
      }),
    });
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'inconnue';
  if (limited(ip)) {
    return res.status(429).json({ reply: "Vous avez posé beaucoup de questions d'un coup. Pour aller plus loin, [réservez un appel](https://cal.com/maxens-soldan-msd-media/30min) avec Maxens." });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const history = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }));
  if (!history.length || history[history.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Message manquant' });
  }
  if (!process.env.GROQ_API_KEY) return res.status(200).json({ reply: FALLBACK });

  try {
    // Quota du modèle principal atteint (429) : on retente avec le modèle léger, aux quotas plus larges.
    let r = await ask(MODEL, history);
    if (r.status === 429 && MODEL !== FALLBACK_MODEL) r = await ask(FALLBACK_MODEL, history);
    if (!r.ok) return res.status(200).json({ reply: FALLBACK });
    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    return res.status(200).json({ reply: reply || FALLBACK });
  } catch {
    return res.status(200).json({ reply: FALLBACK });
  }
}
