# Calendrier éditorial

**Depuis le 2026-11-10 (décision de Maxens)** : 2 articles par mois, les 1er et 3e lundis, **uniquement des sujets santé** (réglementation, communication et site des médecins, dentistes, centres esthétiques, avis de patients). Les sujets hors santé encore « À écrire » ne se publient plus : à la revue du mois, passe-les en `Écarté (hors santé, décision du 2026-11-10)`. Jamais d'article qui classe des agences (MSD Media ne se classe pas elle-même).

Repris du plan SEO de Maxens (octobre 2026). Le `responsable-editorial` prend, les 1er et 3e lundis, le premier sujet santé « À écrire » de la liste, après avoir vérifié qu'aucune page du site ne vise déjà la même requête (sinon il l'adapte ou passe au suivant, et le note ici). Il met le statut à jour : `Publié (AAAA-MM-JJ, /blog/articles/slug/)`, `Écarté (raison)` ou `Bloqué (raison)`.

## Revue éditoriale (1er lundi du mois)

Le `responsable-editorial` reclasse ce calendrier à partir de trois signaux, du plus fiable au moins fiable :

1. **Demande mesurée** (`seo-pilot/data/latest.md`) : requêtes avec des impressions sans page dédiée sur le site. C'est le signal principal.
2. **Google Trends** (`seo-pilot/data/trends.md`, France, 12 mois) : sujets en hausse et recherches qui montent, surtout en **santé esthétique**. Une hausse côté patients (un soin, une technique) devient un sujet pour les praticiens : « comment présenter <ce soin> sur le site de votre cabinet ». On ignore le bruit (célébrités, marques, sites tiers, requêtes en anglais).
3. **Actualité** : nouveaux textes réglementaires santé, mises à jour Google, évolutions des moteurs IA, signalées par le `specialiste-ia` et l'`analyste-concurrence`.

Il ajoute, écarte ou remonte des sujets, et note en une ligne la raison de chaque changement dans la colonne Statut.

**Règles de la revue** (vérifiées par le chef) :
- Sur 4 articles par mois : au moins 1 landing page, 1 Annecy et 1 santé. La santé reste la niche prioritaire.
- Uniquement des sujets des groupes de la stratégie (landing page, santé, Annecy, et au plus 1 sujet Munich par mois) : pas d'actualité SEO générale ni de comparatif de logiciels.
- Les sujets bloqués sont rappelés à Maxens dans le rapport du 1er lundi du mois, au plus un à la fois.
- Une actualité forte (un nouveau décret santé, par exemple) peut passer en tête en cours de mois, avec la raison notée.

