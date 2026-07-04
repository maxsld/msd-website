# Audit Google API — msd-media.com — 2026-07-04

Source : Google Search Console (`sc-domain:msd-media.com`) + GA4 (property `542344354`) via service account, script `seo-reports/tmp-audit-google-pull.mjs`.
Fraîcheur des données : GSC = décalage 2-3 jours (fenêtres calées en conséquence) ; GA4 = décalage 1 jour.

---

## 1. Requête cible "agence web annecy" — position et tendance

| Fenêtre | Dates | Clics | Impressions | CTR | Position moyenne |
|---|---|---|---|---|---|
| 14 derniers jours | 2026-06-18 → 2026-07-01 | 0 | 34 | 0 % | **29,35** |
| 14 jours précédents | 2026-06-04 → 2026-06-17 | 0 | 34 | 0 % | **30,15** |
| Cumul 28 jours | 2026-06-06 → 2026-07-01 | 0 | 65 | 0 % | 29,3 |

**Verdict : quasi stagnation.** Le correctif de maillage interne du 23/06/2026 (9 ancres exactes vers la page pilier) a produit un gain de **0,8 position** (30,15 → 29,35) sur les 14 jours suivants — un mouvement dans le bruit statistique, pas un signal fort. La page reste en page 3 de résultats, loin de l'objectif #1. À 0 clic sur les deux fenêtres malgré 34 impressions chacune, aucun trafic n'est généré par cette requête pour l'instant.

## 2. Cannibalisation confirmée sur "agence web annecy"

Ventilation par page (28 jours, requête exacte "agence web annecy") :

| Page | Impressions | Position moyenne |
|---|---|---|
| `https://msd-media.com/` (homepage) | 27 | **14,0** |
| `https://msd-media.com/agence-web-annecy/` (page pilier visée) | 38 | **40,2** |

**Le problème est confirmé et il est pire qu'anticipé** : la homepage se positionne bien mieux (pos. ~14) que la page pilier dédiée `agence-web-annecy/` (pos. ~40) sur la requête exacte. Google hésite entre les deux URLs et pénalise la page cible. La position moyenne blended (~29) masque cet écart : le maillage interne du 23/06 a peut-être renforcé le signal vers `agence-web-annecy/` en originant du contenu, mais Google continue de préférer la homepage pour cette requête précise. Il faut soit désambiguïser clairement l'intention (title/H1/contenu de la homepage vs page pilier), soit envisager un `rel=canonical` implicite via contenu radicalement différencié, et probablement du netlinking externe pour trancher en faveur de la page pilier (cf. ACTION-PLAN.md H1).

Aucune autre des 11 pages Annecy ciblées (creation-site-web-annecy, landing-page-annecy, seo-local-annecy, refonte-site-web-annecy, audit-seo-annecy, faq-seo-annecy, glossaire-web-seo-annecy, creation-site-vitrine-annecy, creation-site-internet-annecy, agence-web-annecy-le-vieux) ne reçoit d'impressions sur "agence web annecy" — la cannibalisation est strictement à deux (homepage vs page pilier).

## 3. Page-level 28 jours — 11 pages cibles Annecy

| Page | Clics | Impressions | CTR | Position |
|---|---|---|---|---|
| agence-web-annecy/ | 1 | 244 | 0,41 % | 24,3 |
| audit-seo-annecy/ | 0 | 128 | 0 % | 8,9 |
| seo-local-annecy/ | 0 | 15 | 0 % | 1,8 |
| agence-web-annecy-le-vieux/ | 0 | 9 | 0 % | 6,1 |
| refonte-site-web-annecy/ | 0 | 5 | 0 % | 17,4 |
| landing-page-annecy/ | 0 | 4 | 0 % | 14,8 |
| creation-site-web-annecy/ | 0 | 3 | 0 % | 10,7 |
| creation-site-internet-annecy/ | 0 | 0 | — | — |
| creation-site-vitrine-annecy/ | 0 | 0 | — | — |
| faq-seo-annecy/ | 0 | 0 | — | — |
| glossaire-web-seo-annecy/ | 0 | 0 | — | — |

