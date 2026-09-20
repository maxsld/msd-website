# Audit SEO — msd-media.com (PARTIEL)

Date : 2026-09-20
Statut : **incomplet** — 7 agents spécialisés interrompus par une limite de session API.
Ce document ne contient que les vérifications faites en direct, toutes reproductibles.

Audits précédents : 2026-07-09 (60/100), 2026-06-25 (66/100).
Note : le site est passé de 188 à 138 pages HTML et de 87 à 70 articles depuis juillet — une consolidation a donc déjà eu lieu.

---

## Données GSC de référence (16 mois, fournies par le client)

| Métrique | Valeur |
|---|---|
| Clics | 841 |
| Impressions | 48 600 |
| CTR | 1,7 % |
| Position moyenne | 22 |

Répartition :
- Marque (« msd media », « maxens soldan »…) : **416 clics = 49,5 %**
- Page d'accueil : **552 clics = 66 %**
- Non-marque hors home : **~290 clics sur 16 mois**, soit ~18/mois
- France : 72 % des impressions · **USA : 5 190 impressions pour 1 clic (CTR 0,02 %)**
- Desktop : 82,9 % des impressions, CTR 1,4 % · Mobile : 16,7 %, CTR 3,37 %

---

## VÉRIFIÉ — Ce qui est sain

### Canonicals : 135/135
Toutes les pages réelles portent un `rel="canonical"` en `https://msd-media.com` (non-www).
Zéro canonical vers www, zéro en http. Les 3 fichiers sans canonical sont des templates
dans `scripts/templates/`, ce qui est correct.

### robots.txt
Crawlers IA explicitement autorisés : GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot,
Claude-SearchBot, anthropic-ai, PerplexityBot, Google-Extended, CCBot, Applebot-Extended.
Deux sitemaps déclarés. Rien ne bloque l'accès.

### Headers de sécurité (vercel.json)
HSTS `max-age=63072000; includeSubDomains; preload`, CSP complète, X-Content-Type-Options,
X-Frame-Options, Referrer-Policy, Permissions-Policy. Rien à redire.

### Schema.org
349 blocs JSON-LD, **100 % valides syntaxiquement**, sur 129 des 135 pages.
Types principaux : 584 Question/Answer, 220 Organization, 157 WebPage, 135 Person,
116 BreadcrumbList, 110 FAQPage, 82 Article, 36 Service, 25 LocalBusiness.

### Redirections des anciennes URLs
`/ville/annecy/`, `/website/annecy/`, `/pages/annecy-innovation/`, `/creation-site-internet-annecy/`
renvoient toutes en 308 vers `/agence-web-annecy/`. La cannibalisation historique visible
dans GSC provient d'URLs déjà traitées — c'est de l'historique sur 16 mois, pas un problème actif.

---

## VÉRIFIÉ — Les problèmes

