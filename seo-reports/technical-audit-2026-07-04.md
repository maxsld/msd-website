# Audit technique SEO — msd-media.com
Date : 2026-07-04 · Score de référence (25/06) : 66/100

---

## 1. Résumé exécutif

Audit de suivi hebdomadaire, focalisé sur ce qui est vérifiable depuis le code (site statique, hébergé sur Vercel — pas de framework, HTML généré + scripts Node de patch/génération dans `scripts/`).

Deux problèmes à risque faible et périmètre clair ont été **corrigés directement** dans cette session :
1. Attributs `width`/`height` manquants sur 3 images de la homepage (risque CLS).
2. Headers de sécurité absents en production alors qu'ils sont définis dans `.htaccess` (fichier **inopérant sur Vercel**, qui ignore Apache config).

Tous les autres points ouverts de `ACTION-PLAN.md` (C1 duplication villes, M3 CLS mobile, H4 recrawl, B1 Munich) restent des chantiers manuels — trop larges ou nécessitant des outils de mesure live (Lighthouse/PSI) non disponibles dans cette session (quota PageSpeed Insights épuisé, voir §5).

**Estimation du score après corrections de cette session : ~68-69/100** (progression marginale ; les gains significatifs restent conditionnés à C1 et M3, non résolus aujourd'hui).

---

## 2. Crawlability — PASS (avec réserve)

- `robots.txt` : correctement configuré, `Allow: /`, disallow ciblés (`/assets/img/profiles/`, `/admin/`), règles explicites pour les crawlers IA (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, CCBot, Applebot-Extended...), 2 sitemaps déclarés. Aucune anomalie.
- `sitemap.xml` : 145 URLs, XML valide, pas de doublon `about/maxens-soldan/` détecté — **C2 confirmé résolu** (l'entrée 404 signalée le 25/06 a bien été retirée).
- **H4 (recrawl)** : toujours **non fait**. `scripts/google-index.mjs` (ping sitemap + IndexNow) existe depuis avril mais rien n'indique qu'il a été exécuté après les correctifs H3 (breadcrumb, 66 pages) ou C1 (Lyon). **Recommandation : exécuter `node scripts/google-index.mjs` maintenant que H3 + les correctifs du jour sont dans le repo, une fois déployés.**

## 3. Indexability — PARTIAL FAIL

- Canonicals, meta robots, hreflang : présents et cohérents sur les pages contrôlées (home, Lyon, Paris, Munich).
- **C1 toujours ouvert** : diff entre `agence-web-paris/index.html` et `creation-site-web-paris/index.html` (et `landing-page-paris`) ≈ 56 lignes sur les 400 premières lignes comparées — nettement plus proche du duplicate que Lyon (déjà traité, diff 97-99 lignes après réécriture). Les 11 villes restantes (Paris, Genève, Marseille, Bordeaux, Toulouse, Chambéry, Lille, Nantes, Montpellier, Clermont-Ferrand, Nice) sont donc toujours en quasi-duplication à ~93-95 %, non traité cette semaine (hors périmètre "fix low-risk").
- Schema breadcrumb (H3) : vérifié sur `agence-web-lyon/index.html` — `name` = "Agence Web Lyon" (libellé court), pas le `<title>` complet. Correction bien propagée.

## 4. Sécurité — FAIL corrigé partiellement (fix appliqué)

**Constat critique** : `.htaccess` contient un jeu complet de headers de sécurité (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP détaillée) — **mais le site est servi par Vercel, qui ignore `.htaccess` (fichier Apache)**. Vérification live (`curl -I https://msd-media.com/`) confirme qu'aucun de ces headers n'est réellement envoyé ; seul `strict-transport-security` est présent (ajouté automatiquement par Vercel). Cette faille silencieuse existe probablement depuis le passage du site sur Vercel.

- **Fixé directement** : ajout d'un bloc `headers` dans `vercel.json` (route `/(.*)`)  pour `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(), microphone=(), camera=()`. Ce sont des headers additifs sans risque de casse fonctionnelle.
- **Non fixé (nécessite validation manuelle)** : la Content-Security-Policy définie dans `.htaccess` n'a **jamais été testée en conditions réelles** (elle n'a jamais été appliquée puisque `.htaccess` est inerte sur Vercel). L'ajouter aveuglément à `vercel.json` est un risque moyen (peut casser Cal.com embed, GTM, Google Analytics, Font Awesome Kit, formulaires Formspree si une directive est mal alignée avec les besoins actuels du site). **Recommandation : porter la CSP de `.htaccess` vers `vercel.json` en mode `Content-Security-Policy-Report-Only` d'abord, vérifier la console navigateur sur les pages clés (accueil, contact, étude de cas avec iframe Cal.com), puis passer en mode bloquant.**
- HTTPS : OK (HTTP/2, HSTS déjà actif via Vercel).

## 5. Core Web Vitals / CLS mobile homepage (M3) — toujours NON résolu, investigation approfondie sans fix direct

Impossible de reproduire la mesure live : quota PageSpeed Insights API épuisé au moment de l'audit (`RESOURCE_EXHAUSTED`, 0 requête/jour restante sur le projet configuré). Analyse par inspection de code uniquement :

- **Carrousel de mots du hero (`hero__title-word`, `assets/js/script.js` L.316-483)** : animation de largeur (`heroWordWrap.style.width`) pilotée par `setInterval`, qui *pourrait* causer du CLS répété — **mais le code désactive explicitement cette rotation sur mobile** (`if (isMobileView) { heroWordWrap.style.width = "auto"; return; }`) et le jeu de mots FR ne contient qu'un seul mot (`words: ["inoubliables."]`, condition `words.length < 2` bloque l'intervalle même sur desktop). **Cette piste est donc à écarter** pour le CLS mobile FR — déjà correctement mitigée par un développeur précédent.
- Toutes les images de la homepage (mockups, process, cover-video, logo, Trustpilot) ont déjà des attributs `width`/`height` corrects, sauf 3 exceptions mineures **corrigées cette session** (logo `.ai-proof__msd-logo` et 2 logos ChatGPT/Claude dans `#ai-proof`) — ces images sont cependant **sous la ligne de flottaison** (section `#ai-proof`, loin après le hero), donc leur contribution au CLS de la homepage mobile était probablement faible à nulle ; corrigées par bonne pratique, pas comme fix principal du 0,207.
- Vidéo hero (`.video-hero-content`) : `aspect-ratio: 16/8` fixé en CSS, `preload="none"` — l'espace est réservé indépendamment du chargement, pas de risque de CLS identifié ici.
- Bannière cookies : `position: fixed`, masquée sur mobile (`display: none` sous 680px) — ne pousse pas le contenu, écartée comme cause.
- **Piste restante la plus probable, non vérifiable sans Lighthouse trace réelle** : le chargement de police (`Inter`/`Outfit` via Google Fonts, `font-display: swap`, chargement non bloquant via le hack `media="print" onload`) peut provoquer un FOUT → reflow du `h1.hero__title` (qui utilise `text-wrap: balance` et `clamp()`, sensible aux changements de métriques de police) au moment du swap police système → police web. C'est une cause plausible mais nécessite une trace Lighthouse "Layout Shift" réelle sur mobile pour confirmer l'élément exact (`LayoutShift culprit`) avant toute correction — **hors périmètre du fix "faible risque" de cette session** (toucher au chargement des polices peut dégrader le FCP/LCP si mal fait).
- **Recommandation pour la semaine prochaine** : relancer `scripts/cwv-report.mjs` une fois le quota PSI reconstitué (quota journalier, généralement réinitialisé sous 24h), ou lancer un test Lighthouse mobile manuel via Chrome DevTools pour obtenir le "Layout Shift culprit" exact avant d'intervenir sur le CSS/JS du hero.

