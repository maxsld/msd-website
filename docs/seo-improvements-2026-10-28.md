# Améliorations SEO du 28 octobre 2026

Les modifications sont préparées dans le dépôt local. Aucune publication ni
modification des comptes Google n’a été effectuée.

| Sujet | Travail réalisé |
| --- | --- |
| Offre landing page | Nouvelle page `/creation-landing-page/`, prestations, budget de départ existant de 1 990 €, calendrier conditionné au périmètre, exemples, FAQ et contacts. |
| Maillage commercial | Liens depuis les articles pertinents, les tarifs et les pieds de page. Titres et descriptions des deux articles landing page prioritaires retravaillés. |
| Santé | Appels à l’action adaptés aux trois articles médecin/dentiste/esthétique. Trois études de cas Merz complétées avec une méthode de mesure, sans résultat de conversion inventé. |
| Annecy | Six pages de prestation distinguées par leur besoin principal et reliées entre elles. Référence régionale Carroz Sports ajoutée aux pages pertinentes, sans la présenter comme un client annécien. Débordement du titre mobile corrigé. |
| Performances | Versions minifiées, styles spécifiques aux familles de pages, chargement différé des avis et du manifeste, suppression des chargements GTM immédiats en double, première image du portfolio prioritaire. |
| FAQ | Suppression du repli générique du générateur ; anciennes FAQ des articles réparées. Dix-sept blocs structurés des pages statiques synchronisés avec les réponses réellement affichées, notamment la version anglaise. |
| Dates | Sept dates manquantes récupérées depuis l’historique des sources éditoriales. Dates de mise à jour affichées. Les retouches de gabarit ne rafraîchissent plus toutes les dates du sitemap du blog. |
| Sitemaps | Articles déclarés uniquement dans `blog/sitemap.xml`, autres pages dans `sitemap.xml`. Les deux restent déclarés dans robots.txt. Total : 123 URL distinctes. |
| Conversions | Source d’acquisition jointe aux événements ; parcours Google → offre → formulaire vérifié avec une réponse simulée. Messages Cal.com contrôlés et dédupliqués. |
| Suivi | Rapport hebdomadaire enrichi avec les conversions par canal et les segments marque/hors marque. Réalisations et nouvelle offre ajoutées aux pages suivies en performance. |

## Vérifications

- `npm run seo:prepare` : génération, empreintes éditoriales, ressources minifiées,
  canonical, H1, JSON-LD, FAQ, dates et cohérence des sitemaps.
- `npm run seo:browser-check` : 26 vues sur 13 pages, en 390 et 1440 px, puis
  simulation du formulaire et des messages de réservation. Toutes les requêtes
  externes du navigateur sont interceptées ; aucun formulaire ou événement réel
  n’est envoyé.
- Contrôle des liens : 8 112 liens internes vérifiés, aucune cible absente hors
  redirections connues.
- `git diff --check` : aucun problème d’espacement.
- Requêtes de lecture Google Analytics et Search Console validées pour les
  nouveaux tableaux. Aucun événement `lead_submit_success` ou
  `booking_completed` retourné dans GA4 pour la période du 28 septembre au
  25 octobre : ne pas interpréter cela comme une preuve d’absence de demandes.

Poids avant/après, par rapport aux sources initiales : CSS principal de l’accueil
212 023 → 158 689 octets (−25 %), JavaScript principal 87 801 → 39 999 octets
(−54 %). Après gzip : 36 877 → 29 126 et 22 253 → 12 573 octets respectivement.
Les avis et le manifeste disposent de leur propre script différé. Les chiffres
de poids ne constituent pas une mesure du LCP ou des Core Web Vitals en ligne.

## Suite après publication

1. Mesurer à nouveau l’accueil et les réalisations sur PageSpeed mobile, puis
   examiner les données de terrain disponibles dans Search Console.
2. Suivre la nouvelle offre et les deux articles landing page sur au moins
   quatre semaines ; les changements SEO ne garantissent aucun classement.
3. Contrôler les conversions réelles dans GA4 et la configuration des événements
   clés dans l’interface du compte. Les événements de formulaire réussi et de
   réservation sont comptés séparément des intentions et pages de confirmation.
4. Ajouter des résultats clients chiffrés seulement avec leurs données, période
   et autorisation. Ajouter des références propres aux autres villes quand elles
   sont disponibles ; aucune référence ni implantation supplémentaire inventée.
5. Faire relire les passages réglementaires santé par un professionnel compétent.
   Les sources et réserves existantes restent présentes ; aucune relecture
   juridique ou médicale n’est prétendue dans cette livraison.
6. Compléter l’audit de Google Business Profile et des backlinks avec les données
   des outils concernés. Aucun avis client ni lien entrant n’a été créé.

Les segments de requêtes marque/hors marque de Search Console excluent les
requêtes anonymisées : leur somme ne reconstitue donc pas le total du site.
