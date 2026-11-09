# Couverture des prompts IA

Relevé automatique (114 pages françaises du sitemap). Une combinaison est couverte quand une même page réunit les termes dans son title, sa description, ses titres H1 à H3 ou ses questions de FAQ. Matrice : `data/ai-prompts.json`. Méthode : on croise qui, quoi, où et quelle intention, faute de volume de recherche pour les prompts.

## Couverture par terme

- **Cibles** (nombre de pages) : médecin 18, médecine esthétique 12, chirurgien esthétique 14, dermatologue 6, dentiste 14, centre laser 1, avocat 1, architecte 1, artisan 2, restaurant 2, immobilier 1, coach 15, startup 34, PME 39
- **Besoins** (nombre de pages) : site vitrine 77, landing page 59, refonte 34, SEO local 41, référencement 84, visibilité IA 60
- **Lieux** (nombre de pages) : Annecy 49, Haute-Savoie 2, Chambéry 17, Genève 14, Strasbourg 11, Munich 1, France 28
- **Intentions** (nombre de pages) : meilleur / recommandation 51, prix 78, délai 67, règles / conformité 23, comparaison / alternative 34, comment faire 60, avis / preuves 75

## Couverture par croisement

| Croisement | Couvert |
|---|---|
| cible × besoin | 71/84 (85 %) |
| cible × lieu | 68/98 (69 %) |
| cible × intention | 78/98 (80 %) |
| besoin × lieu | 36/42 (86 %) |
| besoin × intention | 42/42 (100 %) |
| lieu × intention | 41/49 (84 %) |

## Trous à combler en priorité

Classés du plus proche au plus loin : les deux termes existent déjà chacun sur le site, il manque la page (ou la question de FAQ) qui les réunit.

- **cible × lieu** : PME + Haute-Savoie ; médecin + Munich ; dermatologue + Strasbourg ; coach + Haute-Savoie ; chirurgien esthétique + Haute-Savoie ; dentiste + Haute-Savoie ; coach + Munich ; chirurgien esthétique + Munich
- **cible × intention** : artisan + comment faire ; restaurant + comment faire ; centre laser + comment faire ; architecte + comment faire ; immobilier + comment faire ; artisan + meilleur / recommandation ; restaurant + meilleur / recommandation ; centre laser + meilleur / recommandation
- **besoin × lieu** : site vitrine + Munich ; landing page + Haute-Savoie ; refonte + Genève ; SEO local + Munich ; refonte + Haute-Savoie ; refonte + Munich
- **lieu × intention** : Munich + comment faire ; Haute-Savoie + meilleur / recommandation ; Munich + meilleur / recommandation ; Chambéry + comparaison / alternative ; Genève + comparaison / alternative ; Haute-Savoie + comparaison / alternative ; Munich + comparaison / alternative ; Munich + règles / conformité

## Exemples de prompts non couverts

- « Quelle agence pour le site web d'un PME à Haute-Savoie ? »
- « Quelle agence pour le site web d'un médecin à Munich ? »
- « Quelle agence pour le site web d'un dermatologue à Strasbourg ? »
- « Quelle agence pour le site web d'un coach à Haute-Savoie ? »
- « Quelle agence pour le site web d'un chirurgien esthétique à Haute-Savoie ? »
- Site de artisan, intention « comment faire » : aucune page ne réunit les deux.
- Site de restaurant, intention « comment faire » : aucune page ne réunit les deux.
- Site de centre laser, intention « comment faire » : aucune page ne réunit les deux.
- Site de architecte, intention « comment faire » : aucune page ne réunit les deux.
- Site de immobilier, intention « comment faire » : aucune page ne réunit les deux.
