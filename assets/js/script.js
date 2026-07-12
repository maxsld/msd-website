// AI referrer detection — fires on every page, no consent needed
(function(){
  var AI_SOURCES = {
    'perplexity.ai':'perplexity','chatgpt.com':'chatgpt','chat.openai.com':'chatgpt',
    'claude.ai':'claude','gemini.google.com':'gemini','bard.google.com':'gemini',
    'copilot.microsoft.com':'copilot','bing.com/chat':'copilot',
    'you.com':'you','phind.com':'phind','deepseek.com':'deepseek'
  };
  var ref = document.referrer, aiSource = null;
  for (var d in AI_SOURCES) { if (ref.indexOf(d) !== -1) { aiSource = AI_SOURCES[d]; break; } }
  window.dataLayer = window.dataLayer || [];
  if (aiSource) {
    window.dataLayer.push({ event: 'ai_referral', ai_source: aiSource, referrer: ref });
    sessionStorage.setItem('_msd_ai_source', aiSource);
  }
  window._msdAiSource = aiSource;
})();

// Tracking analytics (GTM + dataLayer + attribution + CTA + forms + engagement + booking + optional heatmap)
(function () {
  window.dataLayer = window.dataLayer || [];

  const GTM_CONTAINER_ID = "GTM-P28B6QRF";
  const CLARITY_PROJECT_ID =
    window.MSD_CLARITY_PROJECT_ID ||
    document.documentElement.getAttribute("data-clarity-project-id") ||
    (document.querySelector('meta[name="msd-clarity-id"]') || {}).content ||
    "";
  const PAGE_ENTERED_AT = Date.now();
  const SCROLL_STEPS = [25, 50, 75, 90];
  const reachedScrollSteps = new Set();
  let exitTracked = false;
  let bookingCompletedTracked = false;

  const toText = (value) =>
    String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);

  const getPageType = () => {
    const path = window.location.pathname || "/";
    if (path === "/" || path === "/index.html") return "home";
    if (path.includes("/contact/")) return "contact";
    if (path.includes("/blog/")) return "blog";
    if (path.includes("/etudes-de-cas/")) return "case_study";
    if (path.includes("/confirmation-contact/")) return "confirmation_contact";
    if (path.includes("/confirmation-reservation-appel/")) return "confirmation_booking";
    return "other";
  };

  const getSectionLabel = (node) => {
    const section = node ? node.closest("section, header, footer, main, nav") : null;
    if (!section) return "unknown";
    return (
      section.getAttribute("id") ||
      toText(section.getAttribute("aria-label")) ||
      toText(section.className) ||
      section.tagName.toLowerCase()
    );
  };

  const ensureGtmLoaded = () => {
    if (!GTM_CONTAINER_ID) return;
    const hasScript = Boolean(
      document.querySelector(`script[src*="googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}"]`)
    );
    const hasRuntime = Boolean(window.google_tag_manager && window.google_tag_manager[GTM_CONTAINER_ID]);
    if (hasScript || hasRuntime) return;

    window.dataLayer.push({
      "gtm.start": Date.now(),
      event: "gtm.js"
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;
    document.head.appendChild(script);
  };

  const pushTrack = (eventName, payload = {}) => {
    window.dataLayer.push({
      event: eventName,
      event_source: "msd_site",
      page_path: window.location.pathname,
      page_title: document.title,
      page_type: getPageType(),
      ...payload
    });
  };

  window.msdTrack = pushTrack;
  ensureGtmLoaded();

  const query = new URLSearchParams(window.location.search || "");
  pushTrack("msd_page_view", {
    referrer: document.referrer || "(direct)",
    utm_source: query.get("utm_source") || "",
    utm_medium: query.get("utm_medium") || "",
    utm_campaign: query.get("utm_campaign") || "",
    utm_term: query.get("utm_term") || "",
    utm_content: query.get("utm_content") || ""
  });

  const trackExit = (reason) => {
    if (exitTracked) return;
    exitTracked = true;
    const timeOnPageSeconds = Math.max(1, Math.round((Date.now() - PAGE_ENTERED_AT) / 1000));
    pushTrack("time_on_page", { time_on_page_seconds: timeOnPageSeconds, leave_reason: reason });
  };

  window.addEventListener(
    "scroll",
    () => {
      const doc = document.documentElement;
      const maxScrollable = doc.scrollHeight - window.innerHeight;
      if (maxScrollable <= 0) return;
      const percent = Math.round((window.scrollY / maxScrollable) * 100);
      SCROLL_STEPS.forEach((step) => {
        if (percent >= step && !reachedScrollSteps.has(step)) {
          reachedScrollSteps.add(step);
          pushTrack("scroll_depth", { scroll_percent: step });
        }
      });
    },
    { passive: true }
  );

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      trackExit("hidden");
    }
  });

  window.addEventListener("beforeunload", () => trackExit("beforeunload"));

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target.closest("a, button");
      if (!target) return;

      const href = target.getAttribute("href") || "";
      const text = toText(target.textContent || target.getAttribute("aria-label") || target.getAttribute("title"));
      const classes = toText(target.className);
      const ctaLocation = getSectionLabel(target);
      const isBooking = /cal\.com/i.test(href);
      const isWhatsApp = /wa\.me/i.test(href);
      const isEmail = href.startsWith("mailto:");
      const isPhone = href.startsWith("tel:");
      const isSubmitButton = target.tagName === "BUTTON" && target.getAttribute("type") === "submit";
      const isStyledCta =
        target.matches(".contact-button, .hero__btn, .whatsapp-nav-button, .realisations-cta") ||
        /cta|hero__btn|contact-button|whatsapp/i.test(classes);

      if (!isBooking && !isWhatsApp && !isEmail && !isPhone && !isSubmitButton && !isStyledCta) {
        return;
      }

      let ctaKind = "generic";
      if (isBooking) ctaKind = "booking";
      else if (isWhatsApp) ctaKind = "whatsapp";
      else if (isEmail) ctaKind = "email";
      else if (isPhone) ctaKind = "phone";
      else if (isSubmitButton) ctaKind = "form_submit_button";

      pushTrack("cta_click", {
        cta_kind: ctaKind,
        cta_text: text || "(no_text)",
        cta_href: href || "",
        cta_location: ctaLocation
      });

      if (isBooking) {
        pushTrack("booking_intent", {
          provider: "cal",
          cta_text: text || "(no_text)",
          cta_location: ctaLocation
        });
      }
    },
    true
  );

  document.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const formId = toText(form.getAttribute("id") || "");
      const formName = toText(form.getAttribute("name") || "");
      const formAction = form.getAttribute("action") || window.location.pathname;
      const isContactForm = formId === "contact-form";

      pushTrack("form_submit_attempt", {
        form_id: formId || "(none)",
        form_name: formName || "(none)",
        form_action: formAction,
        form_method: (form.getAttribute("method") || "get").toLowerCase(),
        form_location: getSectionLabel(form)
      });

      if (isContactForm) {
        pushTrack("lead_submit_attempt", { form_id: "contact-form" });
      }
    },
    true
  );

  const emitBookingCompleted = (source) => {
    if (bookingCompletedTracked) return;
    bookingCompletedTracked = true;
    pushTrack("booking_completed", { provider: "cal", source });
  };

  window.addEventListener("message", (event) => {
    let hostname = "";
    try {
      hostname = new URL(event.origin).hostname;
    } catch (_) {
      return;
    }
    if (!/cal\.com$/i.test(hostname)) return;

    const rawData = event.data;
    const dataText = toText(
      typeof rawData === "string" ? rawData : JSON.stringify(rawData || {})
    ).toLowerCase();

    if (
      dataText.includes("bookingsuccessful") ||
      dataText.includes("booking_successful") ||
      dataText.includes("bookingconfirmed") ||
      dataText.includes("booking_confirmed")
    ) {
      emitBookingCompleted("embed_message");
    }
  });

  const observeBookingIframes = () => {
    const bookingIframes = document.querySelectorAll('iframe[src*="cal.com"], iframe[data-src*="cal.com"]');
    bookingIframes.forEach((iframe, idx) => {
      const emitLoaded = () => {
        pushTrack("booking_loaded", {
          provider: "cal",
          embed_slot: idx + 1,
          embed_src: iframe.getAttribute("src") || iframe.getAttribute("data-src") || ""
        });
      };

      if (iframe.getAttribute("src")) {
        iframe.addEventListener("load", emitLoaded, { once: true });
        return;
      }

      const observer = new MutationObserver(() => {
        if (!iframe.getAttribute("src")) return;
        observer.disconnect();
        iframe.addEventListener("load", emitLoaded, { once: true });
      });
      observer.observe(iframe, { attributes: true, attributeFilter: ["src"] });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", observeBookingIframes);
  } else {
    observeBookingIframes();
  }

  if (window.location.pathname.includes("/confirmation-reservation-appel/")) {
    emitBookingCompleted("confirmation_page");
  }
  if (window.location.pathname.includes("/confirmation-contact/")) {
    pushTrack("lead_confirmed", { form_id: "contact-form", source: "confirmation_page" });
  }

  if (CLARITY_PROJECT_ID) {
    (function (c, l, a, r, i, t, y) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      t = l.createElement(r);
      t.async = 1;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_PROJECT_ID);
    pushTrack("heatmap_loaded", { provider: "clarity" });
  }
})();

