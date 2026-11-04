---
name: msd-design-system
description: >
  Design system complet du site msd-media.com (couleurs, typographie, border-radius, header, footer,
  composants réutilisables) extrait de la home page et des pages existantes. Invoque ce skill à chaque
  fois que l'utilisateur crée une nouvelle page sur le site MSD Media, demande "crée une page", "nouvelle
  page", "fais une page comme les autres", "respecte le design du site", ou plus généralement dès qu'un
  fichier HTML doit être ajouté au repo msd-website. Le skill fournit les tokens de design, le HTML
  copy-paste du header/footer/boilerplate `<head>`, et les patterns de composants (hero, cards, blocs
  alternés, FAQ, CTA IA, booking) à réutiliser tels quels — il ne reste plus qu'à écrire le contenu.
---

# Design system — MSD Media

Référence unique du design system du site, pour créer une nouvelle page en 100% cohérente avec
l'existant sans redevoir tout redéduire à chaque fois. Tout vient de `assets/css/style.css`
(+ `animations.css` / `responsive.css`) et de `index.html` comme page de référence canonique.

**Règle d'or : ne jamais inventer de nouvelles couleurs, tailles ou border-radius.** Tout ce dont une
page a besoin existe déjà ci-dessous ou dans une classe déjà présente dans `style.css`. Si un besoin
ne rentre dans aucun pattern existant, chercher d'abord une classe proche dans `style.css` (`grep`)
avant d'en créer une nouvelle.

---

## 1. Fond de page et thème

Le site est **dark par défaut** :

```css
--global-color-background: #111111;  /* fond de <body>, partout */
```

Une page n'a donc quasiment jamais besoin de définir son propre fond — le body est déjà noir. Les
sections qui doivent être *claires* (FAQ, cartes blanches, ai-proof) définissent explicitement
`background: #ffffff` ou `#f8f8f8` sur leur `<section>`.

## 2. Couleurs

```css
--global-color-white: rgb(247, 245, 246);   /* blanc principal (texte sur fond sombre) */
--global-color-black: #0f0f0f;              /* noir principal (texte sur fond clair, boutons) */
--global-color-background: #111111;         /* fond de page */
--global-color-gray: #cecece;
--global-color-dark-gray: #383838;
--global-color-light-gray: #555;
--global-color-dark: rgba(27, 27, 27, 0.95);
--global-color-blue: #1b44fe;               /* variable définie mais peu utilisée directement */
```

