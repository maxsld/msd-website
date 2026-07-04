# Local SEO Audit — MSD Media (msd-media.com)
Target query: "agence web annecy" (map pack + organic #1)
Date: 2026-07-04

## Business profile
- Type: Hybrid (visible street address + "areaServed" wording), but presented site-wide mostly as a remote/national agency ("clients France, Suisse, Belgique") rather than a local storefront.
- Legal entity: Maxens Soldan, entreprise individuelle, SIRET 988 083 416 00012, NAF 6201Z, created 16/06/2025. Confirmed on societe.com (auto-generated INSEE record, address "NC").
- Industry vertical: Home/professional services (web agency) — no dedicated schema subtype exists in schema.org; `LocalBusiness` (or `ProfessionalService`) is correct, currently used correctly.

## LocalBusiness schema — site-wide audit
Three different `LocalBusiness`/`Organization` blocks exist and are **inconsistent**:

| Property | Homepage `Organization` node | Homepage `schema-localbusiness-auto` | `/agence-web-annecy/` `LocalBusiness` node |
|---|---|---|---|
| Street address | — (city only) | — (city only) | 6 Rue Paul Guiton, 74000 Annecy ✓ |
| Phone | — | — | +33783141287 ✓ |
| Geo coordinates | — | 45.8992 / 6.1294 (4-decimal, not 5) | — (only in meta geo.position tag) |
| openingHoursSpecification | — | — | Mon–Fri 09:00–19:00 ✓ |
| aggregateRating | 4.9 / 7 reviews ✓ | — | 4.9 / 7 reviews ✓ |
| sameAs → GBP | none | none | none |
| Oddity | "numberOfEmployees": 30 on a solo micro-entreprise — factually false, risk of trust/spam signal | same 30-employee claim | — |

**Findings:**
1. No page contains a complete LocalBusiness object (address + phone + geo + hours + reviews all together). Google has to stitch fragments across two auto-injected schema blocks on the homepage plus a third on the Annecy page — brittle and duplicative (`@id` collision: two different LocalBusiness nodes share the exact `@id` `https://msd-media.com/#localbusiness` with different data — this is invalid/contradictory JSON-LD and should be fixed immediately).
2. Geo coordinates are 4-decimal precision, not the recommended 5-decimal (45.89920, 6.12940 needed for street-level precision).
3. `numberOfEmployees: 30` contradicts the public "micro-entreprise / entreprise individuelle" status stated in mentions légales — a glaring, easily-flagged inconsistency that could look like schema manipulation.
4. No `sameAs` link to a Google Business Profile / Maps place ID anywhere on the site.
5. No Google Maps embed (`<iframe>`) found on the homepage or the `/agence-web-annecy/` page — a basic, well-known GBP-reinforcement signal is entirely absent.

## NAP consistency
| Source | Name | Address | Phone |
|---|---|---|---|
| Footer (all pages) | MSD Media | 6 Rue Paul Guiton, 74000 Annecy, France | not shown in footer |
| Mentions légales | MSD Media | 6 rue Paul Guiton, 74000 Annecy | not shown |
| Contact page schema | MSD Media | (not checked in detail) | +33783141287 |
| /agence-web-annecy/ schema | MSD Media | 6 Rue Paul Guiton, 74000 Annecy | +33783141287 |
| Homepage schema (both blocks) | MSD Media | Annecy (city only, no street) | none |
| societe.com | (anonymized, "NC") | NC | — |

→ Name is consistent. Street address is consistent where it appears, but is **missing from the homepage schema and footer's visible phone number** (footer only shows an email, no clickable tel: link) — a weak signal for both users and Google. No GBP listing exists yet to compare against, so true NAP parity with a live Maps listing cannot be assessed (see limitations).

## Google Business Profile (GBP) — CRITICAL GAP
- No `sameAs` GBP/Maps URL, no embed, no "reviews on Google" widget anywhere on the site.
- Web searches for "MSD Media" + Annecy return only the msd-media.com pages, LinkedIn, a university article, Le Dauphiné article, and a Sortlist profile — **no evidence of an indexed/claimed Google Business Profile**.
- Given Whitespark 2026 data, primary GBP category is the #1 local ranking factor and proximity alone explains 55% of ranking variance — **without a claimed, categorized, review-active GBP, MSD Media cannot appear in the map pack at all**, regardless of on-page/schema quality. This is the single largest gap found.
- Competitors surfacing for "agence web annecy" in search (Wecomeback, Maison du Net, Netdev, Pure Illusion, World Wild Web, Novaris, Savana Web, Coq Web) are established local agencies that likely have active, reviewed GBP listings — could not be verified live (Maps data blocked from automated fetch in this environment; needs manual check or DataForSEO `local_business_data`).

## Reviews & reputation
- On-site: Trustpilot badge linked (fr.trustpilot.com/review/msd-media.com), 4.9/5 from 7 reviews, mirrored in schema `aggregateRating` + 6+ individual `Review` objects with named authors on the Annecy page and homepage Organization node.
- Trustpilot page itself returned 403 to automated fetch — count/recency of reviews could not be independently verified beyond what's embedded in the site's own schema.
- 7 total reviews is low volume and, per the "18-day rule," review *velocity* (not just count) drives ranking stability — with zero GBP reviews, there is currently no velocity signal Google can use for local ranking at all. Trustpilot reviews do not feed Google Maps ranking.
- No review responses visible/markup — cannot assess response rate.

## Citations
- **Confirmed:** societe.com (auto INSEE listing, address withheld), Sortlist agency profile (linked in schema sameAs), Le Dauphiné press mention, LinkedIn company page.
- **Not found / likely missing:** Google Business Profile, PagesJaunes (fetch blocked/403, no evidence in search results either), BBB-equivalent (not applicable in France), other French agency directories (agences-web.fr, CodeurMax, Kompass, Yelp France). These are standard Tier-1/Tier-2 local citations competitors in this niche typically hold.
- 3 of the top 5 AI-visibility ranking factors are citation-related — this is a compounding weakness alongside the missing GBP.

## Local content quality — /agence-web-annecy/
- Real local signals present: correct city name, nearby communes list (Annecy-le-Vieux, Cran-Gevrier, Seynod, Pringy, Meythet, Thônes, Rumilly, Saint-Julien-en-Genevois, Genève), local FAQ content, named case studies (Nation Startup, EM Motors, Aristoi Academia, Carroz Sports, HairTattoo).
- Missing: no embedded Google Map, no photographic/visual proof of a local presence (office photo, team-in-Annecy imagery), no mention of specific Annecy quartiers/landmarks beyond the commune list, no dedicated GBP "posts" or review-widget integration.
- Only one true local landing page (`/agence-web-annecy/`) plus several nearby-town variants (`agence-web-annecy-le-vieux`, `agence-web-chambery`, etc.) — not assessed for duplicate-content ratio in this pass; recommend a template-similarity check across these before scaling further.

## Local SEO Score: 42/100
| Dimension | Weight | Score | Notes |
|---|---|---|---|
| GBP Signals | 25% | 5/25 | No listing evidence, no embed, no sameAs |
| Reviews & Reputation | 20% | 10/20 | Good Trustpilot content but zero GBP review signal |
| Local On-Page SEO | 20% | 15/20 | Solid dedicated Annecy page, good FAQ/local terms |
| NAP Consistency & Citations | 15% | 6/15 | Consistent NAP but thin citation footprint |
| Local Schema Markup | 10% | 4/10 | Fragmented/contradictory LocalBusiness nodes, false employee count, low geo precision |
| Local Link & Authority Signals | 10% | 2/10 | Le Dauphiné + Sortlist only; limited local backlink diversity |

## Top 10 prioritized actions
1. **Critical** — Create and fully verify a Google Business Profile: category "Web Designer" or "Website Designer" as primary, service area = Annecy + Haute-Savoie communes, address 6 Rue Paul Guiton. This alone unlocks map-pack eligibility.
2. **Critical** — Fix the duplicate/contradictory `@id` (`#localbusiness`) across homepage and Annecy page; merge into a single canonical LocalBusiness object (or scope IDs per page) with full NAP + geo + hours in every instance.
3. **Critical** — Remove the false `numberOfEmployees: 30` claim; align schema with the real solo/micro-entreprise status to avoid trust and manual-action risk.
4. **High** — Start actively soliciting Google reviews from clients (target: 1+ review every ~2-3 weeks to satisfy the 18-day freshness rule); ask past clients already quoted on Trustpilot (Julian, Gerald Debaud, Pierre Aliaga, etc.) to cross-post on Google.
5. **High** — Add a real Google Maps embed + "View on Google" / GBP link (sameAs) on `/agence-web-annecy/` and the homepage.
6. **High** — Build out Tier-1/2 French citations: PagesJaunes, Kompass, agences-web.fr, CodeurMax, and any relevant Sortlist/La French Tech Annecy directories, ensuring identical NAP everywhere.
7. **Medium** — Add 5-decimal precision geo coordinates and street address to the homepage schema (currently city-level only).
8. **Medium** — Publish 2-3 additional dedicated service pages under the Annecy umbrella (e.g. "création site vitrine Annecy," "refonte site web Annecy" — several already exist, verify uniqueness) since dedicated service pages are the #1 local organic ranking factor.
9. **Medium** — Add visual local proof (photo of workspace/deliverables tied to Annecy, client logos with location) to the Annecy landing page to strengthen E-E-A-T and reduce "doorway page" risk.
10. **Low** — Add a phone `tel:` link and full NAP block to the site footer (currently email-only), improving crawlable consistency and mobile click-to-call.

## Limitations
- Live Google Maps/GBP data, local pack SERP positions, and Trustpilot's actual review count/dates could not be fetched directly (403s / no DataForSEO MCP tools available in this session) — findings on GBP existence are inferred from absence of evidence in site schema and general web search, not a live Maps API check.
- Competitor GBP review counts/categories were not verified live; recommend a manual Google Maps check or `local_business_data` via DataForSEO for a precise map-pack competitive gap analysis.
- PagesJaunes and Trustpilot pages returned HTTP 403 to automated fetching; presence/absence should be manually confirmed.
- Duplicate-content percentage across the 10+ nearby-city landing pages was not measured in this pass.