// Défilement doux pour les ancres internes
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// Animations d’apparition désactivées (fade/opacity)

// Controles personnalises pour la video hero
document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");
  const navMenus = document.querySelectorAll("[data-nav-menu]");
  const langSelect = document.querySelector("#lang-select");
  const i18nTargets = document.querySelectorAll("[data-i18n]");
  const heroLead = document.querySelector("[data-hero-lead]");
  const heroWordWrap = document.querySelector(".hero__title-word-wrap");
  const heroWord = document.querySelector("[data-hero-word]");
  let heroWordIntervalId = null;
  let heroWordIndex = 0;
  let heroWordLang = "fr";

  const heroWordSets = {
    fr: {
      lead: "On fait des sites web et des landing pages",
      words: ["inoubliables."]
    },
    en: {
      lead: "We build websites and landing pages",
      words: ["unforgettable.", "striking.", "elegant.", "high-converting.", "memorable."]
    }
  };

  const translations = {
    fr: {
      nav_call: "Réserver un appel",
      clients_supported: "+30 clients accompagnés",
      hero_primary: "Réserver un appel",
      hero_secondary: "Découvrir l'agence"
    },
    en: {
      nav_call: "Book a call",
      clients_supported: "+30 clients supported",
      hero_primary: "Book a call",
      hero_secondary: "Discover the agency"
    }
  };

  const LANGUAGE_COOKIE_KEY = "msd_site_lang";
  const LANGUAGE_STORAGE_KEY = "msd_site_lang";
  const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

  const setCookie = (name, value, maxAgeSeconds) => {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  };

  const getCookie = (name) => {
    const prefix = `${name}=`;
    const cookies = document.cookie ? document.cookie.split("; ") : [];
    for (const cookie of cookies) {
      if (cookie.startsWith(prefix)) {
        return decodeURIComponent(cookie.slice(prefix.length));
      }
    }
    return "";
  };

  const normalizeLang = (raw) => {
    const value = String(raw || "").toLowerCase().trim();
    if (value === "en" || value.startsWith("en-")) return "en";
    if (value === "fr" || value.startsWith("fr-")) return "fr";
    return "";
  };

  const saveLanguagePreference = (lang) => {
    const normalizedLang = normalizeLang(lang) || "fr";
    setCookie(LANGUAGE_COOKIE_KEY, normalizedLang, ONE_YEAR_SECONDS);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLang);
    } catch (_) {}
  };

  const readLanguagePreference = () => {
    const cookieLang = normalizeLang(getCookie(LANGUAGE_COOKIE_KEY));
    if (cookieLang) return cookieLang;
    try {
      const storedLang = normalizeLang(window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || "");
      if (storedLang) return storedLang;
    } catch (_) {}
    return "";
  };

  const stopHeroWordRotation = () => {
    if (heroWordIntervalId) {
      clearInterval(heroWordIntervalId);
      heroWordIntervalId = null;
    }
  };

  const renderHeroWord = (entry) => {
    if (typeof entry === "string") return entry;
    const label = String(entry?.label || "");
    const logo = String(entry?.logo || "");
    if (!label && !logo) return "";
    if (!logo) return label;
    return `<span class="hero__title-word-entry"><img class="hero__title-word-logo" src="${logo}" alt="${label} logo" loading="eager" decoding="async"><span class="hero__title-word-label">${label}</span></span>`;
  };

  const measureHeroWordWidth = (word) => {
    if (!heroWord || !heroWordWrap) return 0;

    const ruler = document.createElement("span");
    ruler.style.position = "absolute";
    ruler.style.visibility = "hidden";
    ruler.style.pointerEvents = "none";
    ruler.style.whiteSpace = "nowrap";

    const computed = window.getComputedStyle(heroWord);
    ruler.style.fontFamily = computed.fontFamily;
    ruler.style.fontSize = computed.fontSize;
    ruler.style.fontWeight = computed.fontWeight;
    ruler.style.letterSpacing = computed.letterSpacing;
    ruler.style.textTransform = computed.textTransform;

    document.body.appendChild(ruler);

    ruler.innerHTML = renderHeroWord(word);
    const width = Math.ceil(ruler.getBoundingClientRect().width) + 2;
    ruler.remove();
    return width;
  };

  const swapHeroWord = (nextWord, animate = true) => {
    if (!heroWord || !heroWordWrap) return;
    const nextWidth = measureHeroWordWidth(nextWord);
    if (nextWidth) {
      heroWordWrap.style.width = `${nextWidth}px`;
    }

    if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      heroWord.innerHTML = renderHeroWord(nextWord);
      heroWord.classList.remove("is-leaving", "is-entering");
      return;
    }

    heroWord.classList.remove("is-entering");
    heroWord.classList.add("is-leaving");

    window.setTimeout(() => {
      heroWord.innerHTML = renderHeroWord(nextWord);
      heroWord.classList.remove("is-leaving");
      heroWord.classList.add("is-entering");

      window.setTimeout(() => {
        heroWord.classList.remove("is-entering");
      }, 460);
    }, 180);
  };

  const startHeroWordRotation = (lang) => {
    const wordSet = heroWordSets[lang] || heroWordSets.fr;
    if (!heroLead || !heroWord || !wordSet.words.length) return;

    stopHeroWordRotation();
    heroWordLang = lang;
    heroWordIndex = 0;
    heroLead.textContent = wordSet.lead;
    const isMobileView = window.matchMedia("(max-width: 768px)").matches;
    swapHeroWord(wordSet.words[heroWordIndex], false);

    // Sur mobile on garde le mot fixe pour éviter tout décalage de page.
    if (isMobileView) {
      heroWordWrap.style.width = "auto";
      return;
    }

    if (wordSet.words.length < 2) return;

    heroWordIntervalId = window.setInterval(() => {
      if (heroWordLang !== lang) return;
      heroWordIndex = (heroWordIndex + 1) % wordSet.words.length;
      swapHeroWord(wordSet.words[heroWordIndex], true);
    }, 2300);
  };

  const setLanguage = (lang) => {
    const dict = translations[lang];
    if (!dict) return;

    document.documentElement.lang = lang;

    i18nTargets.forEach((node) => {
      const key = node.dataset.i18n;
      if (!key || !dict[key]) return;
      node.textContent = dict[key];
    });
    startHeroWordRotation(lang);
  };

  const getRequestedLanguage = () => {
    const forcedLang = normalizeLang(window.__MSD_FORCE_LANG__);
    if (forcedLang) return forcedLang;

    if (/^\/en(?:\/|$)/i.test(window.location.pathname)) return "en";
    return "fr";
  };

  const preferredLang = getRequestedLanguage();

  if (langSelect) {
    langSelect.remove();
  }

  if (i18nTargets.length) {
    setLanguage(preferredLang);
  } else {
    document.documentElement.lang = preferredLang;
    startHeroWordRotation(preferredLang);
  }

  const isProjectPreviewOpen = () => Boolean(document.querySelector(".project-preview-modal.is-open"));
  const isNavMenuOpen = () => Array.from(navMenus).some((menu) => menu.classList.contains("is-open"));
  const syncBodyScrollLock = () => {
    document.body.style.overflow = isProjectPreviewOpen() || isNavMenuOpen() ? "hidden" : "";
  };

  if (navMenus.length) {
    navMenus.forEach((menu) => {
      const toggleBtn = menu.querySelector("[data-nav-menu-toggle]");
      const closeBtn = menu.querySelector("[data-nav-menu-close]");
      const menuDropdown = menu.querySelector("[data-nav-menu-dropdown]");
      const menuLinks = menuDropdown ? menuDropdown.querySelectorAll("a[href]") : [];

      if (!toggleBtn || !menuDropdown) return;

      const closeMenu = () => {
        if (!menu.classList.contains("is-open")) return;
        menu.classList.remove("is-open");
        toggleBtn.setAttribute("aria-expanded", "false");
        if (navbar) navbar.classList.remove("navbar-menu-open");
        syncBodyScrollLock();
      };

      const openMenu = () => {
        menu.classList.add("is-open");
        toggleBtn.setAttribute("aria-expanded", "true");
        if (navbar) navbar.classList.add("navbar-menu-open");
        syncBodyScrollLock();
      };

      const toggleMenu = () => {
        if (menu.classList.contains("is-open")) {
          closeMenu();
          return;
        }
        openMenu();
      };

      toggleBtn.addEventListener("click", toggleMenu);
      if (closeBtn) closeBtn.addEventListener("click", closeMenu);

      menuLinks.forEach((link) => {
        link.addEventListener("click", closeMenu);
      });

      menuDropdown.addEventListener("click", (event) => {
        if (event.target === menuDropdown) closeMenu();
      });

      document.addEventListener("click", (event) => {
        if (!menu.classList.contains("is-open")) return;
        if (menu.contains(event.target)) return;
        closeMenu();
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
      });
    });
  }

  if (navbar) {
    navbar.classList.remove("is-hidden", "is-visible");
  }

  let wasMobileHeroView = window.matchMedia("(max-width: 768px)").matches;
  window.addEventListener("resize", () => {
    if (!heroWord || !heroWordWrap) return;
    const isMobileHeroView = window.matchMedia("(max-width: 768px)").matches;

    if (isMobileHeroView !== wasMobileHeroView) {
      wasMobileHeroView = isMobileHeroView;
      startHeroWordRotation(heroWordLang);
      return;
    }

    if (isMobileHeroView) {
      heroWordWrap.style.width = "auto";
      return;
    }

    const activeWordSet = heroWordSets[heroWordLang] || heroWordSets.fr;
    const activeEntry = activeWordSet.words[heroWordIndex] || activeWordSet.words[0] || "";
    const currentWidth = measureHeroWordWidth(activeEntry);
    if (currentWidth) {
      heroWordWrap.style.width = `${currentWidth}px`;
    }
  });

  const companyCountEl = document.querySelector("[data-company-count]");
  const animateCompanyCount = () => {
    if (!companyCountEl) return;

    const target = Number(companyCountEl.dataset.target || "30");
    const min = 1;
    const max = Number.isFinite(target) ? Math.max(target, min) : 30;
    const duration = 2600;
    const start = performance.now();

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = easeOutCubic(progress);
      const value = Math.round(min + (max - min) * eased);
      companyCountEl.textContent = String(value);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  };

  if (companyCountEl) {
    let hasUserScrolled = window.scrollY > 0;
    const markScrolled = () => {
      hasUserScrolled = true;
      window.removeEventListener("scroll", markScrolled);
      window.removeEventListener("wheel", markScrolled);
      window.removeEventListener("touchmove", markScrolled);
    };

    window.addEventListener("scroll", markScrolled, { passive: true });
    window.addEventListener("wheel", markScrolled, { passive: true });
    window.addEventListener("touchmove", markScrolled, { passive: true });

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting || !hasUserScrolled) return;
            animateCompanyCount();
            observer.disconnect();
          });
        },
        { threshold: 0.6, rootMargin: "0px 0px -10% 0px" }
      );
      observer.observe(companyCountEl.closest(".hero-companies-proof") || companyCountEl);
    } else {
      const onScrollAnimate = () => {
        const container = companyCountEl.closest(".hero-companies-proof") || companyCountEl;
        const rect = container.getBoundingClientRect();
        const triggerY = window.innerHeight * 0.8;
        if (rect.top > triggerY) return;

        animateCompanyCount();
        window.removeEventListener("scroll", onScrollAnimate);
      };
      window.addEventListener("scroll", onScrollAnimate, { passive: true });
    }
  }

  const logoTracks = document.querySelectorAll(".logo-marquee__track");
  const clientLogos = [
    { src: "https://msd-media.com/assets/img/logo-track1.webp", alt: "Logo client 1" },
    { src: "https://msd-media.com/assets/img/logo-track2.webp", alt: "Logo client 2" },
    { src: "https://msd-media.com/assets/img/logo-track3.webp", alt: "Logo client 3" },
    { src: "https://msd-media.com/assets/img/logo-track4.webp", alt: "Logo client 4" },
    { src: "https://msd-media.com/assets/img/logo-track5.webp", alt: "Logo client 5" },
    { src: "https://msd-media.com/assets/img/logo-merz-aesthetics.webp", alt: "Logo Merz Aesthetics", className: "logo-marquee__img--merz" },
    { src: "https://msd-media.com/assets/img/logo-track6.webp", alt: "Logo client 6" },
    { src: "https://msd-media.com/assets/img/logo-track7.webp", alt: "Logo client 7", className: "logo-marquee__img--carroz" },
    { src: "https://msd-media.com/assets/img/logo-track8.webp", alt: "Logo client 8" },
    { src: "https://msd-media.com/assets/img/logo-track9.webp", alt: "Logo client 9" }
  ];

  if (logoTracks.length) {
    const buildLogo = ({ src, alt, className = "" }, isDuplicate = false) => {
      const logo = document.createElement("img");
      logo.className = `logo-marquee__img ${className}`.trim();
      logo.src = src;
      logo.alt = isDuplicate ? "" : alt;
      logo.loading = "lazy";
      logo.decoding = "async";
      if (isDuplicate) {
        logo.setAttribute("aria-hidden", "true");
      }
      return logo;
    };

    logoTracks.forEach((logoTrack) => {
      const logos = [
        ...clientLogos.map((logo) => buildLogo(logo)),
        ...clientLogos.map((logo) => buildLogo(logo, true))
      ];
      logoTrack.replaceChildren(...logos);
    });
  }

  const callToast = document.querySelector("[data-call-toast]");
  const callToastCloseBtn = document.querySelector("[data-call-toast-close]");
  const bookingSection = document.querySelector(".booking-section");
  if (callToast) {
    window.setTimeout(() => {
      callToast.classList.add("is-visible");
    }, 10000);
  }
  if (callToast && callToastCloseBtn) {
    callToastCloseBtn.addEventListener("click", () => {
      callToast.classList.remove("is-visible");
    });
  }
  if (callToast && bookingSection && "IntersectionObserver" in window) {
    const bookingObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          callToast.classList.toggle("is-hidden-by-footer", entry.isIntersecting);
        });
      },
      { threshold: 0.05 }
    );
    bookingObserver.observe(bookingSection);
  }

  const reviewVideoCards = document.querySelectorAll("[data-review-video]");
  if (reviewVideoCards.length) {
    const withAutoplay = (rawUrl) => {
      if (!rawUrl) return "";
      try {
        const url = new URL(rawUrl);
        url.searchParams.set("autoplay", "1");
        return url.toString();
      } catch (_) {
        if (rawUrl.includes("?")) return `${rawUrl}&autoplay=1`;
        return `${rawUrl}?autoplay=1`;
      }
    };

    reviewVideoCards.forEach((card) => {
      const cover = card.querySelector("[data-review-video-cover]");
      const iframe = card.querySelector("[data-review-video-iframe]");
      if (!cover || !iframe) return;

      const src = iframe.getAttribute("data-src") || iframe.getAttribute("src") || "";
      const activate = () => {
        if (!iframe.getAttribute("src")) {
          iframe.setAttribute("src", withAutoplay(src));
        }
        card.classList.add("is-active");
      };

      cover.addEventListener("click", activate);
    });
  }

  const officeTimeNodes = document.querySelectorAll("[data-office-time]");
  if (officeTimeNodes.length) {
    const formatters = new Map();
    const getFormatter = (timeZone) => {
      if (!formatters.has(timeZone)) {
        formatters.set(
          timeZone,
          new Intl.DateTimeFormat("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone
          })
        );
      }
      return formatters.get(timeZone);
    };

    const updateOfficeTimes = () => {
      const now = new Date();
      officeTimeNodes.forEach((node) => {
        const timeZone = node.getAttribute("data-timezone");
        if (!timeZone) return;
        try {
          node.textContent = getFormatter(timeZone).format(now);
        } catch (_) {}
      });
    };

    updateOfficeTimes();
    window.setInterval(updateOfficeTimes, 1000);
  }

  const faqItems = document.querySelectorAll(".faq-item");
  if (faqItems.length) {
    faqItems.forEach((item) => {
      const question = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");
      const icon = item.querySelector(".icon");
      if (!question || !answer) return;

      question.addEventListener("click", () => {
        const isOpen = item.classList.contains("is-open");

        faqItems.forEach((otherItem) => {
          const otherQuestion = otherItem.querySelector(".faq-question");
          const otherAnswer = otherItem.querySelector(".faq-answer");
          const otherIcon = otherItem.querySelector(".icon");
          if (!otherQuestion || !otherAnswer) return;
          otherItem.classList.remove("is-open");
          otherQuestion.setAttribute("aria-expanded", "false");
          otherAnswer.style.maxHeight = "0px";
          if (otherIcon) otherIcon.textContent = "+";
        });

        if (isOpen) return;

        item.classList.add("is-open");
        question.setAttribute("aria-expanded", "true");
        answer.style.maxHeight = `${answer.scrollHeight}px`;
        if (icon) icon.textContent = "−";
      });
    });
  }

  const realisationsCarousel = document.querySelector("[data-realisations-carousel]");
  const standalonePreviewTriggers = Array.from(document.querySelectorAll("[data-preview-trigger]"));

  if (!realisationsCarousel && standalonePreviewTriggers.length) {
    const previewModal = document.querySelector("[data-project-preview-modal]");
    const previewIframe = previewModal ? previewModal.querySelector("[data-project-preview-iframe]") : null;
    const previewAddress = previewModal ? previewModal.querySelector("[data-project-preview-address]") : null;
    const previewCloseButtons = previewModal ? previewModal.querySelectorAll("[data-project-preview-close]") : [];
    let previewCloseTimeoutId = null;

    const PREVIEW_CLOSE_DURATION = 240;

    if (previewModal) {
      previewModal.hidden = !previewModal.classList.contains("is-open");
      previewModal.inert = !previewModal.classList.contains("is-open");
    }

    const closePreview = () => {
      if (!previewModal || !previewIframe) return;
      if (!previewModal.classList.contains("is-open")) return;

      previewModal.classList.remove("is-open");
      previewModal.classList.add("is-closing");
      previewModal.setAttribute("aria-hidden", "true");
      previewModal.inert = true;
      syncBodyScrollLock();

      if (previewCloseTimeoutId) {
        window.clearTimeout(previewCloseTimeoutId);
      }

      previewCloseTimeoutId = window.setTimeout(() => {
        previewModal.classList.remove("is-closing");
        previewIframe.src = "";
        previewModal.hidden = true;
      }, PREVIEW_CLOSE_DURATION);
    };

    const openPreview = (url, displayUrl) => {
      if (!previewModal || !previewIframe || !url) return;

      if (previewCloseTimeoutId) {
        window.clearTimeout(previewCloseTimeoutId);
        previewCloseTimeoutId = null;
      }

      previewModal.hidden = false;
      previewModal.inert = false;
      previewModal.classList.remove("is-closing");
      if (previewAddress) previewAddress.textContent = displayUrl || url;
      previewIframe.src = url;
      previewModal.classList.add("is-open");
      previewModal.setAttribute("aria-hidden", "false");
      syncBodyScrollLock();
    };

    standalonePreviewTriggers.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        const previewUrl = trigger.getAttribute("data-preview-url");
        const previewDisplayUrl = trigger.getAttribute("data-preview-display-url");
        if (!previewUrl) return;
        event.preventDefault();
        openPreview(previewUrl, previewDisplayUrl);
      });
    });

    previewCloseButtons.forEach((btn) => {
      btn.addEventListener("click", closePreview);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closePreview();
    });
  }

  if (realisationsCarousel) {
    const realisationSlides = Array.from(realisationsCarousel.querySelectorAll(".realisations-slide"));
    const prevBtn = realisationsCarousel.querySelector("[data-realisations-prev]");
    const nextBtn = realisationsCarousel.querySelector("[data-realisations-next]");
    const previewModal = document.querySelector("[data-project-preview-modal]");
    const previewIframe = previewModal ? previewModal.querySelector("[data-project-preview-iframe]") : null;
    const previewAddress = previewModal ? previewModal.querySelector("[data-project-preview-address]") : null;
    const previewCloseButtons = previewModal ? previewModal.querySelectorAll("[data-project-preview-close]") : [];
    let previewCloseTimeoutId = null;
    let stopRealisationsAutoplay = () => {};
    let startRealisationsAutoplay = () => {};

    const PREVIEW_CLOSE_DURATION = 240;

    if (previewModal) {
      previewModal.hidden = !previewModal.classList.contains("is-open");
      previewModal.inert = !previewModal.classList.contains("is-open");
    }

    const closePreview = () => {
      if (!previewModal) return;
      if (!previewModal.classList.contains("is-open")) return;

      previewModal.classList.remove("is-open");
      previewModal.classList.add("is-closing");
      previewModal.setAttribute("aria-hidden", "true");
      previewModal.inert = true;
      syncBodyScrollLock();

      if (previewCloseTimeoutId) {
        window.clearTimeout(previewCloseTimeoutId);
      }

      previewCloseTimeoutId = window.setTimeout(() => {
        previewModal.classList.remove("is-closing");
        if (previewIframe) previewIframe.src = "";
        previewModal.hidden = true;
      }, PREVIEW_CLOSE_DURATION);

      startRealisationsAutoplay();
    };

    const openPreview = (url, displayUrl) => {
      if (!previewModal || !previewIframe) return;
      stopRealisationsAutoplay();

      if (previewCloseTimeoutId) {
        window.clearTimeout(previewCloseTimeoutId);
        previewCloseTimeoutId = null;
      }

      previewModal.hidden = false;
      previewModal.inert = false;
      previewModal.classList.remove("is-closing");
      if (previewAddress) previewAddress.textContent = displayUrl || url;
      previewIframe.src = url;
      previewModal.classList.add("is-open");
      previewModal.setAttribute("aria-hidden", "false");
      syncBodyScrollLock();
    };

    previewCloseButtons.forEach((btn) => {
      btn.addEventListener("click", closePreview);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closePreview();
    });

    if (realisationSlides.length > 1) {
      let currentIndex = 0;
      const AUTOPLAY_DELAY = 4000;
      let autoplayTimeoutId = null;
      let currentViewportMode = "";

      const getRealisationsViewportMode = () => {
        if (window.matchMedia("(max-width: 620px)").matches) return "mobile";
        if (window.matchMedia("(max-width: 992px)").matches) return "tablet";
        return "desktop";
      };

      const getRealisationsSlideStyles = (state) => {
        const viewportMode = getRealisationsViewportMode();
        const isMobile = viewportMode === "mobile";
        const isTablet = viewportMode === "tablet";

        const transforms = {
          active: "translate(-50%, -50%) scale(1)",
          prev: isMobile
            ? "translate(calc(-50% - 58%), -50%) scale(0.84) rotate(-2deg)"
            : isTablet
              ? "translate(calc(-50% - 54%), -50%) scale(0.82) rotate(-2deg)"
              : "translate(calc(-50% - 46%), -50%) scale(0.84) rotate(-3deg)",
          next: isMobile
            ? "translate(calc(-50% + 58%), -50%) scale(0.84) rotate(2deg)"
            : isTablet
              ? "translate(calc(-50% + 54%), -50%) scale(0.82) rotate(2deg)"
              : "translate(calc(-50% + 46%), -50%) scale(0.84) rotate(3deg)",
          farLeft: isMobile
            ? "translate(calc(-50% - 88%), -50%) scale(0.7)"
            : "translate(calc(-50% - 78%), -50%) scale(0.72)",
          farRight: isMobile
            ? "translate(calc(-50% + 88%), -50%) scale(0.7)"
            : "translate(calc(-50% + 78%), -50%) scale(0.72)"
        };

        const styles = {
          active: { opacity: "1", zIndex: "3", filter: "saturate(1)", pointerEvents: "auto", transform: transforms.active },
          prev: { opacity: "0.44", zIndex: "2", filter: "saturate(0.75)", pointerEvents: "none", transform: transforms.prev },
          next: { opacity: "0.44", zIndex: "2", filter: "saturate(0.75)", pointerEvents: "none", transform: transforms.next },
          farLeft: { opacity: "0", zIndex: "1", filter: "saturate(0.75)", pointerEvents: "none", transform: transforms.farLeft },
          farRight: { opacity: "0", zIndex: "1", filter: "saturate(0.75)", pointerEvents: "none", transform: transforms.farRight }
        };

        return styles[state];
      };

      const updateRealisations = () => {
        const total = realisationSlides.length;
        currentViewportMode = getRealisationsViewportMode();
        realisationSlides.forEach((slide, index) => {
          let diff = index - currentIndex;
          if (diff > total / 2) diff -= total;
          if (diff < -total / 2) diff += total;

          slide.classList.remove("is-prev", "is-active", "is-next", "is-far-left", "is-far-right");

          let state = "farRight";

          if (diff === 0) {
            slide.classList.add("is-active");
            state = "active";
          } else if (diff === -1) {
            slide.classList.add("is-prev");
            state = "prev";
          } else if (diff === 1) {
            slide.classList.add("is-next");
            state = "next";
          } else if (diff < -1) {
            slide.classList.add("is-far-left");
            state = "farLeft";
          } else {
            slide.classList.add("is-far-right");
            state = "farRight";
          }

          const styles = getRealisationsSlideStyles(state);
          slide.style.transform = styles.transform;
          slide.style.opacity = styles.opacity;
          slide.style.zIndex = styles.zIndex;
          slide.style.filter = styles.filter;
          slide.style.pointerEvents = styles.pointerEvents;
        });
      };

      const goNext = () => {
        currentIndex = (currentIndex + 1) % realisationSlides.length;
        updateRealisations();
      };

      const goPrev = () => {
        currentIndex = (currentIndex - 1 + realisationSlides.length) % realisationSlides.length;
        updateRealisations();
      };

      stopRealisationsAutoplay = () => {
        if (!autoplayTimeoutId) return;
        window.clearTimeout(autoplayTimeoutId);
        autoplayTimeoutId = null;
      };

      startRealisationsAutoplay = () => {
        if (autoplayTimeoutId) return;
        if (document.hidden) return;
        if (previewModal && previewModal.classList.contains("is-open")) return;
        autoplayTimeoutId = window.setTimeout(() => {
          autoplayTimeoutId = null;
          goNext();
          startRealisationsAutoplay();
        }, AUTOPLAY_DELAY);
      };

      const restartRealisationsAutoplay = () => {
        stopRealisationsAutoplay();
        startRealisationsAutoplay();
      };

      if (nextBtn) {
        nextBtn.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          goNext();
          restartRealisationsAutoplay();
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          goPrev();
          restartRealisationsAutoplay();
        });
      }

      realisationSlides.forEach((slide) => {
        const caseLink = slide.querySelector(".realisations-case-link");
        if (caseLink) {
          caseLink.addEventListener("click", (event) => {
            event.stopPropagation();
          });
        }

        slide.addEventListener("click", () => {
          if (!slide.classList.contains("is-active")) return;
          const previewUrl = slide.getAttribute("data-preview-url");
          const previewDisplayUrl = slide.getAttribute("data-preview-display-url");
          if (!previewUrl) return;
          openPreview(previewUrl, previewDisplayUrl);
        });
      });

      realisationsCarousel.addEventListener("mouseenter", stopRealisationsAutoplay);
      realisationsCarousel.addEventListener("mouseleave", startRealisationsAutoplay);
      realisationsCarousel.addEventListener("focusin", stopRealisationsAutoplay);
      realisationsCarousel.addEventListener("focusout", (event) => {
        if (realisationsCarousel.contains(event.relatedTarget)) return;
        startRealisationsAutoplay();
      });

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          stopRealisationsAutoplay();
          return;
        }
        startRealisationsAutoplay();
      });

      window.addEventListener("resize", () => {
        const nextViewportMode = getRealisationsViewportMode();
        if (nextViewportMode === currentViewportMode) return;
        updateRealisations();
      });

      updateRealisations();
      startRealisationsAutoplay();
    }
  }

  document.querySelectorAll(".video-hero-content").forEach((v) => {
    v.setAttribute("autoplay", "");
    v.muted = true;

    const ensureAutoplay = () => {
      if (!v.play) return;
      const playPromise = v.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    };

    if (v.readyState >= 2) {
      ensureAutoplay();
      return;
    }

    v.addEventListener("loadeddata", ensureAutoplay, { once: true });
  });

  const players = document.querySelectorAll(".video-hero-player");
  if (!players.length) return;

  players.forEach((player) => {
    const controls = player.querySelector(".video-hero-controls");
    const video = player.querySelector(".video-hero-content");
    const playBtn = player.querySelector('[data-action="toggle-play"]');
    const soundBtn = player.querySelector('[data-action="toggle-sound"]');
    const seekInput = player.querySelector('[data-action="seek"]');

    if (!video || !playBtn || !soundBtn || !seekInput || !controls) return;

    const playIcon = playBtn.querySelector("i");
    const soundIcon = soundBtn.querySelector("i");
    const fullscreenBtn = document.createElement("button");
    fullscreenBtn.type = "button";
    fullscreenBtn.className = "video-control-btn";
    fullscreenBtn.setAttribute("aria-label", "Passer en plein ecran");
    fullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
    controls.appendChild(fullscreenBtn);
    const fullscreenIcon = fullscreenBtn.querySelector("i");
    const unmuteHint = document.createElement("button");
    unmuteHint.type = "button";
    unmuteHint.className = "video-unmute-hint";
    unmuteHint.innerHTML = '<i class="fa-solid fa-volume-xmark"></i><span>Activer le son</span>';
    unmuteHint.setAttribute("aria-label", "Activer le son");
    player.appendChild(unmuteHint);

    const syncPlayState = () => {
      const paused = video.paused;
      if (playIcon) {
        playIcon.classList.toggle("fa-play", paused);
        playIcon.classList.toggle("fa-pause", !paused);
      }
      playBtn.setAttribute("aria-label", paused ? "Lire la video" : "Mettre en pause");
    };

    const syncSoundState = () => {
      const muted = video.muted;
      if (soundIcon) {
        soundIcon.classList.toggle("fa-volume-xmark", muted);
        soundIcon.classList.toggle("fa-volume-high", !muted);
      }
      soundBtn.setAttribute("aria-label", muted ? "Activer le son" : "Couper le son");
      unmuteHint.classList.toggle("is-hidden", !muted);
    };

    const syncProgress = () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      const percent = (video.currentTime / video.duration) * 100;
      seekInput.value = String(percent);
      seekInput.style.setProperty("--progress", `${percent}%`);
    };

    const isFullscreenActive = () => {
      return document.fullscreenElement === player || document.webkitFullscreenElement === player;
    };

    const syncFullscreenState = () => {
      const active = isFullscreenActive();
      if (fullscreenIcon) {
        fullscreenIcon.classList.toggle("fa-expand", !active);
        fullscreenIcon.classList.toggle("fa-compress", active);
      }
      fullscreenBtn.setAttribute("aria-label", active ? "Quitter le plein ecran" : "Passer en plein ecran");
    };

    playBtn.addEventListener("click", async () => {
      if (video.paused) {
        try {
          await video.play();
        } catch (_) {
          return;
        }
      } else {
        video.pause();
      }
      syncPlayState();
    });

    video.addEventListener("click", async () => {
      if (video.paused) {
        try {
          await video.play();
        } catch (_) {
          return;
        }
      } else {
        video.pause();
      }
      syncPlayState();
    });

    soundBtn.addEventListener("click", () => {
      video.muted = !video.muted;
      syncSoundState();
    });

    unmuteHint.addEventListener("click", () => {
      video.muted = false;
      syncSoundState();
    });

    fullscreenBtn.addEventListener("click", async () => {
      if (isFullscreenActive()) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        syncFullscreenState();
        return;
      }

      if (player.requestFullscreen) {
        await player.requestFullscreen();
      } else if (player.webkitRequestFullscreen) {
        player.webkitRequestFullscreen();
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
      syncFullscreenState();
    });

    seekInput.addEventListener("input", () => {
      if (!video.duration || Number.isNaN(video.duration)) return;
      const percent = Number(seekInput.value);
      seekInput.style.setProperty("--progress", `${percent}%`);
      const target = (percent / 100) * video.duration;
      video.currentTime = target;
    });

    video.addEventListener("play", syncPlayState);
    video.addEventListener("pause", syncPlayState);
    video.addEventListener("timeupdate", syncProgress);
    video.addEventListener("loadedmetadata", syncProgress);
    video.addEventListener("volumechange", syncSoundState);
    document.addEventListener("fullscreenchange", syncFullscreenState);
    document.addEventListener("webkitfullscreenchange", syncFullscreenState);

    syncPlayState();
    syncSoundState();
    syncFullscreenState();
    seekInput.style.setProperty("--progress", "0%");
    syncProgress();
  });
});




