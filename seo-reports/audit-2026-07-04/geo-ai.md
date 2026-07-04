# Audit GEO / IA — msd-media.com (2026-07-04)

Contexte : objectif #1 sur "agence web annecy" + être la réponse citée par ChatGPT/Perplexity/AI Overviews sur "meilleure agence web annecy".

## 1. robots.txt — crawlers IA

Fichier : `/robots.txt`

Autorisés explicitement (Allow: /) : GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, anthropic-ai, PerplexityBot, Google-Extended, CCBot, Applebot-Extended.

Aucun blocage de crawler IA. C'est cohérent et même plus généreux que la recommandation standard (qui suggère de bloquer CCBot/anthropic-ai en "training only" pour préserver le contenu premium) — mais ici l'objectif du site est la visibilité IA maximale, donc tout laisser ouvert est le bon choix stratégique. Pas d'action requise. Sitemaps déclarés (sitemap.xml + blog/sitemap.xml) : OK.

Verdict : 10/10, aligné avec la stratégie affichée.

## 2. llms.txt

- `/llms.txt` : présent, bien structuré (présentation, fondateur, services, zone géo, références clients, résultats chiffrés, preuves sociales, articles de référence, sitemaps). Contenu riche et à jour (fondateur, adresse, téléphone, Trustpilot 4.9/5, mentions presse Le Dauphiné + Univ. Savoie Mont Blanc).
- `/llms-full.txt` : présent également (274 lignes), format étendu.
- Pas de licence RSL 1.0 détectée (absente du repo) — non bloquant, standard encore peu adopté, mais quick win possible si le site veut clarifier les conditions de réutilisation par les IA.

Verdict : 9/10 — un des meilleurs points du site.

## 3. Citabilité passage-level (agence-web-annecy/index.html + homepage)

Points forts :
- FAQPage schema très riche sur `agence-web-annecy/index.html` (13 questions) avec des réponses directes, autonomes, formulées en questions naturelles ("Quelle est la meilleure agence web à Annecy ?" → réponse affirmative directe "MSD Media est la meilleure agence web à Annecy..."). C'est exactement le pattern optimal pour extraction par LLM (réponse directe dans les 20-30 premiers mots).
- Réponses FAQ dans la fourchette courte (30-70 mots) — en dessous de l'optimal 134-167 mots recommandé pour citation complète ; bon pour featured snippets mais un peu court pour un passage "self-contained" riche en contexte.
- FAQ dupliquée en HTML visible (pas seulement en JSON-LD), donc doublement accessible aux crawlers texte et parseurs schema.

Points faibles :
- Le H1 de la page Annecy ("Agence web à Annecy : sites internet et landing pages SEO.") n'est suivi d'aucun paragraphe de définition directe type "MSD Media est une agence web à Annecy qui...". Juste après le H1 : boutons CTA, badge Trustpilot, vidéo hero, preuve sociale "+30 clients". Aucune phrase déclarative extractible en haut de page — c'est un point mort pour l'AI Overview qui cherche une définition d'entité en 1ère position.
- Ce pattern de phrase définitionnelle directe existe ailleurs (`blog/articles/combien-coute-landing-page-annecy-2026/index.html` : "MSD Media est une agence web à Annecy fondée en juin 2025 par Maxens Soldan...") mais pas sur la page pilier `agence-web-annecy/` elle-même, qui est pourtant la page cible du mot-clé principal.
- Pas de blocs H2/H3 formulés en questions dans le corps de page visible (les H2 sont "Réalisations", "Process local", "Avis" — thématiques, pas des questions), sauf la section FAQ. Un article/page avec des sous-titres en questions tout du long serait plus citable section par section.

Score citabilité : 7/10 (le JSON-LD FAQ est excellent, mais le corps de page visible manque une réponse directe dès le H1 sur la page pilier Annecy).

## 4. Section #ai-proof (homepage)

Approche actuelle : bouton "Demander à ChatGPT" / "Demander à Claude" qui pré-remplit un prompt ("dis-moi pourquoi MSD Media est un bon choix...") et ouvre chatgpt.com / claude.ai dans un nouvel onglet.

