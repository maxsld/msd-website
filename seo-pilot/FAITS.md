# Registre des faits de MSD Media

Ce que le site a le droit d'affirmer sur MSD Media, et où chaque fait est prouvé. Tous les agents le lisent avant d'écrire un texte qui parle de MSD Media. Un fait absent de ce registre ne s'écrit pas ; un fait « à confirmer » ne s'ajoute nulle part tant que Maxens ne l'a pas validé. Seul Maxens fait passer un fait de « à confirmer » à « validé » (en session), et seul lui change un prix, une promesse ou une référence client.

Contrôle automatique : `python3 scripts/check-verite.py` relève les écarts dans `seo-pilot/data/verite.md` (lancé chaque lundi par le relevé, et par le chef avant clôture).

## Identité

| Fait | Statut | Preuve |
|---|---|---|
| MSD Media, agence web à Annecy (Haute-Savoie), fondée en juin 2025 par Maxens Soldan | validé | mentions légales, `/a-propos/` |
| Maxens vit et travaille à Munich ; pas de bureau à Munich, pas encore de client en Allemagne | validé (Maxens, 2026-11-03) | `STRATEGY.md` |
| Clients en France, en Suisse et en Belgique | validé | réalisations (HairTattoo Bruxelles, etc.) |
| Parcours relayé par Le Dauphiné Libéré et Polytech Annecy-Chambéry | validé | `/presse/` |
| « Plus de 30 clients accompagnés » | **à confirmer** | `/a-propos/` ; seules 11 réalisations sont publiées |

## Offre et prix

