# Audit SEO complet — msd-media.com
Date : 2026-07-04 · Objectif : n°1 sur « agence web annecy » · Rapport uniquement, aucune modification effectuée

Sous-rapports : `google-data.md`, `sxo-analysis.md`, `local-seo.md`, `content-eeat.md`, `backlinks.md`, `geo-ai.md` (+ `technical-audit-2026-07-04.md` et trace Lighthouse du même jour, réutilisés).

---

## Score de santé SEO global : ~67/100

| Catégorie | Poids | Score | Note |
|---|---|---|---|
| Technique | 22% | 68 | Audit du matin ; fix CLS + headers sécurité en attente de déploiement |
| Contenu / E-E-A-T | 23% | 63 | Pilier Annecy 6.3/10 ; contradiction factuelle « depuis 2024 » |
| On-page | 20% | 75 | Plus sophistiqué que la plupart des concurrents (constat SXO) |
| Schema | 10% | 55 | 2 blocs LocalBusiness contradictoires même @id ; numberOfEmployees:30 faux |
| Performance | 10% | 65 | CLS 0,193 mobile, cause identifiée et corrigée (non déployé) |
| Préparation IA | 10% | 75 | llms.txt présent, crawlers autorisés ; contradictions factuelles à corriger |
| Images | 5% | 80 | Formats modernes, lazy loading OK |

---

## Verdict principal

**Le problème n'est pas l'optimisation on-page — elle est déjà meilleure que celle de la plupart des concurrents. Trois vrais blocages :**

### 1. Cannibalisation homepage ↔ page pilier (donnée GSC dure)
Sur la requête exacte « agence web annecy » :
- **Homepage : position 14,0** (27 impressions)
- **Page pilier /agence-web-annecy/ : position 40,2** (38 impressions)

Google préfère la homepage à la page prévue pour ranker. Le fix de maillage interne du 23/06 n'a produit que +0,8 position en 2 semaines (30,15 → 29,35 en moyenne pondérée) — dans le bruit statistique. 0 clic sur cette requête dans les deux fenêtres.

### 2. Absence totale de Google Business Profile (facteur local n°1)
- Aucune fiche GBP trouvée pour MSD Media — **impossible d'apparaître dans le map pack**, qui s'affiche au-dessus de l'organique sur cette requête.
- Concurrents top 10 (Boondooa, Alpaweb, Cocliko, Pappleweb…) : agences annéciennes de 5-17 ans d'ancienneté, 70+ avis Google (Cocliko : 4,9/5, 150 clients), études de cas locales nommées.
- Nos 7 avis sont sur Trustpilot — Trustpilot n'alimente pas le ranking Maps.
- Citations quasi inexistantes : societe.com (auto), Sortlist, LinkedIn, 1 mention presse. Pas de PagesJaunes, pas de Kompass, pas d'annuaires d'agences.

