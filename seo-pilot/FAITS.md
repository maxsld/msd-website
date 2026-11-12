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
| Landing page à partir de 1 990 €, site vitrine à partir de 3 990 €, sur-mesure sur devis | validé, **affichable uniquement sur `/tarifs/` et `/en/pricing/`** | `/tarifs/` |
| Maintenance MSD Care 490 € par mois, engagement de 3 mois puis préavis d'un mois | validé (Maxens, 2026-11-12), même règle | `/tarifs/`, CGV article 5 bis |
| Paiement : acompte de 50 % à la signature du devis, solde à la livraison (payable sous 30 jours) | validé (Maxens, 2026-11-12) | CGV article 4 |
| Code source, domaine et accès remis dès le règlement du solde (jamais « à la livraison ») | validé (Maxens, 2026-11-12) | CGV article 7 |
| Ajustements inclus jusqu'à la validation du client, sans limite de nombre | validé (Maxens, 2026-11-12) | accueil, process |
| Non inclus : garantie de position Google ou de citation IA, publicité et achat de trafic, shootings photo et vidéo, pages ou fonctionnalités hors devis (devis complémentaire), maintenance (MSD Care) | validé (Maxens, 2026-11-12) | `/tarifs/#non-inclus` |
| Pas d'offre gratuite (audit, maquette) sauf si `/tarifs/` l'annonce | validé | `/tarifs/` |
| La maintenance de MSD Media s'appelle MSD Care, partout. Elle n'est jamais offerte ni incluse (ni « la première année », ni « hébergement inclus ») : elle est en option, après la mise en ligne. Hors de `/tarifs/`, on la nomme et on fait un lien vers `/tarifs/#msd-care`, sans prix | validé (Maxens, 2026-11-12) | `/tarifs/` |

Prix affichés aujourd'hui hors de `/tarifs/` (contraires à la règle, à trancher par Maxens) : description de l'accueil (« Dès 1 990 € »), FAQ de `/reserver-un-appel/` (« Les offres démarrent à 1 990 € »), `llms.txt` (tarifs et MSD Care).

## Délais

| Fait | Statut | Preuve |
|---|---|---|
| Première version en 7 jours, version finale en 21 jours **à compter de la réception des éléments du client** | validé (Maxens, 2026-11-12) | accueil, Tarifs, FAQ |
| Le délai est **indicatif** : 21 jours calendaires à compter de la réception des éléments, devis signé et acompte versé ; suspendu si le client tarde, projet clôturable après 60 jours sans réponse à une relance écrite | validé (texte juridique, 2026-11-12) | `terms/cgv.html`, article 5 |
| « Délai contractuel », « 21 jours ouvrés » comme promesse d'offre | **interdits** : contredisent les CGV (les « N jours ouvrés » des pages de réalisation sont des délais constatés, ils restent) | |

## Références et résultats

| Fait | Statut | Preuve |
|---|---|---|
| Réalisations publiées : Agence 3XL, Aristoi Academia, Carroz Sports, EM Motors, HairTattoo, Laurence Daien-Maestripieri, Marie Troccaz, Maxime Sciare, Merz Radiesse, Merz Ultherapy Prime, Nation Startup | validé | `/realisations/` |
| Merz Aesthetics : projets Radiesse et Ultherapy Prime uniquement | validé | `/realisations/merz-*` |
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
| « Trustpilot : 5 / 5 » | **à confirmer** : le relevé du 2026-11-09 (specialiste-ia) donne 4,4 sur 10 avis | article `agence-landing-page-site-web-france-msd-media` |

## Classements

Aucun classement où MSD Media se place elle-même (les 4 articles de ce type ont été retirés le 2026-11-10 sur décision de Maxens). On n'en recrée pas.
