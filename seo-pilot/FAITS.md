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
| Maintenance MSD Care 490 € par mois, sans engagement | validé, même règle | `/tarifs/` |
| Pas d'offre gratuite (audit, maquette) sauf si `/tarifs/` l'annonce | validé | `/tarifs/` |

Prix affichés aujourd'hui hors de `/tarifs/` (contraires à la règle, à trancher par Maxens) : description de l'accueil (« Dès 1 990 € »), FAQ de `/reserver-un-appel/` (« Les offres démarrent à 1 990 € »), `llms.txt` (tarifs et MSD Care).

## Délais

| Fait | Statut | Preuve |
|---|---|---|
| Première version en 7 jours, version finale en 21 jours | validé | accueil, pages de service |
| Le délai est **indicatif** : 21 jours ouvrés à compter du devis signé, de l'acompte et de la réception des contenus | validé (texte juridique) | `terms/cgv.html`, article 5 |
| « Délai contractuel » | **contredit les CGV** : ne pas l'écrire | encore dans `llms.txt` |

## Références et résultats

| Fait | Statut | Preuve |
|---|---|---|
| Réalisations publiées : Agence 3XL, Aristoi Academia, Carroz Sports, EM Motors, HairTattoo, Laurence Daien-Maestripieri, Marie Troccaz, Maxime Sciare, Merz Radiesse, Merz Ultherapy Prime, Nation Startup | validé | `/realisations/` |
| Merz Aesthetics : projets Radiesse et Ultherapy Prime uniquement | validé | `/realisations/merz-*` |
| Belotero | **interdit** : MSD Media n'a pas cette réalisation | redirection du 2026-11-03 |
| Chiffres d'un projet (délai, PageSpeed, résultats) | validés seulement s'ils figurent sur la page de la réalisation | `/realisations/<projet>/` |
| « PageSpeed systématiquement supérieur à 95/100 » | **à confirmer** : pas de mesure publiée pour tous les projets ; on cite le score d'un projet précis | pages de réalisation |
| Maxime Sciare : PageSpeed 96/100 mobile, +40 points, livré en 21 jours ouvrés | validé | `/realisations/maxime-sciare/` ; `llms.txt` dit « livraison 14 jours » : à corriger |

## Avis

| Fait | Statut | Preuve |
|---|---|---|
| Avis Google réels (nombre et note du jour) | à relever à la date d'écriture | fiche Google |
| « Trustpilot : 5 / 5 » | **à confirmer** : le relevé du 2026-11-09 (specialiste-ia) donne 4,4 sur 10 avis | article `agence-landing-page-site-web-france-msd-media` |

## Classements

Aucun classement où MSD Media se place elle-même (les 4 articles de ce type ont été retirés le 2026-11-10 sur décision de Maxens). On n'en recrée pas.
