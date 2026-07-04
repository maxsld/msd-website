# Content Quality / E-E-A-T Audit — msd-media.com
Date: 2026-07-04 · Goal: #1 on "agence web annecy" · Scope: report only, no files modified

## 1. Pillar page — `agence-web-annecy/index.html`

- **Depth**: ~4,600 words of markup (substantial body copy, not thin). H1: "Agence web à Annecy : sites internet et landing pages SEO."
- **E-E-A-T signals present**: founder section with photo, LinkedIn link, first-person quote from Maxens Soldan; 6 named client testimonials (Julian, Gerald Debaud, Pierre Aliaga, Maxime Sciare, Zoltàn Mayer, Cédric Wyplata, Laurence Daien Maestripieri) embedded as schema Review objects; Trustpilot 4.9/5 cited; `author`/`founder` meta present; FAQPage schema block.
- **Factual accuracy issue (real, not cosmetic)**: the FAQPage answer states "plus de 30 clients accompagnés **depuis 2024**" while `a-propos/index.html` states MSD Media "a été fondée en **juin 2025**." A company founded in June 2025 cannot have served clients "since 2024." This is exactly the kind of inconsistency the Sept 2025 QRG flags as a low-quality/AI-authoring marker, and it undermines trustworthiness for both human reviewers and AI answer engines that will quote the FAQ text verbatim (it's the literal snippet most likely to be lifted for an AI Overview / ChatGPT citation, so the error is high-visibility).
- **Freshness**: no `datePublished`/`dateModified` schema found on the pillar page. No visible "last updated" signal — a missed freshness cue for a page competing on a fast-moving competitive term.
- **Internal linking**: weak in the outbound direction. The pillar links out to only 2 Annecy URLs (`landing-page-annecy/`, and itself via canonical patterns) despite 10 pages existing in the Annecy cluster (seo-local, audit-seo, refonte, creation-site-web, glossaire, faq-seo, creation-site-internet, creation-site-vitrine, annecy-le-vieux). Inbound linking is healthy — all 6 sampled cluster pages link back to the pillar — but the pillar itself doesn't act as a hub distributing authority/context to its own cluster, weakening topical-cluster signal to Google and reducing crawl paths for AI crawlers.
- **AI citation readiness**: good raw material (named reviewers, concrete numbers, FAQ format) but the date inconsistency above is the single biggest risk to citation trust; a fact-checking AI system pulling this page would likely surface the contradiction.

## 2. Homepage — `index.html`

- H1 targets "landing pages" nationally ("On fait des sites web et des landing pages... inoubliables"), no Annecy/local mention in hero. Proof bar says "+30 clients accompagnés en France, Suisse et Belgique" — consistent framing with national ambition, not competing with the Annecy positioning, but also not reinforcing it. Only 17 lowercase + 26 uppercase mentions of "Annecy" across the whole page — acceptable as supporting signal, not dilutive, but the homepage does little heavy lifting for the local entity outside of schema/footer NAP.

## 3. Annecy cluster sample (differentiation check)

Sampled `seo-local-annecy`, `audit-seo-annecy`, `refonte-site-web-annecy`, `creation-site-web-annecy`, `glossaire-web-seo-annecy`, `faq-seo-annecy`:
- All are substantive (2,000–3,700 words of markup each) with distinct H1s reflecting distinct intents (SEO local vs audit vs refonte vs création vs glossary vs FAQ).
- Text-diff between `creation-site-web-annecy` and `refonte-site-web-annecy`: 96 differing lines; between `seo-local-annecy` and `audit-seo-annecy`: 78 differing lines — genuinely differentiated content, not doorway pages. This cluster is the strongest content asset on the site and is not the risk area.

## 4. Site-wide E-E-A-T / trust

- `terms/mentions.html` has SIREN/SIRET, legal editor block — solid trustworthiness baseline.
- `blog/articles/maxens-soldan/` byline page exists (author bio effort, per recent commits) — good expertise/authorship signal, reinforces the founder entity used on the pillar.
- `a-propos/index.html` correctly and consistently states "fondée en juin 2025" — the inconsistency is isolated to the Annecy pillar's FAQ schema, so it's a one-page fix, not a systemic problem.
- Trustpilot + verifiable named client reviews (HairTattoo Bruxelles referenced elsewhere per case studies) give genuine experience/authority signals rare for a company this young — a real strength.

## 5. City-triplet duplication (C1, domain-level dilution risk)

Confirmed via direct diff: **Lyon triplet already fixed** (agence-web-lyon vs creation-site-web-lyon: 330 differing lines — well differentiated, matches ACTION-PLAN status). **Marseille and Bordeaux triplets remain near-duplicates**: agence-web vs creation-site-web diffs only 88 lines each (vs. 212 for the equivalent Annecy pair, vs 330 for Lyon) — consistent with the ~93-95% similarity flagged in ACTION-PLAN.md C1, still unresolved for the other 11 cities (Paris, Genève, Marseille, Bordeaux, Toulouse, Chambéry, Lille, Nantes, Montpellier, Clermont-Ferrand, Nice).
- **Impact on the Annecy target**: indirect but real. Google's helpfulness evaluation (merged into core ranking since March 2024) operates at both page and site level; ~33 pages of near-duplicate, low-differentiation content is the kind of pattern that can suppress a domain's overall quality/trust ceiling, potentially capping how much authority the well-built Annecy cluster can convert into rankings. It is not likely to cause the Annecy pillar to be filtered directly (the cluster itself is well differentiated and internally consistent), but it is a plausible drag on domain-wide trust that a competitor with a cleaner site-wide footprint would not carry. Recommend continuing the ACTION-PLAN C1 remediation (2-3 cities/week) as a supporting workstream, not a blocker, for the Annecy #1 goal.

---

## Content Quality Score: 74/100

### E-EAT Breakdown (Annecy pillar)
| Factor | Score | Notes |
|---|---|---|
| Experience | 7/10 | Founder video/photo, first-person quote, named client testimonials — strong for company age |
| Expertise | 6/10 | No visible author credentials/technical depth beyond founder bio; byline exists but not linked from pillar itself |
| Authoritativeness | 6/10 | Trustpilot 4.9/5, named reviews; no external citations/press/backlinks evidence checked |
| Trustworthiness | 6/10 | Legal mentions solid; **but the 2024/2025 founding-date contradiction on the pillar page directly damages trust** |
| **Overall** | **6.3/10** | |

### AI Citation Readiness: 65/100
Good raw ingredients (named quotes, numbers, FAQ format) undercut by the factual inconsistency most likely to be quoted verbatim by an AI Overview.

## Top fixes for a #1-worthy pillar page
1. Fix the "depuis 2024" vs "fondée en juin 2025" contradiction in the pillar's FAQ schema — single highest-priority, highest-visibility trust fix.
2. Add `dateModified`/"Mis à jour le" freshness signal to the pillar, and have the pillar link out to its own 10-page Annecy cluster (currently only 2 outbound links) to complete the hub-and-spoke internal linking.
3. Surface a real, numbered local case study (client name, city, measurable result — e.g. traffic/leads delta) directly on the pillar, not just testimonial quotes, to strengthen the Experience/Expertise legs for a term as competitive as "agence web annecy."
