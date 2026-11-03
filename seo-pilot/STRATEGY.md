# Stratégie SEO de msd-media.com (novembre 2026 → novembre 2027)

Document de référence du pilote. Il ne change que sur décision de Maxens. Chaque semaine, le pilote choisit ses actions dans l'ordre des priorités ci-dessous, et vérifie chaque premier lundi du mois où l'on en est par rapport aux jalons.

## Point de départ (relevé du 2026-10-31, 28 jours)

- 52 clics, dont **3 seulement hors marque** (recherches sans « msd », « maxens », « soldan »), sur 2 752 impressions hors marque.
- Le site est vu (impressions en hausse de 33 %) mais presque jamais cliqué hors marque : les pages sont en page 1 basse ou en page 2.
- Trois groupes de recherches portent déjà des impressions :
  1. **Landing page** (national) : « prix landing page », « agence landing page », « agence création de landing page » : environ 550 impressions, positions 9 à 14.
  2. **Santé** : avis Google médecin, ce que le site d'un médecin ou d'un dentiste peut afficher : environ 750 impressions, positions 5 à 17.
  3. **Annecy** : refonte, audit SEO, référencement, maintenance (positions 4 à 13) ; « création site internet Annecy » (42) et « agence web Annecy » (15 à 28) restent loin.

## Ce qui marche, d'après les sources fiables