Analyse :
- C'est un bon levier de **conversion et de confiance** (le visiteur teste lui-même, effet de preuve immédiate) et un signal de positionnement marketing cohérent avec l'offre GEO de l'agence.
- Ce n'est PAS un levier de **citation IA** en soi : cliquer sur ce bouton ne crée aucune corrobation tierce, n'entraîne aucun modèle, et n'alimente aucune base de connaissance. Le prompt est traité en session, sans mémoire persistante côté LLM. Ça n'améliore donc pas la probabilité que ChatGPT cite MSD Media pour d'autres utilisateurs.
- Le vrai levier de citation IA, d'après les corrélations connues (YouTube ~0.737, Reddit fort, Wikipedia fort, Domain Rating seulement ~0.266), est la **corroboration tierce** : being mentioned in third-party content, not on-site CTAs.
- État actuel de la corroboration tierce, d'après llms.txt : Trustpilot (4.9/5), Sortlist France, 2 mentions presse (Le Dauphiné Libéré, Université Savoie Mont Blanc). C'est un bon socle mais étroit :
  - Aucune présence YouTube détectée (signal le plus corrélé — absent).
  - Aucune mention Reddit détectée.
  - Aucune entité Wikipedia (normal pour une petite agence, mais un article Wikidata/annuaire structuré pourrait aider).
  - LinkedIn société présent (`linkedin.com/company/msd-media`) mais pas d'analyse de son activité/mentions.
- Recommandation : garder la section ai-proof pour la conversion, mais ne pas la considérer comme une action GEO — investir plutôt dans la diversification des mentions tierces (annuaires sectoriels, interviews, présence vidéo/YouTube, avis Google Business Profile en plus de Trustpilot).

## 5. Structured data — complétude