// Avis
const assetBase = "https://msd-media.com/assets";
const avisLeft = [
  {
    text: "MSD MEDIA m’a vraiment impressionné par son professionnalisme et sa créativité. Maxens a su comprendre mes besoins rapidement et transformer mes idées en une landing page claire, moderne et efficace. Communication fluide et résultat à la hauteur de mes attentes.",
    photo: `${assetBase}/img/profiles/julian.webp`,
    name: "Julian",
    desc: "Client MSD Media",
  },
  {
    text: "Une superbe expérience avec les conseils avisés de Maxens qui met à disposition tout son énergie créative et positive. Le résultat de la landing page est bluffant. Nous recommandons fortement !",
    photo: `${assetBase}/img/profiles/gerald.webp`,
    name: "Gerald Debaud",
    desc: "Fondateur de l'Agence 3XL",
  },
  {
    text: "J’ai travaillé avec Maxens sur la création de notre landing page, et il a su immédiatement capter notre besoin : une page qui convertit. Ultra réactif, toujours à l’écoute, et un résultat parfaitement aligné avec nos attentes.",
    photo: `${assetBase}/img/profiles/pierre.webp`,
    name: "Pierre Aliaga",
    desc: "Co-Fondateur de Nation",
  },
  {
    text: "J’ai fait appel à Maxens pour refaire mon site web à un moment où j’avais besoin de clarté. En moins d’une semaine, il a compris parfaitement mon besoin et m’a proposé un design clair et efficace. Le résultat est exceptionnel et j’ai eu des retours positifs dès le lancement.",
    photo: `${assetBase}/img/profiles/maxime.webp`,
    name: "Maxime Sciare",
    desc: "Coach & Conférencier",
  },
];