**Bleu CTA réel** (celui qu'on voit sur le site) : `#2f6bff` — appliqué via l'override
`.home-page .hero__btn--primary { background: #2f6bff; border-radius: 0.2rem; }`. C'est LA couleur
d'accent du site pour les boutons d'action primaires. Ne pas utiliser `--global-color-blue` (#1b44fe)
qui est plus foncé et n'apparaît quasiment nulle part à l'écran.

Couleurs de texte selon fond :
- Sur fond sombre (`#111111`) : texte blanc `#ffffff` ou `rgba(255,255,255,0.65-0.85)` pour le secondaire.
- Sur fond clair (cartes blanches, `.faq`, `.ai-proof`) : texte `#111`/`#101010` ou `rgba(17,17,17,0.6-0.8)` pour le secondaire.
- Bordures discrètes sur carte blanche : `rgba(17, 17, 17, 0.12)`.
- Bordures discrètes sur fond sombre : `rgba(255, 255, 255, 0.18-0.22)`.

## 3. Polices

```html
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Outfit:wght@100..900&display=swap" rel="stylesheet">
```

- **Inter** — police principale, tout le texte courant, les titres, les boutons.
- **Instrument Serif** — accent chiffré uniquement (grands nombres dans les cartes stats, ex. `.about-metric-card__value`, `.about-timeline-card__date`). Jamais pour du texte courant.
- **Outfit** — chargée mais non utilisée actuellement dans `style.css`. Ne pas s'en servir sauf besoin explicite.

`letter-spacing: -0.05em` est appliqué globalement sur `body` — c'est voulu, ne pas le neutraliser par section.

## 4. Échelle de tailles de police (variables)

```css
--font-xs: clamp(0.8rem, 1vw, 0.9rem);
--font-sm: clamp(0.935rem, 1.2vw, 1rem);
--font-md: clamp(1rem, 1.5vw, 1.05rem);
--font-lg: clamp(1.25rem, 2vw, 1.5rem);
--font-xl: clamp(1.75rem, 3vw, 2.25rem);
--font-xxl: clamp(2.5rem, 5vw, 3.6rem);
--font-hero: clamp(3rem, 7vw, 3.8rem);
```

## 5. Hiérarchie de titres (copier ces tailles, ne pas en inventer d'autres)

| Niveau | Classe | Taille | Usage |
|---|---|---|---|
| H1 hero | `.hero__title` + `.home-page .hero__title` | `clamp(2.35rem, 8vw, 3.75rem)`, blanc, centré, `max-width:19ch` | Titre principal de chaque page (1 par page) |
| H2/H3 section | `.section-title.section-title--dark` (texte sombre, pour fond clair) ou `.section-title--light` (texte blanc, pour fond sombre) | `clamp(2rem, 3.8vw, 3.8rem)`, weight 600 | Titre de grande section (FAQ, Méthode, Valeurs, Avis…) |
| Eyebrow / tag | `.section-tag.section-tag--dark` ou `--light` | `0.85rem`, weight 600, `border-radius:0.2rem` | Petit label au-dessus d'un H1/H2 ("À propos", "Méthode"…) |
| H2 bloc alterné | `.about-alt-text h2` (pattern `content-alt-section`) | `clamp(1.3rem, 2.4vw, 1.75rem)`, weight 600 | Titre d'un bloc image+texte alterné |
| H4 carte | `.process-step h4` / `.about-value-card h4` / `.about-signal-card h4` | `clamp(1.02rem, 1.9vw, 1.22rem)` à `1.02rem` | Titre à l'intérieur d'une card |

`section-tag--dark`/`section-title--dark` = texte **sombre**, à utiliser seulement sur fond **clair**.
`--light` = texte **blanc**, à utiliser sur fond **sombre** (donc `--light` est le choix par défaut
puisque le body est sombre partout, sauf si la section a explicitement un fond blanc).

## 6. Border-radius (échelle fixe, ne pas improviser)

| Valeur | Usage |
|---|---|
| `0.2rem` | Le standard du site : boutons (`hero__btn`, `contact-button`), images dans les blocs alternés (`.home-page .about-alt-img img`), cards de blog (`.blog-card`), et **tous les tags sans exception** (`.section-tag`, `.blog-card__tag`, `.blog-featured__tag`, `.case-study-card__tag`, `.feature-tag-main-second-page`) |
| `999px` (pill) | **Uniquement** les formes rondes : avatars, dots de pagination. **Jamais un tag.** |
| `1.25rem` | Cards contenu blanc (`.about-metric-card`, `.about-value-card`, `.about-signal-card`, `.about-testimonial-card`) |
| `1.5rem` | Images des blocs alternés dans le pattern `.about-alt-img img` (version non `home-page`) |
| `2rem` | Cards process (`.process-step`), boutons pill alternatifs |

Sur les pages avec `body class="home-page"` (donc quasi toutes), les boutons et images de blocs alternés
sont forcés à `0.2rem` via les overrides `.home-page .hero__btn--primary/secondary` et
`.home-page .about-alt-img img` — c'est le rendu final à reproduire.

## 7. Layout & espacement

- Conteneur standard : `max-width: 1200px; margin: 0 auto; padding: 0 3rem;` (1.2rem sur mobile ≤680px).
- Entre deux grandes sections (`.section-grid + .section-grid`) : `margin-top: 10rem` (desktop), moins sur mobile.
- Pattern bloc alterné (`content-alt-section`) : `padding: 4rem 3rem 1.2rem`, blocs `.about-alt-block { display:flex; gap:6rem; align-items:center }`, `gap:3rem` entre blocs sur `home-page`/`sector-page`/`about-page`, `flex-direction: row-reverse` via `.about-alt-block--reverse` pour alterner gauche/droite.
- Grilles de cards : `display:grid; grid-template-columns:repeat(3 ou 4, minmax(0,1fr)); gap:1rem` (desktop) → 2 colonnes ≤980px → 1 colonne ≤680px.

## 8. Composants réutilisables

### 8.1 Bannière d'annonce (top, toutes les pages)

```html
<div class="top-announcement" role="banner">
  <span class="top-announcement__badge" data-i18n="announcement_badge">Nouveau</span>
  <span class="top-announcement__text" data-i18n="announcement_text">Recommandez MSD Media et percevez 15% sur chaque projet signé.</span>
  <a class="top-announcement__link" href="https://msd-media.com/affiliation/" data-i18n="announcement_link">Découvrir le programme</a>
</div>
```

### 8.2 Hero (pattern standard, 1 par page)

```html
<section class="hero">
  <p class="section-tag section-tag--dark">Eyebrow</p>
  <h1 class="hero__title"><span>Titre principal</span></h1>
  <p class="hero__subheading">Sous-titre d'une phrase, contexte de la page.</p>
  <div class="hero__actions" aria-label="Actions principales">
    <a class="hero__btn hero__btn--primary" href="https://msd-media.com/reserver-un-appel/">Réserver un appel</a>
    <a class="hero__btn hero__btn--secondary" href="...">Action secondaire</a>
  </div>
</section>
```

### 8.3 Bloc alterné image/texte (`content-alt-section`) — LE pattern le plus réutilisé

```html
<section class="section-grid content-alt-section" id="mon-id" aria-label="Description">
  <article class="about-alt-block">
    <div class="about-alt-img">
      <img src="https://msd-media.com/assets/img/xxx.webp" alt="Description précise" loading="lazy" decoding="async">
    </div>
    <div class="about-alt-text">
      <h2>Titre du bloc</h2>
      <p>Paragraphe.</p>
      <p>Deuxième paragraphe optionnel.</p>
    </div>
  </article>

  <article class="about-alt-block about-alt-block--reverse">
    <!-- même structure, image à droite cette fois -->
  </article>
</section>
```

Règles : jamais de `<span class="section-tag">` dans `.about-alt-text` sur ce pattern (repéré et retiré
partout, cf. pages villes) — on va direct au `<h2>`. Toujours des images réelles et pertinentes au sujet
du bloc (jamais `img-cover.webp` générique, jamais une image déjà utilisée 2x ailleurs sur la même page).

### 8.4 Cards stats/valeurs (grille 3-4 colonnes)

```html
<section class="about-values section-grid" id="valeurs" aria-label="...">
  <h2 class="section-tag section-tag--light">Label</h2>
  <h3 class="section-title section-title--light">Titre de section</h3>
  <div class="about-values-grid">
    <article class="about-value-card">
      <p class="about-value-card__num">01</p>
      <h4>Nom</h4>
      <p class="about-value-card__quote">« Citation courte en italique. »</p>
      <p>Description factuelle, appuyée sur une vraie preuve du site (avis, chiffre, délai...).</p>
    </article>
    <!-- répéter -->
  </div>
</section>
```

(CSS déjà présent dans les pages qui l'utilisent, ex. `a-propos/index.html` — copier le bloc `<style>`
correspondant `.about-values`/`.about-value-card` si la page n'a pas encore ces classes chargées.)

### 8.5 Section presse ("reconnu par…")

Réutiliser tel quel le pattern `founder-section` avec `id="agence"` (l'ID déclenche le CSS grid 2
colonnes + fond adapté, indispensable — sans lui la mise en page casse) :

```html
<section class="section-grid founder-section" id="agence" aria-label="MSD Media dans la presse">
  <div class="founder-inner">
    <div class="founder-video-card">
      <a href="https://msd-media.com/blog/articles/msd-media-presse-le-dauphine/" class="founder-video-link">
        <img width="600" height="338" src="../assets/img/mockup-img-dauphine.png" alt="Article du Dauphiné Libéré sur MSD Media" class="founder-video-thumb" loading="lazy" decoding="async">
      </a>
    </div>
    <div class="founder-quote">
      <p class="founder-text">« Citation de l'article. »</p>
      <a href="..." class="contact-button founder-cta">
        <span class="cta-text">Lire l'article</span> <i class="fa-solid fa-arrow-right"></i>
      </a>
    </div>
  </div>
</section>
```

### 8.6 FAQ (fond blanc, `<section class="faq">`)

```html
<section class="faq section-grid" id="faq">
  <div class="faq-container">
    <h2 class="section-tag section-tag--dark">FAQ</h2>
    <h3 class="section-title section-title--dark">Questions fréquentes</h3>
    <div class="faq-item">
      <button class="faq-question" aria-expanded="false">
        <span>Question ?</span>
        <span class="icon">+</span>
      </button>
      <div class="faq-answer"><p>Réponse.</p></div>
    </div>
    <!-- répéter -->
  </div>
</section>
```

### 8.7 CTA "demande à ChatGPT/Claude" (`ai-proof`, fond clair `#f8f8f8`)

```html
<section class="ai-proof section-grid" id="ai-proof">
  <div class="ai-proof__inner">
    <img class="ai-proof__msd-logo" src="https://msd-media.com/assets/img/logo-black.webp" alt="MSD Media" loading="lazy" decoding="async">
    <h3 class="section-title section-title--dark" data-i18n="ai_proof_title">Toujours pas sûr que MSD Media soit fait pour vous ?</h3>
    <p class="ai-proof__lead" data-i18n="ai_proof_lead">Laissez ChatGPT ou Claude réfléchir pour vous.</p>
    <div class="ai-proof__actions">
      <a class="hero__btn hero__btn--primary ai-proof__btn ai-proof__btn--chatgpt" href="https://chatgpt.com/?q=..." target="_blank" rel="noopener noreferrer">
        <img class="ai-proof__logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/960px-ChatGPT-Logo.svg.png" alt="" width="18" height="18" loading="lazy" decoding="async">
        <span data-i18n="ai_proof_chatgpt">Demander à ChatGPT</span>
      </a>
      <a class="hero__btn hero__btn--primary ai-proof__btn ai-proof__btn--claude" href="https://claude.ai/new?q=..." target="_blank" rel="noopener noreferrer">
        <img class="ai-proof__logo" src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Claude_AI_symbol.svg" alt="" width="18" height="18" loading="lazy" decoding="async">
        <span data-i18n="ai_proof_claude">Demander à Claude</span>
      </a>
    </div>
  </div>
</section>
```

### 8.8 Réservation (embed Cal.com, à mettre en dernier avant le footer)

```html
<section class="booking-section" id="rdv">
  <div class="booking-section__inner">
    <div class="booking-section__embed">
      <iframe src="https://cal.com/maxens-soldan-msd-media/30min?embed=true&theme=dark" title="Prendre rendez-vous avec MSD Media" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </div>
  </div>
</section>
```

### 8.9 Marquee logos clients (auto-rempli par `script.js`, rien à coder)

```html
<div class="logo-marquee" aria-label="Logos clients">
  <div class="logo-marquee__track"></div>
</div>
```

## 9. Classes `<body>` — laquelle choisir

| Classe | Effet | Quand l'utiliser |
|---|---|---|
| `home-page` | Active TOUS les overrides "fond sombre" (hero blanc, boutons bleus 0.2rem, blocs alternés en blanc sur fond noir…) | **Par défaut pour toute nouvelle page classique** (page métier, page ville, page à propos, etc.) |
| `about-page` | Ajoute des styles spécifiques à `/a-propos/` en plus de `home-page` (combiner `class="home-page about-page"`) | Uniquement `/a-propos/` |
| `blog-index-page` | Grille d'articles, recherche, filtres, fond du grid forcé en `#111111` | Uniquement `/blog/` |
| `blog-article-page` | Layout article : sommaire, contenu markdown, partage, auteur | Tout article de blog |
| `case-study-page` | Layout étude de cas | Pages `/realisations/{slug}/` |
| `realisations-page` | Page listant toutes les réalisations | `/realisations/` |
| `contact-new-page`, `pricing-page`, `affiliate-page`, `recruit-page`, `press-page`, `page-404` | Pages uniques dédiées | Ne pas réutiliser ailleurs |

**Par défaut, toute nouvelle page de contenu (page métier, page ville, page thématique) doit avoir
`<body class="home-page">`** — c'est ce qui active tout le design system dark décrit ci-dessus. Oublier
cette classe est LA cause n°1 de texte invisible (texte sombre sur fond sombre) constatée sur ce site.

## 10. Header (copier tel quel, adapter uniquement le lien "actif" si besoin)

```html
<header class="navbar">
  <div class="nav-left">
    <a href="https://msd-media.com/" aria-label="Accueil MSD Media">
      <img height="151" width="372" src="https://msd-media.com/assets/img/logo-black.webp" alt="MSD Media logo" class="logo" loading="eager">
      <span style="position:absolute;left:-9999px;">Accueil MSD Media</span>
    </a>
    <div class="nav-menu" data-nav-menu>
      <button class="nav-menu-toggle" type="button" aria-label="Ouvrir le menu des pages" aria-expanded="false" data-nav-menu-toggle>
        <span class="nav-menu-toggle__arrow" aria-hidden="true"></span>
      </button>
      <div class="nav-menu-dropdown" data-nav-menu-dropdown>
        <button class="nav-menu-close" type="button" aria-label="Fermer le menu" data-nav-menu-close>×</button>
        <a href="https://msd-media.com/" data-i18n="nav_home">Accueil</a>
        <a href="https://msd-media.com/realisations/" data-i18n="nav_realisations">Réalisations</a>
        <a href="https://msd-media.com/blog/" data-i18n="nav_blog">Blog</a>
        <a href="https://msd-media.com/contact/" data-i18n="nav_contact">Contact</a>
        <a href="https://msd-media.com/recrutement/" data-i18n="nav_recruitment">Recrutement</a>
        <a href="https://msd-media.com/affiliation/" data-i18n="nav_affiliation">Affiliation</a>
      </div>
    </div>
  </div>

  <nav class="nav-center" aria-label="Navigation principale">
    <div class="nav-dropdown-item">
      <a href="https://msd-media.com/blog/"><span class="nav-link-label" data-i18n="nav_resources">Ressources</span> <i class="fa-solid fa-chevron-down nav-dropdown-arrow" aria-hidden="true"></i></a>
      <div class="nav-megamenu">
        <div class="nav-megamenu__inner">
          <div class="nav-megamenu__links">
            <a href="https://msd-media.com/blog/" data-i18n="nav_blog">Blog</a>
            <a href="https://msd-media.com/glossaire/" data-i18n="nav_glossary">Glossaire</a>
            <a href="https://msd-media.com/realisations/" data-i18n="nav_realisations">Réalisations</a>
            <a href="https://msd-media.com/recrutement/" data-i18n="nav_recruitment">Recrutement</a>
            <a href="https://msd-media.com/#faq" data-i18n="nav_faq">FAQ</a>
          </div>
          <div class="nav-megamenu__media">
            <img src="https://msd-media.com/assets/img/navbar-img.png" alt="" loading="lazy" decoding="async">
          </div>
        </div>
      </div>
    </div>
    <div class="nav-dropdown-item">
      <a href="https://msd-media.com/#secteurs"><span class="nav-link-label" data-i18n="nav_sector">Secteur</span> <i class="fa-solid fa-chevron-down nav-dropdown-arrow" aria-hidden="true"></i></a>
      <div class="nav-megamenu">
        <div class="nav-megamenu__inner">
          <div class="nav-megamenu__links">
            <a href="https://msd-media.com/site-web-avocat/" data-i18n="nav_lawyers">Avocats &amp; juristes</a>
            <a href="https://msd-media.com/site-web-medecin/" data-i18n="nav_doctors">Médecins &amp; santé</a>
            <a href="https://msd-media.com/site-web-immobilier/" data-i18n="nav_real_estate">Immobilier</a>
            <a href="https://msd-media.com/site-web-restaurant/" data-i18n="nav_restaurants">Restaurants &amp; cafés</a>
            <a href="https://msd-media.com/site-web-artisan/" data-i18n="nav_artisans">Artisans &amp; TPE</a>
            <a href="https://msd-media.com/site-web-architecte/" data-i18n="nav_architects">Architectes</a>
          </div>
          <div class="nav-megamenu__media">
            <img src="https://msd-media.com/assets/img/navbar-img2.png" alt="" loading="lazy" decoding="async">
          </div>
        </div>
      </div>
    </div>
    <a href="https://msd-media.com/realisations/" data-i18n="nav_realisations">Réalisations</a>
    <a href="https://msd-media.com/tarifs/" data-i18n="nav_pricing">Tarifs</a>
  </nav>

  <div class="nav-right">
    <label class="lang-switch" for="lang-select">
      <span class="lang-switch__label">Langue</span>
      <select class="lang-switch__select" id="lang-select" data-lang-select aria-label="Choisir la langue">
        <option value="fr">🇫🇷 FR</option>
        <option value="en">🇬🇧 EN</option>
      </select>
    </label>
    <a href="https://msd-media.com/reserver-un-appel/" class="contact-button" data-i18n="nav_call">Réserver un appel</a>
    <a href="https://wa.me/33783141287" class="whatsapp-nav-button" target="_blank" aria-label="Chat on WhatsApp">
      <i class="fa-brands fa-whatsapp"></i>
    </a>
  </div>
</header>
```

## 11. Footer (COPIER TEL QUEL, mot pour mot — ne jamais improviser)

Rappel important déjà établi sur ce projet : **le footer doit toujours être identique à celui de la
home page, sur chaque page du site, sans exception.** Copier le bloc ci-dessous tel quel (adapter
uniquement les chemins relatifs `../assets/...` selon la profondeur du dossier de la page).

```html
<footer class="site-footer">
  <div class="footer-container">
    <div class="footer-left">
      <img height="151" width="372" src="https://msd-media.com/assets/img/logo-black.webp" alt="Logo MSD Media" class="footer-logo" loading="lazy" decoding="async">
      <p class="footer-contact-text"><span class="footer-contact-title" data-i18n="footer_contact_title">Nous contacter</span><br><a href="mailto:maxens.soldan@msd-media.com">maxens.soldan@msd-media.com</a></p>
    </div>
    <div class="footer-offices">
      <article class="footer-office-card">
        <p class="footer-office-city">Annecy</p>          <p class="footer-office-address">6 Rue Paul Guiton <br> 74000 Annecy, France</p>
      </article>
      <article class="footer-office-card">
        <p class="footer-office-city">Munich</p>          <p class="footer-office-address">Munich, Bavière, Allemagne</p>
      </article>
    </div>
    <div class="footer-contact">
      <div class="footer-social">
        <a href="https://www.linkedin.com/in/maxens-soldan/" target="_blank" aria-label="Profil LinkedIn"><i class="fa-brands fa-linkedin"></i></a>
        <a href="https://instagram.com/" target="_blank" aria-label="Profil Instagram"><i class="fa-brands fa-instagram"></i></a>
        <a href="https://wa.me/33783141287" target="_blank" aria-label="Contacter sur WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
        <a href="mailto:maxens.soldan@msd-media.com" aria-label="E-mail"><i class="fa-solid fa-envelope"></i></a>
      </div>
    </div>
  </div>

  <div class="footer-cities">
    <ul>
      <li><a href="https://msd-media.com/agence-web-annecy/">Annecy</a></li>
      <li><a href="https://msd-media.com/agence-web-chambery/">Chambéry</a></li>
      <li><a href="https://msd-media.com/agence-web-geneve/">Genève</a></li>
      <li><a href="https://msd-media.com/agence-web-lyon/">Lyon</a></li>
      <li><a href="https://msd-media.com/agence-web-strasbourg/">Strasbourg</a></li>
      <li><a href="https://msd-media.com/agence-web-paris/">Paris</a></li>
      <li><a href="https://msd-media.com/agence-web-marseille/">Marseille</a></li>
      <li><a href="https://msd-media.com/agence-web-toulouse/">Toulouse</a></li>
      <li><a href="https://msd-media.com/agence-web-bordeaux/">Bordeaux</a></li>
      <li><a href="https://msd-media.com/agence-web-lille/">Lille</a></li>
      <li><a href="https://msd-media.com/agence-web-nantes/">Nantes</a></li>
      <li><a href="https://msd-media.com/agence-web-montpellier/">Montpellier</a></li>
      <li><a href="https://msd-media.com/agence-web-nice/">Nice</a></li>
      <li><a href="https://msd-media.com/agence-web-rennes/">Rennes</a></li>
      <li><a href="https://msd-media.com/agence-web-clermont-ferrand/">Clermont-Ferrand</a></li>
    </ul>
  </div>

  <div class="footer-columns">
    <div class="footer-column">
      <p class="footer-column__title" data-i18n="footer_col_company">Entreprise</p>
      <ul>
        <li><a href="https://msd-media.com/a-propos/" data-i18n="footer_about">À propos</a></li>
        <li><a href="https://msd-media.com/realisations/" data-i18n="footer_references">Références</a></li>
        <li><a href="https://msd-media.com/tarifs/" data-i18n="nav_pricing">Tarifs</a></li>
        <li><a href="https://msd-media.com/reserver-un-appel/" data-i18n="footer_book_call">Réserver un appel</a></li>
        <li><a href="https://msd-media.com/contact/" data-i18n="footer_contact_commercial">Contact commercial</a></li>
        <li><a href="https://msd-media.com/affiliation/" data-i18n="footer_affiliate">Apporteur d'affaires</a></li>
      </ul>
    </div>
    <div class="footer-column">
      <p class="footer-column__title" data-i18n="footer_col_resources">Ressources</p>
      <ul>
        <li><a href="https://msd-media.com/blog/" data-i18n="nav_blog">Blog</a></li>
        <li><a href="https://msd-media.com/glossaire/" data-i18n="footer_glossary">Glossaire</a></li>
        <li><a href="https://msd-media.com/realisations/" data-i18n="nav_realisations">Réalisations</a></li>
        <li><a href="https://msd-media.com/recrutement/" data-i18n="nav_recruitment">Recrutement</a></li>
        <li><a href="https://msd-media.com/#faq" data-i18n="nav_faq">FAQ</a></li>
      </ul>
    </div>
    <div class="footer-column" id="secteurs">
      <p class="footer-column__title" data-i18n="footer_col_sectors">Secteurs</p>
      <ul>
        <li><a href="https://msd-media.com/site-web-avocat/" data-i18n="nav_lawyers">Avocats & juristes</a></li>
        <li><a href="https://msd-media.com/site-web-medecin/" data-i18n="nav_doctors">Médecins & santé</a></li>
        <li><a href="https://msd-media.com/site-web-immobilier/" data-i18n="nav_real_estate">Immobilier</a></li>
        <li><a href="https://msd-media.com/site-web-restaurant/" data-i18n="nav_restaurants">Restaurants & cafés</a></li>
        <li><a href="https://msd-media.com/site-web-artisan/" data-i18n="nav_artisans">Artisans & TPE</a></li>
        <li><a href="https://msd-media.com/site-web-architecte/" data-i18n="nav_architects">Architectes</a></li>
      </ul>
    </div>
  </div>

  <div class="footer-legal">
    <a href="https://msd-media.com/terms/mentions.html" target="_blank" data-i18n="footer_legal_mentions">Mentions légales</a>
    <a href="https://msd-media.com/terms/politique-confidentialite.html" target="_blank" data-i18n="footer_privacy_policy">Politique de confidentialité</a>
    <a href="https://msd-media.com/terms/cgv.html" target="_blank" data-i18n="footer_terms_sale">Conditions générales de vente</a>
  </div>

  <div class="footer-bottom">
    <p>&copy; <span class="copyright-year">2026</span> <span data-i18n="footer_copyright">MSD Media. Tous droits réservés.</span></p>
  </div>
</footer>
<script src="../assets/js/script.js" defer></script>
```

## 12. Boilerplate `<head>` obligatoire

Toute nouvelle page doit inclure, dans cet ordre :

1. **Meta de base** : `charset`, `viewport`, `title`, `description`, `robots`, `canonical`, `hreflang` (fr-FR + x-default).
2. **Favicons** : `favicon-96x96.png`, `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` (chemins `https://msd-media.com/assets/img/...`).
3. **Fonts** : le lien Google Fonts Instrument Serif + Inter + Outfit (section 3 ci-dessus), avec `preconnect` sur `fonts.googleapis.com`/`fonts.gstatic.com` et un `<noscript>` de secours.
4. **CSS** : `style.css`, `animations.css`, `responsive.css` (chemin relatif `../assets/css/...` ou `../../../assets/css/...` selon la profondeur).
5. **JSON-LD** : au minimum `Organization` (référencer `"@id": "https://msd-media.com/#organization"` par `@id`, ne jamais dupliquer l'objet complet), `BreadcrumbList`, et le schema propre au type de page (`WebPage`, `Article`, `FAQPage`, `AboutPage`…). Toujours lier le fondateur par `"@id": "https://msd-media.com/#maxens-soldan"` plutôt que de recréer un objet `Person` inline.
6. **Open Graph / Twitter Card** : `og:title`, `og:description`, `og:image` (1200×630 réel, jamais `img-cover.webp` si une image plus pertinente existe), `og:url`, `twitter:card summary_large_image`.
7. **Scripts trackés** (copier tels quels depuis n'importe quelle page existante, ne pas modifier) : détection referrer IA (ChatGPT/Perplexity/Claude/Gemini/Copilot), tracking MSD + GA4 chargé après consentement cookie, Google Tag Manager (`GTM-P28B6QRF`).
8. **Body** : bannière `.top-announcement`, GTM `<noscript>`, `.cookie-consent` (markup standard, copier depuis une page existante), puis header, `<main>`, footer, `<script src=".../script.js" defer>`.

## 13. Ce qui change spécifiquement pour les articles de blog

Les articles (`blog/articles/{slug}/index.html`, `body class="blog-article-page"`) suivent un pattern
différent des pages classiques :

- Hero article : `.blog-breadcrumb` (fil d'ariane Blog / Titre), `.section-tag--dark` pour la catégorie,
  `.hero__title`, `.blog-article-meta` (durée de lecture, date, auteur via `<a rel="author">`), image de
  couverture `.blog-article-cover` à droite du hero (`border-radius: 0.2rem`).
- Corps d'article dans `<article class="blog-article-content" itemscope itemtype="https://schema.org/Article">`,
  avec un sommaire `.blog-toc` généré à partir des `<h2 id="...">`.
- Bloc résumé IA `.blog-ai-summary` juste avant le contenu (boutons "Demander à ChatGPT/Claude").
- Byline auteur obligatoire : `<a href="/blog/articles/maxens-soldan/" rel="author">Maxens Soldan</a>`.
- H2 de section reformulés en question quand c'est pertinent pour l'AEO (`Pourquoi... ?`, `Comment... ?`).
- 3-5 liens internes par 1000 mots, insérés **dans** le dernier `<p>` du bloc
  `<article class="blog-article-content">...</article>` — jamais dans le nav/footer/hero (piège classique :
  chercher un ancrage par texte peut matcher le même lien ailleurs dans le fichier).
- Fin d'article : `<section class="blog-related"><h2>Articles liés</h2><div class="blog-related-grid">`
  avec 3 `<a class="blog-card">` — l'image de chaque carte doit être la vraie `og:image` de l'article
  ciblé (jamais `img-cover.webp` générique).
- JSON-LD `Article` avec `author` en `@id` vers `#maxens-soldan`, `FAQPage` si l'article a une FAQ,
  `BreadcrumbList`.

## 14. Checklist avant de livrer une nouvelle page

1. `<body class="home-page">` (ou la classe adaptée du tableau section 9) — sinon texte invisible.
2. Header et footer copiés tels quels depuis ce skill (section 10 et 11), chemins relatifs corrects.
3. Un seul `<h1>` (le hero), hiérarchie H2/H3/H4 respectée (section 5).
4. Aucune couleur/border-radius hors de l'échelle définie ici (sections 2 et 6).
5. Images réelles et pertinentes, jamais `img-cover.webp` par défaut, jamais une image dupliquée
   plusieurs fois sur la même page.
6. JSON-LD présent et valide (vérifier avec un script Python `json.loads` sur chaque bloc
   `<script type="application/ld+json">`).
7. Vérification visuelle via Playwright/screenshot avant de considérer la page terminée — le bug le
   plus fréquent sur ce site est le texte sombre invisible sur fond sombre (oubli de `home-page` ou
   classe manquante dans un override `.home-page .xxx`/`.sector-page .xxx`).
