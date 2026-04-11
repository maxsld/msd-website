#!/usr/bin/env python3
"""
Fix SEO top-1 gaps on agence-web-annecy and agence-web-strasbourg.
What this script does:
  1. Fixes all Strasbourg schema/content errors (wrong postalCode, addressRegion, region names)
  2. Fixes French grammar issues ("d'Strasbourg" → "de Strasbourg")
  3. Adds two FAQ items (price + local SEO comparison)
"""

import re

# ─── ANNECY ────────────────────────────────────────────────────────────────────

ANNECY_SERVICES_SECTION = ""

ANNECY_EXTRA_FAQ = """
      <div class="faq-item animate-fade-opacity">
        <button class="faq-question" aria-expanded="false">
          <span>Quel est le prix d'un site internet à Annecy ?</span>
          <span class="icon">+</span>
        </button>
        <div class="faq-answer">
          <p>Le prix dépend de la complexité du projet. Une <a href="https://msd-media.com/landing-page-annecy/">landing page à Annecy</a> est plus accessible qu'un site vitrine multi-pages. Pour les entreprises de Haute-Savoie, nous proposons des formules adaptées. <a href="https://msd-media.com/tarifs-site-web-annecy/">Consultez nos tarifs</a> pour une estimation précise.</p>
        </div>
      </div>

      <div class="faq-item animate-fade-opacity">
        <button class="faq-question" aria-expanded="false">
          <span>Intervenez-vous aussi dans les communes autour d'Annecy ?</span>
          <span class="icon">+</span>
        </button>
        <div class="faq-answer">
          <p>Oui. Nous accompagnons des entreprises dans tout le bassin annécien : Annecy-le-Vieux, Cran-Gevrier, Seynod, Pringy, Thônes, Rumilly ainsi que dans l'arc alpin franco-suisse jusqu'à Genève. La distance n'est pas un obstacle avec notre process 100% en ligne.</p>
        </div>
      </div>
"""

# ─── STRASBOURG ────────────────────────────────────────────────────────────────

STRASBOURG_SERVICES_SECTION = ""

STRASBOURG_EXTRA_FAQ = """
      <div class="faq-item animate-fade-opacity">
        <button class="faq-question" aria-expanded="false">
          <span>Quel est le prix d'un site internet à Strasbourg ?</span>
          <span class="icon">+</span>
        </button>
        <div class="faq-answer">
          <p>Le prix dépend de la complexité du projet. Une <a href="https://msd-media.com/landing-page-strasbourg/">landing page à Strasbourg</a> est plus accessible qu'un site vitrine multi-pages. Pour les entreprises d'Alsace, nous proposons des formules adaptées. <a href="https://msd-media.com/tarifs-site-web-strasbourg/">Consultez nos tarifs</a> pour une estimation précise.</p>
        </div>
      </div>

      <div class="faq-item animate-fade-opacity">
        <button class="faq-question" aria-expanded="false">
          <span>Intervenez-vous aussi dans les communes autour de Strasbourg ?</span>
          <span class="icon">+</span>
        </button>
        <div class="faq-answer">
          <p>Oui. Nous accompagnons des entreprises dans toute l'Eurométropole de Strasbourg et dans le reste du Bas-Rhin : Schiltigheim, Illkirch, Haguenau, Saverne, Obernai, Molsheim, Sélestat. Le process 100% en ligne nous permet d'intervenir partout en Alsace sans surcoût.</p>
        </div>
      </div>
"""

def fix_annecy():
    path = "/Users/maxenssoldan/Documents/Codage/msd-website-v2/agence-web-annecy/index.html"
    with open(path, encoding="utf-8") as f:
        html = f.read()

    # 1. Add extra FAQ items before closing </div> of faq-container
    if "Quel est le prix d'un site internet à Annecy" not in html:
        html = html.replace(
            '    </div>\n  </section>\n\n\n  <section class="booking-section"',
            ANNECY_EXTRA_FAQ + '    </div>\n  </section>\n\n\n  <section class="booking-section"'
        )

    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print("✅ Annecy: FAQ items updated")