### 3. Incohérences factuelles dans les schemas (confiance entité + IA)
- FAQ schema pilier Annecy (et Lyon) : « clients accompagnés **depuis 2024** » alors que l'entreprise est **fondée en juin 2025** — impossible, marqueur de contenu IA de faible qualité, et c'est le passage le plus susceptible d'être cité par une AI Overview.
- `numberOfEmployees: 30` sur la homepage — faux (micro-entreprise solo), contradiction directe avec le positionnement « interlocuteur unique ».
- 2 blocs LocalBusiness avec le même `@id` mais des données différentes (l'un sans adresse/téléphone).

---

## Constats par domaine

### Données Google (GSC/GA4 live, 28 jours)
- /agence-web-annecy/ : 244 impressions (plus haut des pages service) mais CTR 0,41%
- 4 pages Annecy sur 11 à **zéro impression** : creation-site-internet-annecy, creation-site-vitrine-annecy, faq-seo-annecy, glossaire-web-seo-annecy
- Seule requête qui génère des clics réels : « msd media » (16 clics) — trafic de marque uniquement
- 128 pages avec impressions / 145 URLs sitemap
- ⚠️ **Anomalie GA4** : 3 sessions en 28 jours, toutes « Direct », zéro « Organic Search » — incohérent avec les 4 792 impressions / 46 clics GSC. Tracking GA4 probablement cassé (tag ou property ID) — à vérifier manuellement.

### SXO (lecture du SERP)
- Le format de page n'est PAS le facteur discriminant (des concurrents rankent avec des sous-pages)
- Le facteur discriminant : **ancienneté + avis Google + preuves locales nommées** — un déficit de confiance d'entité qu'aucune optimisation on-page ne compense

### Contenu / E-E-A-T (6,3/10)
- Pas de `dateModified` / signal de fraîcheur sur le pilier
- Structure hub défaillante : les 10 pages du cluster Annecy pointent vers le pilier, mais le pilier ne renvoie que vers 2 d'entre elles
- Preuve d'expérience limitée aux témoignages : aucune étude de cas chiffrée (client, résultat, delta mesurable) sur le pilier
- Duplication des 11 villes (C1) : frein de confiance au niveau domaine, mais pas un blocage direct pour Annecy (le cluster Annecy est bien différencié)

### GEO / IA (7,5/10)
- Base technique solide : crawlers IA autorisés, llms.txt + llms-full.txt présents et riches, HTML statique
- Manque un paragraphe définitionnel extractible juste après le H1 du pilier (« MSD Media est une agence web à Annecy qui… »)
- Les boutons « Demander à ChatGPT/Claude » n'influencent pas les citations LLM — c'est la corroboration tierce (annuaires, avis, presse) qui compte, et elle est mince

### Backlinks (données insuffisantes)
- Pas de crédentials Moz/DataForSEO ; Common Crawl ne donne que la présence du domaine (46 pages indexées juin 2026, cohérent avec un site jeune)
- Empreinte externe connue : Sortlist, LinkedIn, societe.com, 1-2 mentions presse (Le Dauphiné, article universitaire) — très en-deçà des concurrents

### Technique (audit du matin, 68-69/100)
- CLS mobile 0,193 : cause identifiée par trace Lighthouse (logo #ai-proof sans dimensions), **fix déjà dans le working tree**, en attente de déploiement
- Headers de sécurité restaurés dans vercel.json (`.htaccess` inerte sur Vercel), CSP à porter en Report-Only
- H4 : recrawl jamais déclenché (`node scripts/google-index.mjs` à lancer après déploiement)

---

## Feuille de route vers le n°1 (ordre de priorité)

### Semaine 1 — Fondations de confiance
1. **Créer et vérifier la fiche Google Business Profile** (catégorie « Web Designer », adresse 6 Rue Paul Guiton) — prérequis absolu au map pack. Puis viser ~1 avis Google toutes les 2-3 semaines (migrer l'effort d'avis de Trustpilot vers Google).
2. **Corriger les schemas** : supprimer « depuis 2024 » (Annecy + Lyon + autres villes), corriger/supprimer `numberOfEmployees: 30`, fusionner les 2 blocs LocalBusiness contradictoires, ajouter `sameAs` vers GBP/LinkedIn/Sortlist.
3. **Vérifier le tracking GA4** (3 sessions/28j = probablement cassé).
4. Déployer les fixes du jour (CLS + headers) puis lancer `node scripts/google-index.mjs`.

### Semaines 2-4 — Résoudre la cannibalisation
5. **Décision structurelle** : la homepage (pos. 14) est l'asset qui ranke. Deux options — (a) assumer la homepage comme page cible « agence web annecy » (title/H1 orientés Annecy plutôt que « France ») et faire du pilier une page d'appui, ou (b) désoptimiser la homepage sur cette requête au profit du pilier. L'option (a) est plus proche du pattern gagnant des concurrents (les agences locales rankent avec une identité domaine 100% Annecy).
6. **Renforcer le pilier** : paragraphe définitionnel après le H1, 1 étude de cas chiffrée locale, dateModified, liens sortants vers les 10 pages du cluster.

### Mois 1-3 — Autorité externe
7. **Citations Tier-1** : PagesJaunes, Kompass, CCI Haute-Savoie, annuaires d'agences (NAP identique partout).
8. **Presse locale** : Le Dauphiné (édition Annecy), L'Essor Savoyard, actu.fr — pitch fondateur local / études de cas clients.
9. **Backlinks clients** : liens contextuels depuis les sites livrés.
10. Continuer C1 (différenciation des 11 villes restantes) — chantier de fond qui décape le frein domaine.

### Réalisme
Les concurrents top 3 ont 5-17 ans d'ancienneté et 70+ avis Google. Le n°1 organique est un objectif 6-12 mois ; le **map pack est atteignable bien plus vite** (GBP + avis + citations) et capte l'essentiel des clics locaux en attendant.
