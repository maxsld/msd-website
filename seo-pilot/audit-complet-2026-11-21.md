# Audit complet du site, 21 novembre 2026

Audit en lecture seule mené le 2026-11-21 par 5 agents (technique, performance, maillage interne, liens externes, contenu et IA), à la demande de Maxens. Le rapport complet est chez Maxens ; ce fichier ne garde que ce qui concerne l'agence. Maxens a demandé le 2026-11-22 que l'équipe s'en charge à partir du passage du 2026-11-23.

Règles inchangées : 3 pages au plus par passage, une modification par page, gel de 21 jours, entrée au journal pour chaque lot, rien sur l'accueil, le header, le footer, le CSS, le JS ni les scripts sans Maxens.

## Priorité du passage du 2026-11-23 : le groupe landing page

Constat de Maxens et de l'audit (Search Console, semaines du 3, du 10 et du 17 novembre) : depuis la redirection du 2026-11-10, l'ancien article comparatif `/blog/articles/agences-landing-page-prix-france-2026/` recule (position principale 12,4 → 20,9) et `/creation-landing-page/` ne prend pas le relais (17,3 → 27,9). « agence landing page » tient encore (10,5) sur l'ancienne URL. La page cible reçoit 26 liens contextuels, dont 12 « Découvrir l'accompagnement » et une seule ancre « agence ».

À faire, dans cet ordre, en respectant les gels :
1. **C1 + C2**, article `/blog/articles/combien-coute-landing-page-france-2026/` (libre depuis le 2026-11-20, bilan d'abord) : remplacer « Si vous cherchez plutôt à comparer des agences nommément, lisez notre comparatif des agences de landing page en France. » (le comparatif n'existe plus) par « Si vous cherchez une agence plutôt qu'un prix, voici comment travaille notre agence de landing page. » (même cible `/creation-landing-page/`). Garder 2 ou 3 des 7 liens vers `/tarifs/`.
2. **Réponse directe sous le H1** de `/creation-landing-page/` (champ `subtitle` ou premier paragraphe dans `data/services.json`), avec des faits de FAITS.md : « MSD Media conçoit des landing pages sur mesure : textes, design, développement et SEO technique. Première version en 7 jours, version finale en 21 jours à compter de la réception de vos éléments. »
3. **Liens vers `/creation-landing-page/`** :

| N° | Page source | Emplacement | Ancre exacte |
|---|---|---|---|
| 1 | `/landing-page-annecy/` | après « …la landing page s'adapte à tout objectif ponctuel des entreprises annéciennes. » : « Hors d'Annecy, la même offre est présentée sur la page de notre agence de landing page. » | agence de landing page |
| 2 | `/blog/articles/creer-landing-page-qui-convertit/` (sans .md) | « Chez MSD Media, une landing page sur mesure est livrée en 21 jours… » | landing page sur mesure |
| 3 | `/blog/articles/ameliorer-taux-conversion-site-web/` | « MSD Media est spécialisée dans la création de landing pages à fort taux de conversion. » | création de landing pages |
| 4 | `/site-web-coach/` | réponse « Oui. Une offre claire par objectif… » : « Une landing page bien construite convient à beaucoup de coachs… » | landing page |
| 5 | `/realisations/nation-startup/` | « MSD Media a conçu la landing page de pré-lancement beta de Nation… » | landing page de pré-lancement |
| 6 | `/blog/articles/agence-web-freelance-nocode-2026/` | « Micro-agence spécialisée landing pages et sites sur mesure. » | agence spécialisée landing pages |

## Failles de mots-clés du 2026-11-22 (demande de Maxens, juste après le groupe landing page)

Recherche du 2026-11-22 : Ahrefs (générateur gratuit, France), Semrush (Keyword Overview, France), vraie première page Google et Search Console du 2026-08-24 au 2026-11-21. Critère : difficulté faible et première page tenue par des forums ou des petits sites. À traiter dans les places restantes du passage du 2026-11-23, sinon au passage suivant, en respectant les gels et la règle d'une modification par page.

