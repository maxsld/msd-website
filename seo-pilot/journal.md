# Journal du pilote SEO

Chaque modification faite sur le site pour le référencement, avec ses chiffres de départ, pour en mesurer l'effet 21 jours plus tard.

Hors entrées : le 2026-10-30, les 11 pages « agence web + ville » hors zone et /landing-page-bruxelles/ ont été redirigées (301). C'est définitif, ne pas revenir dessus.

Hors entrées : le 2026-11-02, refonte du design de tout le site (thème clair, nouveau header et footer, polices Inter Tight et Manrope, mêmes textes sauf l'accueil). Les bilans de novembre doivent en tenir compte : une variation commune à toutes les pages vient probablement de la refonte, pas des changements ci-dessous.
Le même jour, les 12 pages secteur (site-web-…) ont été reconstruites sur le modèle de l'accueil par `scripts/build-sector-pages.py` (contenu dans `data/sectors.json`). Textes, FAQ et données structurées conservés ; leur structure change. Pour les modifier : éditer `data/sectors.json` puis relancer le script, jamais le HTML directement.
Le 2026-11-03, les 15 pages de service ont été reconstruites de la même façon (contenu dans `data/services.json`), et les anciennes sections communes des autres pages (réalisations, process, avis, FAQ, « Demander à l'IA ») remplacées par celles de l'accueil. Textes, FAQ et données structurées conservés.
Le 2026-11-03, audit SEO/AEO/GEO après refonte : titles, descriptions, canonicals et données structurées identiques à avant sur toutes les pages. Corrigé : étiquette au-dessus du H1 passée de <h2> à <p> (75 pages, le H1 est maintenant le premier titre), données structurées Blog + fil d'Ariane sur /blog/, ancre cassée sur /faq-seo/, llms.txt (première version en 7 jours). À traiter par l'agence, page par page : 10 titles > 60 caractères et 5 descriptions > 160 (outils, template, 6 articles, /refonte-site-web-annecy/).

## Entrées

### 2026-11-10 : refonte après l'audit complet du site (décision de Maxens)
- Changement : 4 articles où MSD Media se classait elle-même supprimés et redirigés en 301 : top-7-meilleures-agences-web-annecy-2026 → /agence-web-annecy/, top-5-agences-landing-page-france-2026 et agences-landing-page-prix-france-2026 → /creation-landing-page/, meilleures-agences-cro-france → /blog/articles/ameliorer-taux-conversion-site-web/. Le test du 2026-11-03 sur agences-landing-page-prix-france-2026 s'arrête. Section « Demander à ChatGPT / Claude » retirée de toutes les pages. Bandeau affiliation retiré des pages qui vendent (accueil, tarifs, contact, réservation, services, villes, secteurs), gardé sur le blog, les réalisations, les outils, la presse et les pages d'information. /tarifs/ : formule MSD Care (490 €/mois, sans engagement), SEO technique et lisibilité IA cochés pour la landing page comme sur l'accueil, mention TVA. /contact/ : e-mail, téléphone et WhatsApp en clair ; e-mail et téléphone en clair dans le footer. /agence-web-annecy/ : Laurence Daien Maestripieri et Agence 3XL cités. /presse/ : dates et texte du pitch deck. Liste du blog : date de chaque article. llms.txt corrigé.
- Hypothèse : moins de dispersion et plus de confiance ; le signal des articles supprimés passe aux pages d'offre.
- Requête visée : agence landing page, agence web annecy (pages qui reçoivent les redirections).
- Départ : relevé du 2026-11-09.
- Type : `seo`
- Note : les titres réécrits le 2026-10-30 ne sont pas touchés, leur bilan à 21 jours tombe le 2026-11-20.

### 2026-11-09 : /blog/articles/webdesigner-annecy-ou-agence/
- Changement : nouvel article Annecy « Prestataire web à Annecy : webdesigner, agence ou plateforme ? » (aide au choix : périmètre, SEO, maintenance, délais, propriété du site et du domaine, questions à poser), liens vers /creation-site-web-annecy/, /agence-web-annecy/, /tarifs/ et /reserver-un-appel/. Aucune source externe : Google, Afnic et Légifrance inaccessibles depuis la session, l'article ne contient donc que des conseils et des faits déjà publiés sur le site.
- Hypothèse : premières impressions sur « prestataire web annecy », « webdesigner ou agence » et variantes en 2 à 6 semaines ; renforce le groupe Annecy et pousse vers les deux pages de service.
- Requête visée : prestataire web Annecy
- Départ : nouvel article.
- Type : `seo`
- Relecture : bloqué une fois (cannibalisation : « webdesigner annecy » appartient à /creation-site-web-annecy/, 1 impression, position 37 ; deux phrases de droit à tourner en conseils), corrigé puis validé. Ne pas réorienter cet article vers « webdesigner annecy ».

### 2026-11-05 : pages légales FR/EN, /plan-du-site/ et FAQ des 12 pages secteur (décision de Maxens)
- Changement : portes d'entrée pour les IA. Bloc « MSD Media en bref » (résumé, tableau comparatif, FAQ balisée, pages clés) ajouté sous le texte des 6 pages légales FR et EN ; nouvelle page /plan-du-site/ (toutes les pages, liée depuis le footer). Matrice des prompts IA (data/ai-prompts.json) et relevé hebdo de couverture (seo-pilot/data/prompts-ia.md). Sur les 12 pages secteur, la question « en dehors d'Annecy ? » nomme désormais Annecy, Chambéry, Genève et la France (ajoutée sur centre laser, chirurgie esthétique, coach, dentiste, dermatologue).
- Hypothèse : les robots des IA entrent souvent par des pages que les humains ne visitent pas (pages légales) ; ils y trouvent les faits et les liens pour continuer la visite. Les croisements cible × lieu passent de 44 % à 69 % de couverture, ce qui augmente la probabilité d'être retenu pour un prompt du type « site de dentiste à Chambéry ».
- Requête visée : prompts IA (pas de volume mesurable) ; couverture suivie dans prompts-ia.md.
- Départ : couverture cible × lieu 43/98 au 2026-11-05. Pages secteur : ne pas les retoucher avant le 2026-11-26.

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

## Notes du 2026-11-09

- Relevé non rafraîchi : seo-pilot/data/latest.md est encore celui du 2026-11-03 (période 2026-10-04 → 2026-10-31), aucun relevé n'a été enregistré ce lundi. Chiffres identiques à la semaine dernière ; la section « Tests en cours » du relevé reste vide alors que le journal a des entrées depuis le 2026-10-30 (à faire vérifier par le technicien le 7 décembre).
- Bilans à 21 jours : aucun dû (premiers le 2026-11-20).
- Pages existantes : aucune modifiée, bonne décision. Toutes les pages à potentiel (landing page, Annecy, santé) sont gelées jusqu'à leurs bilans du 20 au 26 novembre ; les seules éligibles (/agence-web-rennes/, 19 impressions hors zone ; /seo-local-annecy/, baisse à confirmer sur un relevé frais) ne justifiaient pas un changement sur des données périmées.
- Cannibalisation : un conflit actif, « refonte de site internet annecy » (propriétaire /refonte-site-web-annecy/, 26 impressions, position 3.7 ; /creation-site-web-annecy/ 5 impressions, position 21.8). Les deux pages sont gelées : à régler après le bilan du 2026-11-20 (angle « création » et lien vers la page refonte).
- Conversion : /blog/articles/avis-google-medecin-que-repondre/ (10 visites Google, 0 intention) reste la page à traiter, gelée jusqu'au 2026-11-22. Test prêt pour le 2026-11-23 (specialiste-conversion) : dans la source, après la ligne italique de cadrage, ajouter « Votre site de cabinet affiche des avis de patients ou un widget Google ? [Réserver un appel de 30 min pour faire vérifier votre site →](https://msd-media.com/reserver-un-appel/) L'appel est gratuit et sans engagement. » ; en option, renommer le lien du bas de la même façon et ajouter la preuve Merz (Radiesse, Ultherapy Prime). Clarity est quasi inutilisable : 37 sessions sur 45 viennent de 127.0.0.1 (trafic de test), aucune session mobile.
- Article : sujet #2 (référencement dentiste) bloqué, requête possédée par l'article dentiste existant et textes officiels illisibles depuis la session ; remplacé par le #3 (Annecy).
- Accès réseau : legifrance.gouv.fr, ordre-chirurgiens-dentistes.fr, developers.google.com, support.google.com et afnic.fr sont refusés par le proxy de la session. Tant que c'est le cas, aucun article santé ou juridique ne peut être sourcé.
- OpenSEO : métriques de 6 mots-clés dentiste et 2 pages de résultats (« référencement dentiste », « publicité dentiste »), 25 crédits dépensés, solde 387. Contexte du projet OpenSEO rempli (activité, objectif, positionnement, style, pages clés). « publicité dentiste » : 40 recherches/mois, difficulté 0, l'Ordre en tête des résultats.
- Relevé de référence des citations IA fait par Maxens le 2026-11-09 (IA-CITATIONS.md) : 0 recommandation sur les 18 prompts neutres (ChatGPT sans mémoire, Claude, Gemini 1 à 7 ; Perplexity non testé). Les IA décrivent correctement MSD Media quand on la nomme. Leviers : avis et fiches sur La Fabrique du Net, Sortlist et Agence Web 74 (hors site), cohérence de l'entité face à la confusion avec MSD (Merck). À traiter par le specialiste-ia le 2026-12-07.
- Audit des citations IA et d'entité avancé au 2026-11-09 à la demande de Maxens (specialiste-ia). Cause principale : les IA recommandent les agences présentes avec beaucoup d'avis dans les annuaires et comparatifs (La Fabrique du Net, Sortlist, Clutch, Semrush/SE Ranking Agencies, annuaires santé Hackceleration et Digitiz) ; MSD Media y est absente ou faible (fiche La Fabrique du Net non revendiquée, 2 avis). Plan retenu par le chef :
  1. (Maxens, dès cette semaine) revendiquer et remplir La Fabrique du Net, compléter Sortlist, avis réels étalés (AVIS.md) ; prompts 1-7, 11, 19, 2, 18, 3, 4, 13, 20.
  2. (Maxens, avancé à novembre-décembre) Clutch (landing page), Malt, annuaires santé, revendiquer 118712 et PagesJaunes, corriger l'effectif sur DesignRush ; même description partout.
  3. (Maxens, hors périmètre de l'agence) entité : description unique « MSD Media, agence web à Annecy, fondée en juin 2025 par Maxens Soldan », sameAs alignés, alternateName « MSD Media Annecy » sur l'accueil et llms.txt ; retirer les prix MSD de llms.txt et de la description de l'accueil (contraire à RULES.md) ; vérifier le badge « 5 étoiles Trustpilot » (Trustpilot public : 4,4 sur 10 avis) et la mention Sorank « 7e des 10 meilleures agences » (page source non retrouvée). /a-propos/ par l'agence à partir du 2026-11-24.
  4. (agence, au plus tôt le 2026-11-22) FAQ « Quelle agence web à Annecy ? » sur /agence-web-annecy/ via data/services.json.
  5. (agence) FAQ de recommandation sur /creation-landing-page/ (au plus tôt le 2026-11-20, avec la version EN) et sur la santé (/site-web-medecine-esthetique/ le 2026-11-22 ou pages secteur le 2026-11-26).
  Ces trois changements de site passent avant les autres lors des passages du 23 et du 30 novembre. Relevé de contrôle : 21 jours après chaque mise en ligne, mêmes prompts ; compléter Gemini 8-20 et Perplexity avant le 2026-12-07.

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