- **Délais** : un changement sur une page déjà indexée est relu en quelques jours à quelques semaines. Les premiers effets nets se voient en 3 à 6 mois, et les requêtes concurrentielles en 6 à 12 mois. Seules environ 6 % des pages atteignent le top 10 dans l'année qui suit leur publication (Ahrefs) : **améliorer les pages déjà visibles rapporte plus vite que publier**.
- **Titres** : réécrire titre et description d'une page déjà en page 1 donne les gains les plus rapides, mais l'effet varie et certains tests sont négatifs. On teste donc une page à la fois, on mesure 3 semaines, et on garde ou on annule.
- **Liens internes** : les tests contrôlés (SearchPilot, Zyppy) montrent un effet réel, qui plafonne au-delà d'un certain nombre. Viser 3 à 5 liens contextuels vers chaque page prioritaire, depuis des pages proches et visitées.
- **Local** (Whitespark 2026, enquête d'experts) : la fiche Google pèse environ 32 %, les avis environ 20 %, le site environ 15 à 19 %. **La fraîcheur des avis** a fortement monté. Avoir une page dédiée par service aide. Le pack local peut bouger en 4 à 8 semaines. **Contrainte MSD Media** : Google a déjà supprimé une partie des avis. Les nouveaux avis doivent donc suivre la méthode de `seo-pilot/AVIS.md` pour tenir, et arriver progressivement (objectif : 15 fin avril).
- **IA (ChatGPT, Perplexity, AI Overviews)** : les AI Overviews puisent dans l'index Google, donc bien se classer reste la base. Ce qui augmente les citations : une réponse directe dans les 60 à 100 premiers mots, des données originales, des mentions sur d'autres sites, et Reddit pour les questions de recommandation. Les contenus cités par les IA sont en moyenne plus récents (Ahrefs).

## Priorités du pilote, dans cet ordre

0. **Conversion** : une page qui reçoit des visites Google (au moins 10 sur 28 jours dans GA4) mais ne produit aucune intention passe en tête. On rend la réponse plus nette, on montre les preuves existantes, on place mieux l'appel à réserver un appel, avec les blocs de la home.
1. **Page 1 sans clics** (position 4 à 10, CTR sous 2 %) : titre et description qui reprennent la requête exacte, avec une promesse concrète (délai, gratuit, guide pas à pas, année).
2. **Bas de page 1 et page 2** (position 11 à 20, au moins 30 impressions) : réponse directe de 2 phrases sous le H1, section ou FAQ qui couvre l'intention, et 3 à 5 liens internes contextuels depuis les pages du même groupe.
3. **Pages de service cibles**, à faire monter par le maillage interne, l'une après l'autre :
   - `/creation-landing-page/` : « agence landing page », « création landing page ». Les articles du groupe landing page lui renvoient le visiteur.
   - `/creation-site-web-annecy/` et `/agence-web-annecy/` : « création site internet Annecy », « agence web Annecy ».
   - `/site-web-medecine-esthetique/` (hub santé) et les pages métiers santé.
4. **Articles en baisse** (−25 % d'impressions ou −3 places) : mise à jour réelle (faits, exemples, date de mise à jour), jamais un simple changement de date.
5. **Lisibilité par les IA** sur les pages qui ont des impressions : réponse directe en tête, faits datés, FAQ.

Une seule modification par page à la fois. Pas de nouvelle modification sur une page avant son bilan à 21 jours.

**Articles** : 1 article par semaine, pris dans `seo-pilot/EDITORIAL.md` et écrit selon `seo-pilot/ARTICLE-GUIDE.md`. Chaque article sert un des 3 groupes et renvoie vers sa page de service cible. Améliorer les pages existantes reste prioritaire : si la semaine demande 3 corrections lourdes, l'article peut attendre.

## Axe Munich (ajouté le 2026-11-03, décision de Maxens)

Maxens est membre de la communauté French Tech Munich. Il vit et travaille à Munich (la carte « Munich » du footer est donc juste et voulue : ne pas la signaler), mais il ne parle pas allemand et n'a pas de bureau ni d'adresse où recevoir des clients à Munich : on ne vise donc **ni les recherches en allemand, ni la fiche Google Business Profile à Munich** (Google l'interdit sans adresse réelle où recevoir des clients). On vise trois cibles, en français et en anglais :
1. les entrepreneurs francophones installés à Munich (indépendants, filiales françaises, startups) ;
2. les entreprises allemandes qui veulent vendre en France (site écrit pour le marché français, SEO Google France) ;
3. les startups internationales de Munich qui travaillent en anglais.

Pages : `/agence-web-munich/` (FR) et `/en/munich/` (EN), reliées par hreflang, générées depuis `data/services.json`. Ne jamais écrire que MSD Media a un bureau ou reçoit sur place à Munich, ni promettre des contenus en allemand (on intègre les textes fournis par le traducteur du client). Pas de cas client munichois inventé : la page n'en aura qu'une fois un vrai projet livré.

Ce que fait l'agence : suivre dans la Search Console les requêtes contenant « munich », « münchen », « bavière » ou « germany » ; enrichir les deux pages (FAQ, réponses directes) quand une requête apparaît ; un article par mois au plus sur l'axe Munich (voir `EDITORIAL.md`). Ce que fait Maxens : la présence dans l'écosystème (voir la liste plus bas), qui apporte l'essentiel des clients les 6 premiers mois.

## Feuille de route : 1er novembre 2026 → 1er novembre 2027

Chaque phase prépare la suivante. L'agence travaille chaque lundi ; les actions de Maxens sont celles que l'agence ne peut pas faire à sa place.

| Période | Phase | L'agence | Maxens |
|---|---|---|---|
| **Nov. 2026** | Fondations | Bilans des titres d'octobre ; maillage vers les 3 pages cibles ; 4 articles (dont 2 santé) | Lancer les demandes d'avis aux anciens clients, 2 à 3 par semaine (`AVIS.md`) ; compléter la fiche Google |
| **Déc. 2026** | Fondations | Pages santé : réponses directes et FAQ ; 3 articles (pause entre Noël et le Nouvel An) | Annuaires : La Fabrique du Net, Sortlist, Clutch, 118712, PagesJaunes |
| **Janv. 2027** | Contenu | Mise à jour de l'article prix landing page pour 2027 ; guide pilier « communication des médecins » ; 4 articles | Fournir les données de l'étude des 84 cabinets si elle est faite |
| **Févr. 2027** | Contenu | Article de l'étude des 84 cabinets si les données sont là ; 4 articles | Retour en France : tourner la vidéo Merz, recueillir 2 ou 3 cas clients chiffrés |
| **Mars 2027** | Contenu | Études de cas chiffrées en ligne (avec les données de Maxens) ; mise à jour des 10 articles les plus vus ; **bilan trimestriel** | Pitch presse locale avec l'étude des cabinets |
| **Avr. 2027** | Autorité | Pages qui stagnent entre 4 et 15 : renforcement ; 4 articles | Liens : clients (« site réalisé par MSD Media »), French Tech, Polytech |
| **Mai 2027** | Autorité | Articles « données » et comparatifs honnêtes, les plus citables par les IA ; 4 articles | Réponses utiles et signées sur Reddit et les forums pros |
| **Juin 2027** | Autorité | **Bilan semestriel** ; recentrage sur ce qui a marché | Podcast ou interview (santé, entrepreneuriat) |
| **Juil. 2027** | Accélération | 3 articles (été) ; mise à jour des pages saisonnières | Si le déménagement à Strasbourg est confirmé : fiche Google Strasbourg, adresse réelle |
| **Août 2027** | Accélération | Préparer les contenus prix et tendances 2028 ; 3 articles | |
| **Sept. 2027** | Accélération | Rentrée : 4 articles, mise à jour des contenus santé avec les textes de l'année | Relancer les demandes d'avis (objectif 20 fin octobre) ; un avis par client livré |
| **Oct. 2027** | Bilan | **Bilan annuel** ; proposition du plan de l'année 2 (2e niche : dentaire ou coachs) | Décider de l'année 2 |

## Objectifs et indicateurs

Les objectifs chiffrés (clients, leads, clics, par semaine, mois et trimestre) et la façon de les manager sont dans `seo-pilot/KPIS.md`. Ils priment sur toute autre estimation.

## Ce que seul Maxens peut faire (rappel mensuel, pas hebdomadaire)

Le site seul plafonne : à partir de février, ce sont surtout ces actions qui feront la différence.

1. **Avis Google** : 10 fin janvier, 15 fin avril, 20 fin octobre, selon la méthode de `seo-pilot/AVIS.md` (vrais clients, postés par eux, étalés dans le temps). En complément : un témoignage nommé pour le site et des avis sur Trustpilot, Sortlist, Clutch ou Malt.
2. **Fiche Google** : catégorie principale « Concepteur de sites Web », services listés, horaires, une publication par semaine avec photo.
3. **Annuaires** : La Fabrique du Net, Sortlist, Clutch, 118712, PagesJaunes, avec la même description, la même adresse et le même téléphone partout.
4. **Liens** : « site réalisé par MSD Media » chez les clients, French Tech Alpes, Polytech, presse locale.
5. **Mentions** : réponses utiles et signées sur Reddit et les forums pros, et LinkedIn. Ce sont des sources que les IA citent.
7. **Munich** : fiche dans l'annuaire de la communauté French Tech Munich (avec lien vers /agence-web-munich/), événements French Tech Munich, réseaux franco-allemands (chambre de commerce franco-allemande, Business France Allemagne, Institut français de Munich), posts LinkedIn sur le passage au marché français. Premier client munichois → étude de cas.
6. **Données originales** : l'étude des sites de cabinets santé d'Annecy. C'est le contenu le plus citable par la presse et les IA.

Le rapport du premier lundi du mois rappelle les 2 actions de cette liste qui auraient le plus d'effet à ce moment-là.