1. **« supprimer avis google médecin »** : 70 recherches par mois, difficulté 8 %. En première page : deux fils du forum d'aide Google et des agences e-réputation. L'article `/blog/articles/avis-google-medecin-que-repondre/` est 20e sur cette requête (138 impressions en 3 mois, 0 clic) et 14e sur « avis google médecin ». La section H2 « Comment supprimer un avis Google quand on est médecin ? » existe déjà : passer la requête à l'analyste-concurrence pour voir ce que les résultats de tête donnent de plus (étapes concrètes, motifs de suppression acceptés par Google, délais, recours) et compléter cette section. Attention : un test de conversion est déjà prévu le 2026-11-23 sur cet article ; une seule modification par page, au chef de choisir l'ordre.
2. **« création site internet dentiste »** : 110 recherches par mois, difficulté 26 %, intention commerciale. En première page : uniquement de petits sites spécialisés (denti.site, simplebo, land-dentiste, webdentiste…). `/site-web-dentiste/` n'apparaît pas sur cette requête dans Search Console ; son title (« Site Web pour Dentiste : Implantologie et Esthétique ») ne contient pas « création site internet ». Faire entrer « création de site internet pour dentiste » dans le title et la réponse directe, sans changer le design. La page vient de `data/sectors.json` : ne jamais lancer `scripts/build-sector-pages.py`.
3. **« landing page exemple »** (720 recherches par mois, difficulté 15 %) : demande une nouvelle page d'exemples tirée des vraies réalisations. **À Maxens, ne pas créer.**

Écartés : « site kiné », « site ostéopathe » (moins de 100 recherches par variante, mot principal noté difficile). **Psychologue repris** à la demande de Maxens : sujet n° 30 de `seo-pilot/EDITORIAL.md`, en tête pour le 2026-12-07 ; une page métier `/site-web-psychologue/` est à Maxens (générateur des pages secteur), « landing page c'est quoi » (HubSpot, Adobe, Bpifrance en tête), « création site internet annecy » (difficile).

## Vérité : à corriger en priorité dès que la page est libre (compte dans les 3 pages)