Constat : `audit-seo-annecy/` et `seo-local-annecy/` performent très bien en position (8,9 et 1,8) mais sur des requêtes de niche (audit seo annecy, visibilité local annecy) sans lien direct avec "agence web annecy". 4 des 11 pages cibles n'ont **aucune impression** sur 28 jours (creation-site-internet-annecy, creation-site-vitrine-annecy, faq-seo-annecy, glossaire-web-seo-annecy) — signal potentiel de contenu trop fin, mauvaise indexation, ou absence totale de demande/maillage vers ces URLs.

Note complémentaire : plusieurs articles de blog Annecy (site-web-photographe-annecy, site-web-agence-immobiliere-annecy, site-web-architecte-annecy, etc.) génèrent beaucoup plus d'impressions (jusqu'à 158) que les pages de service elles-mêmes, ce qui dilue davantage l'autorité thématique "Annecy" loin de la page pilier.

## 4. Top 20 requêtes site-wide (28 jours, triées par clics)

| Requête | Clics | Impressions | CTR | Position |
|---|---|---|---|---|
| msd media | 16 | 54 | 29,63 % | 2,9 |
| maxens soldan | 1 | 42 | 2,38 % | 4,0 |
| agence seo chambery | 1 | 10 | 10,0 % | 22,1 |
| agence chatgpt strasbourg | 0 | 23 | 0 % | 21,3 |
| agence création landing pages | 0 | 15 | 0 % | 13,1 |
| agence création de landing page | 0 | 12 | 0 % | 13,9 |
| agence audit seo annecy | 0 | 11 | 0 % | 6,4 |
| agence création site web annecy | 0 | 8 | 0 % | 15,8 |
| agence audit seo annecy-le-vieux | 0 | 7 | 0 % | 5,1 |
| afxxxxxx | 0 | 6 | 0 % | 3,7 |
| agence creation site internet annecy | 0 | 5 | 0 % | 18,2 |
| agence de création landing page | 0 | 4 | 0 % | 10,2 |
| "agence de création web" | 0 | 1 | 0 % | 23 |
| agence .net strasbourg | 0 | 1 | 0 % | 19 |
| agence audit seo ville-la-grand | 0 | 1 | 0 % | 3 |
| agence communication suisse romande | 0 | 1 | 0 % | 62 |
| agence creation site internet chambery | 0 | 1 | 0 % | 25 |
| agence cro strasbourg | 0 | 1 | 0 % | 8 |
| agence création site internet strasbourg | 0 | 1 | 0 % | 13 |
| agence de creation de site internet annecy | 0 | 1 | 0 % | 28 |

Seule la requête de marque "msd media" génère un volume de clics significatif (16). Toutes les requêtes génériques listées (y compris les variantes Annecy) sont à 0 clic malgré des impressions parfois notables — cohérent avec des positions moyennes de 6 à 30+ sur des mots-clés à forte concurrence commerciale.

## 5. Top 20 pages site-wide (28 jours, triées par clics)

| Page | Clics | Impressions | CTR | Position |
|---|---|---|---|---|
| / (homepage) | 22 | 348 | 6,32 % | 9,4 |
| /en/ | 6 | 243 | 2,47 % | 7,0 |
| /agence-web-paris/ | 2 | 146 | 1,37 % | 16,3 |
| /agence-web-nantes/ | 2 | 89 | 2,25 % | 9,9 |
| /blog/articles/meilleures-agences-cro-france/ | 2 | 34 | 5,88 % | 4,7 |
| /agence-web-annecy/ | 1 | 244 | 0,41 % | 24,3 |
| /agence-web-chambery/ | 1 | 187 | 0,53 % | 21,2 |
| /blog/articles/site-web-photographe-annecy/ | 1 | 158 | 0,63 % | 21,1 |
| /a-propos/ | 1 | 82 | 1,22 % | 5,1 |
| /agence-web-rennes/ | 1 | 80 | 1,25 % | 11,5 |
| /etudes-de-cas/ | 1 | 69 | 1,45 % | 21,6 |
| /blog/articles/site-web-therapeute-annecy/ | 1 | 51 | 1,96 % | 9,0 |
| /recrutement/ | 1 | 36 | 2,78 % | 12,5 |
| /blog/articles/site-web-medecin-strasbourg/ | 1 | 19 | 5,26 % | 6,3 |
| /blog/articles/schema-org-donnees-structurees-ia/ | 1 | 12 | 8,33 % | 6,7 |
| /landing-page-chambery/ | 1 | 3 | 33,33 % | 2,7 |
| /landing-page-bordeaux/ | 1 | 2 | 50,0 % | 5,0 |
| /affiliation/ | 0 | 24 | 0 % | 8,6 |
| /agence-web-alsace/ | 0 | 10 | 0 % | 8,1 |
| /agence-web-annecy-le-vieux/ | 0 | 9 | 0 % | 6,1 |

