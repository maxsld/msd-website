(function () {
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
      <img src="${assetBase}/img/icon-citation.webp" alt="Icône citation bleue" width="32" height="32" loading="lazy" decoding="async">
      <div class="avis-stars" aria-hidden="true">
        <img src="${assetBase}/img/stars.svg" alt="">
      </div>
    </div>
    <p>${item.text}</p>
    <div class="avis-author">
      <img src="${item.photo}" alt="${item.name}" class="avis-photo" width="50" height="50" loading="lazy" decoding="async">
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
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) { loadGsap(); return; }
  var observer = new IntersectionObserver(function(entries) {
    if (entries.some(function(entry) { return entry.isIntersecting; })) {
      observer.disconnect();
      loadGsap();
    }
  }, { rootMargin: '300px' });
  observer.observe(document.querySelector('.scroll-manifesto'));
})();


})();