## 6. Structure d'URL / Redirects — PASS

`vercel.json` contient une liste de redirections 301 propres (anciens articles blog → nouveaux, variantes avec/sans slash), pas de chaîne de redirection détectée dans l'échantillon contrôlé. URLs propres, sans paramètres, cohérentes avec la convention `/ville-service/`.

## 7. Mobile-friendliness — PASS

Viewport meta correct, media queries mobile-first présentes dans `responsive.css`, cookie banner désactivée sous 680px (bon choix UX/CLS), bouton Cal.com désactivé sur mobile (déjà corrigé selon l'historique git `2b2bd3f`).

## 8. Structured Data — PASS (après H3)

Schémas `LocalBusiness`, `Service`, `BreadcrumbList`, `FAQPage` détectés en JSON-LD statique, générés/patchés par `scripts/patch-static-schemas.js`. Breadcrumb `name` correctement tronqué (H3 vérifié sur Lyon). Pas de nouvelle anomalie de schema détectée sur les pages échantillonnées (home, Lyon, Munich).

## 9. JavaScript Rendering — PASS

Site 100% HTML statique pré-rendu, aucun besoin de rendu JS pour l'indexation (contenu visible dans le HTML source). Le JS (`script.js`) ne gère que des interactions/animations progressives (menu, carrousel, cookies), pas de contenu critique injecté côté client uniquement.

## 10. IndexNow — PASS (config), statut d'exécution incertain (cf. H4)

`scripts/google-index.mjs` correctement configuré (clé IndexNow présente en fallback, endpoint `api.indexnow.org`, ping sitemap Google + Bing). Pas de preuve d'exécution récente — voir H4 ci-dessus.

## 11. B1 — Page Munich (langue)

Confirmé : `agence-web-munich/index.html` a `<html lang="en">`, `<title>Web Agency Munich | ...</title>`, hreflang `en-DE`. Reste un choix de contenu (marché germanophone en anglais ou à traduire en allemand) — décision éditoriale, pas un bug technique. Non modifié (hors périmètre "fix direct").

## 12. B2 — Audit images (poids/format)

Non réalisé de façon exhaustive cette session (nécessiterait un scan de tous les fichiers `assets/img/`). Spot-check sur la homepage : formats modernes utilisés (`.webp`, `.avif`), `loading="lazy"` correctement appliqué sauf sur le logo above-the-fold (`loading="eager"`, correct). Pas d'anomalie flagrante détectée sur l'échantillon.

---

## Corrections appliquées directement (cette session)

| Fichier | Changement | Justification |
|---|---|---|
| `index.html` | Ajout `width="372" height="151"` sur `.ai-proof__msd-logo` | Manquait, risque CLS mineur, correction sûre (dimensions déjà connues du même fichier logo utilisé ailleurs) |
| `index.html` | Ajout `width="18" height="18"` sur les 2 logos ChatGPT/Claude (`.ai-proof__logo`) | Idem — dimensions déjà fixées en CSS (18x18), attribut ajouté par cohérence/bonne pratique |
| `vercel.json` | Nouveau bloc `headers` global (`/(.*)`) : `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` | Ces headers existent dans `.htaccess` mais ne sont **jamais appliqués en production** (Vercel ignore Apache config) — vérifié via `curl -I` sur le site live. Ajout additif, sans risque de régression fonctionnelle |

## À traiter manuellement (non fixé cette session)

- **C1** (critique, effort élevé) : réécrire le contenu des 3 pages par ville pour 11 villes restantes (Paris en tête, diff mesuré à 56 lignes ≈ quasi-duplicate).
- **H4** (haute) : lancer `node scripts/google-index.mjs` pour forcer un recrawl maintenant que H3 + les fixes du jour sont prêts à être déployés.
- **M3** (moyenne, CLS mobile) : nécessite une trace Lighthouse/PSI réelle (quota API épuisé aujourd'hui) pour identifier l'élément exact responsable du 0,207 ; hypothèse la plus probable = reflow du `h1.hero__title` au swap de police web, à confirmer avant toute intervention.
- **Sécurité — CSP** : porter la Content-Security-Policy de `.htaccess` vers `vercel.json`, d'abord en `Report-Only`, tester, puis activer en mode bloquant.
- **B1** (basse) : décision éditoriale sur la langue de la page Munich (anglais vs allemand).
- **B2** (basse) : audit exhaustif poids/format des images sur l'ensemble du site.

---

## Estimation de score

| Catégorie | Statut |
|---|---|
| Crawlability | 9/10 (H4 en attente) |
| Indexability | 6/10 (C1 ouvert sur 11 villes) |
| Sécurité | 7/10 (headers de base corrigés ; CSP encore à porter) |
| URL structure | 9/10 |
| Mobile | 8/10 |
| Core Web Vitals | 5/10 (CLS 0,207 mobile toujours non résolu) |
| Structured Data | 9/10 |
| JS Rendering | 10/10 |
| IndexNow | 7/10 (config OK, exécution à confirmer) |

**Score technique global estimé : ~68-69/100** (vs 66/100 le 25/06). Progression limitée par le fait que les deux chantiers à fort impact (C1 duplication de contenu, M3 CLS mobile) restent ouverts et nécessitent soit un travail éditorial conséquent, soit un outil de mesure Lighthouse/PSI non disponible aujourd'hui.
