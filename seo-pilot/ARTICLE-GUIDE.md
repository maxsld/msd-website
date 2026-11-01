# Guide d'article du blog MSD Media

Le modèle de référence est `blog/sources/site-internet-medecine-esthetique-ce-qui-est-autorise.md`, l'article le plus performant du site (position 5, CTR 3,3 %). Ce guide décrit ce qui le fait marcher, pour Google comme pour les IA. Le `responsable-editorial` le suit ; le `relecteur-qualite` le vérifie.

## Pourquoi cette structure

- Les IA prennent environ 44 % de leurs citations dans le premier tiers d'une page : la réponse doit venir tout de suite, pas après une introduction.
- Les pages de 500 à 2 000 mots sont les plus citées ; au-delà de 5 000 mots, elles le sont moins. Google ne fixe aucune longueur idéale : la longueur suit la question.
- La confiance est le cœur de l'E-E-A-T : sources vérifiables, auteur identifié, expérience réelle de l'agence.
- Une section = une question = une réponse autonome : chaque passage peut être cité seul.

## Fichier source

Un fichier `blog/sources/<slug>.md`, sur le modèle exact des sources existantes :

```
---
status: "published"
title: "<titre H1, ≤ 70 caractères, contient la requête principale>"
seoTitle: "<title Google, ≤ 60 caractères, si différent du titre>"
date: "AAAA-MM-JJ"
description: "<meta description, 140 à 160 caractères, promesse concrète>"
image: "https://msd-media.com/assets/img/stock/<fichier existant>.webp"
tags: ["<requête principale>", "<variantes>", "MSD Media"]
slug: "<slug-court-sans-annee-si-possible>"
keyword: "<requête principale>"
category: "<Santé | SEO | Landing page | Annecy | Entrepreneuriat>"
---
```

- L'image est choisie dans `assets/img/stock/` parmi celles qui ne sont pas encore utilisées par un autre article (vérifier avec `grep -h '^image:' blog/sources/*.md`). On n'ajoute jamais d'image.
- Le slug est stable : on ne met l'année que si le sujet est par nature daté (prix, réglementation).

## Structure du corps

1. **`## Réponse courte`** : 60 à 100 mots qui répondent entièrement à la question, avec le fait principal, le chiffre ou la règle, et la nuance utile. Quelqu'un qui ne lit que ce bloc doit avoir sa réponse.
2. **Ligne de cadrage en italique** si le sujet est réglementaire ou daté : *« Cet article décrit l'état des textes au <date>. Il ne remplace pas l'avis de… »*
3. **5 à 8 sections `##` formulées comme les questions réelles des lecteurs**, dans l'ordre où ils se les posent. Chaque section commence par une phrase qui répond, puis développe : exemple, règle, chiffre sourcé.
4. **Au moins un tableau** comparatif ou récapitulatif (options, règles, prix du marché, étapes).
5. **Une section d'expérience** : « Comment nous … chez MSD Media » ou équivalent. Uniquement des faits réels déjà présents sur le site (projets Merz Radiesse et Ultherapy Prime, méthode en 21 jours, etc.). Jamais de chiffre de résultat client inventé.
6. **`## Questions fréquentes`** : 4 à 8 questions en `###`, chacune suivie d'**un seul paragraphe** de réponse (2 à 4 phrases). Le générateur en tire le balisage FAQ : pas de liste ni de second paragraphe sous une question.
7. **`## Sources`** : liste des sources officielles ou reconnues citées dans l'article, avec leur lien. Obligatoire dès qu'il y a une règle, une date réglementaire ou un chiffre externe.

Longueur visée : 1 200 à 2 200 mots. Plus court si la question est simple.

## Liens internes

- 3 à 5 liens internes dans le corps, en URL absolue, avec une ancre descriptive.
- Au moins un lien vers la **page de service cible** du groupe de l'article (voir `STRATEGY.md`) : `/creation-landing-page/`, `/creation-site-web-annecy/` ou `/agence-web-annecy/`, `/site-web-medecine-esthetique/` ou la page métier santé concernée.
- Après publication, ajouter un lien vers le nouvel article depuis 1 ou 2 articles proches (dans leur source `.md`), si cela a un sens pour le lecteur. Ces ajouts comptent dans le plafond de 3 pages modifiées.

## Écriture

- Le titre et la réponse courte reprennent les mots de la requête, tels que les gens la tapent.
- Phrases courtes, vouvoiement, exemples concrets, aucun remplissage (« dans un monde où… », « il est important de noter que… »).
- Chaque affirmation vérifiable a une source ; dans le doute, on ne l'écrit pas.
- Pas de prix MSD Media (seulement sur `/tarifs/`). Les fourchettes du marché sont permises.
- Un appel à l'action naturel en fin d'article vers la page de service cible ; le générateur ajoute déjà l'encadré de contact.

## Avant de publier

1. `npm run blog:build` sans erreur.
2. `npm run seo:check` sans erreur.
3. Relecture par `relecteur-qualite`.
