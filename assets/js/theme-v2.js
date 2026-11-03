// Header commun à tout le site (refonte 2026) : méga-menus et sélecteur de langue.
// Le menu plein écran des pages (mobile), l'adresse e-mail, les horloges et l'année du footer
// sont gérés par assets/js/script.js.
(function () {
  var nav = document.getElementById('nav');
  if (!nav) return;

  // Méga-menus : positionnés juste sous la navbar, fermeture différée
  // pour laisser le temps de descendre la souris dans le menu
  document.querySelectorAll('.nav-dropdown-item').forEach(function (item) {
    var menu = item.querySelector('.nav-megamenu');
    var closeTimer;
    var open = function () {
      clearTimeout(closeTimer);
      menu.style.top = nav.getBoundingClientRect().bottom + 'px';
      item.classList.add('is-open');
    };
    var scheduleClose = function () {
      clearTimeout(closeTimer);
      closeTimer = setTimeout(function () { item.classList.remove('is-open'); }, 250);
    };
    item.addEventListener('mouseenter', open);
    item.addEventListener('mouseleave', scheduleClose);
    menu.addEventListener('mouseenter', open);
    menu.addEventListener('mouseleave', scheduleClose);
  });

  // Langue : la version anglaise vit sur /en/
  var langSwitch = document.querySelector('[data-lang-switch]');
  var langBtn = langSwitch.querySelector('button');
  var langMenu = langSwitch.querySelector('ul');
  function setLangMenu(open) {
    langMenu.hidden = !open;
    langBtn.setAttribute('aria-expanded', String(open));
  }
  langBtn.addEventListener('click', function () { setLangMenu(langMenu.hidden); });
  document.addEventListener('click', function (e) { if (!langSwitch.contains(e.target)) setLangMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setLangMenu(false); });
})();
