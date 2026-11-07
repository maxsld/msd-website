# Outils de l'agence SEO

Deux boîtes à outils complètent les relevés du lundi (`seo-pilot/data/`). Elles servent à mieux décider, jamais à faire plus de modifications : les plafonds de `PROMPT.md` et les règles de `RULES.md` ne changent pas.

## 1. Skills Claude SEO (gratuits, dans `.claude/skills/seo*`)

Méthodes d'audit et d'analyse (source : claude-seo, licence MIT). Un agent les charge avec l'outil `Skill`, puis applique la méthode au fichier ou à la page qu'on lui a confiée.

| Skill | Pour quoi | Qui |
|---|---|---|
| `seo-technical` | Audit technique (exploration, indexation, sécurité, Core Web Vitals, rendu JS) | `technicien` |
| `seo-schema` | Vérifier et écrire le JSON-LD | `technicien`, `specialiste-ia`, `redacteur-integrateur` |
| `seo-sitemap` | Contrôle du `sitemap.xml` | `technicien` |
| `seo-hreflang` | Cohérence des pages `/en/` et des hreflang | `technicien` |
| `seo-images` | Textes alternatifs, poids, formats, CLS | `technicien` |
| `seo-geo` | Visibilité dans les réponses IA, passages citables, `llms.txt` | `specialiste-ia` |
| `seo-sxo` | Lire la page de résultats à l'envers : type de page attendu par Google, persona | `analyste-concurrence`, `specialiste-conversion` |
| `seo-page` | Analyse complète d'une seule page | `analyste-concurrence`, `relecteur-qualite` |
| `seo-content` | Qualité et E-E-A-T, contenu mince, lisibilité | `relecteur-qualite`, `responsable-editorial` |
| `seo-content-brief` | Brief d'article avec longueur par section | `responsable-editorial` |
| `seo-cluster` | Regrouper des mots-clés et le maillage hub / satellites | `responsable-editorial` (revue éditoriale) |
| `seo-local` | SEO local, fiche Google, cohérence NAP | `specialiste-ia` (audit d'entité) |
| `seo-drift` | Comparer les éléments SEO d'une page avant / après | `relecteur-qualite` |

Leurs scripts Python sont dans **`.claude/skills/seo/scripts/`** (pas dans `scripts/` du site). Avant le premier script du passage : `pip install -q requests beautifulsoup4 lxml validators trafilatura`. Les scripts qui demandent des identifiants Google, DataForSEO, Moz ou Bing ne marchent pas ici : on ne les lance pas (la Search Console arrive déjà par le relevé du lundi). Ces skills sont des outils : on ne les modifie jamais, comme tout le dossier `.claude/`.

## 2. OpenSEO (données payantes, connecteur MCP « OpenSEO »)

OpenSEO (openseo.so, alternative à Semrush et Ahrefs) donne des données que le relevé n'a pas : volumes et difficulté des mots-clés, pages de résultats Google réelles, mots-clés des concurrents, backlinks, classements Google Maps et visibilité dans les IA. Méthodes dans `.claude/skills/openseo-*` (licence MIT).

**Seul le chef de projet appelle OpenSEO** (les sous-agents n'ont pas le connecteur). Il passe les chiffres utiles dans le brief de l'agent concerné, en citant « OpenSEO, AAAA-MM-JJ ». Si les outils OpenSEO sont absents ou refusent l'accès, on continue sans eux, comme avant, et on l'écrit en une ligne dans le journal (pas dans le rapport Telegram).

### Chaque lundi (au plus 3 analyses payantes)
1. **Article de la semaine** (`openseo-keyword-research`) : volume, difficulté, intention et page de résultats de la requête du brief, plus 5 variantes au plus. Donne-les au `responsable-editorial` avant qu'il rédige. Une requête à volume nul et sans intérêt commercial : il change d'angle.
2. **Pages choisies** (`openseo-competitor-analysis`, une fois par page, 2 pages au plus) : qui se classe en tête sur la requête visée et ce qu'ils ont de plus. Donne-le à l'`analyste-concurrence`, qui le croise avec sa recherche web.

### Le 1er lundi du mois, en plus (au plus 4 analyses payantes)
3. **Paysage concurrentiel** (`openseo-competitive-landscape`) : agences qui prennent nos requêtes santé et Annecy, et les écarts de mots-clés. Va à la revue éditoriale du `responsable-editorial`.
4. **Backlinks** (`openseo-link-prospecting`) : nos domaines référents face à 2 concurrents, et 5 pistes de liens au plus. Une piste utile devient l'action « À toi » du mois (Maxens agit hors site, l'agence ne fait aucun netlinking).
5. **Visibilité IA** (`openseo-ai-visibility-audit`) : mentions et citations de MSD Media face aux concurrents. Va au `specialiste-ia`, en complément du relevé manuel de `IA-CITATIONS.md` (on ne compare que des relevés faits de la même façon).
6. **Local** (`openseo-local-seo`) : position dans Google Maps sur « agence web Annecy » et « création site internet Annecy ». Va au `specialiste-ia` pour l'audit d'entité.

### Garde-fous de dépense
- Avant chaque appel payant, lis le coût estimé que renvoie OpenSEO. **Plafond : 3 € par lundi ordinaire, 10 € le 1er lundi du mois.** Au-delà, tu t'arrêtes et tu le notes dans le journal.
- Jamais de suivi récurrent (suivi de positions, suivi de prompts IA, audit planifié) : ça facture chaque semaine sans toi. C'est Maxens qui les crée s'il les veut.
- Chaque passage qui dépense ajoute un résumé au journal de recherche du projet OpenSEO (`appendResearchLog`) et une ligne au journal : `OpenSEO : <analyses>, ~<coût>`.
- Au premier passage où OpenSEO répond, remplis le contexte du projet msd-media.com (`openseo-seo-project-setup`, outils gratuits `get_project_context` et `update_project_context`) à partir de `STRATEGY.md`, `KPIS.md` et des pages cibles, **sans poser de questions** : personne ne répond pendant le passage. S'il n'y a pas encore de projet, crée-le (`create_project`, domaine msd-media.com, France, français).
