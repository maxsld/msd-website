// Assistant MSD Media : barre de question (élément [data-msd-ask]), bouton flottant et fenêtre de discussion.
// Les réponses viennent de /api/chat (Groq), à partir de la base de connaissances du site.
(() => {
  const BOOKING = 'https://cal.com/maxens-soldan-msd-media/30min';
  const EN = (document.documentElement.lang || '').toLowerCase().startsWith('en');
  const T = EN ? {
    suggestions: ['What do you do exactly?', 'How much does a website cost?', 'Do you work with doctors?', 'How long does it take?', 'How do I show up on ChatGPT?'],
    book: 'Book a call', close: 'Close the assistant', hello: 'Hello 👋',
    intro: "I'm the MSD Media assistant. A question about a website, a landing page, pricing or timing? Ask away.",
    label: 'Your question', placeholder: 'Type your question…', send: 'Send',
    legal: 'AI-generated answers, check with us before any decision.', legalShort: 'AI-generated answers.',
    ask: 'Ask MSD Media a question…', fab: 'Any question?',
    error: `I can't answer right now. [Book a call](${BOOKING}) with Maxens, he'll answer you directly.`,
  } : {
    suggestions: ['Vous faites quoi exactement ?', 'Combien coûte un site ?', 'Vous travaillez avec les médecins ?', 'En combien de temps ?', 'Comment apparaître sur ChatGPT ?'],
    book: 'Réserver un appel', close: "Fermer l'assistant", hello: 'Bonjour 👋',
    intro: "Je suis l'assistant de MSD Media. Une question sur un site, une landing page, les tarifs ou les délais ? Je vous réponds.",
    label: 'Votre question', placeholder: 'Écrivez votre question…', send: 'Envoyer',
    legal: 'Réponses générées par IA, à vérifier avec nous avant toute décision.', legalShort: 'Réponses générées par IA.',
    ask: 'Posez votre question à MSD Media…', fab: 'Une question ?',
    error: `Je ne peux pas répondre pour le moment. [Réservez un appel](${BOOKING}) avec Maxens, il vous répondra directement.`,
  };
  const SEND_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';
  // La conversation vit le temps de la page : un rechargement ou une autre page repart de zéro.
  const history = [];
  const track = (event, extra = {}) => { try { (window.dataLayer = window.dataLayer || []).push({ event, ...extra }); } catch {} };

  const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Mise en forme minimale et sûre : gras, liens https, listes, retours à la ligne.
  const render = (text) => {
    let h = escapeHtml(text);
    h = h.replace(/&lt;(https:\/\/[^\s&]+)&gt;/g, ' $1');
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, (m, label, url) => {
      const external = !url.startsWith('https://msd-media.com');
      return `<a href="${url}"${external ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
    });
    h = h.replace(/(^|\s)(https:\/\/[^\s<]+[^\s<.,;:!?)])/g, (m, sp, url) => `${sp}<a href="${url}" target="_blank" rel="noopener">${url.replace(/^https:\/\//, '')}</a>`);
    const lines = h.split('\n');
    let out = '', inList = false;
    for (const line of lines) {
      const li = line.match(/^\s*(?:[-•]|\d+[.)])\s+(.*)/);
      if (li) { if (!inList) { out += '<ul>'; inList = true; } out += `<li>${li[1]}</li>`; continue; }
      if (inList) { out += '</ul>'; inList = false; }
      if (line.trim()) out += `<p>${line}</p>`;
    }
    return out + (inList ? '</ul>' : '');
  };

  const chips = (cls) => T.suggestions.map((q) => `<button type="button" class="${cls}" data-msd-suggest="${escapeHtml(q)}">${escapeHtml(q)}</button>`).join('');

  // ---------- Fenêtre ----------
  const modal = document.createElement('div');
  modal.className = 'msd-chat';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="msd-chat__backdrop" data-msd-close></div>
    <div class="msd-chat__window" role="dialog" aria-modal="true" aria-labelledby="msd-chat-title">
      <header class="msd-chat__head">
        <p class="msd-chat__brand" id="msd-chat-title"><img src="/assets/img/logo-black.webp" alt="MSD Media" width="372" height="151"></p>
        <div class="msd-chat__head-actions">
          <a class="contact-button msd-chat__book" href="${BOOKING}" target="_blank" rel="noopener noreferrer">${T.book}</a>
          <button type="button" class="msd-chat__close" data-msd-close aria-label="${T.close}">&times;</button>
        </div>
      </header>
      <div class="msd-chat__body" data-msd-body>
        <div class="msd-chat__welcome" data-msd-welcome>
          <p class="msd-chat__hello">${T.hello}</p>
          <p class="msd-chat__intro">${T.intro}</p>
          <div class="msd-chat__chips">${chips('msd-chip')}</div>
        </div>
        <div class="msd-chat__messages" data-msd-messages aria-live="polite"></div>
      </div>
      <form class="msd-chat__form" data-msd-form>
        <label class="msd-visually-hidden" for="msd-chat-input">${T.label}</label>
        <input id="msd-chat-input" type="text" maxlength="600" autocomplete="off" placeholder="${T.placeholder}" data-msd-input>
        <button type="submit" class="msd-chat__send" aria-label="${T.send}">${SEND_ICON}</button>
      </form>
      <p class="msd-chat__legal">${T.legal}</p>
    </div>`;
  document.body.appendChild(modal);

  const body = modal.querySelector('[data-msd-body]');
  const list = modal.querySelector('[data-msd-messages]');
  const welcome = modal.querySelector('[data-msd-welcome]');
  const input = modal.querySelector('[data-msd-input]');
  const form = modal.querySelector('[data-msd-form]');
  let busy = false;
  let lastFocus = null;

  const addBubble = (role, content, pending = false) => {
    const el = document.createElement('div');
    el.className = `msd-msg msd-msg--${role}${pending ? ' is-pending' : ''}`;
    el.innerHTML = role === 'assistant' ? (pending ? '<span class="msd-typing"><i></i><i></i><i></i></span>' : render(content)) : `<p>${escapeHtml(content)}</p>`;
    list.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  };
  const refreshWelcome = () => { welcome.hidden = history.length > 0; };
  refreshWelcome();

  const open = (question) => {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.documentElement.classList.add('msd-chat-open');
    track('chat_open');
    if (question) send(question); else setTimeout(() => input.focus(), 50);
  };
  const close = () => {
    modal.hidden = true;
    document.documentElement.classList.remove('msd-chat-open');
    if (lastFocus) lastFocus.focus();
  };

  async function send(text) {
    const question = String(text || '').trim();
    if (!question || busy) return;
    busy = true;
    history.push({ role: 'user', content: question });
    refreshWelcome();
    addBubble('user', question);
    input.value = '';
    const pending = addBubble('assistant', '', true);
    track('chat_message');
    let reply = '';
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history }) });
      reply = (await r.json()).reply || '';
    } catch {}
    if (!reply) reply = T.error;
    pending.classList.remove('is-pending');
    pending.innerHTML = render(reply);
    history.push({ role: 'assistant', content: reply });
    body.scrollTop = body.scrollHeight;
    busy = false;
    input.focus();
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value); });
  modal.addEventListener('click', (e) => {
    if (e.target.closest('[data-msd-close]')) close();
    const s = e.target.closest('[data-msd-suggest]');
    if (s) send(s.dataset.msdSuggest);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });

  // ---------- Barre de question fixe, en bas au centre (toutes les pages) ----------
  // Apparaît 5 s après le chargement, se cache quand on descend, revient quand on remonte.
  const bar = document.createElement('div');
  bar.className = 'msd-ask';
  bar.innerHTML = `
    <div class="msd-ask__chips">${chips('msd-chip msd-chip--bar')}</div>
    <form class="msd-ask__form">
      <span class="msd-ask__spark" aria-hidden="true">✦</span>
      <label class="msd-visually-hidden" for="msd-ask-input">${T.ask}</label>
      <input id="msd-ask-input" type="text" maxlength="600" autocomplete="off" placeholder="${T.ask}">
      <button type="submit" class="msd-chat__send" aria-label="${T.send}">${SEND_ICON}</button>
    </form>`;
  document.body.appendChild(bar);
  bar.addEventListener('click', (e) => { const c = e.target.closest('[data-msd-suggest]'); if (c) open(c.dataset.msdSuggest); });
  const field = bar.querySelector('input');
  // Un clic dans le champ ouvre directement la fenêtre de discussion.
  field.addEventListener('focus', () => { field.blur(); open(); });
  bar.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = field.value; field.value = '';
    field.blur();
    open(q.trim() || undefined);
  });

  let ready = false;
  let lastY = window.scrollY;
  const show = (on) => bar.classList.toggle('is-visible', on);
  setTimeout(() => { ready = true; lastY = window.scrollY; show(true); }, 5000);
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (!ready || Math.abs(y - lastY) < 6) return;
    if (document.activeElement !== field) show(y < lastY || y < 80);
    lastY = y;
  }, { passive: true });
})();
