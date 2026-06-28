# Framework article de blog SEO — structure parfaite

Référence de structure de contenu pour chaque article (complète `docs/seo-article-checklist.md`, qui couvre le pipeline technique). À suivre par la routine cloud Claude Code "Brief & rédaction d'article" et par toute rédaction manuelle.

## 1. Structure sémantique des titres (H1 → H2 → H3)

- **Un seul H1** par page, généré automatiquement à partir du `title` du frontmatter — ne jamais en ajouter un second dans le corps du markdown.
- **H2** = chaque section majeure (3 à 6 par article). Le mot-clé principal ou une variante doit apparaître dans au moins 2 des H2.
- **H3** = sous-points à l'intérieur d'un H2 (utilisé pour les listes détaillées, ex: chaque erreur dans un "top 5 erreurs").
- Jamais de saut de niveau (H2 → H4 sans H3 intermédiaire).
- Chaque H2/H3 doit pouvoir se lire seul et répondre à une vraie question — penser "featured snippet" : si quelqu'un copie-colle juste ce titre + le paragraphe qui suit dans Google, ça doit faire sens.

## 2. Titre (title tag) et meta description

- **Title** : 55-65 caractères, mot-clé principal dans les 40 premiers caractères, jamais de liste à la chaîne de mots-clés.
- **Meta description** : 140-155 caractères, contient le mot-clé + un bénéfice concret + incitation implicite au clic. Éviter les meta génériques ("Découvrez tout sur X") — c'est elles qui expliquent le CTR fiable à 1,6% sitewide identifié dans l'audit de juin.
- Formule qui marche bien sur ce site : `[Mot-clé] : [angle différenciant] | [bénéfice chiffré ou délai]`.

## 3. Structure du corps de l'article

```
Intro (80-100 mots)
  → Accroche qui nomme le problème du lecteur, pas l'entreprise
  → Mot-clé principal dans la première phrase

H2 #1 — Contexte / le problème en détail
H2 #2 — Première partie de la réponse
H2 #3 — Deuxième partie de la réponse
H2 #4 — (optionnel) Objection ou cas particulier traité honnêtement
H2 #5 — Conclusion / récap actionnable

CTA final vers le calendly
```

### Cas spécifique : article "Top N" (ex: top 5 erreurs, top 5 outils, top 5 agences)

Structure obligatoire pour ce format :
- **Un H3 par item du classement**, numéroté explicitement dans le H3 ("Erreur n°1 : ...", pas juste le nom de l'erreur)
- Chaque item suit le même micro-format à 3 temps : **le piège** (ce que les gens font) → **la réalité** (pourquoi c'est un problème, avec une donnée si possible) → **la solution** (action concrète)
- Le classement doit être défendable — si MSD Media ou un client apparaît dans un classement ("top 5 agences X"), il faut une justification factuelle, jamais juste une auto-promotion non étayée
- Conclusion du top N : un paragraphe qui synthétise le critère de choix global, pas juste un résumé de la liste

### Cas spécifique : article comparatif ("X vs Y")

- Présenter les deux options avec la même rigueur avant de trancher — un comparatif qui descend l'option B en 2 lignes pour vendre A perd toute crédibilité (et tout potentiel de backlink, personne ne cite une page qui sent la pub)
- Toujours inclure une section "dans quel cas [l'option qu'on ne vend pas] reste pertinente" — c'est ce qui rend l'article cité comme référence plutôt que comme contenu marketing
- Terminer par un critère de décision actionnable, pas par "ça dépend" sans suite

## 4. Maillage interne

- **Liens sortants** (depuis le nouvel article) : gérés automatiquement par `getInternalServiceLinks()` dans `scripts/generate-blog.js` selon la ville/sujet détecté. Ne pas dupliquer à la main.
- **Liens entrants** (depuis 3+ articles/pages existants vers le nouvel article) : **toujours manuel**, voir `docs/seo-article-checklist.md` section 4. Ancre de lien contextuelle et naturelle, jamais "cliquez ici".
- **Articles liés** : générés automatiquement par tag — vérifier que le frontmatter `tags` contient au moins 2 tags partagés avec d'autres articles existants, sinon la section reste vide.

## 5. Liens externes (sortants vers d'autres domaines)

- Citer une vraie source quand on avance une statistique (ex: "40% des sites mondiaux tournent sous WordPress" → lien vers la source si possible) — ça renforce l'E-E-A-T et c'est exactement ce que Google et les IA génératives valorisent pour la citabilité (GEO).
- Ne jamais linker un concurrent direct sur une page commerciale, mais c'est acceptable sur un article de blog factuel si la mention est honnête (ça crédibilise plutôt que ça dessert).

## 6. Schema / données structurées

Générés automatiquement par le pipeline (`Article`, `BreadcrumbList`, `FAQPage`) — ne jamais les écrire à la main dans le markdown. Si le FAQ généré semble pauvre, c'est que le contenu ne répond pas assez explicitement à des questions sous forme de H2/H3 — corriger le contenu, pas le schema.

## 7. Longueur

- Article standard : 800-1200 mots (4-6 sections H2 à 200-250 mots)
- Article "Top N" : compter ~120-150 mots par item du classement + intro/conclusion
- Article comparatif : 1000-1400 mots (les deux options méritent un développement complet)

## 8. CTA

- Toujours le même lien (`https://cal.com/maxens-soldan-msd-media/30min`), jamais varié pour rester cohérent avec le tracking existant
- Reformuler le texte du CTA selon le sujet de l'article (pas un copier-coller générique) — il doit répondre directement à la question que l'article vient de traiter
