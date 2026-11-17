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

**Articles** (décision de Maxens du 2026-11-10, après l'audit complet du site) : **2 articles par mois**, les 1er et 3e lundis, **uniquement sur la réglementation et la communication santé** (médecine esthétique, médecins, dentistes, chirurgie esthétique, avis de patients) : ce sont les seuls articles qui attirent la cible prioritaire et qui se classent déjà. Pris dans `seo-pilot/EDITORIAL.md`, écrits selon `seo-pilot/ARTICLE-GUIDE.md`, avec un renvoi vers `/site-web-medecine-esthetique/` ou la page métier santé concernée. Améliorer les pages existantes reste prioritaire : si le lundi demande 3 corrections lourdes, l'article attend.

**Plus de nouvelles pages** : ni page ville, ni page secteur, ni page de service, ni article hors santé. Le site a assez de pages (85 + le blog) ; ce qui manque, c'est l'autorité et la consolidation. Le temps libéré va :
- à la **consolidation** : fusionner les articles qui se disputent la même requête (redirection 301 vers le plus fort, son contenu utile repris), titres et descriptions des pages en page 1 sans clics, maillage vers les pages cibles ;
- à l'**autorité** : chaque 1er lundi du mois, le chef propose à Maxens dans « À toi » **une** opportunité de lien ou de mention précise et faisable (annuaire santé ou marketing reconnu, comparatif tiers où MSD Media manque, média qui accepte une tribune, client qui peut ajouter « site réalisé par MSD Media »), trouvée avec OpenSEO (backlinks des concurrents) ;
- au **projet du trimestre** : l'étude originale « sites de médecine esthétique audités : combien respectent les règles de publicité » (protocole, grille, puis article de données), avec l'outil d'audit existant. C'est le contenu le plus citable par les IA et les médias.

## Passage à 2027 (décision de Maxens du 2026-11-17, priorité jusqu'au 2026-12-31)

But : que les pages datées affichent 2027 avant que Google et les IA ne cherchent des contenus de 2027, sans tomber dans la fausse fraîcheur. Constat de départ : 32 pages ont 2026 dans leur title ou leur H1 (27 dans leur URL), mais aucune des 4 008 impressions du relevé du 2026-11-15 ne vient d'une requête contenant une année. L'année n'attire donc pas les recherches ; elle joue sur le clic (un résultat « 2026 » paraît périmé en janvier) et sur le choix des IA, qui préfèrent un contenu récent et daté. D'où trois traitements, jamais une simple chasse aux « 2026 ».

**Calendrier.** Les lundis 23 et 30 novembre : briefs seulement (pour chaque page du groupe A, la liste des chiffres, prix, règles et sources à revérifier). Du lundi 30 novembre au lundi 28 décembre : passage effectif, dans l'ordre ci-dessous, dans la limite habituelle des 3 pages par passage et du gel de 21 jours. Les pages non faites au 2026-12-31 suivent le même traitement en janvier.

**A. Actualiser et passer à 2027** (contenu qui dépend vraiment de l'année : prix, règles, outils), du plus d'impressions au moins :
1. `/blog/articles/combien-coute-landing-page-france-2026/` (341 impressions, libre après son bilan du 2026-11-20)
2. `/blog/articles/site-internet-dentiste-ce-qui-est-autorise/` (186, libre le 2026-12-07)
3. `/blog/articles/site-internet-medecine-esthetique-ce-qui-est-autorise/` (84)
4. `/blog/articles/logiciels-seo-marque-blanche-agences-2026/` (32 ; prix des outils à revérifier un par un)
5. `/blog/articles/meilleurs-logiciels-seo-2026/`, `/blog/articles/combien-coute-site-web-annecy-2026/` (libre le 2026-12-01), `/blog/articles/combien-coute-refonte-site-internet-2026/`, `/blog/articles/combien-coute-seo-annecy-2026/`, `/blog/articles/combien-coute-landing-page-annecy-2026/`

**B. Rendre intemporel** (le contenu ne dépend pas de l'année) : retirer l'année du title, du H1 et de la description, sans autre changement de fond. `/blog/articles/referencement-naturel-annecy/` (50 impressions), `/blog/articles/structure-landing-page-saas/`, `/blog/articles/creer-landing-page-qui-convertit/`, `/blog/articles/core-web-vitals-guide-2026/`, `/blog/articles/creation-site-web-annecy-2026/`, `/blog/articles/faut-il-creer-site-web-2026/`, `/blog/articles/wordpress-vs-site-sur-mesure-annecy-2026/`, `/blog/articles/copywriting-web-2026-textes-qui-convertissent/`, `/blog/articles/agence-web-freelance-nocode-2026/`, `/blog/articles/refonte-site-internet-guide-2026/`, `/blog/articles/vitesse-performance-site-web-annecy-2026/`, `/blog/articles/google-business-profile-annecy-2026/`. Après le groupe A, et seulement pour les pages qui ont des impressions.

**C. Garder l'année** (instantané daté : l'année est le sujet) : `/blog/articles/publicite-chirurgie-esthetique-decret-2026/`, `/blog/articles/google-mise-a-jour-aout-2026/`, `/blog/articles/accessibilite-web-obligatoire-entreprises-2026/`. Rien à faire, sauf si le texte de loi change.

**D. Ne pas investir** : les pages de la pré-liste des retraits ou sans impression depuis trois relevés (`seo-local-ia-2026`, `aeo-seo-geo-guide-2026`, `google-business-profile-strasbourg-2026`, `seo-local-alsace-2026`, `pourquoi-site-web-ne-convertit-pas-2026`, `top-10-questions-landing-page-2026`, `avis-clients-autorite-geo-2026`, `google-ai-mode-zero-click-2026`) : elles attendent la décision de retrait du 2026-12-13.

**Règles du passage (groupe A).**
- Une vraie mise à jour d'abord : chaque prix, chiffre, règle et date est revérifié à sa source, et ce qui a changé est corrigé. Si une source ne peut pas être lue depuis la session, la page attend : on ne passe pas à 2027 un contenu non vérifié.
- Ensuite seulement : « 2026 » devient « 2027 » dans le title, le H1, la description et ses copies `og:` et `twitter:`, et dans le texte là où l'année désigne le présent ; le champ `updated:` de la source prend la date du jour. Les années qui datent un fait (« décret du … 2026 », « mise à jour d'août 2026 ») restent.
- Jamais de chiffre « 2027 » qui n'existe pas encore : un prix ou une règle se présente comme l'état vérifié à la date de mise à jour.
- **Les URL ne changent pas** (pas de redirection pour une année) : le slug garde « 2026 », seul ce qui s'affiche change.
- Chaque passage est une entrée du journal (type `seo`), avec son bilan à 21 jours comme les autres.

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
| **Nov. 2026** | Fondations | Bilans des titres d'octobre (et de ceux réécrits le 10 nov.) ; maillage vers les 3 pages cibles ; 2 articles santé ; protocole de l'étude médecine esthétique | Lancer les demandes d'avis aux anciens clients, 2 à 3 par semaine (`AVIS.md`) ; compléter la fiche Google |
| **Déc. 2026** | Fondations | Pages santé : réponses directes et FAQ ; 2 articles santé (pause entre Noël et le Nouvel An) | Annuaires : La Fabrique du Net, Sortlist, Clutch, 118712, PagesJaunes |
| **Janv. 2027** | Contenu | Mise à jour de l'article prix landing page pour 2027 ; guide pilier « communication des médecins » ; 2 articles santé | Fournir les données de l'étude des 84 cabinets si elle est faite |
| **Févr. 2027** | Contenu | Article de l'étude médecine esthétique si les données sont là ; 2 articles santé | Retour en France : tourner la vidéo Merz, recueillir 2 ou 3 cas clients chiffrés |
| **Mars 2027** | Contenu | Études de cas chiffrées en ligne (avec les données de Maxens) ; mise à jour des 10 articles les plus vus ; **bilan trimestriel** | Pitch presse locale avec l'étude des cabinets |
| **Avr. 2027** | Autorité | Pages qui stagnent entre 4 et 15 : renforcement ; 2 articles santé | Liens : clients (« site réalisé par MSD Media »), French Tech, Polytech |
| **Mai 2027** | Autorité | Articles « données », les plus citables par les IA (jamais de classement où MSD Media se place premier) ; 2 articles santé | Réponses utiles et signées sur Reddit et les forums pros |
| **Juin 2027** | Autorité | **Bilan semestriel** ; recentrage sur ce qui a marché | Podcast ou interview (santé, entrepreneuriat) |
| **Juil. 2027** | Accélération | 2 articles santé ; mise à jour des pages saisonnières | Si le déménagement à Strasbourg est confirmé : fiche Google Strasbourg, adresse réelle |
| **Août 2027** | Accélération | Préparer les contenus prix et tendances 2028 ; 2 articles santé | |
| **Sept. 2027** | Accélération | Rentrée : 2 articles santé, mise à jour des contenus santé avec les textes de l'année | Relancer les demandes d'avis (objectif 20 fin octobre) ; un avis par client livré |
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