const avisRight = [
  {
    text: "Après avoir galéré à créer moi-même mon site, j’ai fait appel à Maxens qui a fait un super travail. Un site simple, efficace, et parfaitement adapté à mes besoins. Process clair et rapide. Je recommande fortement.",
    photo: `${assetBase}/img/profiles/zoltan.webp`,
    name: "Zoltàn Mayer",
    desc: "Client MSD Media",
  },
  {
    text: "Il a pu me faire un site sur mesure dans un délai très court. Le résultat est top, loin des structures copiées-collées. Je recommande fortement ses services.",
    photo: `${assetBase}/img/profiles/cedric.webp`,
    name: "Cédric Wyplata",
    desc: "Coach Sommeil",
  },
  {
    text: "Maxens a conçu mon site avec une écoute rare, une présence constante et un sens du détail impressionnant. Chaque élément est pensé pour guider, raconter et convertir. Ce n’est pas un site, c’est un outil vivant. Merci Maxens 🙏",
    photo: `${assetBase}/img/profiles/laurence.webp`,
    name: "Laurence Daien Maestripieri",
    desc: "Coach en prise de parole",
  },
];

const trackLeft = document.getElementById("track-left");

function createAvisCard(item) {
  const div = document.createElement("div");
  div.classList.add("avis-card");
  div.innerHTML = `
    <div class="avis-header">
      <img src="${assetBase}/img/icon-citation.webp" alt="Icône citation bleue">
      <div class="avis-stars" aria-hidden="true">
        <img src="${assetBase}/img/stars.svg" alt="">
      </div>
    </div>
    <p>${item.text}</p>
    <div class="avis-author">
      <img src="${item.photo}" alt="${item.name}" class="avis-photo">
      <div class="avis-info">
        <div class="avis-name">${item.name}</div>
        <div class="avis-description">${item.desc}</div>
      </div>
    </div>
  `;
  return div;
}

