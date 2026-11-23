# Briefs du passage à 2027 (groupe A de STRATEGY.md)

Préparés le 2026-11-23 par le chef de projet (lecture des sources par l'agence, aucune page modifiée). Exécution à partir du lundi 2026-11-30, dans la limite de 3 pages par passage et du gel de 21 jours. Règle de STRATEGY.md : chaque prix, chiffre, règle et date est revérifié à sa source avant de passer l'année ; si la source ne se lit pas depuis la session, la page attend.

Mécanique du générateur de blog : `seoTitle` donne le `<title>`, `og:title` et `twitter:title` ; `title` donne le H1 ; sans `seoTitle`, le build ajoute « | MSD Media » ; `updated:` alimente `dateModified` et « Mis à jour le ». Les 4 articles ont une source dans `blog/sources/` : on ne touche jamais au HTML généré.

Hôtes refusés par le proxy de la session (journal, notes des 2026-11-09 et 2026-11-16) : legifrance.gouv.fr, conseil-national.medecin.fr, ordre-chirurgiens-dentistes.fr, codeur.com, google.com, lafabriquedunet.fr, ipaoo.fr, lequotidiendumedecin.fr, afnic.fr, developers.google.com, support.google.com. WebSearch fonctionne. Les sites d'éditeurs de logiciels (sorank.com lu le 2026-11-16) ne sont pas refusés.

## 1. `blog/sources/combien-coute-landing-page-france-2026.md` (341 impressions au 2026-11-15, 297 au 2026-11-22)

- État : seoTitle « Prix d'une landing page en 2026 : de 0 à 15 000 € (tableau) » (59) ; H1 « Combien coûte une landing page ? De 0 à 15 000 € en 2026 » ; description sans année ; `updated: 2026-10-28`.
- À passer en 2027 : l. 3 (H1), l. 4 (seoTitle), l. 167 H2 « Tarifs MSD Media en 2026 ». À garder : `date`, `slug`.
- À revérifier, tout est sans source (l'article n'a aucune section « Sources ») : fourchettes no-code 0 à 500 € (+ abonnement 0 à 79 €/mois), freelance junior 300 à 1 200 €, agence spécialisée 800 à 2 500 €, intermédiaire 2 500 à 6 000 €, haut de gamme 6 000 à 15 000 €+ (l. 15-23, 33, 50, 54, 70, 74, 96, 107, 111, 122, 185, 189) ; majorations du tableau des facteurs (l. 128-136 : +30 à +50 % copywriting, +10 à +15 % par section, animations +500 à +2 000 €, intégrations +300 à +1 500 €, SEO technique +300 à +800 €, design de zéro +40 à +80 %, urgence +20 à +50 %) ; domaine 10 à 30 €/an (l. 201) ; longueurs de page de vente (l. 205) ; « 40 % du travail de conversion en moins » (l. 159) ; délais freelance 2-4 semaines (l. 61). Outils cités sans prix sourcé : Webflow, Carrd, Leadpages, Unbounce, Notion + Super (l. 35).
- Calcul de ROI (l. 140-151) : hypothèses présentes mais le mot « illustratif » manque ; « remboursée dès le premier mois » (l. 142) et « rentabilisée plus de 7 fois » (l. 151) frôlent la promesse : à marquer illustratif.
- MSD Media face à FAITS.md : 6 occurrences de « 21 jours » sans « à compter de la réception des éléments » (l. 15, 29, 83, 92, 171, 172) ; l. 76 « C'est la zone où se positionne MSD Media » (800 à 2 500 €) : Landing Express tombe dans l'option 4, à nuancer sans prix ; l. 197 « acompte de 50 % au démarrage » → « à la signature du devis » ; tableau l. 169-173 : inclusions du site vitrine (blog, CMS, optimisation IA) et délai « 21 jours » du site vitrine à confronter à `/tarifs/`.
- Tirets cadratins à retirer : l. 74, 96, 162. Liens relatifs à passer en absolus : l. 25, 29, 175.
- Concurrence (analyste, 2026-11-23, extraits de recherche) : GetResponse et Kolonell portent l'année dans le title ; fourchettes concurrentes plus basses à l'entrée (250 à 600 € page simple chez un freelance) ; aucune page n'a été ouverte (codeur.com, getresponse.com, digitiz.fr, involve.me non résolus). Title candidats pour le 2026-12-14 (≤ 60) : « Prix d'une landing page en 2027 : tarifs par prestataire » ou « Combien coûte une landing page ? Fourchettes 2027 ».
- Bloquant : aucune source de prix lisible aujourd'hui. Options : sourcer par WebSearch vers des sites lisibles (éditeurs no-code à tester : carrd.co, webflow.com, leadpages.com, unbounce.com), réduire le tableau aux fourchettes sourçables, ou faire valider par Maxens une présentation « fourchettes constatées par l'agence à la date de mise à jour ».
- Gel : modifié le 2026-11-23 (liens C1 et C2, FAQ) → libre le 2026-12-14.

## 2. `blog/sources/site-internet-dentiste-ce-qui-est-autorise.md` (186 impressions au 2026-11-15)

- État : seoTitle « Site internet de dentiste : ce que l'Ordre autorise (2026) » (58) ; H1 « … autorise en 2026 » ; description sans année ; `updated: 2026-11-16`.
- À passer en 2027 : l. 3, l. 4. À garder : « version du 19 juin 2026 » des recommandations (l. 18, 144), sous réserve de trancher la divergence notée au journal (29 mars 2023 ou 19 juin 2026).
- À revérifier (sources : PDF Ordre `download/109355`, page Ordre, code de déontologie PDF `download/56606`, MACSF) : R4127-215-1 et décret 2020-1658 (l. 24, 112) ; R4127-215 (l. 26) ; R4127-240-II, 5 à 10 actes, annuaire ameli (l. 30-36, 77, 94-95, 116) ; exemples d'offres interdites et **amende administrative de 3 000 €** sans source ni date (l. 38) ; témoignages et notations (l. 42, 120) ; réponse aux avis nominatifs (l. 44) ; avant/après et floutage (l. 48-50, 124) ; spécialités et formulations (l. 56-65) ; R4127-217 référencement prioritaire « payant ou non » (l. 16, 71, 128, 132) ; R4127-225 (l. 84, 140) ; noms de domaine comparatifs (l. 86) ; RPPS (l. 92).
- MSD Media : l. 104 « Nous concevons des sites pour des cabinets dentaires » : aucune réalisation dentaire dans FAITS.md → « pour les professions de santé, dont les cabinets dentaires ».
- Tirets : 4, uniquement en séparateur de la section Sources. Liens internes : tous valides.
- Bloquant : les 3 sources de l'Ordre sont refusées par le proxy ; sans lecture du PDF 109355 ou validation de Maxens en session (version des recommandations, amende de 3 000 €), l'article attend.
- Gel : libre le 2026-12-07, après le bilan du test « référencement dentiste » du 2026-11-16.

## 3. `blog/sources/site-internet-medecine-esthetique-ce-qui-est-autorise.md` (84 impressions au 2026-11-15, 58 au 2026-11-22, position 5,1)

- État : pas de `seoTitle` (title HTML 73 caractères avec « | MSD Media ») ; H1 « Médecine esthétique : ce que votre site peut afficher en 2026 » (61) ; description « … peut afficher en 2026, et ce que change le décret du 23 septembre 2026 » ; pas de champ `updated:` (`date: 2026-09-27`). Article modèle d'ARTICLE-GUIDE.md : structure à ne pas changer.
- À passer en 2027 : l. 3 (H1 ; ajouter un seoTitle ≤ 60), l. 5 (description, première occurrence seulement). Dates de vérification à actualiser à la date du passage, pas à « 2027 » : l. 16, 80, 144 (« au 27 septembre 2026 »). À garder : décret n° 2026-891 du 23 septembre 2026 (l. 5, 14, 18, 20, 91, 138, 140), LFSS 2026 et décision du 30 décembre 2025 (l. 78, 144), signalements 62 (2022) → 213 (2025) (l. 82).
- À revérifier (sources l. 156-165) : décret 2020-1662 et R4127-19, R4127-19-1 (Légifrance, CNOM) ; décret 2026-891 (deux cabinets d'avocats, pas de lien Légifrance) ; loi du 9 mars 2023 (l. 20, sans source) ; sanction « un an dont six mois avec sursis » (Gynéco Online, non recoupée) ; arrêté du 30 mai 2018, seuil de 70 € (l. 71, 136) ; **devis et délai de quinze jours L6322-2** (l. 72, 136, sans lien, non recoupé) ; textes annoncés « d'ici l'été 2026 » (l. 80, Sénat) : **fait à actualiser**, l'été est passé, vérifier si un texte est paru depuis le 27 septembre 2026 ; instituts non médicaux et DGCCRF (l. 92, sans source) ; exercice illégal (l. 94, 148, sans source) ; « contrôlé par l'ANSM » (l. 112, sans source).
- MSD Media : Merz cité dans le corps avec liens vers les deux réalisations (conforme) ; l. 118 « nous faisons un point sur votre site » peut se lire comme un audit gratuit → renvoyer vers l'appel de 30 minutes.
- À faire au même passage : liens 20 et 22 de l'audit du 2026-11-21 (vers l'article décret et l'article dentiste). Tirets : 10, tous dans les Sources.
- Bloquant : Légifrance et CNOM refusés ; sources secondaires (conseil-constitutionnel.fr, senat.fr, vigier-avocats.com, ah-avocats.fr, macsf.fr, gyneco-online.com) à tester le 2026-11-30. Sans validation de Maxens sur les textes primaires, l'article attend.
- Gel : libre depuis le 2026-11-24.

## 4. `blog/sources/logiciels-seo-marque-blanche-agences-2026.md` (32 impressions au 2026-11-15, 18 au 2026-11-22)

- État : seoTitle « Logiciel SEO en marque blanche pour agence : comparatif 2026 » (60) ; H1 « … le comparatif 2026 » ; description sans année ; pas de champ `updated:` (`date: 2026-10-14`).
- À passer en 2027 : l. 3, l. 4, l. 15 « le plus complet en 2026 » (seulement si la revérification le confirme). Dates de relevé à actualiser : l. 34, 50, 142-145.
- À revérifier, outil par outil, sur les pages éditeurs citées : Sedestral (Avancé 499 € HT/mois, marque blanche réservée à Avancé, agents nommés, intégrations, « plus de 1 800 marques ») ; Sorank (99 €/mois/site ou 49 € en annuel, + 2 000 €/an marque blanche avec un an d'engagement, 20 articles/mois/site, mise en place offerte) ; SE Ranking (Pack Agence 59 €/mois en annuel en complément d'un abonnement Pro ou Business, 10 sièges, widget 100 contacts/mois) ; AgencyAnalytics (20 $/client/mois en annuel, dégressif dès 25 clients) ; tableau l. 96-105 (« Indexation : non précisé » pour Sorank à revoir).
- MSD Media : l. 24, conforme. Tirets : 0. Lien unique vers `creer-landing-page-qui-convertit` (pré-liste des retraits : à repointer si retrait le 2026-12-13, pas avant).
- Bloquant : aucun hôte refusé connu ; sedestral.com, seranking.com et agencyanalytics.com à tester. Si les 4 pages se lisent, c'est le seul article du lot entièrement vérifiable par l'agence.
- Gel : libre.

## Ordre d'exécution recommandé

- **2026-11-30** : art. 4 (si les 4 pages éditeurs se lisent) ; tests de lecture des sources secondaires des art. 2 et 3 et des éditeurs no-code de l'art. 1 ; demande à Maxens dans « À toi » de relire lui-même le PDF de l'Ordre (art. 2) et les textes Légifrance (art. 3) et de valider en session.
- **2026-12-07** : bilan de l'art. 2 puis son passage si le PDF de l'Ordre a été lu ou validé ; art. 3 si validé ; sinon commencer le point 5 du groupe A par `combien-coute-site-web-annecy-2026` (libre le 2026-12-01) ou `meilleurs-logiciels-seo-2026`.
- **2026-12-14** : bilan des liens de l'art. 1, puis son passage complet (sources ou réduction des fourchettes, ROI illustratif, 6 « 21 jours » alignés, acompte, Landing Express sans prix, tirets, URL absolues, title 2027).
- **2026-12-21 et 2026-12-28** : bilan de l'art. 4 ; pages reportées et point 5 (`combien-coute-refonte-site-internet-2026`, `combien-coute-seo-annecy-2026` ; `combien-coute-landing-page-annecy-2026` attend la décision de retrait du 2026-12-13) ; liste des pages non passées pour janvier.