- **Belotero** : `data/sectors.json` ligne 1634 (rendu sur `/site-web-medecine-esthetique/`) écrit « trois landing pages pour Merz […] RADIESSE, Ultherapy Prime et BELOTERO ». Écrire « deux landing pages […] Radiesse et Ultherapy Prime ». Le logo Belotero de la bande « clients » (34 pages, modèle : l'accueil) est à Maxens. `check-verite.py` ne cherche que `merz-belotero` : signalé à Maxens.
- **« Livré en 21 jours chrono »** (30 pages, gabarit de `build-sector-pages.py`, à Maxens) ; **« Livraison garantie en 21 jours »** dans `/blog/articles/combien-coute-landing-page-annecy-2026/` et `/blog/articles/creation-site-web-annecy-2026/` → « version finale en 21 jours à compter de la réception de vos éléments ».
- **« Réservez un audit (SEO) gratuit avec MSD Media »** dans 5 articles (`google-business-profile-annecy-2026`, `google-business-profile-strasbourg-2026`, `seo-local-alsace-2026`, `maintenance-site-web-annecy`, `referencement-naturel-annecy`) → lien vers `/outils/audit-site/` ou « Réservez un appel de 30 minutes ».
- **`/blog/articles/maintenance-site-web-annecy/`** : MSD Care « Essentiel, Croissance et Marque » → Essentiel, Suivi et Marque ; « support sous 24 h » → « réponse sous 24 à 48 h ouvrées selon le niveau ».
- **« Plus de 30 clients »** (35 pages, llms.txt) : en attente de la décision de Maxens. Ne pas toucher avant.

## Annecy / Strasbourg : risque de pages satellites

Les 5 paires de services Annecy / Strasbourg (audit SEO, refonte, SEO local, landing page, création) se recouvrent à 83-94 % (texte hors navigation, ville masquée). `/audit-seo-strasbourg/` affiche « les entreprises d'Strasbourg ». Les FAQ des pages audit, refonte et SEO local sont celles de la création de site. Search Console : « création site internet annecy » recule de 42 à 52-58.

Proposition de l'audit, à traiter par la procédure « Retirer ou fusionner » (décision du 2026-12-13 sur les fusions) :
1. Tout de suite : corriger « d'Strasbourg » ; remplacer la FAQ générique des pages audit, refonte et SEO local par 4 à 6 questions propres au service ; « MSD Media, agence web à Strasbourg » → « agence web d'Annecy qui accompagne les entreprises de Strasbourg, en visio » (texte, `alt`, `description`).
2. Réécrire `story` et `faq` des pages Annecy dans `data/services.json` avec du contenu propre à chaque service.
3. Candidates à la fusion vers `/agence-web-strasbourg/` : les 4 ou 5 pages de service Strasbourg (seule `/audit-seo-strasbourg/` a des impressions : 29, position 3,6).

## Maillage : les autres liens proposés

Seuls 5 % des 9 144 liens internes sont dans les textes ; 56 pages indexables n'en reçoivent aucun.

| N° | Source | Ancre exacte | Cible |
|---|---|---|---|
| 7 | `landing-page-vs-site-web-guide-complet` (section budget) | prix d'une landing page | `combien-coute-landing-page-france-2026` |
| 8 | `combien-coute-site-web-annecy-2026` (après le 2026-12-01) | prix d'une landing page | `combien-coute-landing-page-france-2026` |
| 9 | `/refonte-site-web-annecy/` (FAQ « Combien de temps… créer un site internet à Annecy ? ») | création de site internet à Annecy | `/creation-site-web-annecy/` |
| 10 | `/audit-seo-annecy/` (FAQ SEO local dès la création) | création de site web à Annecy | `/creation-site-web-annecy/` |
| 11 | `/creation-site-web-annecy/` (phrase « consultez la refonte », sans lien) | refonte de site internet à Annecy | `/refonte-site-web-annecy/` |
| 12 | `10-erreurs-creation-site-web-annecy` (1re phrase) | créer un site web à Annecy | `/creation-site-web-annecy/` |
| 13 | `referencement-naturel-annecy` (sans .md) | création de site web à Annecy | `/creation-site-web-annecy/` |
| 14 | `combien-coute-site-web-annecy-2026` (avec le 8) | création d'un site internet à Annecy | `/creation-site-web-annecy/` |
| 15 | `10-erreurs-creation-site-web-annecy` (avec le 12) | maintenance d'un site web | `maintenance-site-web-annecy` |
| 16 | `/tarifs/msd-care/` (vérifier le gel) | guide de la maintenance de site web | `maintenance-site-web-annecy` |
| 17 | `/seo-local-annecy/` | référencement naturel à Annecy | `referencement-naturel-annecy` |
| 18 | `/audit-seo-annecy/` (avec le 10) | guide du référencement naturel à Annecy | `referencement-naturel-annecy` |
| 19 | `/site-web-chirurgie-esthetique/` (FAQ décret) | publicité en chirurgie esthétique après le décret de 2026 | `publicite-chirurgie-esthetique-decret-2026` |
| 20 | `site-internet-medecine-esthetique-ce-qui-est-autorise` (section décret) | ce que le décret change pour la publicité en chirurgie esthétique | `publicite-chirurgie-esthetique-decret-2026` |
| 21 | `avis-google-medecin-que-repondre` (avec le test de conversion) | la publicité en chirurgie esthétique | `publicite-chirurgie-esthetique-decret-2026` |
| 22 | `site-internet-medecine-esthetique-ce-qui-est-autorise` (avec le 20) | ce que l'Ordre autorise sur le site d'un dentiste | `site-internet-dentiste-ce-qui-est-autorise` |
| 23-24 | `/agence-web-annecy/` (après le 2026-12-01, FAQ secteurs) | sites web d'architectes ; agences immobilières | `/site-web-architecte/` ; `/site-web-immobilier/` |
| 25 | `/outils/chatgpt-peut-il-lire-mon-site/` | comment apparaître dans ChatGPT et Perplexity | `apparaitre-chatgpt-perplexity-google-ia` |
| 26 | `schema-org-donnees-structurees-ia` | apparaître dans ChatGPT et Perplexity | `apparaitre-chatgpt-perplexity-google-ia` |
| 27 | `/agence-web-strasbourg/` (« création de zéro ») | création de site internet à Strasbourg | `/creation-site-web-strasbourg/` (sauf si fusion décidée) |
| 28 | `/a-propos/` (« présence opérationnelle à Munich ») | agence web à Munich | `/agence-web-munich/` |
| 29 | `/en/about/` | web agency in Munich | `/en/munich/` |
| 30 | `/en/munich/` (bloc de cartes) | Landing page design | `/en/landing-page-design/` |

Corrections d'ancres : « MSD Care » → cible `/tarifs/msd-care/` au lieu de `/tarifs/#msd-care` (`10-erreurs-creation-site-web-annecy` ×2, `combien-coute-site-web-annecy-2026`) ; « référencement local à Annecy » → `/seo-local-annecy/` (`google-business-profile-annecy-2026`) ; ancre « agence-web-strasbourg » → « agence web à Strasbourg » (`landing-page-chatgpt-google`) ; noms de ville seuls → « agence web à Chambéry / Genève / Annecy » ; `/en/munich/` : Pricing → `/en/pricing/`, Our work → `/en/work/`, About → `/en/about/` ; 4 liens vers `/configurateur/` (noindex) à remplacer par `/tarifs/` si Maxens confirme.

## Données structurées et technique (agence)

- 8 pages secteur : `mentions` EM Motors pointe vers `/realisations/marie-troccaz/` → `/realisations/em-motors/` (donnée de `build-sector-pages.py`, à Maxens pour le script).
- `/template-landing-page/` : supprimer le bloc `schema-breadcrumb-auto` (fil d'Ariane qui finit sur `/contact/`).
- 16 articles : entités `&#39;` dans le JSON-LD FAQ, et FAQPage sans FAQ visible sur `/blog/articles/maxens-soldan/` : cause dans `generate-blog.js` (à Maxens).
- Titles > 60 : 6 se règlent en retirant « | MSD Media » (`site-internet-medecine-esthetique…`, `template-landing-page`, `avis-google-medecin…`, `apparaitre-chatgpt…`, `coaching-maxime-sciare…`, `maillage-interne…`). Descriptions > 160 : `/outils/apercu-google/`, `/outils/audit-site/`, `avis-google-medecin`, `refonte-site-web-annecy`, `referencement-naturel-annecy`.
- H1 → H3 sans H2 : `/tarifs/`, `/tarifs/msd-care/`, `/affiliation/`, politique de confidentialité et versions EN.
- Accessibilité : `aria-label` sur les champs sans `<label>` (`/contact/`, `/en/contact/`, `/recrutement/`, `/template-landing-page/`, recherche de `/blog/`).
- Le lien AP-HP de `avis-google-medecin-que-repondre` ne répond plus : vérifier, sinon remplacer par le guide du CNOM sur conseil-national.medecin.fr.
- 35 articles antérieurs à septembre 2026 citent des chiffres sans source : à sourcer ou retirer au passage à 2027.

## Déjà traité ou à Maxens (ne pas faire)

Hors du périmètre de l'agence, transmis à Maxens : GA4 chargé sans consentement sur mobile (`tracking-block.html`) et Clarity via GTM ; `.vercelignore` ; `robots.txt` (logo bloqué pour Googlebot-Image) ; `llms.txt` et `llms-full.txt` ; ancre « Secteur » du menu ; image Trustpilot `height` ; Cal.com à la demande ; lien d'évitement, contrastes, carrousels ; Belotero sur l'accueil ; « plus de 30 clients » ; liens externes (Dauphiné, crédits clients, annuaires).