| # | Sujet | Requête visée | Groupe | Statut |
|---|---|---|---|---|
| 1 | Publicité en chirurgie esthétique : ce que change le décret du 23 septembre 2026 | publicité chirurgie esthétique | Santé | Publié 2026-11-03 (/blog/articles/publicite-chirurgie-esthetique-decret-2026/ ; revue de novembre : remplace « Site internet de chirurgien esthétique », dont la requête est déjà visée par /site-web-chirurgie-esthetique/ ; actualité du décret n° 2026-891) |
| 2 | Référencement d'un dentiste : ce que l'Ordre interdit, ce qui reste permis | référencement dentiste | Santé | Bloqué (2026-11-09 : requête possédée par l'article dentiste existant ; à traiter plutôt en enrichissant cet article, ou sous l'angle « publicité dentiste » (OpenSEO 2026-11-09 : 40 recherches/mois, difficulté 0) une fois les textes officiels lisibles) |
| 3 | Webdesigner ou agence à Annecy : que choisir pour un cabinet ou une PME ? | prestataire web Annecy | Annecy | Publié (2026-11-09, /blog/articles/webdesigner-annecy-ou-agence/ ; requête adaptée : prestataire web Annecy, webdesigner annecy possédée par /creation-site-web-annecy/) |
| 4 | Devis de landing page : les lignes à vérifier avant de signer | devis landing page | Landing page | À écrire, semaine 48 (revue de novembre : nouveau sujet, « landing page devis » a 18 impressions en position 15 sur l'article prix d'après latest.md ; angle checklist du devis, pas de fourchettes de prix déjà traitées dans `combien-coute-landing-page-france-2026`, le relier ; aucun prix MSD) |
| 5 | Combien coûte un site internet pour un médecin esthétique ? | prix site internet médecin | Santé | À écrire (fourchettes du marché seulement, renvoi vers /tarifs/) |
| 6 | Doctolib ne suffit pas : pourquoi votre cabinet a besoin de son propre site | site internet médecin Doctolib | Santé | À écrire |
| 7 | Landing page de dispositif médical sous contrainte ANSM : notre méthode avec Merz | landing page dispositif médical | Santé | À écrire (faits des études de cas Radiesse et Ultherapy Prime uniquement, pas Belotero) |
| 8 | Communication des médecins : ce qui est autorisé (guide complet) | publicité médecin ce qui est autorisé | Santé | À écrire |
| 9 | Site internet de dermatologue : ce qu'il doit contenir | site internet dermatologue | Santé | À écrire |
| 10 | Référencement local d'un cabinet médical à Annecy : le guide pas à pas | référencement cabinet médical Annecy | Santé | À écrire |
| 11 | Site internet d'orthodontiste : convaincre les parents en 10 secondes | site internet orthodontiste | Santé | À écrire |
| 12 | Centre laser : créer un site qui remplit l'agenda | site internet centre laser | Santé | À écrire |
| 13 | Comment ChatGPT recommande un médecin esthétique, et comment y apparaître | ChatGPT médecin esthétique | Santé | À écrire |
| 14 | Landing page pour injections d'acide hyaluronique : la structure qui convertit | landing page médecine esthétique | Santé | À écrire |
| 15 | RGPD et site de cabinet médical : la checklist | site médecin RGPD | Santé | À écrire |
| 16 | Site internet de coach : les éléments qui transforment les visiteurs en clients | site web coach | Landing page | À écrire (la page /site-web-coach/ vise une requête proche : la relier) |
| 17 | Agence web en Haute-Savoie : Annecy, Annemasse, Thonon, délais et méthode | agence web Haute-Savoie | Annecy | À écrire |
| 18 | Les meilleurs sites de médecine esthétique en France, analysés | meilleur site médecine esthétique | Santé | À écrire (analyse de sites publics réels, sans dénigrement) |
| 19 | Créer un site pour le marché français quand on est une entreprise allemande | site web marché français entreprise allemande | Munich | À écrire, décembre 2026 (revue de novembre : reporté, novembre réservé à santé, Annecy et landing page ; aucun prix MSD, pas de règles juridiques sans source ; relier /agence-web-munich/) |
| 20 | Entrepreneur français à Munich : créer un site pour vos clients en France et en Allemagne | site internet entrepreneur français Munich | Munich | À écrire (FR/EN seulement, pas de contenu en allemand) |
| 21 | Landing page en anglais ou en français : que choisir pour une startup de Munich ? | landing page startup Munich | Munich | À écrire (relier /en/munich/) |
| 22 | Accessibilité d'un site de santé : ce que la loi impose aux cabinets | accessibilité site médecin | Santé | À écrire |
| 23 | Prix d'une landing page en 2027 | prix landing page | Landing page | En janvier 2027 : mettre à jour l'article existant `combien-coute-landing-page-france-2026`, pas de nouvel article |
| 24 | Nous avons analysé 84 sites de cabinets santé à Annecy : le bilan | sites cabinets médicaux Annecy | Santé | Bloqué (données de l'étude à fournir par Maxens) |
| 25 | Refonte de site internet à Annecy : cas réels avant/après | refonte site internet Annecy | Annecy | Bloqué (cas chiffrés à fournir par Maxens) |
| 26 | Étude de cas : un cabinet santé client, avant/après chiffré | site médecin résultats | Santé | Bloqué (client et chiffres à fournir par Maxens) |
| 27 | Photos avant/après en médecine esthétique : ce que dit vraiment la loi | photos avant après médecine esthétique légal | Santé | Écarté (revue de novembre : déjà traité par l'article de référence `site-internet-medecine-esthetique-ce-qui-est-autorise` et l'article dentiste ; un nouvel article cannibaliserait la meilleure page du site) |
| 28 | Agence web ou grosse agence : comparatif honnête des délais et de la méthode | agence web ou freelance | Landing page | Écarté (revue de novembre : l'article existant `agence-web-freelance-nocode-2026` vise déjà cette requête) |
| 29 | Avis Google pour un cabinet esthétique : en obtenir plus sans enfreindre la déontologie | avis Google médecin esthétique | Santé | Écarté (revue de novembre : l'article `avis-google-medecin-que-repondre` capte déjà « avis google médecin », 60 impressions d'après latest.md ; l'enrichir plutôt que le concurrencer) |
