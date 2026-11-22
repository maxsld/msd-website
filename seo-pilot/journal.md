# Journal du pilote SEO

Chaque modification faite sur le site pour le référencement, avec ses chiffres de départ, pour en mesurer l'effet 21 jours plus tard.

Hors entrées : le 2026-10-30, les 11 pages « agence web + ville » hors zone et /landing-page-bruxelles/ ont été redirigées (301). C'est définitif, ne pas revenir dessus.

Hors entrées : le 2026-11-02, refonte du design de tout le site (thème clair, nouveau header et footer, polices Inter Tight et Manrope, mêmes textes sauf l'accueil). Les bilans de novembre doivent en tenir compte : une variation commune à toutes les pages vient probablement de la refonte, pas des changements ci-dessous.
Le même jour, les 12 pages secteur (site-web-…) ont été reconstruites sur le modèle de l'accueil par `scripts/build-sector-pages.py` (contenu dans `data/sectors.json`). Textes, FAQ et données structurées conservés ; leur structure change. Pour les modifier : éditer `data/sectors.json` puis relancer le script, jamais le HTML directement.
Le 2026-11-03, les 15 pages de service ont été reconstruites de la même façon (contenu dans `data/services.json`), et les anciennes sections communes des autres pages (réalisations, process, avis, FAQ, « Demander à l'IA ») remplacées par celles de l'accueil. Textes, FAQ et données structurées conservés.
Le 2026-11-03, audit SEO/AEO/GEO après refonte : titles, descriptions, canonicals et données structurées identiques à avant sur toutes les pages. Corrigé : étiquette au-dessus du H1 passée de <h2> à <p> (75 pages, le H1 est maintenant le premier titre), données structurées Blog + fil d'Ariane sur /blog/, ancre cassée sur /faq-seo/, llms.txt (première version en 7 jours). À traiter par l'agence, page par page : 10 titles > 60 caractères et 5 descriptions > 160 (outils, template, 6 articles, /refonte-site-web-annecy/).

Hors entrées : le 2026-11-22, Maxens confie à l'équipe les suites de l'audit complet du 2026-11-21 : **lire `seo-pilot/audit-complet-2026-11-21.md` au passage du 2026-11-23** et traiter en premier le groupe landing page (l'ancien comparatif redirigé recule de 12 à 21 et `/creation-landing-page/` de 17 à 28). Les points marqués « à Maxens » ne sont pas pour l'agence. Ajout du même jour : section « Failles de mots-clés du 2026-11-22 » dans ce fichier (avis Google médecin, création site internet dentiste), à traiter juste après le groupe landing page.

## Entrées

### 2026-11-22 : date de la vidéo Maxime Sciare (alerte Search Console)
- Changement : `uploadDate` du VideoObject passé de « 2026-09-10 » à « 2026-09-10T12:00:00+02:00 » sur /realisations/maxime-sciare/ et /en/work/maxime-sciare/, après l'e-mail Search Console « Données structurées Vidéos » (fuseau horaire manquant, valeur de date et heure incorrecte). Ce sont les 2 seules pages du site avec une vidéo balisée.
- Avant : 2 problèmes non critiques signalés par la Search Console.
- Hypothèse : alertes levées à la prochaine exploration ; pas d'effet de classement attendu. Ne compte pas comme changement de contenu pour le gel de 21 jours.
- Type : `technique`

### 2026-11-20 : Landing Express et premier mois de MSD Care inclus (décision de Maxens, plan 1600)
- Changement : /tarifs/ (FR et EN) ajoute Landing Express, 2 990 € en 7 jours, une place par mois (bloc `#landing-express` et offre dans les données structurées). La carte Landing Page affiche « Ajustements illimités jusqu'à validation » et « 1er mois de MSD Care Essentiel inclus ». Le mois inclus est sans engagement, avec un préavis de 7 jours avant sa fin, puis 89 € par mois résiliables avec un mois de préavis : il figure sur /tarifs/msd-care/, dans les CGV (articles 5 et 5 bis, FR et EN), dans FAITS.md, OFFRES.md, le chatbot et llms.txt. RULES.md autorise désormais les prix sur l'accueil (non utilisé pour l'instant : accueil inchangé).
- Avant : un seul délai, 21 jours ; MSD Care jamais inclus.
- Hypothèse : plus de demandes depuis /tarifs/ et plus d'abonnés MSD Care après livraison ; pas d'effet SEO attendu.
- Type : `offre`

### 2026-11-20 : nouvelle grille MSD Care (décision de Maxens)
- Changement : /tarifs/msd-care/ et sa version anglaise passent à Essentiel 89 € (rapport mensuel automatique, 2 modifications par an incluses), Suivi 190 € recommandé (remplace Croissance 390 € : modifications incluses jusqu'à 1 h par mois, journal daté des interventions) et Marque sur devis (remplace « à partir de 590 € » : validation de chaque texte par le client, historique des versions). L'option SEO sort de la grille, sur devis. Clause de continuité ajoutée (CGV art. 5 bis FR et EN). FAQ refaite (9 questions, dont les objections « site neuf », « ce qui est fait », « et si MSD Media s'arrête ») ; carte MSD Care de /tarifs/, FAQ de l'accueil, llms.txt, chatbot, FAITS.md et OFFRES.md alignés.
- Avant : Essentiel 89 €, Croissance 390 €, Marque dès 590 €.
- Hypothèse : plus de souscriptions MSD Care à la livraison ; pas d'effet SEO attendu (mêmes URL, mêmes titres).
- Type : `offre`

Verdict (2026-11-17) : passage de rattrapage, un jour après celui du 2026-11-16, sur le même relevé du 2026-11-15 (82 clics, 4 hors marque, 43 visites Google et 0 lead ; Search Console et GA4, 28 jours au 2026-11-12) : le maillon le plus faible reste visites → intentions, et toutes les pages qui portent du trafic sont gelées jusqu'aux bilans du 20 au 26 novembre. Aucune page modifiée.

### 2026-11-17 : questions longues de Search Console (méthode de Maxens)
- Changement : nouveau relevé `scripts/seo-pilot-questions.mjs` (dimanche, dans seo-pilot.yml) : requêtes de 8 mots ou plus sur 3 mois (filtre `^(?:\S+\s+){7,}\S+$`), écrites dans `seo-pilot/data/questions.md`, avec la page, la position, le bruit écarté (requêtes booléennes de veille, prompts collés) et les pages redirigées signalées. Mode d'emploi au point 10 de PROMPT.md ; ARTICLE-GUIDE, responsable-editorial et specialiste-ia reprennent ces formulations dans les FAQ. Premier relevé (2026-08-16 → 2026-11-14) : 29 requêtes, 95 impressions, 0 clic ; un tiers de bruit, et les plus gros volumes sont hors cible (vendeurs cherchant une agence immobilière à Annecy, 36 impressions ; clinique vétérinaire ; agence web Lyon). Appliqué tout de suite : /blog/articles/apparaitre-chatgpt-perplexity-google-ia/ (nouvelle question « Comment référencer son site sur Google et ChatGPT en 2026 ? », réponse « concurrent recommandé par ChatGPT » complétée par la façon de comprendre pourquoi ; `updated: 2026-11-17`) et /agence-web-geneve/ (question « À qui confier la refonte de son site web à Genève ? », dans data/services.json et la page).
- Avant : FAQ sans ces deux questions.
- Hypothèse : impressions sur ces formulations longues dans 3 à 6 semaines et chances d'être cité par les IA sur ces questions ; volume faible, signal de formulation.
- Requête visée : « comment référencer son site sur google et chatgpt en 2026 » (position 33) ; « à qui confier la refonte de son site web à genève » (position 15,6, sur une page retirée).
- Départ : 1 et 5 impressions, 0 clic (3 mois au 2026-11-14).
- Type : `seo`
- À reprendre quand libres : /blog/articles/combien-coute-landing-page-france-2026/ (« créateur de pages de destination par IA : est-ce rentable ? », position 3 ; bilan le 2026-11-20). Sans page : « prix des services SEO pour une PME », « prix d'un outil de GEO », « externaliser sa stratégie de contenus » (1 impression chacune) : sujets candidats seulement s'ils reviennent.

### 2026-11-16 : article dispositif médical réécrit sans Merz ; Trustpilot 5/5 rétabli (décision de Maxens)
- Changement : /blog/articles/landing-page-dispositif-medical/ réécrit sur la même URL sans nommer de client : plus de Merz, Radiesse, Ultherapy Prime, études Goldie et Moers, délai de 18 jours ni liens vers les réalisations Merz. La méthode devient générale, en 5 points (catégorie avant bénéfice, études citées dans le texte, double lecteur, localisateur de praticiens, contraintes techniques d'un laboratoire), avec un tableau « produit à effet progressif / bénéfice immédiatement compris ». Title « Landing page dispositif médical : la méthode en 5 points ». Règle ajoutée à RULES.md, PROMPT.md, ARTICLE-GUIDE.md, EDITORIAL.md et FAITS.md : un client n'est jamais le sujet d'un contenu ni détaillé hors de sa page de réalisation, Merz moins encore. `check-verite.py` signale toute mention de Merz ou de ses produits dans le blog. /blog/articles/agence-landing-page-site-web-france-msd-media/ : « Chaque avis Trustpilot est noté 5 / 5. » rétabli (Maxens : chaque avis est à 5/5 ; FAITS.md mis à jour).
- Avant : article « notre méthode avec Merz », détaillant les deux projets Merz.
- Hypothèse : la requête visée reste la même ; on retire un contenu que MSD Media n'a pas le droit de publier.
- Requête visée : landing page dispositif médical.
- Départ : article publié le matin même, aucune donnée.
- Type : `seo`
- Précision de Maxens (même jour) : citer Merz dans le corps d'un article, y compris la méthode appliquée pour ses pages, est permis ; seuls le title, le H1, la description, le slug et le sujet principal lui sont interdits. Les 4 articles qui citent Merz en une ligne restent tels quels ; l'article réécrit garde une phrase de référence vers les deux réalisations. `check-verite.py` bloque désormais Merz, Radiesse ou Ultherapy dans le title, la description, le slug ou le H1 d'un article.

### 2026-11-16 : source du badge « Top 7 des agences web en France, classement Sorank 2026 »
- Changement : la source a été retrouvée et vérifiée. Classement Sorank « Les 10 meilleures agences de création de sites en France », publié le 25 août 2026, MSD Media 7e : https://www.sorank.com/fr/blog-geo-seo/meilleures-agences-creation-de-sites-france. Le badge y renvoyait déjà sur toutes les pages, mais dans le hero seul le mot « Sorank » était cliquable ; le lien couvre maintenant « Classement Sorank 2026 » (« Sorank 2026 ranking » en anglais), sur 31 pages FR et 3 EN. L'assistant du site datait le classement d'« octobre 2026 » : corrigé en août 2026, avec l'adresse. Classement ajouté à FAITS.md.
- Avant : lien sur le seul mot « Sorank ».
- Hypothèse : aucune variation de trafic attendue ; preuve plus facile à vérifier pour un visiteur ou une IA.
- Requête visée : aucune.
- Départ : relevé du 2026-11-15.
- Type : `seo`

Verdict (2026-11-16) : le site est plus vu et plus cliqué (6 341 impressions, +37 % ; 82 clics, +78 %, dont 26 sur l'article avis Google ; Search Console, 28 jours au 2026-11-12), mais rien ne se transforme : 1 clic vers la réservation pour 43 visites Google et 0 lead (GA4, même période). Le maillon le plus faible est visites → intentions ; la page qui concentre le trafic (avis Google médecin, 20 visites, 0 intention) est gelée jusqu'au 2026-11-22, son test de conversion est prêt pour le 2026-11-23.

### 2026-11-16 : /blog/articles/landing-page-dispositif-medical/
- Changement : nouvel article santé « Landing page de dispositif médical : notre méthode avec Merz » (sujet 7 d'EDITORIAL.md) : méthode de conception tirée des deux réalisations Radiesse et Ultherapy Prime (catégorie avant bénéfice, études citées dans le texte, localisateur de praticiens, contraintes WordPress d'un laboratoire), tableau comparatif, 6 questions de FAQ, liens vers /site-web-medecine-esthetique/, les deux pages Merz, l'article de référence médecine esthétique et /site-web-centre-laser/. Aucune règle ANSM (textes illisibles depuis la session, l'article n'en affirme aucune) ; seules règles de droit : R4127-19-1 et MACSF, reprises de l'article de référence. Aucun lien ajouté depuis un autre article (pages gelées).
- Hypothèse : premières impressions sur « landing page dispositif médical » et variantes en 2 à 6 semaines (aucune impression aujourd'hui, volume inconnu : OpenSEO indisponible) ; surtout, une page citable par les IA qui renforce la preuve Merz et le hub santé (levier confiance).
- Requête visée : landing page dispositif médical (ne pas viser « Merz », « Radiesse », « Ultherapy » : requêtes des pages de réalisation).
- Départ : nouvel article.
- Type : `seo`
- Relecture : validé du premier coup ; remarque appliquée (ligne de cadrage : « avis des équipes réglementaires du fabricant »). Sujet 5 (prix site médecin esthétique) bloqué : aucune source de prix lisible.

### 2026-11-16 : /blog/articles/site-internet-dentiste-ce-qui-est-autorise/
- Changement : la page répond explicitement à « un dentiste peut-il faire du référencement ? » : réponse courte ramenée à 100 mots avec une phrase sur le référencement (R4127-217, prioritaire interdit payant ou non ; site qui informe = information, notre lecture), description réécrite avec « référencement », H2 « Google Ads et référencement : où est la limite ? » devenu une question, paragraphe « Notre lecture » reformulé en phrase autonome, liste de 4 actions déjà présentes dans l'article (page d'honoraires, page par traitement, informations pratiques, nom de domaine), nouvelle question de FAQ « Un dentiste peut-il faire du référencement (SEO) pour son site ? » ; champ `updated: 2026-11-16` (dateModified et mention « Mis à jour le »). Nouvelle description : « Tarifs obligatoires, avis patients, Google Ads et référencement : ce que le site internet d'un chirurgien-dentiste peut afficher selon l'Ordre. » Title, H1, keyword, sources inchangés ; aucune règle de droit nouvelle.
- Avant : description « Tarifs obligatoires, avis patients, photos avant/après, Google Ads : ce que le site d'un chirurgien-dentiste peut afficher selon les recommandations de l'Ordre. » ; dernière phrase de la réponse courte « Acheter un référencement prioritaire sur Google, par exemple avec Google Ads, est interdit. » ; H2 « Google Ads et référencement : où est la limite ? ».
- Hypothèse : « référencement dentiste » passe de la position 13-15 à la page 1 (≤ 10) en 3 à 6 semaines, parce que la page répond désormais à la question dans ses 100 premiers mots, dans un H2 et dans la FAQ ; CTR attendu ≥ 2 % une fois en page 1 (title inchangé, description plus proche de la requête). Gain modeste (OpenSEO 2026-11-09 : environ 10 recherches/mois), mais cible prioritaire et angle unique (R4127-217, absent des guides SEO concurrents d'après l'analyste concurrence).
- Requête visée : référencement dentiste (propriétaire : cette page, seule du site sur la requête).
- Départ : page 186 impressions, 3 clics, position 11.6 ; « referencement dentiste » 54 impressions, 0 clic, position 14.7 ; « référencement dentiste » 20 impressions, 0 clic, position 12.6 (28 jours au 2026-11-12, Search Console).
- Type : `seo`
- Note : la SERP est fragmentée (guides SEO d'agences, annuaires, Ordre en tête, AI Overview présent d'après OpenSEO 2026-11-09). Points « à sourcer plus tard » (Ordre illisible) : fiche Google d'un dentiste, pages par ville, amende de 3 000 € sans date dans l'article, divergence sur la version des recommandations (29 mars 2023 vs 19 juin 2026).

### 2026-11-16 : /blog/articles/agence-landing-page-site-web-france-msd-media/
- Changement : correction de vérité. « Note moyenne des avis Trustpilot : 5 / 5 » retirée (FAITS.md : à confirmer ; relevé du 2026-11-09 : 4,4 sur 10 avis), remplacée par un simple lien vers les avis Trustpilot ; « Avis clients vérifiés » → « Avis clients » ; « avis Trustpilot certifiés » → « avis Trustpilot publics ».
- Avant : « **Note moyenne des avis Trustpilot : 5 / 5** — [voir les avis complets](https://www.trustpilot.com/review/msd-media.com) » ; H2 « Avis clients vérifiés (Trustpilot) » ; « avis Trustpilot certifiés ».
- Hypothèse : aucun effet de trafic attendu (0 impression sur les 3 derniers relevés) ; on retire une affirmation fausse qui expose la marque. Cet article est le candidat au retrait n° 1 de la pré-liste (hors stratégie, 0 impression, à confirmer sur 3 relevés non chevauchants) : décision après le 2026-12-13.
- Requête visée : aucune (correction de vérité).
- Départ : 0 impression, 0 clic (relevés du 2026-10-31, 2026-11-03 et 2026-11-15).
- Type : `seo`
- Relecture : validé. Suivi : `assets/i18n/translations.json` (clé `art_msdmediahub_body`, inutilisée) contient encore « Note moyenne des avis Trustpilot : 5 / 5 » en FR et EN : à nettoyer au prochain passage.
- Note : l'article dit encore « livrés en 21 jours » sans « à compter de la réception des éléments » (ligne 15 de la source) : à aligner sur FAITS.md au prochain passage où la page est libre (2026-12-07).

### 2026-11-12 : MSD Care en trois niveaux, sur une sous-page (décision de Maxens)
- Changement : nouvelle page `/tarifs/msd-care/` (et `/en/pricing/msd-care/`, générée) avec les trois niveaux : Essentiel 89 €, Croissance 390 €, Marque à partir de 590 € par mois, engagement de 3 mois pour tous, puis préavis d'un mois. Ajoutée aux sitemaps et au plan du site. Sur /tarifs/, la carte MSD Care devient un résumé « à partir de 89 € » avec un lien vers la sous-page. CGV article 5 bis, llms.txt, assistant du site, article maintenance (lien vers la sous-page, sans prix), FAQ « coûts après la création » (accueil, /tarifs/), FAITS.md, RULES.md (prix permis aussi sur la sous-page), OFFRES.md et le skill /devis mis à jour. `scripts/check-verite.py` accepte les prix sur la sous-page.
- Avant : une seule formule MSD Care à 490 € par mois.
- Hypothèse : une maintenance accessible aux indépendants (landing pages) qui ne prenaient pas MSD Care à 490 €.
- Requête visée : aucune au départ ; ne pas orienter la sous-page vers « maintenance site web Annecy », que possède /blog/articles/maintenance-site-web-annecy/.
- Départ : relevé du 2026-11-09 (page nouvelle, aucune donnée).
- Type : `conversion`

### 2026-11-12 : conditions de vente alignées entre le site et les CGV (décision de Maxens)
- Changement : décisions de Maxens appliquées partout (FR, EN, données structurées, assistant du site, llms.txt, portes IA). Délai : « version finale en 21 jours à compter de la réception de vos éléments » ; les CGV passent de 21 jours ouvrés à 21 jours calendaires (toujours indicatif), avec suspension si le client tarde et clôture possible après 60 jours sans réponse à une relance écrite. Acompte : 50 % à la signature (CGV, /tarifs/, accueil, /reserver-un-appel/). Code, domaine et accès : remis « dès le règlement du solde » au lieu de « à la livraison » (accueil, process des 30 pages ville et métier, /tarifs/, /faq-seo/, /agence-web-munich/, CGV article 7). MSD Care : engagement de 3 mois puis préavis d'un mois (/tarifs/, CGV nouvel article 5 bis, llms.txt, article maintenance). /tarifs/ : nouveau bloc « Ce qui n'est pas inclus » (#non-inclus) et réponse « coûts après la création » qui renvoie vers MSD Care. Les 4 pages métier santé disaient « 21 jours ouvrés » : alignées. Ajustements : toujours inclus jusqu'à validation, sans limite (choix de Maxens).
- Avant : voir le diff git du commit.
- Hypothèse : moins d'objections et de mauvais prospects à l'appel ; pas d'effet SEO attendu.
- Requête visée : aucune (vérité commerciale).
- Départ : relevé du 2026-11-09.
- Type : `seo`
- Note : la description de /blog/articles/maintenance-site-web-annecy/ (test de title du 2026-10-30, bilan le 2026-11-20) disait « Sans engagement » ; elle dit maintenant « Engagement de 3 mois ». Le title testé n'a pas changé, mais en tenir compte au bilan.
- Attention : `data/services.json` n'est plus à jour avec les pages en ligne. Relancer `scripts/build-sector-pages.py` remplacerait le paragraphe « Des clients d'ici, avec des résultats vérifiables… » de /agence-web-annecy/ par une ancienne version, et changerait le lien « English version » et la FAQ prix de /en/munich/. Avant toute régénération, recopier ces textes dans le JSON (les chiffres cités doivent figurer sur les pages de réalisation, voir FAITS.md).
- Ensuite (même jour) : la maintenance devient MSD Care partout. /blog/articles/10-erreurs-creation-site-web-annecy/ disait « chez MSD Media, elle est offerte la première année » et /blog/articles/combien-coute-site-web-annecy-2026/ « Hébergement + maintenance + SSL inclus la 1ère année » : faux, remplacés par MSD Care (lien vers /tarifs/#msd-care, sans prix). FAQ de l'accueil FR et EN (« Que coûte un site une fois en ligne ? ») : MSD Care ajouté.
- Reste à faire : les études de cas Nation Startup (+350 bêta-testeurs en 1 semaine) et Agence 3XL (3 rendez-vous le jour du lancement) ont déjà un résultat de conversion, mais il n'est mis en avant ni sur l'accueil ni sur /tarifs/. Un chiffre Merz viendra de Maxens.

### 2026-11-10 : vérité commerciale de 3 articles (cahier des charges V2)
- Changement : prix MSD Media faux ou hors `/tarifs/` retirés des sources, remplacés par le délai réel et un lien vers `/tarifs/`. /blog/articles/agence-web-freelance-nocode-2026/ (« Landing pages à partir de 900€ »). /blog/articles/combien-coute-site-web-annecy-2026/ (« Chez MSD Media : 2 450€ » et « 1 190€ », « Hébergement et maintenance inclus 1 an », calcul de ROI refait avec un budget illustratif de 3 000 €). /blog/articles/landing-page-coach-consultant-annecy/ (grille 1 190 € / 1 890 € / 2 450 €, « Hébergement 1 an inclus », ROI « 4 à 15 clients par mois, en moins de 2 semaines » remplacé par un calcul illustratif ; deux « exemples concrets de coachs » sans nom ni réalisation, avec leads et clients chiffrés, remplacés par le cas réel Maxime Sciare).
- Avant : voir le diff git du commit (prix et exemples ci-dessus, mot pour mot).
- Hypothèse : aucune variation de trafic attendue ; on retire des contradictions avec `/tarifs/` et des résultats non prouvés, qui exposent la marque.
- Requête visée : aucune (correction de vérité, pas un test).
- Départ : relevé du 2026-11-09.
- Type : `seo`
- Reste à faire : l'article coach garde des chiffres de marché sans source (taux de conversion 15 à 25 %, 75 % de mobile, recherches « près de moi » doublées) ; à sourcer ou retirer au prochain passage où la page est libre (après le 2026-12-01).

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

## Notes du 2026-11-17

- Relevé : toujours celui du 2026-11-15 (2 jours, non périmé), identique à celui du passage d'hier ; aucun nouveau chiffre, donc les analyses de l'analyste data et du spécialiste conversion du 2026-11-16 restent valables et ne sont pas refaites. Pas de ligne ajoutée au scorecard (une ligne par relevé ; celle du 2026-11-16 couvre ce relevé).
- Décision : aucune modification de page. Bilans : aucun dû avant le 2026-11-20. Cannibalisation refonte / création : les deux pages gelées. Retraits : décision reportée au 2026-12-13 (relevés chevauchants). Passage à 2027 (STRATEGY.md, ajouté par Maxens ce jour) : briefs seulement les 23 et 30 novembre, exécution à partir du 30 novembre. Questions longues (PROMPT.md point 10) : les deux questions utiles traitables ont été appliquées par Maxens ce matin (/blog/articles/apparaitre-chatgpt-perplexity-google-ia/, /agence-web-geneve/) ; la troisième attend le 2026-11-20 (/blog/articles/combien-coute-landing-page-france-2026/). Les autres questions sont hors cible (immobilier, vétérinaire, Lyon, Rennes) ou sans page, à revoir si elles reviennent au relevé du 2026-11-22.
- Pages libres examinées et écartées : /audit-seo-strasbourg/ (29 impressions, 0 clic, position 3,6 : page de service générée depuis data/services.json, dont le JSON n'est plus aligné sur les pages en ligne, voir la note du 2026-11-12 ; hors des groupes de la stratégie ; à reprendre quand le JSON aura été resynchronisé) ; /agence-web-chambery/ (88 impressions, position 26 ; même contrainte JSON, 15 impressions sur « agence web chambery ») ; /realisations/merz-ultherapy-prime/ (173 impressions, 0 clic, position 26,9 : requêtes de produit, patients, pas de cible). Sources : Search Console, 28 jours au 2026-11-12.
- Vérité commerciale : 9 écarts bloquants, tous dans l'accueil, /reserver-un-appel/ et llms.txt (prix hors /tarifs/), inchangés depuis hier ; relèvent de Maxens. La note « translations.json contient encore “Note moyenne des avis Trustpilot : 5 / 5” » du 2026-11-16 est caduque : le fait est validé depuis le 2026-11-16 (FAITS.md).
- OpenSEO : solde 37 crédits (réserve minimale 50) : aucune analyse à crédits, comme hier.
- Prochain passage (2026-11-23) : plan du 2026-11-16 inchangé (bilans des 6 tests du 2026-10-30, test de conversion de l'article avis Google, FAQ de recommandation sur /creation-landing-page/, conflit refonte / création), plus les briefs 2027 du groupe A (STRATEGY.md).

## Notes du 2026-11-16

- Relevé frais (2026-11-15, période 2026-10-16 → 2026-11-12). Correction : le JSON du 2026-11-09 n'était pas une copie du 2026-11-03 (il couvrait 10-10 → 11-06 : 71 clics, 5 719 impressions, 92 requêtes en top 10) ; seul latest.md était resté périmé. La ligne du 2026-11-09 du scorecard est annotée.
- KPI (28 jours) : 82 clics (cible de décembre 70 dépassée ; 2 clics sur des URL redirigées), 4 hors marque par la méthode du relevé (minimum 5 ; estimation par page d'entrée : environ 49 clics hors marque, dont 26 sur l'article avis Google), 6 341 impressions (5 226 sans les URL redirigées : sous le minimum de 5 500), 101 requêtes en top 10 (83 sans les URL redirigées et la requête parasite « site:mlsend7.com »), 29 en top 3, 0 lead. Le paradoxe « plus d'impressions, position moyenne 14 → 21 » vient des impressions en position 31+ (561 → 1 823 : /creation-site-web-annecy/ 538 impr. à 41.9, URL de villes redirigées, /outils/audit-site/ 199 impr. à 78). Le top 10 monte semaine après semaine : 89 (11-03), 92 (11-09), 101 (11-15).
- Bilans à 21 jours : aucun dû (premiers le 2026-11-20). Lecture provisoire des tests du 2026-10-30 à J+14, tous sous 300 impressions après (règle : prolonger) : combien-coute-landing-page effet net −62 % mais position stable (8.7 → 9.4) et 0 clic sur environ 280 impressions ; audit-seo-annecy net −28 %, requête « audit seo annecy » stable (3.6 → 3.9), perte sur « seo annecy » (16 → 25) ; maintenance-site-web-annecy net −75 % sur 11 impressions (longue traîne perdue, description changée le 11-12) ; refonte-site-web-annecy requêtes principales stables (−1 à −2 places), chute de la page due à des requêtes « création » en position 63 à 79 ; referencement-naturel-annecy positif (6 → 49 impressions, position 7.2, 0 clic) ; creation-landing-page sans signal encore (hérite de l'article redirigé). Le témoin (+66 %) est gonflé par des pages à impressions lointaines : lire les effets nets avec prudence au 2026-11-20.
- Changement hors journal : le commit 0caf75b3 du 2026-11-10 (Maxens) change le H1 et le sous-titre de /site-web-medecine-esthetique/ (page en test depuis le 2026-11-01) et ajoute sur la plupart des pages un badge « Top 7 des agences web en France, Classement Sorank 2026 » dont la source n'a pas été retrouvée (note du 2026-11-09). Le bilan du hub santé du 2026-11-22 doit en tenir compte ; le badge est signalé à Maxens dans « À toi ».
- Cannibalisation : « refonte de site internet annecy » toujours actif au seuil (refonte 16 impr. pos. 5.3, propriétaire ; création 5 impr. pos. 21.8) : à régler après les bilans (refonte le 11-20, création le 11-22), angle « création » et lien vers la page refonte, pas de fusion. Les conflits landing page (agence création de landing page, landing page devis, combien coûte une landing page) sont réglés par les 301 du 2026-11-10 : vérifier le transfert vers /creation-landing-page/ et combien-coute aux relevés suivants. À surveiller : « visibilité local annecy » (/audit-seo-annecy/ en 3.8 devant /seo-local-annecy/ propriétaire en 7.5).
- Retraits : aucun exécuté. Les 3 relevés disponibles se chevauchent (pas espacés de 28 jours), le dépôt est superficiel (dates git inutilisables), OpenSEO indisponible (liens externes non vérifiables). Pré-liste à revérifier sur des relevés non chevauchants (2026-12-13 puis 2027-01-10), du plus sûr au moins sûr : agence-landing-page-site-web-france-msd-media (hors stratégie, 0 impr.) → /creation-landing-page/ ; google-business-profile-strasbourg-2026 et seo-local-alsace-2026 (zombies) → /seo-local-strasbourg/ ; pourquoi-site-web-ne-convertit-pas-2026 (doublon) → ameliorer-taux-conversion-site-web ; seo-local-ia-2026 et aeo-seo-geo-guide-2026 (zombies) → apparaitre-chatgpt-perplexity-google-ia ; creer-landing-page-qui-convertit (doublon de creer-landing-page-14-jours, attention à la chaîne de 301) ; combien-coute-landing-page-annecy-2026 (doublon de la version France) ; wordpress-vs-site-sur-mesure-annecy-2026 (zombie, ou plutôt lien vers /creation-site-web-annecy/).
- Conversion (specialiste-conversion) : aucune page testable hors gel. Les « 5 intentions » de l'accueil sont 4 `form_submit_attempt` (très probablement le formulaire du widget IA sur l'ancien accueil, entre le 10-16 et le 10-29 ; l'accueil actuel n'a aucun `<form>`) et 1 `booking_intent` Google (7 au 12 nov.) sans `booking_completed`. Les 3 `booking_intent` directs datent aussi d'avant la refonte. Pas de parcours cassé prouvé, trop peu de volume. À faire par le technicien le 2026-12-07 : test de bout en bout réservation Cal.com et formulaire /contact/ (`scripts/check-conversions.mjs`), et proposition à Maxens de compter les intentions comme `booking_intent` + `lead_submit_attempt` (sans `form_submit_attempt`) dans le relevé. Test avis Google prêt pour le 2026-11-23 (amendé) : après la ligne italique de cadrage, « Votre site de cabinet reprend des avis de patients ou affiche un widget Google ? Cela peut vous exposer (voir la section sur la fiche Google et le site plus bas). [Réserver un appel de 30 min pour faire vérifier votre site →](https://msd-media.com/reserver-un-appel/) L'appel est gratuit et sans engagement. » Pas de preuve Merz dans cet article. Mesure : au moins 1 booking_intent sur 20 visites ou plus ; prolonger sous 30 visites.
- Clarity : le trafic de test 127.0.0.1 a disparu ; 15 sessions sur 3 jours (14 PC, 1 mobile), inexploitable hors accueil. Une session vient de msdmedia.pages.dev : copie publique du site à vérifier par le technicien (contenu dupliqué, noindex ?).
- Pages redirigées encore affichées par Google : /agence-web-clermont-ferrand/ 395 impressions (en hausse depuis le 11-09), rennes 161, lyon 113, paris 46, toulouse 20, montpellier 12 et 1 clic ; /blog/articles/site-web-agence-immobiliere-annecy/ redirigé vers /site-web-immobilier/ qui n'a repris aucune requête immobilière. Le technicien contrôle les 301 en direct le 2026-12-07 (proxy en 403 depuis la session).
- Alertes : /agence-web-annecy/ perd 6,5 places sur « agence web annecy » (24.6 → 31.1, 13 impr.), gelée jusqu'au 2026-12-01 ; « prix landing page » 201 → 143 impressions à position stable, 0 clic ; accueil sur « msd media » : position 3.0 (41 impressions, 9 clics), pas de recul.
- Incohérences à traiter quand les pages seront libres : FAQ de /site-web-medecine-esthetique/ cite « la présence de photos avant/après » parmi les postes du devis alors que l'article de référence les déconseille (libre le 2026-11-22 via data/sectors.json, après recopie des textes en ligne) ; data/sectors.json, bloc « preuves-merz », affirme « conçues dans le cadre publicitaire de l'ANSM » sans source (idem) ; /blog/articles/publicite-chirurgie-esthetique-decret-2026/ : 100 % de clics morts sur 2 sessions Clarity (libre le 2026-11-24) ; blog/sitemap.xml : le lastmod de /blog/articles/maxens-soldan/ recule (2026-05-21 → 2026-03-16) à chaque build, défaut du générateur à voir par le technicien.
- Accès réseau : WebFetch refusé (403 ou ENOTFOUND) sur legifrance.gouv.fr, conseil-national.medecin.fr, ordre-chirurgiens-dentistes.fr, codeur.com, google.com, lafabriquedunet.fr, ipaoo.fr, lequotidiendumedecin.fr. WebSearch fonctionne. Tant que c'est le cas : aucune règle de droit ni chiffre de marché nouveau.
- OpenSEO : indisponible, solde 37 crédits (réserve minimale 50) ; le solde était de 387 le 2026-11-09 : la dépense n'est pas celle de l'agence. Aucune analyse à crédits ; les données du 2026-11-09 (« référencement dentiste » environ 10 recherches/mois, Ordre en tête, AI Overview) ont été réutilisées.
- Plan du 2026-11-23 : bilans des 6 tests du 2026-10-30 (dus le 11-20) et décision garder / corriger / annuler ; test de conversion de l'article avis Google (libre le 11-22) ; FAQ de recommandation sur /creation-landing-page/ (libre le 11-20, avec la version EN) et conflit refonte / création après les bilans ; /site-web-medecine-esthetique/ (libre le 11-22, recopier d'abord les textes en ligne dans data/sectors.json) : FAQ avant/après et mention ANSM.

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
