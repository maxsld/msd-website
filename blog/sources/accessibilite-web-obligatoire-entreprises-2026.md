---
title: "Accessibilité web obligatoire en 2026 : ce que la loi impose à votre entreprise (RGAA, amendes)"
date: "2026-08-18"
description: "European Accessibility Act, RGAA, sanctions jusqu'à 300 000 € : qui est concerné en 2026, ce qu'il faut mettre en place et comment vérifier votre site."
image: "https://images.unsplash.com/photo-1516387938699-a93567ec168e?q=80&w=2070&auto=format&fit=crop"
tags: ["accessibilité web", "RGAA", "European Accessibility Act", "conformité site web", "WCAG", "MSD Media"]
slug: "accessibilite-web-obligatoire-entreprises-2026"
keyword: "accessibilité web obligatoire entreprise"
---

# Accessibilité web obligatoire en 2026 : ce que la loi impose à votre entreprise (RGAA, amendes)

Depuis juin 2025, le **European Accessibility Act (EAA)** a élargi le champ des entreprises concernées par l'accessibilité numérique. Ce n'est plus un sujet réservé au secteur public : les **sociétés privées de plus de 10 salariés ou réalisant plus de 2 millions d'euros de chiffre d'affaires** doivent désormais s'y conformer, sous peine de sanctions financières. En 2026, les premiers contrôles ont commencé.

Ce guide explique qui est concerné, ce que la loi impose concrètement, les sanctions encourues et la méthode pour mettre votre site en conformité — sans jargon juridique inutile.

---

## Qui est concerné en 2026 ?

Le durcissement du cadre tient à la combinaison de deux textes : le RGAA (Référentiel Général d'Amélioration de l'Accessibilité), historiquement réservé au secteur public et parapublic, et l'EAA, directive européenne transposée en droit français, qui étend l'obligation au secteur privé depuis juin 2025.

| Type de structure | Obligation |
|---|---|
| Administrations, collectivités, établissements publics | Obligatoires depuis 2019 (loi handicap) |
| Entreprises privées de +10 salariés ou +2 M€ de CA | Obligatoires depuis juin 2025 (EAA) |
| Sites e-commerce, banque en ligne, plateformes de réservation | Concernés en priorité en 2026, quel que soit l'effectif |
| Micro-entreprises (-10 salariés et -2 M€ de CA) | Exemptées |

Concrètement : si vous vendez en ligne, gérez des réservations, ou dépassez ces seuils, votre site entre dans le périmètre de l'EAA — même si votre activité n'a rien à voir avec le handicap.

---

## Le cadre technique : RGAA et WCAG

