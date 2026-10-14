// Pages « kit partenaire » : copier l'article, suivre l'ouverture, recevoir l'URL publiée.
(() => {
  const kit = document.body.dataset.kit;
  const preview = new URLSearchParams(location.search).has('preview');
  const send = (payload) =>
    fetch('/api/kit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kit, ...payload }),
    }).then((r) => r.json().catch(() => ({ ok: r.ok })));

  const flash = (button, label = 'Copié') => {
    const original = button.textContent;
    button.textContent = label;
    button.classList.add('is-copied');
    setTimeout(() => {
      button.textContent = original;
      button.classList.remove('is-copied');
    }, 1800);
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement('textarea');
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
  };

  // Champs simples (title, meta, slug, textes alternatifs)
  document.querySelectorAll('[data-copy-text]').forEach((button) =>
    button.addEventListener('click', async () => {
      await copyText(button.dataset.copyText);
      flash(button);
    })
  );

  // Article en texte riche : titres, listes et liens conservés au collage dans un CMS
  const article = document.getElementById('kit-article');
  document.querySelectorAll('[data-copy-article]').forEach((button) =>
    button.addEventListener('click', async () => {
      const htmlContent = article.innerHTML;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([htmlContent], { type: 'text/html' }),
            'text/plain': new Blob([article.innerText], { type: 'text/plain' }),
          }),
        ]);
      } catch {
        const range = document.createRange();
        range.selectNodeContents(article);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('copy');
        selection.removeAllRanges();
      }
      flash(button, 'Article copié');
      if (!preview) send({ action: 'copy' }).catch(() => {});
    })
  );

  document.querySelectorAll('[data-copy-html]').forEach((button) =>
    button.addEventListener('click', async () => {
      await copyText(document.getElementById('kit-html').value);
      flash(button, 'HTML copié');
    })
  );

  // Ouverture de la page : une seule notification par navigateur
  try {
    const key = `kit-opened-${kit}`;
    if (!preview && !localStorage.getItem(key)) {
      localStorage.setItem(key, '1');
      send({ action: 'open' }).catch(() => {});
    }
    if (localStorage.getItem(`kit-published-${kit}`)) {
      document.querySelector('[data-step-published]')?.classList.add('is-done');
    }
  } catch {}

  // Formulaires : URL publiée, description de la fiche
  document.querySelectorAll('[data-kit-form]').forEach((form) =>
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const action = form.dataset.kitForm;
      const status = document.querySelector(`[data-status="${action}"]`);
      const button = form.querySelector('button');
      const data = Object.fromEntries(new FormData(form));
      button.disabled = true;
      status.className = 'kit-form__status';
      status.textContent = 'Envoi en cours…';
      try {
        const res = await send({ action, ...data });
        if (!res.ok) throw new Error(res.error || 'Envoi impossible');
        if (action === 'publish') {
          status.textContent = res.linkFound
            ? 'Merci ! Le lien vers MSD Media est bien en place. Nous vous confirmons la suite par e-mail.'
            : 'Merci, adresse reçue. Nous ne trouvons pas encore le lien vers MSD Media sur la page : nous vérifions et revenons vers vous.';
          try { localStorage.setItem(`kit-published-${kit}`, '1'); } catch {}
          document.querySelector('[data-step-published]')?.classList.add('is-done');
        } else {
          status.textContent = 'Merci, votre description est bien reçue.';
          form.reset();
        }
        status.classList.add('is-ok');
      } catch (error) {
        status.textContent = "L'envoi n'a pas fonctionné. Vous pouvez aussi répondre directement à notre e-mail.";
        status.classList.add('is-error');
      } finally {
        button.disabled = false;
      }
    })
  );
})();
