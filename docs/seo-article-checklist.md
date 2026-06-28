# Checklist SEO — création d'un article de blog

Process rigide à suivre pour chaque nouvel article, pour qu'aucune étape ne soit oubliée (inspiré d'un retour d'expérience sur la création programmatique de pages SEO, adapté à la pile technique de msd-website).

## 1. Choisir un mot-clé à fort potentiel business

Privilégier les patterns répétables et déjà identifiés comme rentables :
- **Comparatifs technique** ("WordPress vs développement sur mesure", "Wix vs site sur mesure") — jouent sur le différenciateur MSD (code natif, zéro CMS) et attirent des backlinks naturels (page-ressource, pas une page de vente)
- **Guides prix** ("combien coûte X à Annecy")
- **Comparatifs service** ("landing page vs site vitrine", "agence vs freelance")
- **Listicles** ("top 5 erreurs X")
- **SEO local par métier × ville** (déjà bien couvert sur Annecy/Strasbourg, à étendre)

Avant de choisir : vérifier que le sujet n'est pas déjà traité (`grep -ri "<mot-clé>" blog/sources/*.md`) et regarder ce que publient les concurrents directs (WeComeback, Annecy-dev.fr, TezDev) pour identifier les trous de contenu.

## 2. Rédiger le contenu en respectant le format markdown du pipeline existant

Fichier source dans `blog/sources/<slug>.md`, frontmatter obligatoire :

```yaml
---
title: "[Titre SEO, 55-65 caractères]"
date: "YYYY-MM-DD"
description: "[Meta description 140-155 caractères, avec le mot-clé]"
image: "[URL Unsplash ou autre, format paysage]"
tags: ["tag1", "tag2", "tag3", "tag4"]
slug: "[slug-kebab-case]"
keyword: "[mot-clé cible exact]"
---
```

Structure : intro accrocheur (80-100 mots) → 3-5 sections H2 (200-250 mots chacune) → conclusion/récap → CTA vers `https://cal.com/maxens-soldan-msd-media/30min`.

## 3. Lancer le build (génère automatiquement le reste de la checklist)

```bash
npm run blog:build
```

Ce que ce script fait **déjà automatiquement**, à ne pas refaire à la main :
- Génère le HTML complet de l'article dans `blog/articles/<slug>/`
- Injecte le schema `Article` + `BreadcrumbList` + `FAQPage` (FAQ déduite du contenu)
- Ajoute une section "Liens utiles" (liens internes sortants vers les pages de service pertinentes, détectés par ville/sujet)
- Ajoute une section "Articles liés" (liens vers articles au tag similaire)
- Met à jour `blog/index.html`, `blog/feed.xml`, `blog/sitemap.xml` **et** `sitemap.xml` (racine)

## 4. Ajouter manuellement 3+ liens entrants (seule étape non automatisée)

Le pipeline gère les liens **sortants** depuis le nouvel article, mais pas les liens **entrants** depuis des articles/pages existants vers le nouvel article. À faire à la main :

1. `grep -rl "<mot-clé ou sujet proche>" blog/sources/*.md` pour trouver 2-3 articles pertinents
2. Ajouter un lien contextuel naturel (pas juste "voir aussi") dans le `.md` source de chacun — **jamais directement dans le HTML généré**, qui sera écrasé au prochain build
3. Relancer `npm run blog:build` pour propager

## 5. Vérifier avant de committer

```bash
# Schema valide (Article + BreadcrumbList + FAQPage présents)
grep -c "application/ld+json" blog/articles/<slug>/index.html

# Présence dans les sitemaps
grep -c "<slug>" sitemap.xml blog/sitemap.xml

# HTML valide
python3 -c "from html.parser import HTMLParser; HTMLParser().feed(open('blog/articles/<slug>/index.html').read())"
```

## 6. Indexation

Pas d'action manuelle nécessaire : le workflow GitHub Actions `index-on-deploy.yml` soumet automatiquement les URLs modifiées à l'Indexing API Google à chaque push sur `main` (sauf commits `[skip ci]` ou `chore(sitemap):`).

## ⚠️ Point de vigilance : deux systèmes de génération d'articles coexistent

- `scripts/generate-articles.js` + workflow `weekly-blog.yml` (lundi 7h UTC) — génère un article via l'API Anthropic directe, pioche dans `KEYWORD_POOL`, envoie un email d'approbation
- La routine cloud Claude Code "Brief & rédaction d'article" (lundi 6h30 UTC) — génère aussi un article, de façon indépendante

Les deux tournent le même jour sans se coordonner. Risque de doublon ou de sujets qui se chevauchent. À trancher : garder un seul système ou les désynchroniser/spécialiser (ex: l'un pour les patterns comparatifs, l'autre pour le SEO local ville×métier).
