(function () {
  var nav = document.getElementById('nav');

  // Menu plein écran des pages (flèche à côté du logo, mobile)
  var pageMenu = document.querySelector('[data-nav-menu]');
  var pageToggle = pageMenu.querySelector('[data-nav-menu-toggle]');
  var setPageMenu = function (open) {
    pageMenu.classList.toggle('is-open', open);
    pageToggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  pageToggle.addEventListener('click', function () { setPageMenu(!pageMenu.classList.contains('is-open')); });
  pageMenu.querySelector('[data-nav-menu-close]').addEventListener('click', function () { setPageMenu(false); });
  pageMenu.querySelectorAll('.nav-menu-dropdown a').forEach(function (a) {
    a.addEventListener('click', function () { setPageMenu(false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setPageMenu(false); });

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
  document.querySelector('[data-lang-select]').addEventListener('change', function (e) {
    if (e.target.value === 'en') window.location.href = 'https://msd-media.com/en/';
  });

  // Sous-titre du hero : le nom de l'IA change toutes les 2 s, avec son icône
  var aiWord = document.querySelector('[data-ai-word]');
  if (aiWord && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var ais = [
      { name: 'ChatGPT', icon: 'i-chatgpt', color: '#000' },
      { name: 'Claude', icon: 'i-claude', color: '#d97757' },
      { name: 'Perplexity', icon: 'i-perplexity', color: '#1fb8cd' },
      { name: 'Gemini', icon: 'i-gemini', color: '#9168c0' }
    ];
    var aiInner = aiWord.querySelector('.ai-word__inner');
    var aiIcon = aiInner.querySelector('.ai-word__icon');
    var aiUse = aiIcon.querySelector('use');
    var aiLabel = aiInner.querySelector('.ai-word__label');
    var aiIndex = 0;
    aiWord.style.width = aiInner.offsetWidth + 'px';
    setInterval(function () {
      aiInner.classList.add('is-out');
      setTimeout(function () {
        aiIndex = (aiIndex + 1) % ais.length;
        aiLabel.textContent = ais[aiIndex].name;
        aiUse.setAttribute('href', '#' + ais[aiIndex].icon);
        aiIcon.style.color = ais[aiIndex].color;
        // la largeur suit le nouveau nom en douceur
        aiWord.style.width = aiInner.offsetWidth + 'px';
        aiInner.classList.remove('is-out');
        aiInner.classList.add('is-in');
        aiInner.offsetWidth; // force le reflow pour rejouer la transition
        aiInner.classList.remove('is-in');
      }, 280);
    }, 2000);
  }

  // Footer (repris de la v1) : adresse e-mail reconstituée au chargement (anti-spam),
  // heure locale des bureaux et année du copyright
  document.querySelectorAll('.js-email-link').forEach(function (el) {
    var addr = el.getAttribute('data-u') + '@' + el.getAttribute('data-d');
    el.setAttribute('href', 'mailto:' + addr);
    if (el.textContent.trim() && !el.querySelector('i')) el.textContent = addr;
  });
  var clocks = document.querySelectorAll('[data-office-tz]');
  var tickClocks = function () {
    clocks.forEach(function (el) {
      try {
        el.textContent = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: el.getAttribute('data-office-tz') }).format(new Date());
      } catch (e) {}
    });
  };
  tickClocks();
  setInterval(tickClocks, 30000);
  document.querySelectorAll('.copyright-year').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Vidéo du comparatif : chargée et lancée seulement quand elle arrive à l'écran
  var lazyVideo = document.querySelector('[data-lazy-video]');
  if (lazyVideo) {
    var startVideo = function () {
      var source = lazyVideo.querySelector('source[data-src]');
      if (source) {
        source.src = source.dataset.src;
        source.removeAttribute('data-src');
        lazyVideo.load();
      }
      lazyVideo.play().catch(function () {});
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { startVideo(); observer.disconnect(); }
        });
      }, { rootMargin: '200px' }).observe(lazyVideo);
    } else {
      startVideo();
    }
    var soundBtn = document.querySelector('[data-video-sound]');
    soundBtn.addEventListener('click', function () {
      lazyVideo.muted = !lazyVideo.muted;
      soundBtn.setAttribute('aria-label', lazyVideo.muted ? 'Activer le son' : 'Couper le son');
      soundBtn.querySelector('i').className = lazyVideo.muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
    });
  }

  // Blocs « tout inclus » : chaque bloc apparaît à l'arrivée à l'écran, puis l'animation
  // de son visuel se joue une seule fois (le visuel attend la fin de l'apparition du bloc)
  var feats = document.querySelectorAll('.feat');
  var showFeat = function (feat) {
    feat.classList.add('is-visible');
    var viz = feat.querySelector('.viz');
    if (viz) setTimeout(function () { viz.classList.add('is-visible'); }, 450);
  };
  if ('IntersectionObserver' in window) {
    var featObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        showFeat(entry.target);
        featObserver.unobserve(entry.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
    feats.forEach(function (f) { featObserver.observe(f); });
  } else {
    feats.forEach(showFeat);
  }

  // Frise 21 jours : la ligne J1 → J21 se trace une fois, à l'arrivée de la frise à l'écran
  var timeline = document.querySelector('.timeline');
  if (timeline && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries, observer) {
      if (!entries[0].isIntersecting) return;
      timeline.classList.add('is-drawn');
      observer.disconnect();
    }, { threshold: 0.3 }).observe(timeline);
  } else if (timeline) {
    timeline.classList.add('is-drawn');
  }

  // Aperçu de l'audit (section outils) : se joue une fois à l'arrivée à l'écran
  var audit = document.querySelector('.audit');
  var playAudit = function () {
    audit.classList.add('is-visible');
    var typed = audit.querySelector('[data-type]');
    var text = typed.dataset.type;
    var n = 0;
    var typer = setInterval(function () {
      typed.textContent = text.slice(0, ++n);
      if (n >= text.length) clearInterval(typer);
    }, 70);
  };
  if (audit && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries, observer) {
      if (!entries[0].isIntersecting) return;
      playAudit();
      observer.disconnect();
    }, { threshold: 0.4 }).observe(audit);
  } else if (audit) {
    playAudit();
  }

  // Filtres du portfolio : le trait glisse sous l'onglet choisi, les projets affichés sortent en fondu
  // puis ceux de la nouvelle catégorie entrent en cascade
  var tabs = document.querySelectorAll('.tab');
  var items = Array.prototype.slice.call(document.querySelectorAll('.work__grid .work__item'));
  var indicator = document.querySelector('.tabs__indicator');
  var moveIndicator = function (tab) {
    indicator.style.width = tab.offsetWidth + 'px';
    indicator.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
  };
  var activeTab = document.querySelector('.tab.is-active');
  moveIndicator(activeTab);
  window.addEventListener('resize', function () { moveIndicator(activeTab); });

  var filterTimer;
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      if (tab === activeTab) return;
      activeTab = tab;
      tabs.forEach(function (t) { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      moveIndicator(tab);

      var filter = tab.dataset.filter;
      // « À la une » = les 4 projets marqués data-featured, sinon filtre par catégorie
      var matches = function (item) { return filter === 'featured' ? item.hasAttribute('data-featured') : item.dataset.cat.indexOf(filter) !== -1; };
      clearTimeout(filterTimer);
      items.forEach(function (item) { item.style.transitionDelay = ''; if (!item.hidden) item.classList.add('is-out'); });
      filterTimer = setTimeout(function () {
        var shown = items.filter(matches);
        items.forEach(function (item) { item.hidden = !matches(item); item.classList.add('is-out'); });
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            shown.forEach(function (item, i) {
              item.style.transitionDelay = (i * 70) + 'ms';
              item.classList.remove('is-out');
            });
          });
        });
      }, 300);
    });
  });

  // Vidéos d'avis (comme la v1) : l'iframe n'est chargée qu'au clic sur la couverture, en lecture auto
  document.querySelectorAll('[data-review-video]').forEach(function (card) {
    var cover = card.querySelector('[data-review-video-cover]');
    var iframe = card.querySelector('[data-review-video-iframe]');
    cover.addEventListener('click', function () {
      if (!iframe.getAttribute('src')) iframe.setAttribute('src', iframe.dataset.src + '?autoplay=1');
      card.classList.add('is-active');
    });
  });

  // Second bandeau de logos (section avis) : même contenu que le premier, défilement inversé en CSS
  var logoTracks = document.querySelectorAll('.logo-marquee__track');
  if (logoTracks.length > 1) logoTracks[1].innerHTML = logoTracks[0].innerHTML;

  // Carrousel des études de cas
  var track = document.querySelector('.cases__track');
  document.querySelectorAll('[data-cases]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var step = track.querySelector('.case').offsetWidth + 30;
      track.scrollBy({ left: btn.dataset.cases === 'next' ? step : -step, behavior: 'smooth' });
    });
  });
})();
