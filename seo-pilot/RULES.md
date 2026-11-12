# Règles communes de l'agence SEO de msd-media.com

Tous les agents les lisent et les appliquent. MSD Media est une agence web d'Annecy, fondée en juin 2025 par Maxens Soldan. Maxens a demandé que le travail parte en ligne sans validation de sa part : la qualité et la prudence reposent entièrement sur l'agence. Le site est en HTML statique, déployé sur Vercel à chaque push sur `main`. Aucun agent ne fait de commit ni de push : le workflow s'en charge à la fin, si les contrôles passent.

## Interdits absolus

- **Inventer** quoi que ce soit : chiffres, résultats clients, cas clients, témoignages, avis, récompenses, partenariats, citations. On n'utilise que les faits déjà présents sur le site, ou des faits publics vérifiés avec leur source.
- Écrire sur MSD Media un fait absent de `seo-pilot/FAITS.md` ou marqué « à confirmer » (nombre de clients, note d'avis, score PageSpeed général, délai « contractuel » : les CGV disent indicatif). Un calcul de rentabilité dans un article est marqué « illustratif », avec ses hypothèses, et ne promet jamais un nombre de clients ou un délai de retour sur investissement.
- **Affirmer une règle de droit, un chiffre de marché ou une date réglementaire sans source.** Toute affirmation de ce type cite une source officielle ou reconnue (Légifrance, Ordre, ANSM, CNIL, Google…), avec un lien dans la section « Sources » de l'article. Dans le doute, on ne l'écrit pas.
- Afficher un **prix MSD Media** ailleurs que sur `/tarifs/` et sa sous-page `/tarifs/msd-care/` (MSD Care, maintenance en trois niveaux). Les fourchettes de prix du marché restent permises dans les articles.
- Modifier l'**accueil** (`index.html`, `en/index.html`) : Maxens le gère lui-même.
- Citer Belotero comme réalisation ou ajouter un lien vers `/realisations/merz-belotero/` : MSD Media n'a pas cette réalisation (page redirigée vers `/realisations/` le 2026-11-03).
- Supprimer une page en dehors de la procédure « Retirer ou fusionner une page » de `seo-pilot/PROMPT.md` (fusion, redirection 301 ajoutée à la fin des `redirects` de `vercel.json`, liens internes mis à jour, `node scripts/check-retraits.mjs` au vert). Hors de cette procédure : ne pas toucher à `vercel.json`, aux workflows, aux scripts, au CSS, au JS, à `llms.txt`, au footer ou au header ; les sitemaps ne changent que pour retirer une page retirée.
- Créer une page ailleurs que sur le blog (un article = un fichier dans `blog/sources/`).
- Toucher à une page modifiée il y a moins de 21 jours d'après `seo-pilot/journal.md`, sauf pour annuler un changement nuisible.
- Écrire une année de fondation autre que 2025 (juin 2025).

## Design

Le design actuel du site ne change pas, et aucune autre référence de design ne s'applique (ni skill, ni tendance extérieure). La référence est l'accueil (`index.html`) ; pour un article, ce sont les articles existants. On ne crée ni style, ni classe CSS, ni attribut `style=`. Pour ajouter un bloc (FAQ, paragraphe, liste de liens, cartes), on reprend la structure HTML et les classes d'un bloc du même type sur l'accueil ou sur la page modifiée. Depuis la refonte du 2026-11-02, le design commun vient de `assets/css/theme-v2.css` (header, footer, boutons) et `assets/css/pages-v2.css` (typographie des pages) ; les anciens composants sont passés en thème clair par `assets/css/light-v1.css`, généré automatiquement. Le skill `msd-design-system` décrit encore l'ancien thème sombre : s'y fier pour la structure des blocs, pas pour les couleurs. Le rendu doit être identique à l'existant.

## Conversion

Améliorer la conversion d'une page est permis et encouragé : réponse plus nette en tête, preuves déjà présentes sur le site (projets Merz Radiesse et Ultherapy Prime, avis réels, presse), appel à réserver un appel (lien `https://msd-media.com/reserver-un-appel/`) mieux placé. Toujours avec des blocs existants de la home, jamais de fausse urgence ni de promesse non tenue.

## Règles techniques

- **Pages secteur** (`site-web-*/`) **et pages de service** (création de site, landing page, agence web, audit SEO, SEO local, refonte, par ville) : générées par `python3 scripts/build-sector-pages.py` à partir de `data/sectors.json` et `data/services.json`. On modifie leur contenu dans ce fichier JSON, puis on relance le script ; jamais leur HTML directement.
- **Blog** : les articles qui ont une source dans `blog/sources/*.md` (champ `slug:`) se modifient uniquement dans cette source, puis `npm run blog:build`. On ne touche jamais au HTML généré de ces articles. Les articles sans source se modifient directement dans leur HTML. Un nouvel article suit `seo-pilot/ARTICLE-GUIDE.md`.
- **Traductions** : un élément avec `data-i18n="clé"` voit son texte remplacé par `assets/i18n/translations.json`. Si on modifie un tel texte, on met à jour la clé en français (et en anglais si elle existe), sinon la modification ne s'affiche pas.
- **Portes d'entrée IA** : le bloc « MSD Media en bref » des pages légales (FR et EN : résumé, tableau comparatif, FAQ, pages clés) et la page `/plan-du-site/` sont générés par `python3 scripts/build-ai-doors.py` (aussi lancé au push). On modifie le texte dans ce script, jamais dans le HTML. Il ne contient que des faits déjà publiés, sans prix (ils restent sur `/tarifs/`).
- **Matrice des prompts IA** : `data/ai-prompts.json` (cibles, besoins, lieux, intentions) ; `scripts/ai-prompt-coverage.py` mesure chaque lundi les croisements couverts dans `seo-pilot/data/prompts-ia.md`. Un trou se comble par une question de FAQ, un passage ou un article utile, jamais par une page creuse par combinaison.
- **Pages anglaises** : les pages françaises listées dans `PAGES` de `scripts/build-en-pages.mjs` (tarifs, à propos, contact, réservation, landing page, outils, affiliation, réalisations, mentions légales) ont une version `/en/` générée. Après une modification de l'une d'elles, ajoute la traduction anglaise des textes nouveaux ou modifiés dans `scripts/i18n/en-pages.json` (texte français exact → texte anglais ; `node scripts/build-en-pages.mjs --extract` liste ceux qui manquent), puis lance `node scripts/build-en-pages.mjs`. On ne modifie jamais le HTML des pages `/en/` générées.
- **Cannibalisation** : avant de changer le title, le H1, la description ou le sujet principal d'une page, vérifie dans le dernier relevé (`seo-pilot/data/*.json`, champ `queries` : page + requête) quelle page possède la requête visée. La page propriétaire est celle qui a le plus d'impressions sur cette requête (puis le plus de clics). On n'oriente jamais une page vers une requête qu'une autre page possède, et deux pages ne partagent jamais le même mot-clé principal dans leur title ou leur H1. Si deux pages sont dans le top 30 sur la même requête, on règle le conflit avant toute autre optimisation : la page non propriétaire prend un angle distinct et fait un lien vers la propriétaire. Les requêtes de marque (« msd media » et ses variantes) ne sont pas concernées.
- **FAQ** : le texte des réponses dans le JSON-LD `FAQPage` doit être identique au texte visible. `npm run seo:check` le vérifie.
- **Titles et descriptions** : title ≤ 60 caractères, description ≤ 160, modifiés aussi dans leurs copies `og:` et `twitter:`.
- **Liens internes** : URL absolues `https://msd-media.com/...` comme dans le reste du site, ancres descriptives (jamais « cliquez ici »).

## Style

Français clair, phrases courtes, vouvoiement du visiteur, pas de superlatifs creux ni de jargon inutile. Pas de tiret cadratin pour relier deux idées : deux phrases, ou deux-points.
