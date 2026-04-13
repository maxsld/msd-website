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

// Animations d’apparition
document.addEventListener("DOMContentLoaded", () => {
  const fadeInRightElements = document.querySelectorAll(".animate-fade-in");
  const fadeInOpacityElements = document.querySelectorAll(".animate-fade-opacity");
  const delayBetween = 150;

  const handleIntersection = (elements, animationName) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting && !entry.target.classList.contains("animated")) {
            entry.target.classList.add("animated");
            setTimeout(() => {
              entry.target.style.animation = `${animationName} 1s ease forwards`;
            }, index * delayBetween);
          }
        });
      },
      { threshold: 0.1 }
    );
    elements.forEach((el) => observer.observe(el));
  };

  handleIntersection(fadeInRightElements, "fadeInRightBlur");
  handleIntersection(fadeInOpacityElements, "fadeInOpacity");
});

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
      words: ["inoubliables.", "qui convertissent.", "sur mesure.", "qui performent.", "sans template."]
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
  const GOOGLE_TRANSLATE_COOKIE_KEY = "googtrans";
  const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

  const setCookie = (name, value, maxAgeSeconds) => {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  };

  const setRawCookie = (name, value, maxAgeSeconds) => {
    document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
    const host = window.location.hostname;
    if (!host || host === "localhost" || /^[0-9.]+$/.test(host)) return;
    document.cookie = `${name}=${value}; path=/; domain=.${host}; max-age=${maxAgeSeconds}; SameSite=Lax`;
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

  const normalizeLang = (raw) => (raw === "en" ? "en" : "fr");

  const saveLanguagePreference = (lang) => {
    const normalizedLang = normalizeLang(lang);
    setCookie(LANGUAGE_COOKIE_KEY, normalizedLang, ONE_YEAR_SECONDS);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLang);
    } catch (_) {}
  };

  const readLanguagePreference = () => {
    const cookieLang = normalizeLang(getCookie(LANGUAGE_COOKIE_KEY));
    if (cookieLang === "en") return "en";
    try {
      const storedLang = normalizeLang(window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || "");
      if (storedLang === "en") return "en";
    } catch (_) {}
    return "fr";
  };

  const readGoogleTranslateLang = () => {
    const value = getCookie(GOOGLE_TRANSLATE_COOKIE_KEY);
    const match = value.match(/^\/fr\/([a-z]{2})$/i);
    return normalizeLang(match ? match[1].toLowerCase() : "");
  };

  const saveGoogleTranslatePreference = (lang) => {
    const normalizedLang = normalizeLang(lang);
    setRawCookie(GOOGLE_TRANSLATE_COOKIE_KEY, `/fr/${normalizedLang}`, ONE_YEAR_SECONDS);
  };

  const ensureTranslateContainer = () => {
    let container = document.getElementById("google_translate_element");
    if (container) return container;
    container = document.createElement("div");
    container.id = "google_translate_element";
    container.style.position = "fixed";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "1px";
    container.style.height = "1px";
    container.style.overflow = "hidden";
    document.body.appendChild(container);
    return container;
  };

  const ensureGoogleTranslateScript = () => {
    if (window.__msdGoogleTranslateReady) return;
    ensureTranslateContainer();

    window.googleTranslateElementInit = () => {
      if (window.__msdGoogleTranslateReady) return;
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "fr",
            includedLanguages: "fr,en",
            autoDisplay: false
          },
          "google_translate_element"
        );
        window.__msdGoogleTranslateReady = true;
      } catch (_) {}
    };

    if (window.google && window.google.translate && window.google.translate.TranslateElement) {
      window.googleTranslateElementInit();
      return;
    }

    if (document.getElementById("google-translate-script")) return;
    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.head.appendChild(script);
  };

  const stopHeroWordRotation = () => {
    if (heroWordIntervalId) {
      clearInterval(heroWordIntervalId);
      heroWordIntervalId = null;
    }
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

    ruler.textContent = word;
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
      heroWord.textContent = nextWord;
      heroWord.classList.remove("is-leaving", "is-entering");
      return;
    }

    heroWord.classList.remove("is-entering");
    heroWord.classList.add("is-leaving");

    window.setTimeout(() => {
      heroWord.textContent = nextWord;
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

    heroWordLang = lang;
    heroWordIndex = 0;
    heroLead.textContent = wordSet.lead;
    swapHeroWord(wordSet.words[heroWordIndex], false);

    stopHeroWordRotation();
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

  const preferredLang = "fr";
  saveLanguagePreference(preferredLang);
  saveGoogleTranslatePreference(preferredLang);

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

  window.addEventListener("resize", () => {
    if (!heroWord || !heroWordWrap) return;
    const currentWidth = measureHeroWordWidth(heroWord.textContent || "");
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

  const logoTrack = document.querySelector(".logo-marquee__track");
  const clientLogos = [
    { src: "https://msd-media.com/assets/img/logo-track1.webp", alt: "Logo client 1" },
    { src: "https://msd-media.com/assets/img/logo-track2.webp", alt: "Logo client 2" },
    { src: "https://msd-media.com/assets/img/logo-track3.webp", alt: "Logo client 3" },
    { src: "https://msd-media.com/assets/img/logo-track4.webp", alt: "Logo client 4" },
    { src: "https://msd-media.com/assets/img/logo-track5.webp", alt: "Logo client 5" },
    { src: "https://msd-media.com/assets/img/logo-track6.webp", alt: "Logo client 6" },
    { src: "https://msd-media.com/assets/img/logo-track7.webp", alt: "Logo client 7", className: "logo-marquee__img--carroz" },
    { src: "https://msd-media.com/assets/img/logo-track8.webp", alt: "Logo client 8" },
    { src: "https://msd-media.com/assets/img/logo-track9.webp", alt: "Logo client 9" }
  ];

  if (logoTrack) {
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

    const logos = [
      ...clientLogos.map((logo) => buildLogo(logo)),
      ...clientLogos.map((logo) => buildLogo(logo, true))
    ];
    logoTrack.replaceChildren(...logos);
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

    const closePreview = () => {
      if (!previewModal || !previewIframe) return;
      if (!previewModal.classList.contains("is-open")) return;

      previewModal.classList.remove("is-open");
      previewModal.classList.add("is-closing");
      previewModal.setAttribute("aria-hidden", "true");
      syncBodyScrollLock();

      if (previewCloseTimeoutId) {
        window.clearTimeout(previewCloseTimeoutId);
      }

      previewCloseTimeoutId = window.setTimeout(() => {
        previewModal.classList.remove("is-closing");
        previewIframe.src = "";
      }, PREVIEW_CLOSE_DURATION);
    };

    const openPreview = (url, displayUrl) => {
      if (!previewModal || !previewIframe || !url) return;

      if (previewCloseTimeoutId) {
        window.clearTimeout(previewCloseTimeoutId);
        previewCloseTimeoutId = null;
      }

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

    const closePreview = () => {
      if (!previewModal) return;
      if (!previewModal.classList.contains("is-open")) return;

      previewModal.classList.remove("is-open");
      previewModal.classList.add("is-closing");
      previewModal.setAttribute("aria-hidden", "true");
      syncBodyScrollLock();

      if (previewCloseTimeoutId) {
        window.clearTimeout(previewCloseTimeoutId);
      }

      previewCloseTimeoutId = window.setTimeout(() => {
        previewModal.classList.remove("is-closing");
        if (previewIframe) previewIframe.src = "";
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
      let autoplayIntervalId = null;

      const updateRealisations = () => {
        const total = realisationSlides.length;
        realisationSlides.forEach((slide, index) => {
          let diff = index - currentIndex;
          if (diff > total / 2) diff -= total;
          if (diff < -total / 2) diff += total;

          slide.classList.remove("is-prev", "is-active", "is-next", "is-far-left", "is-far-right");

          if (diff === 0) {
            slide.classList.add("is-active");
          } else if (diff === -1) {
            slide.classList.add("is-prev");
          } else if (diff === 1) {
            slide.classList.add("is-next");
          } else if (diff < -1) {
            slide.classList.add("is-far-left");
          } else {
            slide.classList.add("is-far-right");
          }
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
        if (!autoplayIntervalId) return;
        window.clearInterval(autoplayIntervalId);
        autoplayIntervalId = null;
      };

      startRealisationsAutoplay = () => {
        if (autoplayIntervalId) return;
        if (document.hidden) return;
        if (previewModal && previewModal.classList.contains("is-open")) return;
        autoplayIntervalId = window.setInterval(goNext, AUTOPLAY_DELAY);
      };

      const restartRealisationsAutoplay = () => {
        stopRealisationsAutoplay();
        startRealisationsAutoplay();
      };

      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          goNext();
          restartRealisationsAutoplay();
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
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
          const isMuted = normalized === "20" || normalized === "secondes" || normalized === "graves";
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