### P1 — `www` redirige en 307 (temporaire) au lieu de 301
```
https://www.msd-media.com/  →  HTTP 307  →  https://msd-media.com/
server: cloudflare · cf-ray présent
```
La règle dans `vercel.json` est pourtant correcte (`permanent: true`) :
```json
{"source":"/(.*)","has":[{"type":"host","value":"www.msd-media.com"}],
 "destination":"https://msd-media.com/$1","permanent":true}
```
Elle ne s'applique pas. Cause : **`www.msd-media.com` n'est pas rattaché au projet Vercel**
(un seul domaine listé : l'apex). Le sous-domaine www pointe vers Cloudflare
(188.114.97.3 / 188.114.96.3) qui émet le 307, tandis que l'apex est servi directement
par Vercel (64.29.17.65 / 216.198.79.65).

**Le correctif est dans Cloudflare, pas dans le repo.** Passer la Redirect Rule de 307 à 301.

Impact réel : **limité**, car les canonicals pointent tous vers non-www et compensent.
Cela explique la home splitée en 3 lignes dans GSC (379 + 165 + 8 clics) mais ne dilue
probablement pas le ranking.

### P2 — Chaînes de redirection à 2 sauts
```
http://www.msd-media.com  →308→  https://www.msd-media.com  →307→  https://msd-media.com
/blog/articles/landing-page-vs-site-web.html  →308→  /landing-page-vs-site-web/  →308→  /landing-page-vs-site-web-guide-complet/
```

### P3 — 110 pages FAQPage pour zéro résultat enrichi
Le rapport GSC « Apparence dans les résultats » ne contient qu'une ligne :
« Extraits de produits, 3 impressions, 0 clic ».

Le schema est valide, mais **Google a déprécié les rich results FAQPage en août 2023** :
ils ne s'affichent plus que pour les sites gouvernementaux et de santé faisant autorité.
Les 584 blocs Question/Answer et les 110 FAQPage ne produisent donc aucun résultat enrichi.
HowTo (2 pages) a été supprimé entièrement par Google pour les mêmes raisons.

Ce n'est pas un bug à corriger — c'est un investissement à ne pas prolonger.

### P4 — Source du « Extraits de produits »
`tarifs/index.html` déclare un `OfferCatalog` avec 3 `Offer` (1990 €, 3990 €, sur-mesure).
C'est ce qui génère la ligne Product dans GSC. Usage légitime pour des services.
À noter : la page `/tarifs/` ne totalise que 32 impressions et 0 clic en 16 mois.

### P5 — Pages villes à ~50 % de contenu templaté
15 pages `agence-web-[ville]`, 908 à 1302 mots chacune.

Mesure par 8-grammes (part de contenu présent sur une seule page) :

| Page | Contenu unique |
|---|---|
| agence-web-annecy | 63,9 % |
| agence-web-lyon | 60,5 % |
| agence-web-paris | 53,3 % |
| agence-web-strasbourg | 52,9 % |
| agence-web-bordeaux | 50,6 % |
| … | ~49 % |
| agence-web-rennes | **46,4 %** |

Similarité réelle mesurée Clermont-Ferrand ↔ Rennes : **57,8 %**.

Environ la moitié de chaque page est du boilerplate partagé. Ce n'est pas du doorway page
caractérisé (qui serait à 90 %+), mais c'est insuffisant pour se différencier — et ça se
voit dans les positions : ces pages sont toutes entre 15 et 45.

---

## NON VÉRIFIÉ — ce qui reste à faire

Les agents suivants ont été interrompus avant de rendre quoi que ce soit :

| Agent | Mission | Priorité |
|---|---|---|
| seo-sxo | **Pourquoi ~2 500 impressions en position 1–8 donnent 0 clic** (AI Overview ? pack local ? titles ?) | **La plus haute** |
| seo-local | GBP, NAP, citations, avis — pourquoi le local est en position 41 à 86 | Haute |
| seo-google | URL Inspection, CrUX, PageSpeed, GA4, requêtes position 8–20 | Haute |
| seo-geo | Part réelle des impressions IA vs humaines (piste des 5 190 impressions US) | Moyenne |
| seo-content | Titles/metas des 20 pages les plus impressionnées, E-E-A-T | Moyenne |
| seo-technical | Sitemap, profondeur de clic, hreflang FR/EN | Moyenne |
| seo-schema | Cohérence des @id d'entité | Basse |

---

## Les deux anomalies à expliquer en priorité

### 1. Des positions 1 à 8 qui ne rapportent aucun clic

| Requête | Impressions | Clics | Position |
|---|---|---|---|
| agence création landing page performance | 879 | 0 | 5,1 |
| création landing page clermont | 325 | 0 | **1,7** |
| agence landing page rennes | 257 | 0 | 3,2 |
| référencement naturel annecy | 249 | 0 | 7,0 |
| maintenance site internet annecy | 154 | 0 | 3,7 |
| refonte site internet annecy | 145 | 0 | 4,2 |
| audit seo annecy | 128 | 0 | 2,6 |
| audit de site annecy | 84 | 0 | 1,7 |

~2 500 impressions en top 8, zéro clic. La position n'est pas le facteur limitant ici.

### 2. Le local échoue là où le national réussit

| Cluster | Position |
|---|---|
| « agence landing page » (national) | 5 à 14 |
| agence web annecy | 41,5 |
| agence digitale annecy | 63,6 |
| creation site internet annecy | 65,2 |
| agence seo annecy | **85,8** |
| agence web chambéry | 62,3 |

12 pages live ciblent Annecy. Aucune ne passe sous la position 40 sur les requêtes
principales. Hypothèse dominante à vérifier : absence ou non-optimisation de la fiche
Google Business Profile.

---

*Rapport partiel. Aucun score global n'est calculé : trop de catégories manquent.*
