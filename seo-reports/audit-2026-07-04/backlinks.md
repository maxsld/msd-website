# Backlink Profile — msd-media.com (Annecy)
Date: 2026-07-04 | Target goal: #1 on "agence web annecy"

## 0. Credentials / Tooling Check

- `scripts/backlinks_auth.py`, `commoncrawl_graph.py`, `moz_api.py`, `bing_webmaster.py`,
  `verify_backlinks.py`: **none of these scripts exist in this repository** — confirmed via
  filesystem search. No Moz / Bing / DataForSEO keys configured.
- **Tier: 0** (Common Crawl raw index only, queried directly via CDX API, confidence: 0.50).
- **No WebSearch tool was available in this session**, and programmatic scraping of DuckDuckGo
  HTML search was attempted and blocked by an anti-bot challenge (captcha wall) — so items 2 and 3
  of the brief (live citation search, competitor backlink discovery) could **not be executed live**.
  Everything below labeled "knowledge-based" is analyst domain knowledge about the French local-SEO
  directory landscape, not a verified live search result, and should be spot-checked manually or via
  a proper WebSearch-enabled session before acting on specific claims (e.g. "Competitor X is listed on
  Sortlist").

## 1. Common Crawl Findings (confidence: 0.50, domain-level, quarterly freshness)

- Queried `CC-MAIN-2026-25-index` (June 2026 crawl, latest available) via the public CDX API.
- Result: **46 of msd-media.com's own URLs** are present in the CC index (e.g. `/`, `/agence-web-annecy/`,
  `/agence-web-bordeaux/`, `/agence-web-chambery/`, `/affiliation/`, etc.) — confirms the site is being
  crawled and picked up by a major web crawler, consistent with a launch ~June 2025 site that has since
  been actively publishing content.
- **No prior crawls (2025 snapshots) returned any captures** for msd-media.com — the domain doesn't
  appear in earlier CC indexes, consistent with a young domain.
- **Important limitation**: the CDX/URL Index API only lists a domain's *own* pages, it does **not**
  provide inbound links or referring domains. The CC Web Graph dataset (which does model domain-to-domain
  links) is distributed as large graph/rank files on S3 and is not queryable via a simple API call within
  a few minutes — per the task's own time-box instruction, this was not pursued further and is reported
  as skipped/infeasible rather than guessed at.
- **Net result: zero referring-domain data obtained for msd-media.com from any source in this session.**

## 2. Referring Domains / Citations for msd-media.com

**Not determined.** No working search tool was available to find real citations, directory listings,
or press mentions. Do not assume msd-media.com has zero backlinks — this is genuinely unknown from this
session's tooling; it is only known that no data source *available here* could confirm any.

## 3. Competitor Gap Analysis

**Not determined live.** Could not identify or verify which agencies currently rank top 5 on
"agence web annecy" nor pull their real directory/press citations. Any competitor names or specific
directory listings would be speculation and are intentionally omitted to avoid presenting guesses as facts.

**Recommendation**: re-run this analysis with a WebSearch-enabled agent/session (or with DataForSEO/Moz
credentials configured) to get: (a) actual current top-5 SERP for "agence web annecy", (b) each
competitor's Moz DA / referring-domain count, (c) their known directory citations. That data is the
single highest-value missing input for deciding whether backlinks are the ranking bottleneck.

## 4. Backlink Health Score

**INSUFFICIENT DATA — no numeric score produced.** Per protocol, fewer than 4 of the 7 scoring factors
have any data (only "domain crawled by CC" is confirmed; referring-domain count, quality distribution,
anchor text, toxic ratio, velocity, follow/nofollow, geo relevance are all unscored). Producing a number
here would be misleading.

## 5. Pragmatic Link-Building Shortlist (knowledge-based, not live-verified — verify each before pursuing)

For a young (founded June 2025), Annecy-based web agency, these are the standard, attainable link
sources for this vertical/geography. Effort and value are analyst estimates; confirm actual submission
requirements and current domain metrics before investing time.

| # | Source | Type | Effort | Expected value |
|---|--------|------|--------|-----------------|
| 1 | Google Business Profile + citation consistency (NAP) on Pages Jaunes, Yelp FR, Ave... | Local citation | Low | High for local pack, indirect for organic |
| 2 | CCI Haute-Savoie / CCI Annecy member directory | Local business directory | Low | Medium (trusted .fr, local relevance) |
| 3 | Sortlist (agency marketplace, France) | Directory/marketplace | Medium (profile + reviews) | Medium-High (DA, industry relevance) |
| 4 | CodeurMax / Codeur.com agency directory | Directory | Low-Medium | Medium |
| 5 | La French Tech Annecy / Auvergne-Rhône-Alpes network | Community/association | Medium (membership) | Medium (local authority, event backlinks) |
| 6 | Local press: Le Dauphiné Libéré (édition Annecy), L'Essor Savoyard, actu.fr Annecy | Press | Medium-High (needs a story/press release, e.g. launch, hiring, local partnership) | High (strong local trust signal) |
| 7 | Partner/client testimonials with backlink to msd-media.com on client sites | Client backlinks | Low (ask existing clients) | Medium-High (contextual, relevant anchor) |
| 8 | BPI France / Réseau Entreprendre / Initiative Annecy (funding/incubation directories, if applicable) | Institutional directory | Medium | Medium |
| 9 | Local coworking spaces (e.g. La Turbine Annecy) — "our members" page | Local partner listing | Low | Low-Medium |
| 10 | Guest post / interview on French web-dev or freelance community blogs (e.g. Alsacreations forum signature, Malt profile, Codeur blog) | Community/guest content | Medium | Medium |
| 11 | Chamber of Commerce / Mairie d'Annecy "entreprises locales" listings (if such a page exists) | Institutional | Low | Low-Medium |
| 12 | Sponsor or exhibit at a local tech/business event (Annecy, Savoie) for a natural press/partner link | Event sponsorship | High | Medium-High |
| 13 | HTML/CSS or WordPress-focused directories (e.g. WPMarmite partner listings, if agency does WP work) | Niche tech directory | Low | Low |
| 14 | Malt / Comet freelance-agency profile with link to site | Marketplace profile | Low | Low-Medium |
| 15 | Case-study co-publication with a local client (client publishes "how we redesigned our site" post crediting msd-media.com) | Content partnership | Medium | Medium-High |

## 6. Bottom Line for the #1 "agence web annecy" Question

Cannot be answered definitively from this session — the tooling gap (no live search, no CC web-graph
access, no paid API) means the referring-domain situation for msd-media.com and its competitors is
**unknown, not "zero" or "low."** Given the site is ~1 year old and internal linking was just fixed,
the two most likely candidate bottlenecks are (a) content/on-page depth for the exact query and
(b) off-page authority — but distinguishing between them requires the missing competitor DA/referring-domain
comparison. Recommend prioritizing a follow-up run with WebSearch or Moz/DataForSEO access before
committing budget to a link-building campaign.