Le référentiel applicable est le **RGAA 4.1**, qui traduit les standards internationaux **WCAG** en **106 critères vérifiables**, organisés en 13 thématiques (images, couleurs, formulaires, navigation, structuration de l'information...).

Une **déclaration d'accessibilité** est obligatoire sur la page d'accueil, accompagnée d'un **schéma pluriannuel de mise en conformité**. Ce n'est pas une simple mention légale : elle doit indiquer le taux de conformité réel du site et les actions prévues pour les points non conformes.

---

## Les sanctions : ce que ça coûte de ne rien faire

| Structure | Sanction |
|---|---|
| Service public non conforme | Jusqu'à 20 000 € d'amende par an |
| Entreprise privée (manquement EAA) | Jusqu'à 50 000 € par manquement |
| Entreprise soumise à l'EAA (+10 salariés / +2 M€ CA) | Jusqu'à 300 000 € ou 3 000 €/jour d'astreinte |

Le contrôle est assuré par l'**ARCOM** (Autorité de régulation de la communication audiovisuelle et numérique), et les premiers contrôles de la **DGCCRF** ont débuté en **janvier 2026**. Autrement dit : ce n'est plus une menace théorique, les vérifications sont en cours.

---

## Ce qu'il faut concrètement mettre en place

Pas besoin de tout refaire pour progresser. Les points qui pèsent le plus dans un audit RGAA :

- **Textes alternatifs** sur toutes les images porteuses d'information (pas juste `alt=""` par défaut)
- **Contraste des couleurs** suffisant entre texte et fond (ratio 4,5:1 minimum pour le texte courant)
- **Navigation au clavier** complète, sans piège de focus, pour les visiteurs qui n'utilisent pas de souris
- **Formulaires labellisés** : chaque champ associé à un `<label>` explicite, messages d'erreur clairs
- **Structure sémantique** : hiérarchie de titres H1 → H2 → H3 cohérente, balises HTML utilisées pour leur sens (et non pour leur apparence)
- **Vidéos sous-titrées** et lecteurs multimédias accessibles au clavier
- **Déclaration d'accessibilité** publiée avec le taux de conformité et le plan d'action

---

## Comment vérifier votre site gratuitement

1. **[WAVE](https://wave.webaim.org/)** — extension et outil en ligne qui liste les erreurs directement sur la page
2. **Audit clavier manuel** — débranchez la souris et naviguez uniquement au clavier (Tab, Entrée) : tout ce qui est injoignable est un point de blocage
3. **Contraste** — vérifiez vos couleurs de texte avec le [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
4. **Lighthouse (Chrome DevTools)** — l'onglet « Accessibilité » donne un score et une liste priorisée de correctifs

Ces outils donnent un état des lieux rapide, mais ne remplacent pas un audit RGAA complet pour une déclaration de conformité officielle.

---

## Pourquoi les sites à widgets tiers sont les plus exposés

Les correctifs d'accessibilité vendus comme des « overlays » (widgets JavaScript ajoutés en une ligne de code, souvent en surcouche d'un site WordPress ou Wix) sont explicitement déconseillés par les associations d'usagers et ne suffisent pas à obtenir une conformité RGAA réelle : ils masquent les problèmes sans les corriger à la source, et certains aggravent même l'expérience des utilisateurs de lecteurs d'écran.

C'est pourquoi les sites **codés sur mesure** (HTML sémantique, sans constructeur visuel ni thème surchargé) partent avec un avantage structurel : la hiérarchie de titres, les formulaires et la navigation clavier sont pensés dès la construction, pas ajoutés après coup en rustine. Notre article sur les [Core Web Vitals](https://msd-media.com/blog/articles/core-web-vitals-guide-2026/) détaille la même logique appliquée à la performance : un site propre à la base coûte moins cher à mettre en conformité qu'un site bâti sur des extensions empilées.

---

## FAQ — Accessibilité web obligatoire

### Mon entreprise est-elle concernée par l'EAA ?

Oui si vous employez plus de 10 salariés ou réalisez plus de 2 millions d'euros de chiffre d'affaires, et particulièrement si vous exploitez un site e-commerce, une plateforme de réservation ou un service bancaire en ligne. Les micro-entreprises sous ces deux seuils sont exemptées.

### Quelle est l'amende si mon site n'est pas conforme ?

Pour une entreprise soumise à l'EAA, la sanction peut atteindre 300 000 € ou 3 000 € par jour d'astreinte en cas de manquement persistant. Pour un manquement isolé au titre de l'EAA côté privé, l'amende peut atteindre 50 000 €.

### Dois-je refaire tout mon site pour être conforme ?

Non. La conformité RGAA se construit par une déclaration d'accessibilité indiquant votre taux de conformité réel et un plan d'action pluriannuel — vous n'êtes pas tenu d'atteindre 100 % immédiatement, mais de démontrer une trajectoire d'amélioration continue et sincère.

### Quelle est la différence entre RGAA et WCAG ?

WCAG (Web Content Accessibility Guidelines) est le standard international. Le RGAA 4.1 est sa déclinaison française officielle, qui traduit ces recommandations en 106 critères vérifiables et opposables, utilisés pour les audits et les déclarations de conformité en France.

### Comment savoir si mon site est accessible sans payer d'audit ?

Testez-le avec WAVE (gratuit, en ligne), naviguez-y entièrement au clavier sans souris, et vérifiez le score de l'onglet Accessibilité dans Chrome DevTools (Lighthouse). Ces trois vérifications gratuites suffisent à repérer 70 à 80 % des problèmes courants, même si elles ne remplacent pas un audit RGAA officiel pour la déclaration de conformité.

---

## Conclusion : une obligation, mais aussi une opportunité

L'accessibilité web n'est plus une case à cocher pour le secteur public : depuis juin 2025, elle concerne toute entreprise privée dépassant 10 salariés ou 2 M€ de CA, avec des sanctions qui montent jusqu'à 300 000 €. Au-delà de la contrainte légale, un site accessible touche aussi un public plus large — en France, 12 millions de personnes vivent avec un handicap — et améliore mécaniquement le SEO, puisque les deux disciplines partagent les mêmes fondamentaux (structure sémantique, alternatives textuelles, hiérarchie claire).

**Envie de savoir où en est votre site ?** [Demandez un audit gratuit](https://msd-media.com/audit-seo-annecy/) : nous vérifions vos points de blocage RGAA prioritaires en même temps que votre SEO technique.
