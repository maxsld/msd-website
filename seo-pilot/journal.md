# Journal du pilote SEO

Chaque modification faite sur le site pour le référencement, avec ses chiffres de départ, pour en mesurer l'effet 21 jours plus tard.

Hors entrées : le 2026-10-30, les 11 pages « agence web + ville » hors zone et /landing-page-bruxelles/ ont été redirigées (301). C'est définitif, ne pas revenir dessus.

Hors entrées : le 2026-11-02, refonte du design de tout le site (thème clair, nouveau header et footer, polices Inter Tight et Manrope, mêmes textes sauf l'accueil). Les bilans de novembre doivent en tenir compte : une variation commune à toutes les pages vient probablement de la refonte, pas des changements ci-dessous.
Le même jour, les 12 pages secteur (site-web-…) ont été reconstruites sur le modèle de l'accueil par `scripts/build-sector-pages.py` (contenu dans `data/sectors.json`). Textes, FAQ et données structurées conservés ; leur structure change. Pour les modifier : éditer `data/sectors.json` puis relancer le script, jamais le HTML directement.
Le 2026-11-03, les 15 pages de service ont été reconstruites de la même façon (contenu dans `data/services.json`), et les anciennes sections communes des autres pages (réalisations, process, avis, FAQ, « Demander à l'IA ») remplacées par celles de l'accueil. Textes, FAQ et données structurées conservés.
Le 2026-11-03, audit SEO/AEO/GEO après refonte : titles, descriptions, canonicals et données structurées identiques à avant sur toutes les pages. Corrigé : étiquette au-dessus du H1 passée de <h2> à <p> (75 pages, le H1 est maintenant le premier titre), données structurées Blog + fil d'Ariane sur /blog/, ancre cassée sur /faq-seo/, llms.txt (première version en 7 jours). À traiter par l'agence, page par page : 10 titles > 60 caractères et 5 descriptions > 160 (outils, template, 6 articles, /refonte-site-web-annecy/).

## Entrées

### 2026-11-03 : /realisations/merz-belotero/ (décision de Maxens)
- Changement : MSD Media n'a pas la réalisation Belotero. Page supprimée et redirigée (301) vers /realisations/ ; liens retirés de /realisations/merz-radiesse/, /realisations/merz-ultherapy-prime/ et de l'article médecine esthétique ; retirée du sitemap et de llms.txt. FAQ Munich FR/EN : plus de mention de clients en Allemagne (Maxens n'en a pas encore).
- Requête visée : aucune (correction d'exactitude).

### 2026-11-03 : /blog/articles/publicite-chirurgie-esthetique-decret-2026/
- Changement : nouvel article santé sur le décret n° 2026-891 du 23 septembre 2026 (communications commerciales des installations de chirurgie esthétique), renvoie vers /site-web-chirurgie-esthetique/.
- Hypothèse : premières impressions sur « publicité chirurgie esthétique » et « décret chirurgie esthétique 2026 » en 2 à 6 semaines (sujet récent, résultats surtout juridiques) ; renforce le hub santé.
- Requête visée : publicité chirurgie esthétique
- Départ : nouvel article.
- Relecture : bloqué une fois (affirmations juridiques non recoupées : lien Légifrance non vérifié, délai de 15 jours, sanction Gynéco Online, loi influenceurs, projet de décret médecine esthétique), corrigé puis validé. Ne pas réintroduire ces points sans source lue.
- À vérifier plus tard : l'article /blog/articles/site-internet-medecine-esthetique-ce-qui-est-autorise/ et la FAQ de /site-web-chirurgie-esthetique/ contiennent encore « quinze jours » (L6322-2) et la sanction Gynéco Online, non recoupés cette semaine.

### 2026-11-03 : /blog/articles/agences-landing-page-prix-france-2026/
- Changement : title (seoTitle) et description réécrits ; réponse courte qui nomme les 6 prestataires et reprend « agence de création de landing page » ; lien de réservation d'appel remonté sous la note de transparence ; bloc « Mise à jour octobre 2026 » descendu avant la méthodologie.
- Avant : title « Agence landing page : 6 prestataires comparés (2026) » ; description « Comparez 6 prestataires de landing pages en France : spécialités, livrables, budget et critères de choix. MSD Media présente aussi sa propre offre. »
- Hypothèse : le taux de clic sur « agence landing page » passe de 0 à au moins 1,5 % (position 9.7) car le title promet une aide au choix et la description répond à « agence, freelance ou template » ; la réponse courte aide « agence création de landing page » (position 14.2) à remonter.
- Requête visée : agence landing page, agence création de landing page
- Départ : 430 impressions, 0 clics, position 12.2 (28 jours au 2026-10-31) ; « agence landing page » 168 impressions, 0 clic, position 9.7.

### 2026-11-03 : /agence-web-munich/
- Changement : nouvelles pages Munich en français et en anglais (/en/munich/), reliées par hreflang, ajoutées au footer, au sitemap et à llms.txt.
- Hypothèse : premières impressions sur les requêtes « agence web Munich » en français et en anglais en 1 à 3 mois (concurrence faible) ; clients surtout via le réseau French Tech Munich.
- Requête visée : agence web munich, french web agency munich
- Départ : nouvelle page.

### 2026-11-02 : /
- Changement : nouvelle page d'accueil (refonte complète : hero, sections, FAQ de 14 questions réécrite pour le SEO, témoignage Merz). Title et description inchangés. Version anglaise /en/ refaite à l'identique.
- Avant : ancienne accueil sombre (hero vidéo, 19 questions de FAQ).
- Hypothèse : page 4 fois plus rapide sur mobile (PageSpeed 73 → 99, LCP 7,8 s → 1,7 s) et mieux structurée (11 H2 au lieu de 2) : plus de requêtes non marque et meilleure conversion des visites.
- Requête visée : agence web annecy, msd media
- Départ : voir le relevé du 2026-11-01 (accueil : surtout des requêtes de marque).

### 2026-11-01 : /creation-site-web-annecy/
- Changement : Lien dans le footer de toutes les pages et depuis /agence-web-annecy/ ; title passé à « Création de Site Internet à Annecy : Sur Mesure en 21 Jours ».
- Requête visée : création site internet annecy
- Départ : 265 impressions, 0 clics, position 42.5 (28 jours au 2026-10-28).

### 2026-11-01 : /site-web-medecine-esthetique/
- Changement : Devenue le hub santé : blocs projets Merz (Radiesse, Ultherapy Prime) et guides santé.
- Requête visée : site web médecine esthétique
- Départ : 19 impressions, 0 clics, position 8.3 (28 jours au 2026-10-28).

### 2026-11-01 : /blog/articles/avis-google-medecin-que-repondre/
- Changement : Liens ajoutés depuis les 6 pages santé (« À lire aussi » et hub).
- Requête visée : supprimer avis google médecin
- Départ : 516 impressions, 9 clics, position 9.1 (28 jours au 2026-10-28).

### 2026-10-30 : /creation-landing-page/
- Changement : Title et description réécrits ; liens depuis 8 articles landing page.
- Requête visée : agence landing page
- Départ : pas de données (28 jours au 2026-10-28).

### 2026-10-30 : /blog/articles/combien-coute-landing-page-france-2026/
- Changement : Title « Prix d'une landing page en 2026 : de 0 à 15 000 € (tableau) » et nouvelle description ; prix MSD retirés le 2026-10-31.
- Requête visée : prix landing page
- Départ : 484 impressions, 1 clics, position 8.5 (28 jours au 2026-10-28).

### 2026-10-30 : /refonte-site-web-annecy/
- Changement : Title et description réécrits.
- Requête visée : refonte site internet annecy
- Départ : 101 impressions, 1 clics, position 8.3 (28 jours au 2026-10-28).

### 2026-10-30 : /audit-seo-annecy/
- Changement : Title « Audit SEO à Annecy : Testez Votre Site Gratuitement », description, bouton vers l'outil d'audit gratuit.
- Requête visée : audit seo annecy
- Départ : 212 impressions, 0 clics, position 12.2 (28 jours au 2026-10-28).

### 2026-10-30 : /blog/articles/referencement-naturel-annecy/
- Changement : Title et description réécrits.
- Requête visée : référencement naturel annecy
- Départ : 8 impressions, 0 clics, position 9.2 (28 jours au 2026-10-28).

### 2026-10-30 : /blog/articles/maintenance-site-web-annecy/
- Changement : Title et description réécrits (sans prix depuis le 2026-10-31).
- Requête visée : maintenance site internet annecy
- Départ : 67 impressions, 0 clics, position 8.1 (28 jours au 2026-10-28).

## Notes du 2026-11-03 (premier passage de novembre)

- Bilans à 21 jours : aucun dû (entrées les plus anciennes du 2026-10-30). Lecture provisoire, brouillée par la refonte du 2026-11-02 : /audit-seo-annecy/ perd 7 places au niveau de la page (12.2 → 14.3 sur sa requête), /refonte-site-web-annecy/ descend à 19.3 au niveau de la page mais la requête visée reste à 5.9. À trancher au bilan du 2026-11-20.
- Choix de la semaine : 1 page seulement. L'article dentiste (« referencement dentiste », 35 impressions, position 16) n'est pas modifié : un article dédié au référencement des dentistes est prévu semaine 46, pour ne pas faire concurrence aux deux pages. /blog/articles/avis-google-medecin-que-repondre/ (10 visites Google, 0 intention) attend son bilan du 2026-11-22 avant tout travail de conversion.
- Revue éditoriale de novembre validée par le chef : 2 santé, 1 Annecy, 1 landing page, Munich en décembre ; anciens sujets avant/après, agence ou freelance et avis Google cabinet esthétique écartés (voir EDITORIAL.md).
- Audit technique : aucun lien cassé, aucune page orpheline, canonicals, hreflang Munich et JSON-LD conformes. À traiter : liens existants vers /realisations/merz-belotero/ depuis /realisations/merz-radiesse/, /realisations/merz-ultherapy-prime/ et l'article médecine esthétique (la page Belotero est aussi dans le sitemap et llms.txt) : à décider par Maxens, pas modifiés. /site-web-architecte/, /site-web-immobilier/ et les pages Munich n'ont aucun lien éditorial (à faire après 21 jours). 10 titles > 60 et 5 descriptions > 160 (liste dans le rapport du technicien : outils, template, 6 articles, /refonte-site-web-annecy/). Les CSS minifiés ne sont plus à jour par rapport à leurs sources (version-assets les régénérerait sur 58 pages) : à valider par Maxens.
- Audit d'entité : nom, adresse, téléphone et fondation (juin 2025) cohérents partout. Points pour Maxens : le footer affiche une carte « Munich, Bavière, Allemagne » à côté du bureau d'Annecy, ce qui peut se lire comme un second établissement (contraire à STRATEGY.md) ; la FAQ de /agence-web-munich/ dit « accompagne des entreprises en France, en Suisse, en Belgique et en Allemagne » sans client allemand documenté (à reformuler après le 2026-11-24) ; llms.txt n'a pas les mêmes liens sameAs que le balisage.
- Axe Munich : aucune requête munich / münchen / bavière / germany dans le relevé.

### Bilan trimestriel (novembre 2026, point de départ)

- Objectifs : le trimestre précédent n'avait pas d'objectifs chiffrés ; la stratégie et les KPI démarrent ce mois. Au 2026-10-31 : 55 clics Google (minimum de décembre : 55), dont 2 hors marque (minimum : 5), 5 436 impressions, 89 requêtes en top 10, 0 lead GA4 sur 28 jours.
- Cause principale de l'écart : le site est vu hors marque (2 884 impressions) mais presque jamais cliqué, faute de pages en haut de page 1 ; la refonte du 2026-11-02 rend les mesures de novembre fragiles.
- Hypothèses : celles de KPIS.md sont gardées (1 lead sur 4, 2 % de conversion), à recaler fin janvier avec les vrais chiffres.
- Priorités du trimestre : taux de clic des pages en position 4 à 10 (landing page, santé), bilans des titres d'octobre, 11 articles d'ici fin janvier, et côté Maxens les avis Google (objectif 10 fin janvier) et les annuaires.