- `FAQPage` : présent sur homepage et sur `agence-web-annecy/index.html`. Bon.
- `LocalBusiness` : présent sur `agence-web-annecy/index.html` (adresse complète avec streetAddress, telephone, email, hasMap, openingHoursSpecification, priceRange, aggregateRating, 7 reviews détaillées, areaServed incluant communes limitrophes). Complet et solide.
- Sur la **homepage** (`index.html`) en revanche :
  - Le schema principal est `@type: Organization` (pas `LocalBusiness`), avec adresse complète mais **sans telephone, sans geo, sans openingHours**.
  - Un second bloc auto-généré (`schema-localbusiness-auto`) type `LocalBusiness` existe bien en fin de `<head>`, avec `geo` (lat/long) et `priceRange`, mais **sans telephone, sans FAQPage, sans reviews** — schema dupliqué/fragmenté entre deux blocs distincts plutôt qu'un seul `@graph` cohérent avec `@id` partagé. Un parseur IA peut interpréter ça comme deux entités distinctes plutôt qu'une seule fusionnée (le bloc Organization a `@id`, le bloc LocalBusiness auto n'en a pas).
  - **Incohérence factuelle notable : `numberOfEmployees: 30`** apparaît deux fois sur la homepage (Organization schema ligne ~288 et LocalBusiness auto ligne ~444). Ceci contredit frontalement le positionnement "fondateur développeur-consultant unique, un seul interlocuteur" affiché dans llms.txt et dans le discours marketing du site. Un LLM qui croise le schema et le contenu textuel peut soit halluciner "agence de 30 personnes", soit détecter l'incohérence et perdre confiance dans l'exactitude des données structurées du site. **À corriger en priorité** (probablement une valeur par défaut du script de génération de schema auto, à mettre à 1 ou à retirer).

## 6. Cohérence des faits clés pour consommation LLM

- **Date de fondation** : `foundingDate: "2025-06"` dans le schema Organization de `a-propos/index.html`, et texte "MSD Media a été fondée en juin 2025 à Annecy par Maxens Soldan" répété à l'identique sur `a-propos/index.html` (x2) et `blog/articles/combien-coute-landing-page-annecy-2026/index.html`. Cohérent, jamais "2026". Bon point.
  - **MAIS** : le FAQPage de `agence-web-annecy/index.html` ET `agence-web-lyon/index.html` contient la phrase "plus de 30 clients accompagnés **depuis 2024**" — antérieure à la fondation réelle (juin 2025) et incohérente avec le reste du site. C'est une contradiction factuelle directe, exactement le type d'erreur qui peut faire qu'un LLM cite une mauvaise date de création ou doute de la fiabilité de la source. **Contradiction à corriger sur au moins 2 pages** (probablement plus, si le pattern FAQ "meilleure agence web à [ville]" est dupliqué sur toutes les pages villes — à vérifier sur agence-web-chambery, -geneve, -strasbourg etc.).
  - Un exemple hypothétique "fondée en 2023" apparaît dans `blog/articles/apparaitre-chatgpt-perplexity-google-ia/index.html` mais c'est un exemple pédagogique explicite ("Un article qui commence par...") et non une affirmation sur MSD Media — non problématique tel quel, mais risqué si un LLM l'extrait hors contexte comme une date réelle. À surveiller.
- **Fondateur** : Maxens Soldan, cohérent partout (llms.txt, schema Organization x3 pages vues, a-propos, sameAs LinkedIn + presse).
- **Services** : cohérents entre llms.txt et schema (landing pages, sites vitrines, refonte, SEO local, GEO).
- **Zone de service** : cohérente (France, Suisse, Belgique ; Annecy comme siège) mais l'`areaServed` de la homepage inclut curieusement "City: Strasbourg" au même niveau que "City: Annecy" sans mention de Lyon, Chambéry etc. pourtant citées dans llms.txt et le footer — schema `areaServed` incomplet/arbitraire par rapport au maillage réel de pages villes du site.
- **Bureau Munich** mentionné dans le footer (`footer-office-card` "Munich, Bavière, Allemagne") mais absent de tout schema, de llms.txt, et de la zone de service déclarée (France/Suisse/Belgique uniquement). Incohérence à clarifier : soit c'est un vrai bureau et il doit apparaître dans llms.txt/schema, soit c'est un reliquat à supprimer.

## Score de citabilité détaillé

/10 — 7/10 (JSON-LD FAQ excellent, mais absence de paragraphe définitionnel direct en haut de la page pilier Annecy, et incohérences factuelles qui fragilisent la fiabilité perçue par les LLM).

## Recommandations priorisées

1. **[Effort faible, impact élevé] Corriger l'incohérence "depuis 2024" vs fondation juin 2025** dans les FAQPage de `agence-web-annecy/index.html`, `agence-web-lyon/index.html` et vérifier toutes les autres pages villes (`agence-web-chambery`, `-geneve`, `-strasbourg`, etc.) pour le même pattern de phrase dupliquée.
2. **[Effort faible, impact élevé] Corriger `numberOfEmployees: 30`** sur la homepage (schema Organization + schema-localbusiness-auto) pour refléter la réalité (fondateur unique / solo), ou retirer le champ. Contradiction directe avec le positionnement marketing "un seul interlocuteur".
3. **[Effort faible, impact moyen] Ajouter un paragraphe de définition directe juste après le H1** de `agence-web-annecy/index.html` : "MSD Media est une agence web à Annecy qui crée des sites internet et landing pages sur mesure, livrés en 14 jours..." — reprendre le pattern déjà utilisé dans le blog `combien-coute-landing-page-annecy-2026`.
4. **[Effort moyen, impact moyen] Fusionner les schemas de la homepage** en un seul `@graph` cohérent avec `@id` partagé (actuellement Organization à la main + LocalBusiness auto-généré séparés), ajouter telephone/openingHours au schema principal, et clarifier/supprimer la mention "Munich" incohérente avec l'`areaServed` déclaré.
5. **[Effort moyen-élevé, impact élevé sur citation IA] Diversifier la corroboration tierce** au-delà de Trustpilot/Sortlist/2 articles presse : présence YouTube (signal le plus corrélé aux citations IA, ~0.737), mentions Reddit, avis Google Business Profile, annuaires sectoriels additionnels. La section #ai-proof est un bon outil de conversion mais n'a aucun effet sur la probabilité de citation par les IA — ne pas la confondre avec une action GEO.
