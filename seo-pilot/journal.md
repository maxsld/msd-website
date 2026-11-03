# Journal du pilote SEO

Chaque modification faite sur le site pour le référencement, avec ses chiffres de départ, pour en mesurer l'effet 21 jours plus tard.

Hors entrées : le 2026-10-30, les 11 pages « agence web + ville » hors zone et /landing-page-bruxelles/ ont été redirigées (301). C'est définitif, ne pas revenir dessus.

Hors entrées : le 2026-11-02, refonte du design de tout le site (thème clair, nouveau header et footer, polices Inter Tight et Manrope, mêmes textes sauf l'accueil). Les bilans de novembre doivent en tenir compte : une variation commune à toutes les pages vient probablement de la refonte, pas des changements ci-dessous.
Le même jour, les 12 pages secteur (site-web-…) ont été reconstruites sur le modèle de l'accueil par `scripts/build-sector-pages.py` (contenu dans `data/sectors.json`). Textes, FAQ et données structurées conservés ; leur structure change. Pour les modifier : éditer `data/sectors.json` puis relancer le script, jamais le HTML directement.
Le 2026-11-03, les 15 pages de service ont été reconstruites de la même façon (contenu dans `data/services.json`), et les anciennes sections communes des autres pages (réalisations, process, avis, FAQ, « Demander à l'IA ») remplacées par celles de l'accueil. Textes, FAQ et données structurées conservés.
Le 2026-11-03, audit SEO/AEO/GEO après refonte : titles, descriptions, canonicals et données structurées identiques à avant sur toutes les pages. Corrigé : étiquette au-dessus du H1 passée de <h2> à <p> (75 pages, le H1 est maintenant le premier titre), données structurées Blog + fil d'Ariane sur /blog/, ancre cassée sur /faq-seo/, llms.txt (première version en 7 jours). À traiter par l'agence, page par page : 10 titles > 60 caractères et 5 descriptions > 160 (outils, template, 6 articles, /refonte-site-web-annecy/).

## Entrées

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
