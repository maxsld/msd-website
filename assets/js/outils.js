// Outils gratuits (/outils/) : audit express, « ChatGPT peut-il lire mon site ? », générateur de llms.txt.
// Les pages déclarent leur outil avec data-tool="audit" | "ia" | "llms" ; l'analyse passe par /api/outils.
(() => {
  const BOOKING = 'https://cal.com/maxens-soldan-msd-media/30min';
  const track = (event, extra = {}) => { try { (window.dataLayer = window.dataLayer || []).push({ event, ...extra }); } catch {} };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const normalize = (v) => { const t = v.trim(); return t && !/^https?:\/\//i.test(t) ? `https://${t}` : t; };
  const api = async (action, url) => {
    const r = await fetch(`/api/outils?action=${action}&url=${encodeURIComponent(url)}`);
    const data = await r.json().catch(() => ({ error: 'Réponse illisible.' }));
    if (data.error) throw new Error(data.error);
    return data;
  };

  // ---------- Éléments d'affichage communs ----------
  const ring = (label, score) => {
    const s = score == null ? null : Math.round(score);
    const tone = s == null ? 'na' : s >= 90 ? 'good' : s >= 50 ? 'mid' : 'bad';
    return `<div class="tool-ring tool-ring--${tone}" style="--p:${s ?? 0}">
      <div class="tool-ring__circle"><span>${s ?? '–'}</span></div>
      <p class="tool-ring__label">${esc(label)}</p>
    </div>`;
  };
  const ICON = { ok: '✓', warn: '!', bad: '✕', info: 'i' };
  const checkList = (items) => `<ul class="tool-checks">${items.map((c) => `
    <li class="tool-check tool-check--${c.status}">
      <span class="tool-check__icon" aria-hidden="true">${ICON[c.status]}</span>
      <div><p class="tool-check__title">${esc(c.title)}</p>${c.detail ? `<p class="tool-check__detail">${esc(c.detail)}</p>` : ''}</div>
    </li>`).join('')}</ul>`;
  const scoreOf = (items) => {
    const graded = items.filter((c) => c.status !== 'info');
    if (!graded.length) return null;
    return (graded.reduce((n, c) => n + (c.status === 'ok' ? 1 : c.status === 'warn' ? 0.5 : 0), 0) / graded.length) * 100;
  };
  const cta = (text) => `<div class="tool-cta">
    <p>${esc(text)}</p>
    <a class="hero__btn hero__btn--primary" href="${BOOKING}" target="_blank" rel="noopener noreferrer" data-tool-cta>Faire auditer mon site par Maxens</a>
  </div>`;
  const loading = (steps) => `<div class="tool-loading"><span class="tool-spinner" aria-hidden="true"></span><ul>${steps.map((s, i) => `<li data-step="${i}">${esc(s)}</li>`).join('')}</ul></div>`;
  const errorBox = (msg) => `<div class="tool-error"><p>${esc(msg)}</p></div>`;

  // ---------- 1. Audit express ----------
  // Vitesse mesurée côté serveur (clé PageSpeed gardée secrète) ; null si la mesure échoue.
  const pagespeed = (url) => api('speed', url).catch(() => null);

  function auditChecks(a) {
    const seo = [];
    const t = a.title.length;
    seo.push(!t ? { status: 'bad', title: 'Aucune balise title', detail: 'C’est le titre bleu affiché par Google : sans lui, Google en invente un.' }
      : t < 30 || t > 65 ? { status: 'warn', title: `Balise title de ${t} caractères`, detail: `« ${a.title} ». Visez 30 à 65 caractères pour qu’elle s’affiche en entier.` }
      : { status: 'ok', title: `Balise title de ${t} caractères`, detail: a.title });
    const d = a.description.length;
    seo.push(!d ? { status: 'bad', title: 'Aucune méta description', detail: 'Rédigez 1 à 2 phrases (120 à 160 caractères) qui donnent envie de cliquer.' }
      : d < 70 || d > 170 ? { status: 'warn', title: `Méta description de ${d} caractères`, detail: 'Visez 120 à 160 caractères.' }
      : { status: 'ok', title: `Méta description de ${d} caractères`, detail: a.description });
    seo.push(a.h1s.length === 1 ? { status: 'ok', title: 'Un seul titre H1', detail: a.h1s[0] }
      : !a.h1s.length ? { status: 'bad', title: 'Aucun titre H1', detail: 'Chaque page doit avoir un titre principal H1 qui dit de quoi elle parle.' }
      : { status: 'warn', title: `${a.h1s.length} titres H1`, detail: 'Gardez un seul H1 par page et passez les autres en H2.' });
    seo.push(a.canonical ? { status: 'ok', title: 'Balise canonical présente' } : { status: 'warn', title: 'Pas de balise canonical', detail: 'Elle indique à Google l’adresse officielle de la page et évite les doublons.' });
    seo.push(a.imgNoAlt === 0 ? { status: 'ok', title: a.imgCount ? `Les ${a.imgCount} images ont un texte alternatif` : 'Aucune image à décrire' }
      : { status: a.imgNoAlt > 3 ? 'bad' : 'warn', title: `${a.imgNoAlt} image(s) sans texte alternatif`, detail: 'Le texte alternatif aide Google, les IA et les personnes malvoyantes à comprendre vos images.' });
    seo.push(a.ogTitle && a.ogImage ? { status: 'ok', title: 'Aperçu de partage configuré (Open Graph)' } : { status: 'warn', title: 'Aperçu de partage incomplet', detail: 'Sans balises Open Graph, vos liens partagés sur LinkedIn ou WhatsApp s’affichent sans image ni titre propre.' });
    seo.push(a.words >= 300 ? { status: 'ok', title: `${a.words} mots de contenu` } : { status: 'warn', title: `Seulement ${a.words} mots de contenu`, detail: 'Une page trop courte donne peu d’éléments à Google pour la classer.' });

    const tech = [];
    tech.push(a.https ? { status: 'ok', title: 'Site sécurisé (HTTPS)' } : { status: 'bad', title: 'Site non sécurisé (HTTP)', detail: 'Les navigateurs affichent « Non sécurisé » : à corriger en priorité.' });
    tech.push(a.viewport ? { status: 'ok', title: 'Adapté au mobile (balise viewport)' } : { status: 'bad', title: 'Pas de balise viewport', detail: 'Sur mobile, la page risque de s’afficher en tout petit.' });
    tech.push(a.lang ? { status: 'ok', title: `Langue déclarée : ${a.lang}` } : { status: 'warn', title: 'Langue de la page non déclarée' });
    tech.push(/noindex/.test(a.robotsMeta) ? { status: 'bad', title: 'Page bloquée pour Google (noindex)', detail: 'Cette page ne peut pas apparaître dans les résultats de recherche.' } : { status: 'ok', title: 'Page autorisée à apparaître sur Google' });
    tech.push(a.sitemap ? { status: 'ok', title: 'Sitemap XML trouvé' } : { status: 'warn', title: 'Pas de sitemap.xml à la racine', detail: 'Le sitemap aide Google à découvrir toutes vos pages.' });
    tech.push(a.robotsTxt ? { status: 'ok', title: 'Fichier robots.txt présent' } : { status: 'warn', title: 'Pas de fichier robots.txt' });
    tech.push(a.htmlKb <= 150 ? { status: 'ok', title: `Code HTML léger (${a.htmlKb} Ko)` } : { status: 'warn', title: `Code HTML lourd (${a.htmlKb} Ko)`, detail: 'Un HTML très lourd ralentit l’affichage, surtout sur mobile.' });

    const ia = [];
    ia.push(a.schema.length && !a.schema.includes('JSON-LD invalide') ? { status: 'ok', title: 'Données structurées présentes', detail: a.schema.slice(0, 8).join(', ') }
      : a.schema.includes('JSON-LD invalide') ? { status: 'bad', title: 'Données structurées invalides', detail: 'Un bloc JSON-LD contient une erreur : Google et les IA l’ignorent.' }
      : { status: 'warn', title: 'Aucune donnée structurée', detail: 'Elles décrivent votre entreprise (nom, adresse, services) dans un format que Google et les IA lisent directement.' });
    ia.push(a.llmsTxt ? { status: 'ok', title: 'Fichier llms.txt présent' } : { status: 'warn', title: 'Pas de fichier llms.txt', detail: 'Un résumé de votre site destiné aux IA. Créez-le avec notre générateur gratuit.' });
    return { seo, tech, ia };
  }

  function initAudit(root) {
    const form = root.querySelector('form');
    const out = root.querySelector('[data-tool-result]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = normalize(form.url.value);
      if (!url) return;
      form.querySelector('button').disabled = true;
      out.innerHTML = loading(['Lecture de la page', 'Vérification SEO et technique', 'Mesure de la vitesse mobile (jusqu’à 30 s)']);
      track('tool_run', { tool: 'audit' });
      const speed = pagespeed(url);
      try {
        const a = await api('audit', url);
        out.querySelector('[data-step="0"]')?.classList.add('is-done');
        out.querySelector('[data-step="1"]')?.classList.add('is-done');
        const c = auditChecks(a);
        const p = await speed;
        const all = [...c.seo, ...c.tech, ...c.ia];
        const fixes = all.filter((x) => x.status === 'bad').concat(all.filter((x) => x.status === 'warn')).slice(0, 5);
        out.innerHTML = `
          <div class="tool-report">
            <p class="tool-report__url">Résultat pour <strong>${esc(a.finalUrl)}</strong></p>
            <div class="tool-rings">
              ${ring('Vitesse mobile', p ? p.score : null)}
              ${ring('SEO', scoreOf([...c.seo, ...c.tech]))}
              ${ring('Lisibilité IA', scoreOf(c.ia))}
            </div>
            ${p ? `<p class="tool-report__meta">Mesure Google PageSpeed (mobile) : affichage du contenu principal ${esc(p.lcp)}, blocage ${esc(p.tbt)}, stabilité ${esc(p.cls)}.</p>`
              : '<p class="tool-report__meta">La vitesse n’a pas pu être mesurée cette fois (Google PageSpeed indisponible ou site trop lent). Réessayez dans quelques minutes.</p>'}
            ${fixes.length ? `<h3 class="tool-report__h">À corriger en priorité</h3>${checkList(fixes)}` : '<h3 class="tool-report__h">Rien d’urgent à corriger : bravo.</h3>'}
            <details class="tool-details"><summary>Voir le détail des ${all.length} points vérifiés</summary>
              <h4>SEO</h4>${checkList(c.seo)}<h4>Technique</h4>${checkList(c.tech)}<h4>IA</h4>${checkList(c.ia)}
            </details>
            ${cta('Cet audit regarde une seule page. Maxens peut analyser tout votre site et vous dire quoi corriger en premier, gratuitement.')}
          </div>`;
      } catch (err) {
        out.innerHTML = errorBox(err.message);
      } finally {
        form.querySelector('button').disabled = false;
      }
    });
  }

  // ---------- 2. ChatGPT peut-il lire mon site ? ----------
  function initIa(root) {
    const form = root.querySelector('form');
    const out = root.querySelector('[data-tool-result]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = normalize(form.url.value);
      if (!url) return;
      form.querySelector('button').disabled = true;
      out.innerHTML = loading(['Lecture de robots.txt', 'Recherche du fichier llms.txt', 'Lecture de la page sans JavaScript']);
      track('tool_run', { tool: 'ia' });
      try {
        const d = await api('ia', url);
        const blocked = d.bots.filter((b) => !b.allowed);
        const searchBlocked = blocked.filter((b) => /SearchBot|ChatGPT-User|PerplexityBot/.test(b.name));
        const checks = [];
        checks.push(!d.robotsTxt ? { status: 'info', title: 'Pas de fichier robots.txt', detail: 'Rien n’est interdit : tous les robots, IA comprises, peuvent lire le site.' }
          : !blocked.length ? { status: 'ok', title: 'Tous les robots des IA sont autorisés' }
          : { status: searchBlocked.length ? 'bad' : 'warn', title: `${blocked.length} robot(s) d’IA bloqué(s) dans robots.txt`, detail: blocked.map((b) => b.name).join(', ') + (searchBlocked.length ? ' : ces robots alimentent les réponses en direct, votre site ne peut pas y être cité.' : ' : surtout des robots d’entraînement, c’est un choix possible.') });
        checks.push(d.noindex ? { status: 'bad', title: 'Page en noindex', detail: 'Elle est exclue de Google, et donc aussi des réponses qui s’appuient sur la recherche.' } : { status: 'ok', title: 'Page indexable' });
        checks.push(d.words >= 150 ? { status: 'ok', title: `Contenu lisible sans JavaScript (${d.words} mots)`, detail: 'La plupart des robots d’IA ne lancent pas le JavaScript : ils voient bien votre texte.' }
          : { status: 'bad', title: `Seulement ${d.words} mots lisibles sans JavaScript`, detail: 'Votre contenu s’affiche probablement en JavaScript : les robots d’IA voient une page presque vide.' });
        checks.push(d.llmsTxt ? { status: 'ok', title: 'Fichier llms.txt présent' } : { status: 'warn', title: 'Pas de fichier llms.txt', detail: 'Ce résumé de votre site aide les IA à comprendre qui vous êtes. Générez-le gratuitement ci-dessous.' });
        checks.push(d.schema.length ? { status: 'ok', title: 'Données structurées présentes', detail: d.schema.slice(0, 8).join(', ') } : { status: 'warn', title: 'Aucune donnée structurée', detail: 'Les IA comprennent mieux une entreprise décrite en JSON-LD (nom, activité, adresse, avis).' });
        checks.push(d.title && d.description ? { status: 'ok', title: 'Titre et description présents' } : { status: 'warn', title: 'Titre ou description manquant', detail: 'Ce sont souvent les premières lignes qu’une IA retient d’une page.' });
        const score = scoreOf(checks);
        const verdict = score >= 85 ? 'Oui : les IA peuvent lire et comprendre votre site.' : score >= 55 ? 'En partie : les IA lisent votre site, mais il leur manque des repères.' : 'Difficilement : des blocages empêchent les IA de lire votre site.';
        out.innerHTML = `
          <div class="tool-report">
            <p class="tool-report__url">Résultat pour <strong>${esc(d.finalUrl)}</strong></p>
            <div class="tool-verdict">${ring('Lisibilité IA', score)}<p class="tool-verdict__text">${esc(verdict)}</p></div>
            ${checkList(checks)}
            <h3 class="tool-report__h">Robots des IA</h3>
            <div class="tool-table-wrap"><table class="tool-table">
              <thead><tr><th>Robot</th><th>Pour</th><th>Accès</th></tr></thead>
              <tbody>${d.bots.map((b) => `<tr><td><strong>${esc(b.name)}</strong><br><span>${esc(b.owner)}</span></td><td>${esc(b.role)}</td><td><span class="tool-pill tool-pill--${b.allowed ? 'ok' : 'bad'}">${b.allowed ? 'Autorisé' : 'Bloqué'}</span></td></tr>`).join('')}</tbody>
            </table></div>
            <p class="tool-report__meta">Lisible ne veut pas dire cité : les IA choisissent leurs sources selon la pertinence et la confiance. Ce test vérifie qu’aucun obstacle technique ne vous en empêche.</p>
            ${d.llmsTxt ? '' : '<p class="tool-report__next"><a href="/outils/generateur-llms-txt/">Créer mon fichier llms.txt gratuitement →</a></p>'}
            ${cta('Vous voulez être recommandé par ChatGPT, pas seulement lisible ? C’est le cœur du GEO, on en parle en 30 minutes.')}
          </div>`;
      } catch (err) {
        out.innerHTML = errorBox(err.message);
      } finally {
        form.querySelector('button').disabled = false;
      }
    });
  }

  // ---------- 3. Générateur de llms.txt ----------
  function initLlms(root) {
    const f = root.querySelector('[data-llms-form]');
    const rows = root.querySelector('[data-llms-rows]');
    const preview = root.querySelector('[data-llms-preview]');
    const fill = root.querySelector('[data-llms-fill]');

    const addRow = (link = {}) => {
      const row = document.createElement('div');
      row.className = 'tool-llms-row';
      row.innerHTML = `
        <input type="text" placeholder="Nom de la page" aria-label="Nom de la page" data-k="title">
        <input type="url" placeholder="https://…" aria-label="Adresse de la page" data-k="url">
        <select aria-label="Section" data-k="section"><option>Pages principales</option><option>Services</option><option>Ressources</option><option>Optional</option></select>
        <button type="button" class="tool-icon-btn" aria-label="Supprimer la ligne" data-remove>×</button>
        <input type="text" placeholder="Ce qu'on y trouve (facultatif)" aria-label="Description" data-k="desc">`;
      row.querySelector('[data-k="title"]').value = link.title || '';
      row.querySelector('[data-k="url"]').value = link.url || '';
      row.querySelector('[data-k="desc"]').value = link.desc || '';
      if (link.section) row.querySelector('[data-k="section"]').value = link.section;
      rows.appendChild(row);
    };

    const build = () => {
      const name = f.name.value.trim() || 'Nom de votre site';
      const lines = [`# ${name}`, ''];
      if (f.summary.value.trim()) lines.push(`> ${f.summary.value.trim().replace(/\s*\n\s*/g, ' ')}`, '');
      if (f.details.value.trim()) lines.push(f.details.value.trim(), '');
      const sections = {};
      rows.querySelectorAll('.tool-llms-row').forEach((r) => {
        const v = (k) => r.querySelector(`[data-k="${k}"]`).value.trim();
        if (!v('title') || !v('url')) return;
        (sections[v('section')] ||= []).push(`- [${v('title')}](${v('url')})${v('desc') ? `: ${v('desc')}` : ''}`);
      });
      for (const s of ['Pages principales', 'Services', 'Ressources', 'Optional']) {
        if (sections[s]) lines.push(`## ${s}`, '', ...sections[s], '');
      }
      return lines.join('\n').trim() + '\n';
    };
    const refresh = () => { preview.textContent = build(); };

    root.addEventListener('input', refresh);
    root.addEventListener('change', refresh);
    root.addEventListener('click', (e) => {
      if (e.target.closest('[data-remove]')) { e.target.closest('.tool-llms-row').remove(); refresh(); }
      if (e.target.closest('[data-add-row]')) { addRow(); refresh(); }
      if (e.target.closest('[data-copy]')) {
        navigator.clipboard?.writeText(build()).then(() => { e.target.textContent = 'Copié ✓'; setTimeout(() => { e.target.textContent = 'Copier'; }, 1800); });
        track('tool_llms_copy');
      }
      if (e.target.closest('[data-download]')) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([build()], { type: 'text/plain;charset=utf-8' }));
        a.download = 'llms.txt';
        a.click();
        URL.revokeObjectURL(a.href);
        track('tool_llms_download');
      }
    });

    fill.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = normalize(fill.url.value);
      if (!url) return;
      const btn = fill.querySelector('button');
      const status = root.querySelector('[data-llms-status]');
      btn.disabled = true;
      status.textContent = 'Lecture de votre site…';
      track('tool_run', { tool: 'llms' });
      try {
        const d = await api('site', url);
        f.name.value = d.name || '';
        f.summary.value = d.description || '';
        rows.innerHTML = '';
        d.links.slice(0, 8).forEach((l) => addRow({ title: l.title, url: l.url }));
        if (!d.links.length) addRow();
        status.textContent = `${Math.min(d.links.length, 8)} pages ajoutées. Relisez, ajoutez une phrase de description à chacune et gardez seulement les pages utiles.`;
        refresh();
      } catch (err) {
        status.textContent = err.message;
      } finally {
        btn.disabled = false;
      }
    });

    addRow(); addRow();
    refresh();
  }

  // ---------- 4. Aperçu Google ----------
  // Google coupe le titre et la description selon leur largeur en pixels, pas en caractères.
  // Largeurs utilisées (valeurs couramment observées, Google ne publie pas de limite officielle) :
  // titre ≈ 600 px en Arial 20 px ; description ≈ 920 px sur ordinateur, 680 px sur mobile, en Arial 14 px.
  function initSerp(root) {
    const f = root.querySelector('[data-serp-form]');
    const fill = root.querySelector('[data-serp-fill]');
    const status = root.querySelector('[data-serp-status]');
    const out = root.querySelector('[data-serp-preview]');
    const canvas = document.createElement('canvas').getContext('2d');
    let device = 'desktop';
    const width = (text, font) => { canvas.font = font; return canvas.measureText(text).width; };
    const cut = (text, font, max) => {
      if (width(text, font) <= max) return { text, cut: false };
      let lo = 0, hi = text.length;
      while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (width(text.slice(0, mid) + ' …', font) <= max) lo = mid; else hi = mid - 1; }
      return { text: text.slice(0, lo).replace(/\s+\S*$/, '') + ' …', cut: true };
    };
    const meter = (el, chars, px, max, okRange) => {
      const ratio = Math.min(px / max, 1.2);
      const tone = px > max ? 'bad' : chars < okRange[0] ? 'warn' : 'ok';
      el.querySelector('[data-count]').textContent = `${chars} caractères · ${Math.round(px)} / ${max} px`;
      const bar = el.querySelector('[data-bar]');
      bar.style.width = `${Math.min(ratio, 1) * 100}%`;
      el.dataset.tone = tone;
      el.querySelector('[data-advice]').textContent = tone === 'bad' ? 'Trop long : Google va couper la fin.' : tone === 'warn' ? 'Un peu court : vous pouvez en dire plus.' : 'Bonne longueur.';
    };
    const render = () => {
      const title = f.title.value.trim() || 'Titre de votre page';
      const desc = f.description.value.trim() || 'La description qui apparaît sous le titre dans Google. Elle donne envie de cliquer en résumant ce que la page apporte.';
      let url;
      try { url = new URL(/^https?:\/\//.test(f.url.value.trim()) ? f.url.value.trim() : `https://${f.url.value.trim() || 'votresite.fr'}`); } catch { url = new URL('https://votresite.fr'); }
      const site = url.hostname.replace(/^www\./, '');
      const crumbs = [url.hostname, ...url.pathname.split('/').filter(Boolean)].join(' › ');
      const descMax = device === 'mobile' ? 680 : 920;
      const t = cut(title, '20px Arial', 600);
      const d = cut(desc, '14px Arial', descMax);
      out.dataset.device = device;
      out.innerHTML = `
        <div class="serp-result">
          <div class="serp-result__site"><span class="serp-result__favicon">${esc(site.charAt(0).toUpperCase())}</span><span><span class="serp-result__name">${esc(site)}</span><span class="serp-result__url">${esc(crumbs)}</span></span></div>
          <p class="serp-result__title">${esc(t.text)}</p>
          <p class="serp-result__desc">${esc(d.text)}</p>
        </div>`;
      meter(root.querySelector('[data-meter="title"]'), f.title.value.trim().length, width(f.title.value.trim(), '20px Arial'), 600, [30, 65]);
      meter(root.querySelector('[data-meter="description"]'), f.description.value.trim().length, width(f.description.value.trim(), '14px Arial'), descMax, [110, 160]);
    };
    f.addEventListener('input', render);
    root.querySelectorAll('[data-device]').forEach((b) => b.addEventListener('click', () => {
      device = b.dataset.device;
      root.querySelectorAll('[data-device]').forEach((x) => x.classList.toggle('is-active', x === b));
      render();
    }));
    fill.addEventListener('submit', async (e) => {
      e.preventDefault();
      const url = normalize(fill.url.value);
      if (!url) return;
      const btn = fill.querySelector('button');
      btn.disabled = true;
      status.textContent = 'Lecture de votre page…';
      track('tool_run', { tool: 'serp' });
      try {
        const d = await api('site', url);
        f.url.value = d.finalUrl;
        f.title.value = d.title || '';
        f.description.value = d.description || '';
        status.textContent = d.description ? 'Voici votre page telle qu’elle peut apparaître dans Google. Modifiez les textes pour tester d’autres versions.' : 'Votre page n’a pas de méta description : Google en choisit une lui-même dans le texte. Écrivez-en une ci-dessous.';
        render();
      } catch (err) {
        status.textContent = err.message;
      } finally {
        btn.disabled = false;
      }
    });
    render();
  }

  document.querySelectorAll('[data-tool]').forEach((root) => {
    ({ audit: initAudit, ia: initIa, llms: initLlms, serp: initSerp })[root.dataset.tool]?.(root);
    root.addEventListener('click', (e) => { if (e.target.closest('[data-tool-cta]')) track('tool_cta', { tool: root.dataset.tool }); });
  });
})();
