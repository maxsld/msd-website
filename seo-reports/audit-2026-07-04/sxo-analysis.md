# SXO Analysis — "agence web annecy" (MSD Media currently ~position 28)

## 1. Target page audit — /agence-web-annecy/
- Page type: dedicated local landing page (service/local hybrid), correctly URL-slugged, canonical, hreflang.
- Title: "Agence Web Annecy | Création de Sites Web & Landing Pages SEO" — good keyword match.
- H1: "Agence web à Annecy : sites internet et landing pages SEO." — good.
- Schema: strong technical implementation — Organization, WebSite, WebPage, FAQPage (13 Q&A, including keyword-stuffed "meilleure agence" answers), LocalBusiness with address, areaServed (10 cities), aggregateRating (4.9/5, **7 reviews**, sourced from Trustpilot, not Google), 7 written reviews embedded, BreadcrumbList, Service schema.
- Content: hero, realisations carousel (9 projects but generic, not Annecy-specific case studies), 4-step process, video testimonials (4), founder video, FAQ, booking embed. Reasonably deep.
- Weak points: no Google Business Profile reviews/schema (only Trustpilot, 7 reviews), no named local team beyond solo founder, founded 2024 (2 years old), "+30 clients accompagnés" (small scale), no Annecy-specific case studies (all projects generic French/Swiss clients, not "for a business in Annecy").
- Structural conflict: the **homepage** (`index.html`) is titled "MSD Media | Agence Web & Landing Pages en France" — broad, national positioning — while every serious competitor's homepage IS their Annecy identity. This dilutes domain-level topical/entity signals for "Annecy."

## 2. SERP reality (WebSearch "agence web annecy" + "création site internet annecy")
Top 10 ranking domains: Pappleweb, Boondooa, Alpaweb, Cocliko, Farouk Nasri, Beaucoup Studio, Maison du Net (MDN), Aurone, Oeil Neuf, Sortlist (directory).

Fetched detail on Boondooa, Alpaweb, Cocliko, Pappleweb:
| Signal | Boondooa | Alpaweb | Cocliko | Pappleweb | **MSD (target)** |
|---|---|---|---|---|---|
| Founded | 2008 | 2009 | 2019 | 2012 | **2024** |
| Address | Annecy-le-Vieux | Chavanod (Annecy) | Annecy + Thonon | Thônes | Annecy |
| Named team | — | 2 founders named | 7 staff named | 5 collaborators | 1 founder |
| Social proof | — | — | **150 clients, 70+ Google reviews, 4.9/5** | 942 sites, 4.9/5 | 30 clients, **7 Trustpilot reviews** |
| Case studies | 4 local clients | 5 local clients w/ links | 5 logos + 5 video testimonials | 3 reviews | 9 generic projects, no local case study |
| Homepage vs subpage | Homepage IS Annecy | Hybrid homepage/local | Dedicated subpage, but homepage also Annecy-branded | Homepage | Dedicated subpage; **homepage is generic/national** |

**Pattern**: every top-ranking competitor is an established (5-17 year old) Annecy-headquartered agency whose entire domain identity is "Annecy," backed by high-volume Google (not third-party) review counts and real named local team/case studies. Ranking asset varies (homepage or subpage) — page format is NOT the primary mismatch.

## 3. Mismatch severity: MEDIUM-HIGH (entity/authority mismatch, not page-type)
On-page/technical SEO is actually ahead of most competitors (better schema, FAQ, structured data). The gap is **entity trust and tenure**: Google is reading this domain as a 2-year-old, nationally-positioned landing-page studio with thin review volume, competing against 8-17 year old Annecy-native agencies with 70+ Google reviews and dozens of named local clients. This is a classic "on-page optimized but off-page/entity-unconvincing" pattern — no amount of further on-page tweaking fixes it alone.

## 4. Persona check
- **Local business owner comparing agencies**: sees Trustpilot (7 reviews) vs Cocliko's 70+ Google reviews / "150 clients" — trust gap is immediate and visible.
- **Google's local-intent blend**: query has commercial-local intent (often triggers map pack). No GBP schema/citations detected on the page or evidence of an active, review-rich Google Business Profile — likely the single biggest missing local ranking signal (Google weighs GBP/Google reviews far more than Trustpilot for local packs and often for local organic too).

## 5. Highest-leverage fixes (ranked)
1. **Build and actively grow a Google Business Profile for the Annecy address, funnel all new reviews there (not Trustpilot), and add LocalBusiness schema `review`/`aggregateRating` sourced from Google.** This is the fastest lever to close the trust/authority gap that separates position ~28 from the top 10.
2. **Realign the homepage identity toward "agence web Annecy"** (or at minimum equal billing with "France"), since Google evaluates domain-level entity focus, and every top competitor's homepage doubles down on the local identity.
3. Add 2-3 genuine Annecy-based client case studies (not generic project mockups) with named local businesses, to match Cocliko/Alpaweb's local-proof pattern.
4. Publicize tenure/scale honestly but reframe supporting proof (e.g., emphasize growth trajectory, certifications, founder credentials) to offset the "young agency" signal until review volume grows.

## Limitations
- SERP snapshot based on WebSearch results (not live rank-tracked SERP scrape); map pack presence/composition and PAA boxes could not be directly observed via WebSearch tool.
- Competitor GBP review counts/status estimated from on-page claims, not verified directly against Google Maps/GBP API.
- Backlink/domain authority metrics (Ahrefs/Majestic) were not queried — authority comparison is inferred from tenure and on-page social-proof claims only.