def fix_strasbourg():
    path = "/Users/maxenssoldan/Documents/Codage/msd-website-v2/agence-web-strasbourg/index.html"
    with open(path, encoding="utf-8") as f:
        html = f.read()

    # 1. Fix schema: postalCode 74000 → 67000 (only in LocalBusiness which has Strasbourg city)
    html = html.replace(
        '"addressLocality": "Strasbourg",\n        "postalCode": "74000"',
        '"addressLocality": "Strasbourg",\n        "postalCode": "67000"'
    )

    # 2. Fix schema: addressRegion Haute-Savoie → Bas-Rhin (Strasbourg address in LocalBusiness)
    html = html.replace(
        '"postalCode": "67000",\n        "addressLocality": "Annecy"',
        '"postalCode": "67000",\n        "addressLocality": "Strasbourg"'
    )
    # Fix addressRegion for Strasbourg LocalBusiness
    # There are two addressRegion entries — fix the one after Strasbourg city
    html = html.replace(
        '"addressLocality": "Strasbourg",\n        "postalCode": "67000",\n        "addressRegion": "Haute-Savoie"',
        '"addressLocality": "Strasbourg",\n        "postalCode": "67000",\n        "addressRegion": "Bas-Rhin"'
    )

    # 3. Fix Organization description: "pour les entreprises de Haute-Savoie" → "pour les entreprises d'Alsace"
    html = html.replace(
        '"description": "Agence web à Strasbourg spécialisée en création de sites internet et landing pages SEO sur mesure pour les entreprises de Haute-Savoie."',
        '"description": "Agence web à Strasbourg spécialisée en création de sites internet et landing pages SEO sur mesure pour les entreprises d\'Alsace."'
    )

    # 4. Fix WebPage description: "en Haute-Savoie" → "en Alsace"
    html = html.replace(
        '"description": "Agence web locale à Strasbourg pour la création de sites internet, landing pages et refontes SEO en Haute-Savoie."',
        '"description": "Agence web locale à Strasbourg pour la création de sites internet, landing pages et refontes SEO en Alsace."'
    )

    # 5. Fix FAQ answer: "Strasbourg et Haute-Savoie" → "Strasbourg et Alsace"
    html = html.replace(
        "orientés recherches sur Strasbourg et Haute-Savoie",
        "orientés recherches sur Strasbourg et Alsace"
    )

    # 6. Fix grammar: "entreprises d'Strasbourg" → "entreprises de Strasbourg"
    html = html.replace("entreprises d'Strasbourg", "entreprises de Strasbourg")

    # 7. Fix grammar: "agence web d'Strasbourg" → "agence web de Strasbourg"
    html = html.replace("agence web d'Strasbourg", "agence web de Strasbourg")

    # 8. Fix grammar: "process est pensé pour les entreprises d'Strasbourg" (already covered above)
    # Also fix the booking section title
    html = html.replace(
        "avec une agence web d'Strasbourg",
        "avec une agence web de Strasbourg"
    )

    # 9. Fix process section: "pour Strasbourg et la Haute-Savoie" → "pour Strasbourg et l'Alsace"
    html = html.replace(
        "mis en place pour Strasbourg et la Haute-Savoie",
        "mis en place pour Strasbourg et l'Alsace"
    )

    # 10. Add extra FAQ items
    if "Quel est le prix d'un site internet à Strasbourg" not in html:
        html = html.replace(
            '    </div>\n  </section>\n\n\n  <section class="booking-section"',
            STRASBOURG_EXTRA_FAQ + '    </div>\n  </section>\n\n\n  <section class="booking-section"'
        )

    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print("✅ Strasbourg: schema fixed + FAQ items updated")


if __name__ == "__main__":
    fix_annecy()
    fix_strasbourg()
    print("\nDone. Both pages updated for top-1 SEO.")
