# Consignes de Maxens pour le passage du 2026-11-30

Maxens n'est pas satisfait : les clics Google ont baissé de moitié et il attend que ce passage s'attaque à la baisse, chiffres à l'appui, avant toute autre optimisation. Ce fichier passe avant les points restants de `audit-complet-2026-11-21.md`, sauf le test de conversion de l'article avis Google déjà prévu ce jour-là, qui est repris ici.

## 1. Ce qui s'est passé (Search Console, relevé du 2026-11-27)

- **Mise à jour principale de novembre 2026**, du 10 au 24 novembre ([tableau de bord Google](https://status.search.google.com/incidents/WLxcJyC6jMWMfryxsKMc)). Google a aussi annoncé le 24 novembre une **mise à jour de décembre 2026**, pas encore lancée et sans date, qui doit mieux classer les contenus pertinents sur les **requêtes longues et complexes** et personnaliser davantage les résultats. Une baisse de début décembre ne lui est attribuable que si Google publie un début de déploiement.
- Semaine du 19 au 25 novembre (les 24 et 25 sont provisoires) comparée au 3 au 9 novembre : impressions 1 514 contre 1 679 (−10 %), **clics 12 contre 26 (−54 %)**. La baisse des impressions vient surtout de pages au-delà de la position 30 et du retour après le pic des 17-18 novembre. La baisse des clics est réelle.
- Clics perdus :
  - /blog/articles/avis-google-medecin-que-repondre/ : 8 → 1 clic, 243 → 187 impressions, position 6,7 → 8,1. C'était la seule source régulière de clics hors marque.
  - /blog/articles/publicite-chirurgie-esthetique-decret-2026/ : 4 → 0 clic.
  - /en/ : 6 → 2 clics.
  - La marque tient (« msd media » : 3 → 8 clics).
- Positions perdues :
  - Groupe landing page : l'ancienne URL redirigée le 2026-11-10 (308 vérifiée en ligne le 2026-11-27) reste affichée par Google et recule : « agence landing page » 9,3 → 17,1, « agence création landing page » 8,2 → 36,4, « agence création de landing page » 19,4 → 22,0. /creation-landing-page/ ne prend pas le relais (30 sur « agence landing page »).
  - /blog/articles/site-internet-dentiste-ce-qui-est-autorise/ : page 13,2 → 42,4, « referencement dentiste » 12,2 → 41,0, après la modification du 2026-11-16 et pendant la mise à jour.
  - /creation-site-web-annecy/ : 37,1 → 55,4.
- Gains : /creation-site-web-strasbourg/ 0 → 116 impressions, /outils/audit-site/ 79 → 39, /agence-web-clermont-ferrand/ 47 → 34.

## 2. Ce qu'il faut faire lundi, dans cet ordre

1. **Article avis Google médecin.** Sa position tient mais il ne fait presque plus de clics, donc c'est un problème de taux de clic. Appliquer le test de conversion prévu (journal, notes du 2026-11-23). Proposer aussi à Maxens, sans l'appliquer le même jour (une modification par page), un title et une description qui reprennent « supprimer un avis Google » et « gestion avis google cabinet médical » (20 impressions, position 36).
2. **Requêtes longues : la méthode de Maxens, appliquée pour de vrai.** Le relevé `seo-pilot/data/questions.md` ne garde que les requêtes de 8 mots ou plus et ne remonte surtout que du bruit et des pages redirigées. Pour ce passage, l'analyste-data travaille aussi sur les requêtes de 5 mots ou plus et les questions (comment, quel, combien, pourquoi…) des 3 derniers mois. Extrait du 2026-11-27 (2026-08-27 → 2026-11-25, hors marque) :

   | Requête | Page | Impr. | Clics | Position |
   |---|---|---|---|---|
   | comment apparaître dans chatgpt | /blog/articles/apparaitre-chatgpt-perplexity-google-ia/ | 54 | 0 | 27,0 |
   | comment apparaître sur chatgpt | idem | 39 | 0 | 34,3 |
   | comment apparaître dans les recherches chatgpt | idem | 18 | 0 | 4,1 |
   | comment apparaître sur chatgpt et perplexity | idem | 13 | 0 | 3,6 |
   | combien coûte une landing page | /blog/articles/combien-coute-landing-page-france-2026/ | 122 | 0 | 9,1 à 10,0 |
   | top 10 agences landing page | /blog/articles/agences-landing-page-prix-france-2026/ (redirigée) | 24 | 0 | 5,0 |
   | gestion avis google cabinet médical | /blog/articles/avis-google-medecin-que-repondre/ | 20 | 0 | 36,5 |
   | création site internet dentiste strasbourg | /agence-web-strasbourg/ | 19 | 0 | 77,8 |
   | création site internet médecin spécialiste strasbourg | /agence-web-strasbourg/ | 19 | 0 | 78,8 |
   | création site web dentiste genève | /agence-web-geneve/ | 12 | 0 | 63,3 |
   | agence de maintenance de site wordpress | /blog/articles/maintenance-site-web-annecy/ | 13 | 0 | 7,0 |
   | maintenance site web avec support 24/7 | idem | 14 | 0 | 47,0 |

   Ce qui est attendu :
   - **Articles** : le chef ajoute à `EDITORIAL.md` au moins 3 sujets tirés de ces requêtes longues, placés en tête pour le 2026-12-07 et le 2026-12-21 (après l'article psychologue #30, déjà prévu le 2026-12-07). Chaque sujet indique la requête exacte et ses chiffres, l'intention, et la page existante à laquelle il renvoie. Écarter un sujet si une page vivante possède déjà la requête : on renforce alors cette page au lieu d'en créer une seconde. Piste évidente : « comment apparaître sur ChatGPT » se classe 27 à 34 avec 120 impressions cumulées, il faut décider entre renforcer l'article existant et écrire un article plus précis.
   - **FAQ** : sur les pages libres de gel, reprendre mot pour mot les formulations longues dans une question de FAQ avec une réponse courte (point 10 de PROMPT.md), une modification par page.
   - Les rédactions qui touchent la santé ou le droit restent soumises aux règles de vérité habituelles (FAITS.md, sources lisibles).
3. **Groupe landing page.** Mesurer si /creation-landing-page/ récupère les requêtes de l'ancienne URL. L'analyste-concurrence regarde ce que Google classe en tête sur « agence landing page » et « agence création landing page ». Si ce sont des comparatifs d'agences, le chef présente à Maxens le choix suivant, et c'est lui qui décide : attendre, ou faire une page comparatif honnête où MSD Media ne se classe pas elle-même première (c'est la raison du retrait du 2026-11-10).
4. **Article dentiste.** Ne pas le retoucher avant son bilan. Le bilan du 2026-12-07 doit dire si la chute vient de la modification du 2026-11-16 ou de la mise à jour (évolution comparée des autres pages santé). Si c'est la modification, proposer un retour partiel.
5. **Pas de changement massif sous le coup de la mise à jour.** Les données complètes arrivent à partir du 2026-12-01. Les bilans de la semaine notent si une page a pu être touchée par la mise à jour (10 au 24 novembre) avant de conclure sur l'effet d'une modification.

## 3. Compte rendu

Le message Telegram du lundi dit en une phrase ce qui a été fait contre la baisse et les sujets d'articles retenus. S'il y a une décision à prendre, il la pose dans la ligne « À toi ».