if (trackLeft) {
  const mergedAvis = [...avisLeft, ...avisRight];
  const cards = [...mergedAvis, ...mergedAvis].map(createAvisCard);
  trackLeft.replaceChildren(...cards);
}

// Animation GSAP du manifesto — chargement différé au premier scroll
function initManifestoAnimation() {
  const manifestoSection = document.querySelector(".scroll-manifesto");
  const manifestoText = document.querySelector("[data-scroll-manifesto-text]");
  if (!manifestoSection || !manifestoText) return;
  if (!window.gsap || !window.ScrollTrigger) return;
  window.gsap.registerPlugin(window.ScrollTrigger);

  const lineHtml = (manifestoText.innerHTML || "")
    .split(/<br\s*\/?>/i)
    .map((line) => line.replace(/&nbsp;/g, " ").trim())
    .filter(Boolean);
  if (!lineHtml.length) return;

  manifestoText.innerHTML = lineHtml
    .map((line, lineIndex) => {
      const lineWords = line.split(/\s+/);
      const lineContent = lineWords
        .map((word) => {
          const normalized = word
            .toLowerCase()
            .replace(/[.,!?;:]/g, "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          const isMuted = normalized === "oublies" || normalized === "graves";
          const wordClass = isMuted ? "scroll-manifesto__word scroll-manifesto__word--muted" : "scroll-manifesto__word";
          return `<span class="${wordClass}">${word}&nbsp;</span>`;
        })
        .join("");

      if (lineIndex === lineHtml.length - 1) return lineContent;
      return `${lineContent}<span class="scroll-manifesto__break" aria-hidden="true"></span>`;
    })
    .join("");

  const wordNodes = manifestoText.querySelectorAll(".scroll-manifesto__word");
  if (!wordNodes.length) return;

  wordNodes.forEach((n) => { n.style.willChange = "transform, opacity, filter"; });

  const revealTl = window.gsap.timeline({
    scrollTrigger: {
      trigger: manifestoSection,
      start: "top 90%",
      end: "top  5%",
      scrub: 0.45,
      invalidateOnRefresh: true,
      onLeave: () => wordNodes.forEach((n) => { n.style.willChange = "auto"; }),
      onLeaveBack: () => wordNodes.forEach((n) => { n.style.willChange = "auto"; })
    }
  });

  revealTl.fromTo(wordNodes, {
    opacity: 0.14,
    y: 24,
    filter: "blur(10px)"
  }, {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    duration: 1.05,
    ease: "none",
    stagger: 0.24
  });
}

// Chargement GSAP uniquement au premier scroll (économie bande passante au chargement)
(function() {
  if (!document.querySelector(".scroll-manifesto")) return;
  var loaded = false;
  function loadGsap() {
    if (loaded) return;
    loaded = true;
    var s1 = document.createElement("script");
    s1.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
    s1.crossOrigin = "anonymous";
    s1.onload = function() {
      var s2 = document.createElement("script");
      s2.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js";
      s2.crossOrigin = "anonymous";
      s2.onload = initManifestoAnimation;
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);
  }
  window.addEventListener("scroll", loadGsap, { passive: true, once: true });
  // Fallback : charger après 3s si pas encore scrollé
  setTimeout(loadGsap, 3000);
})();

// Année du copyright dynamique
document.querySelectorAll(".copyright-year").forEach(function(el) {
  el.textContent = new Date().getFullYear();
});

// Bouton Cal.com flottant — modal iframe téléphone
(function() {
  if (window.innerWidth <= 768) return;
  var path = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
  var blockedPrefixes = [
    "/404",
    "/blog",
    "/etudes-de-cas",
    "/recrutement",
    "/affiliation",
    "/configurateur",
    "/confirmation",
    "/confirmation-reservation-appel"
  ];
  var shouldRenderCalPopup = !blockedPrefixes.some(function(prefix) {
    return path === prefix || path.indexOf(prefix + "/") === 0;
  });

  if (!shouldRenderCalPopup) {
    return;
  }

  var CAL_URL = "https://cal.com/maxens-soldan-msd-media/30min?embed=true&embedType=inline&layout=month_view";

  // Overlay + modal
  var overlay = document.createElement("div");
  overlay.className = "cal-modal-overlay";
  overlay.hidden = true;
  overlay.innerHTML =
    '<div class="cal-modal" role="dialog" aria-modal="true" aria-label="Prendre rendez-vous">' +
      '<button class="cal-modal__close" aria-label="Fermer">&#x2715;</button>' +
      '<iframe id="cal-iframe" src="' + CAL_URL + '" title="Prendre rendez-vous" loading="lazy"></iframe>' +
    '</div>';
  document.body.appendChild(overlay);

  // Bouton flottant
  var btn = document.createElement("button");
  btn.className = "cal-float-btn";
  btn.type = "button";
  btn.setAttribute("aria-label", "Prendre rendez-vous");
  btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  document.body.appendChild(btn);

  function openModal() {
    overlay.hidden = false;
    overlay.classList.add("cal-modal-overlay--open");
  }

  function closeModal() {
    overlay.classList.remove("cal-modal-overlay--open");
    overlay.hidden = true;
  }

  btn.addEventListener("click", openModal);
  overlay.querySelector(".cal-modal__close").addEventListener("click", closeModal);
  overlay.addEventListener("click", function(e) {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") closeModal();
  });

  setTimeout(function() {
    btn.classList.add("cal-float-btn--visible");
    openModal();
  }, 5000);
})();

// Lazy-load des vidéos data-lazy-video : la source ne se charge qu'à l'approche
// du viewport (économise ~3 Mo au chargement initial sur les pages avec vidéo).
(function () {
  var vids = document.querySelectorAll("video[data-lazy-video]");
  if (!vids.length) return;
  function hydrate(v) {
    v.querySelectorAll("source[data-src]").forEach(function (s) {
      s.src = s.getAttribute("data-src");
      s.removeAttribute("data-src");
    });
    v.load();
    v.play().catch(function () {});
  }
  // Hydratation seulement après l'événement load : le poster (léger) se peint
  // tôt et reste le candidat LCP, la vidéo ne monopolise pas la bande passante
  // pendant le chargement critique de la page.
  function observeAll() {
    if (!("IntersectionObserver" in window)) {
      vids.forEach(hydrate);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          io.unobserve(e.target);
          hydrate(e.target);
        }
      });
    }, { rootMargin: "400px" });
    vids.forEach(function (v) { io.observe(v); });
  }
  if (document.readyState === "complete") {
    observeAll();
  } else {
    window.addEventListener("load", function () {
      window.setTimeout(observeAll, 300);
    });
  }
})();
