// Accueil (refonte 2026) : animations et carrousels des sections. Le header est géré par theme-v2.js.
(function () {

  // Compléter les deux bords de la rangée sur les grands écrans, sans déplacer les cinq projets centraux.
  var recentGrid = document.querySelector('.recent__grid');
  if (recentGrid) {
    var recentCards = Array.from(recentGrid.children);
    var recentSources = recentCards.map(function (card) { return card.querySelector('img').getAttribute('src'); });
    var extraProjects = Array.from(document.querySelectorAll('.work__grid .work__item img')).filter(function (image) {
      return recentSources.indexOf(image.getAttribute('src')) === -1;
    });
    var recentPairs = -1;
    var fillRecentGrid = function () {
      var cardWidth = recentCards[0].getBoundingClientRect().width;
      var gap = parseFloat(getComputedStyle(recentGrid).columnGap) || 0;
      var baseWidth = recentCards.length * (cardWidth + gap) - gap;
      var pairs = Math.max(0, Math.ceil((recentGrid.parentElement.clientWidth + cardWidth - baseWidth) / (2 * (cardWidth + gap))));
      if (pairs === recentPairs) return;
      recentPairs = pairs;
      recentGrid.querySelectorAll('[data-recent-extra]').forEach(function (card) { card.remove(); });
      for (var i = 0; i < pairs * 2; i++) {
        var source = extraProjects[i % extraProjects.length] || recentCards[i % recentCards.length].querySelector('img');
        var card = document.createElement('div');
        card.className = 'recent__card';
        card.setAttribute('data-recent-extra', '');
        var image = source.cloneNode(true);
        image.loading = 'lazy';
        image.decoding = 'async';
        card.appendChild(image);
        if (i % 2 === 0) recentGrid.prepend(card); else recentGrid.appendChild(card);
      }
    };
    fillRecentGrid();
    window.addEventListener('resize', fillRecentGrid);
  }

  // FAQ : hauteur et texte animés depuis leur position courante, même en cas de clics rapides.
  var faqReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.faq__item').forEach(function (item) {
    var summary = item.querySelector('summary');
    var answer = item.querySelector('p');
    if (!item.animate || !answer) return;
    var expanded = item.open;
    var heightAnimation;
    var answerAnimation;
    item.classList.add('is-animated');
    item.classList.toggle('is-expanded', expanded);

    var settle = function () {
      item.open = expanded;
      if (heightAnimation) heightAnimation.cancel();
      if (answerAnimation) answerAnimation.cancel();
      heightAnimation = answerAnimation = null;
      item.style.overflow = '';
      summary.removeAttribute('aria-expanded');
    };

    summary.addEventListener('click', function (event) {
      event.preventDefault();
      var startHeight = item.getBoundingClientRect().height;
      var answerStyle = getComputedStyle(answer);
      var startOpacity = item.open ? answerStyle.opacity : '0';
      var startTransform = item.open ? answerStyle.transform : 'translateY(-6px)';
      if (heightAnimation) heightAnimation.cancel();
      if (answerAnimation) answerAnimation.cancel();
      expanded = !expanded;
      item.classList.toggle('is-expanded', expanded);
      summary.setAttribute('aria-expanded', String(expanded));
      if (faqReducedMotion.matches) {
        settle();
        return;
      }

      item.open = true;
      var endHeight = expanded ? item.getBoundingClientRect().height : summary.getBoundingClientRect().height + parseFloat(getComputedStyle(item).borderBottomWidth);
      item.style.overflow = 'hidden';
      var timing = { duration: 340, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' };
      heightAnimation = item.animate([{ height: startHeight + 'px' }, { height: endHeight + 'px' }], timing);
      answerAnimation = answer.animate([
        { opacity: startOpacity, transform: startTransform },
        { opacity: expanded ? 1 : 0, transform: expanded ? 'translateY(0)' : 'translateY(-6px)' }
      ], timing);
      heightAnimation.onfinish = settle;
    });
    faqReducedMotion.addEventListener('change', function () {
      if (faqReducedMotion.matches && heightAnimation) settle();
    });
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
      }, 280);
    }, 2000);
  }


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
  // Les autres pages qui chargent ce script (outils) n'ont pas les onglets du portfolio
  if (activeTab && indicator) {
    moveIndicator(activeTab);
    window.addEventListener('resize', function () { moveIndicator(activeTab); });
  }

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

  // Le bandeau des avis reprend les logos de la grille, en deux séries pour la boucle.
  var reviewLogoTrack = document.querySelector('.logo-marquee--reviews .logo-marquee__track');
  if (reviewLogoTrack) {
    var clientLogos = document.querySelectorAll('.client-logos__img');
    for (var copy = 0; copy < 2; copy++) {
      clientLogos.forEach(function (logo) {
        var image = logo.cloneNode(true);
        image.className = 'logo-marquee__img' + (logo.classList.contains('is-mono') ? ' is-mono' : '');
        image.alt = '';
        reviewLogoTrack.appendChild(image);
      });
    }
  }

  // Carrousel des études de cas
  var track = document.querySelector('.cases__track');
  document.querySelectorAll('[data-cases]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var step = track.querySelector('.case').offsetWidth + 30;
      track.scrollBy({ left: btn.dataset.cases === 'next' ? step : -step, behavior: 'smooth' });
    });
  });
})();