La homepage domine largement les clics et impressions. `agence-web-annecy/` est la page avec le plus d'impressions parmi les pages de service villes (244) mais son CTR (0,41 %) et sa position (24,3 en cumul 28j) restent faibles — cohérent avec la cannibalisation identifiée en section 2.

## 6. Signal d'indexation : pages avec impressions vs sitemap

- URLs déclarées dans `sitemap.xml` : **145**
- Pages ayant reçu au moins 1 impression Google Search (28 jours) : **128**
- Total clics cumulés sur ces 128 pages : **46**
- Total impressions cumulées : **4 792**

Écart de 17 pages (145 − 128) : cela ne veut pas dire que ces 17 pages ne sont pas indexées (une page peut être indexée sans jamais apparaître dans les résultats sur 28 jours si son volume de requête est nul ou si elle est trop récente/profonde). Une inspection URL page par page serait nécessaire pour confirmer le statut d'indexation exact (hors scope de ce tier de credentials — nécessiterait `gsc_inspect.py`/URL Inspection API en lot).

## 7. GA4 — trafic organique 28 jours vs 28 jours précédents

**ANOMALIE CRITIQUE — données GA4 non exploitables.**

| Fenêtre | Dates | Sessions totales (tous canaux) | Sessions "Organic Search" |
|---|---|---|---|
| 28 derniers jours | 2026-06-06 → 2026-07-03 | **3** | 0 (aucune ligne "Organic Search" retournée) |
| 28 jours précédents | 2026-05-09 → 2026-06-05 | non testé isolément (voir ci-dessous) | 0 |

Détail de la vérification : une requête GA4 sans filtre de dimension sur la fenêtre 2026-06-06 → 2026-07-03 retourne **3 sessions au total, toutes attribuées au canal "Direct"**. Un contrôle élargi à 90 jours (2026-04-05 → 2026-07-03) confirme : un seul canal remonté ("Direct", 3 sessions), aucun "Organic Search", "Paid Search", etc. Ce volume est manifestement incohérent avec les 4 792 impressions / 46 clics Search Console sur la même période.

Causes possibles à vérifier en priorité : (a) `GA4_PROPERTY_ID` (`542344354`) pointant vers une propriété de test/vide ou différente du site de production, (b) tag GA4 cassé/dépublié sur le site, (c) filtre de données internes trop large excluant tout le trafic, (d) mauvais compte de service sans accès à la bonne vue de données. **Aucun chiffre de trafic organique ni de top pages d'atterrissage organiques fiable ne peut être rapporté tant que cette anomalie n'est pas résolue.** Recommandation : vérifier manuellement dans l'interface GA4 (Rapports > Temps réel + Acquisition) que le tag reçoit bien des événements, et confirmer l'ID de propriété avec GA4 Admin > Détails de la propriété.

---

## Scripts et fichiers

- Script de pull (non committé, à supprimer ou déplacer si besoin) : `seo-reports/tmp-audit-google-pull.mjs`
- Scripts de diagnostic GA4 : `seo-reports/tmp-ga-check.mjs`, `seo-reports/tmp-ga-check2.mjs`
- Données brutes JSON : `seo-reports/tmp-audit-google-raw.json`