| Fait | Statut | Preuve |
|---|---|---|
| Landing page à partir de 1 990 €, site vitrine à partir de 3 990 €, sur-mesure sur devis | validé, **affichable uniquement sur `/tarifs/`, `/tarifs/msd-care/` et leurs versions anglaises** | `/tarifs/` |
| MSD Care en trois niveaux, tous avec un engagement de 3 mois puis un mois de préavis, changement de niveau possible chaque mois : Essentiel 89 € par mois (hébergement géré, surveillance, sauvegardes, rapport mensuel automatique, 2 modifications par an incluses, réponse sous 48 h ouvrées) ; Suivi 190 € par mois, recommandé (Essentiel + modifications incluses jusqu'à 1 h par mois en ligne sous 48 h ouvrées, journal daté des interventions, rapport des visites et des demandes, réponse sous 24 h ouvrées) ; Marque sur devis (Suivi + modifications prioritaires, validation de chaque texte par le client, historique des versions, suivi de conformité santé et légal, point mensuel en visio). Option SEO sur devis, hors grille (contenus mensuels, rapport de positions et de visibilité IA). Modifications non reportées (12 mois pour Essentiel, le mois pour Suivi). Clause de continuité : accès, code source et documentation remis à la fin | validé (Maxens, 2026-11-20), affichable sur `/tarifs/`, `/tarifs/msd-care/` et leurs versions anglaises | `/tarifs/msd-care/`, CGV article 5 bis |
| Paiement : acompte de 50 % à la signature du devis, solde à la livraison (payable sous 30 jours) | validé (Maxens, 2026-11-12) | CGV article 4 |
| Code source, domaine et accès remis dès le règlement du solde (jamais « à la livraison ») | validé (Maxens, 2026-11-12) | CGV article 7 |
| Landing Express : 2 990 €, en ligne en 7 jours à compter de la réception des éléments, en priorité, une seule place par mois ; prix affichables sur `/tarifs/` et l'accueil | validé (Maxens, 2026-11-20) | `/tarifs/#landing-express`, CGV article 5 |
| Ajustements inclus jusqu'à la validation du client, sans limite de nombre | validé (Maxens, 2026-11-12) | accueil, process |
| Non inclus : garantie de position Google ou de citation IA, publicité et achat de trafic, shootings photo et vidéo, pages ou fonctionnalités hors devis (devis complémentaire), maintenance (MSD Care) | validé (Maxens, 2026-11-12) | `/tarifs/#non-inclus` |
| Pas d'offre gratuite (audit, maquette) sauf si `/tarifs/` l'annonce | validé | `/tarifs/` |
| Landing Page : paiement en 2 fois sans frais par carte bancaire (Stripe), la moitié à la signature, l'autre moitié 30 jours plus tard ; affichable uniquement sur `/tarifs/` et sa version anglaise | validé (Maxens, 2026-11-24) | `/tarifs/`, CGV article 4 |
| Intégration des outils du client : Doctolib, Planity, Calendly, Stripe, Shopify, Systeme.io | validé (Maxens, 2026-11-24) | `/tarifs/` |
| Option Assistant IA de MSD Care : 390 € de mise en place puis 29 € par mois, en option sur Essentiel, Suivi ou Marque ; répond aux questions pratiques, jamais d'avis médical ni de donnée de santé ; prix affichables uniquement sur `/tarifs/msd-care/` et sa version anglaise | validé (Maxens, 2026-11-24) | `/tarifs/msd-care/#assistant-ia` |
| La maintenance de MSD Media s'appelle MSD Care, partout. Seule exception, décidée par Maxens le 2026-11-20 : le premier mois de MSD Care Essentiel est inclus avec chaque landing page (Landing et Landing Express), sans engagement, puis 89 € par mois résiliable avec un mois de préavis. Jamais « la première année » ni « hébergement inclus » : au-delà de ce mois, elle est en option. Hors des pages de prix, on la nomme et on fait un lien vers `/tarifs/msd-care/`, sans prix | validé (Maxens, 2026-11-12) | `/tarifs/` |

Prix affichés aujourd'hui hors de `/tarifs/` (contraires à la règle, à trancher par Maxens) : description de l'accueil (« Dès 1 990 € »), FAQ de `/reserver-un-appel/` (« Les offres démarrent à 1 990 € »), `llms.txt` (tarifs et MSD Care).

## Délais

| Fait | Statut | Preuve |
|---|---|---|
| Première version en 7 jours, version finale en 21 jours **à compter de la réception des éléments du client** | validé (Maxens, 2026-11-12) | accueil, Tarifs, FAQ |
| Le délai est **indicatif** : 21 jours calendaires à compter de la réception des éléments, devis signé et acompte versé ; suspendu si le client tarde, projet clôturable après 60 jours sans réponse à une relance écrite | validé (texte juridique, 2026-11-12) | `terms/cgv.html`, article 5 |
| Devis envoyé sous 24 h ouvrées après une demande (formulaire de l'accueil, « Recevoir mon devis sous 24 h ») ; Maxens répond lui-même | validé (Maxens, 2026-11-24) ; ne pas l'étendre à « réponse à toute demande sous 24 h » sans son accord | accueil, `/a-propos/` |
| « Délai contractuel », « 21 jours ouvrés » comme promesse d'offre | **interdits** : contredisent les CGV (les « N jours ouvrés » des pages de réalisation sont des délais constatés, ils restent) | |

## Références et résultats

| Fait | Statut | Preuve |
|---|---|---|
| Réalisations publiées : Agence 3XL, Aristoi Academia, Carroz Sports, EM Motors, HairTattoo, Laurence Daien-Maestripieri, Marie Troccaz, Maxime Sciare, Merz Radiesse, Merz Ultherapy Prime, Nation Startup | validé | `/realisations/` |
| Merz Aesthetics : projets Radiesse et Ultherapy Prime uniquement | validé ; citable dans le corps d'un article avec les faits de ses pages de réalisation, **jamais dans un title, un H1, une description ni comme sujet principal** (Maxens, 2026-11-16) | `/realisations/merz-*` |
| Belotero | **interdit** : MSD Media n'a pas cette réalisation | redirection du 2026-11-03 |
| Chiffres d'un projet (délai, PageSpeed, résultats) | validés seulement s'ils figurent sur la page de la réalisation | `/realisations/<projet>/` |
| « PageSpeed systématiquement supérieur à 95/100 » | **à confirmer** : pas de mesure publiée pour tous les projets ; on cite le score d'un projet précis | pages de réalisation |
| Maxime Sciare : PageSpeed 96/100 mobile, +40 points, livré en 21 jours ouvrés | validé | `/realisations/maxime-sciare/` ; `llms.txt` dit « livraison 14 jours » : à corriger |
| Résultats de conversion publiés : Nation Startup « +350 bêta-testeurs inscrits en 1 semaine après la mise en ligne » ; Agence 3XL « 3 rendez-vous générés le jour du lancement » | validé (pages de réalisation) | `/realisations/nation-startup/`, `/realisations/agence-3xl/` |
| Chiffre de conversion Merz (taux, leads) | **à obtenir** : Maxens le fournira avec période et source | |

## Avis

| Fait | Statut | Preuve |
|---|---|---|
| Avis Google réels (nombre et note du jour) | à relever à la date d'écriture | fiche Google |
| Chaque avis Trustpilot est noté 5 / 5 (« note moyenne des avis : 5 / 5 ») | validé (Maxens, 2026-11-16) ; ne pas écrire « TrustScore 5 » : le TrustScore affiché par Trustpilot est un calcul pondéré qui peut être plus bas (relevé du 2026-11-09 : 4,4) | https://www.trustpilot.com/review/msd-media.com |

## Classements

Aucun classement où MSD Media se place elle-même (les 4 articles de ce type ont été retirés le 2026-11-10 sur décision de Maxens). On n'en recrée pas.

| Fait | Statut | Preuve |
|---|---|---|
| 7e du classement Sorank « Les 10 meilleures agences de création de sites en France », publié le 25 août 2026 (badge « Top 7 des agences web en France, classement Sorank 2026 ») | validé (page consultée le 2026-11-16 ; le titre affiche « 2027 », c'est l'année que Sorank met en avant, pas une nouvelle édition) | https://www.sorank.com/fr/blog-geo-seo/meilleures-agences-creation-de-sites-france |

Chaque mention du classement renvoie à cette page. Si Sorank publie une nouvelle édition ou retire MSD Media, le badge se corrige partout le jour même.
