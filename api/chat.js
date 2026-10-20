// api/chat.js
// Assistant du site : reçoit la conversation, répond via l'API Groq (offre gratuite, compatible OpenAI)
// en s'appuyant uniquement sur la base de connaissances de api/_chat-knowledge.js.
// Variables Vercel : GROQ_API_KEY (obligatoire), GROQ_MODEL (facultatif).

import { SYSTEM_PROMPT, BOOKING_HINT } from './_chat-knowledge.js';

// Modèles essayés dans l'ordre. Si Groq n'en reconnaît aucun (modèle retiré, accès restreint),
// on lit la liste des modèles disponibles pour cette clé et on prend le premier modèle de chat.
const PREFERRED = [process.env.GROQ_MODEL, 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'].filter(Boolean);
const NOT_CHAT = /whisper|guard|tts|playai|orpheus|distil|prompt|embed|compound|allam/i;
let available = null;
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

async function ask(model, history, hint) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    return await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        // gpt-oss raisonne avant de répondre : on garde ce raisonnement court, il compte dans les tokens.
        ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low' } : {}),
        max_completion_tokens: 900,
        messages: [{ role: 'system', content: `${SYSTEM_PROMPT}\n\n${hint}` }, ...history],
      }),
    });
  } finally {
    clearTimeout(timer);
  }
}

async function availableModels() {
  if (available) return available;
  const r = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } });
  if (!r.ok) {
    console.error(`[chat] liste des modèles : HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
    return [];
  }
  const ids = ((await r.json())?.data || []).filter((m) => m.active !== false).map((m) => m.id);
  console.error('[chat] modèles disponibles :', ids.join(', '));
  const chat = ids.filter((id) => !NOT_CHAT.test(id));
  available = [...PREFERRED.filter((id) => chat.includes(id)), ...chat.filter((id) => !PREFERRED.includes(id))];
  return available;
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
  if (!process.env.GROQ_API_KEY) {
    console.error('[chat] GROQ_API_KEY absente de l\'environnement');
    return res.status(200).json({ reply: FALLBACK });
  }

  try {
    // Proposer l'appel seulement quand c'est utile : pas s'il a déjà été proposé dans les 3 dernières réponses.
    const recentBooking = history.filter((m) => m.role === 'assistant').slice(-3).some((m) => m.content.includes('cal.com'));
    const hint = recentBooking ? BOOKING_HINT.recent : BOOKING_HINT.allowed;

    // On essaie les modèles un par un : quota atteint (429) ou modèle introuvable (404) → modèle suivant.
    let models = available || PREFERRED;
    let r;
    for (let i = 0; i < models.length && i < 4; i++) {
      r = await ask(models[i], history, hint);
      if (r.ok || r.status === 401) break;
      console.error(`[chat] ${models[i]} : HTTP ${r.status} ${(await r.text()).slice(0, 200)}`);
      if (r.status === 404 && !available) { models = await availableModels(); i = -1; if (!models.length) break; }
    }
    if (!r.ok) {
      if (!r.bodyUsed) console.error(`[chat] Groq : HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
      return res.status(200).json({ reply: FALLBACK });
    }
    const data = await r.json();
    // Certains modèles (Qwen, DeepSeek) écrivent leur raisonnement entre balises <think> : on le retire.
    const reply = data?.choices?.[0]?.message?.content
      ?.replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/[\u2010\u2011\u2012]/g, '-') // tirets insécables de gpt-oss
      .replace(/\s+[\u2013\u2014]\s+/g, ', ') // tirets cadratins entre deux mots
      .replace(/\u202f/g, ' ')
      .trim();
    return res.status(200).json({ reply: reply || FALLBACK });
  } catch (err) {
    console.error('[chat] appel Groq impossible :', err?.name, err?.message);
    return res.status(200).json({ reply: FALLBACK });
  }
}
