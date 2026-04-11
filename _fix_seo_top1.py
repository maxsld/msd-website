#!/usr/bin/env python3
"""
Fix SEO top-1 gaps on agence-web-annecy and agence-web-strasbourg.
What this script does:
  1. Fixes all Strasbourg schema/content errors (wrong postalCode, addressRegion, region names)
  2. Fixes French grammar issues ("d'Strasbourg" → "de Strasbourg")
  3. Adds a rich textual content section (services + city context) after the process section
  4. Adds two FAQ items (price + local SEO comparison)
  5. Adds internal links section pointing to all satellite service pages
"""

import re

# ─── ANNECY ────────────────────────────────────────────────────────────────────

ANNECY_SERVICES_SECTION = """
  <!-- Section services internes Annecy -->
  <section class="section-grid section-services-local" id="services-annecy" style="padding: 80px 5%; background: #f9f9f9;">
    <div style="max-width: 860px; margin: 0 auto;">
      <h2 class="animate-fade-opacity section-tag section-tag--dark">Nos services</h2>
      <h3 class="animate-fade-opacity section-title section-title--dark">Tout ce dont votre entreprise<br>à Annecy a besoin.</h3>
      <p style="font-size: 1.05rem; line-height: 1.75; color: #444; margin-bottom: 2rem;">
        De la première page à la refonte complète, MSD Media couvre tous les besoins web des entreprises d'Annecy et de Haute-Savoie. Chaque prestation est pensée pour maximiser votre visibilité locale et vos conversions.
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
        <a href="https://msd-media.com/creation-site-web-annecy/" style="display: block; background: #fff; border-radius: 12px; padding: 1.5rem; border: 1px solid #e5e5e5; text-decoration: none; color: inherit; transition: box-shadow .2s;" onmouseover="this.style.boxShadow='0 4px 18px rgba(0,0,0,.1)'" onmouseout="this.style.boxShadow='none'">
          <strong style="display: block; font-size: 1rem; margin-bottom: .4rem;">Création de site web</strong>
          <span style="font-size: .9rem; color: #666;">Site vitrine ou e-commerce sur mesure pour Annecy &rarr;</span>
        </a>
        <a href="https://msd-media.com/landing-page-annecy/" style="display: block; background: #fff; border-radius: 12px; padding: 1.5rem; border: 1px solid #e5e5e5; text-decoration: none; color: inherit; transition: box-shadow .2s;" onmouseover="this.style.boxShadow='0 4px 18px rgba(0,0,0,.1)'" onmouseout="this.style.boxShadow='none'">
          <strong style="display: block; font-size: 1rem; margin-bottom: .4rem;">Landing page Annecy</strong>
          <span style="font-size: .9rem; color: #666;">Page de conversion optimisée pour vos campagnes locales &rarr;</span>
        </a>
        <a href="https://msd-media.com/refonte-site-web-annecy/" style="display: block; background: #fff; border-radius: 12px; padding: 1.5rem; border: 1px solid #e5e5e5; text-decoration: none; color: inherit; transition: box-shadow .2s;" onmouseover="this.style.boxShadow='0 4px 18px rgba(0,0,0,.1)'" onmouseout="this.style.boxShadow='none'">
          <strong style="display: block; font-size: 1rem; margin-bottom: .4rem;">Refonte site web</strong>
          <span style="font-size: .9rem; color: #666;">Donnez un nouveau souffle à votre site existant &rarr;</span>
        </a>
        <a href="https://msd-media.com/seo-local-annecy/" style="display: block; background: #fff; border-radius: 12px; padding: 1.5rem; border: 1px solid #e5e5e5; text-decoration: none; color: inherit; transition: box-shadow .2s;" onmouseover="this.style.boxShadow='0 4px 18px rgba(0,0,0,.1)'" onmouseout="this.style.boxShadow='none'">
          <strong style="display: block; font-size: 1rem; margin-bottom: .4rem;">SEO local Annecy</strong>
          <span style="font-size: .9rem; color: #666;">Classement Google Maps et référencement Haute-Savoie &rarr;</span>
        </a>
        <a href="https://msd-media.com/tarifs-site-web-annecy/" style="display: block; background: #fff; border-radius: 12px; padding: 1.5rem; border: 1px solid #e5e5e5; text-decoration: none; color: inherit; transition: box-shadow .2s;" onmouseover="this.style.boxShadow='0 4px 18px rgba(0,0,0,.1)'" onmouseout="this.style.boxShadow='none'">
          <strong style="display: block; font-size: 1rem; margin-bottom: .4rem;">Tarifs site web Annecy</strong>
          <span style="font-size: .9rem; color: #666;">Transparence totale sur les prix et formules &rarr;</span>
        </a>
        <a href="https://msd-media.com/audit-seo-annecy/" style="display: block; background: #fff; border-radius: 12px; padding: 1.5rem; border: 1px solid #e5e5e5; text-decoration: none; color: inherit; transition: box-shadow .2s;" onmouseover="this.style.boxShadow='0 4px 18px rgba(0,0,0,.1)'" onmouseout="this.style.boxShadow='none'">
          <strong style="display: block; font-size: 1rem; margin-bottom: .4rem;">Audit SEO Annecy</strong>
          <span style="font-size: .9rem; color: #666;">Diagnostic complet de votre site pour progresser en 2026 &rarr;</span>
        </a>
      </div>
    </div>
  </section>

  <!-- Section contenu riche Annecy -->
  <section class="section-grid section-content-local" id="agence" style="padding: 80px 5%; background: #fff;">
    <div style="max-width: 860px; margin: 0 auto;">
      <h2 class="animate-fade-opacity section-tag section-tag--dark">Agence web à Annecy</h2>
      <h3 class="animate-fade-opacity section-title section-title--dark">Pourquoi choisir une agence web<br>locale à Annecy ?</h3>

      <p style="font-size: 1.05rem; line-height: 1.8; color: #333; margin-bottom: 1.5rem;">
        Annecy est l'une des villes les plus dynamiques de Haute-Savoie. Entre le lac, la vieille ville et le bassin genevois, des milliers d'entreprises locales se disputent la visibilité en ligne — artisans, cabinets de conseil, hôtels, restaurants, prestataires de services. Dans cet environnement concurrentiel, avoir un site internet performant n'est plus une option : c'est un levier de croissance direct.
      </p>

      <p style="font-size: 1.05rem; line-height: 1.8; color: #333; margin-bottom: 1.5rem;">
        Chez MSD Media, nous créons des sites internet pour les entreprises d'Annecy qui veulent sortir du lot : <strong>design sur mesure, chargement ultra-rapide, SEO local optimisé</strong> dès la mise en ligne. Pas de template générique, pas de délai de 3 mois. Une V1 livrée en 14 jours, avec une vraie stratégie de conversion adaptée à votre marché local.
      </p>

      <h4 style="font-size: 1.15rem; font-weight: 700; margin: 2rem 0 .75rem;">Ce que nos clients d'Annecy apprécient</h4>
      <ul style="list-style: none; padding: 0; margin-bottom: 1.5rem;">
        <li style="padding: .5rem 0; border-bottom: 1px solid #f0f0f0; font-size: .98rem; color: #444;">✓ Un interlocuteur unique, basé à Annecy, disponible par téléphone et WhatsApp</li>
        <li style="padding: .5rem 0; border-bottom: 1px solid #f0f0f0; font-size: .98rem; color: #444;">✓ Des sites optimisés pour les recherches locales : "agence web Annecy", "création site web Haute-Savoie"</li>
        <li style="padding: .5rem 0; border-bottom: 1px solid #f0f0f0; font-size: .98rem; color: #444;">✓ Des réalisations pour des secteurs variés : immobilier, restauration, sport, santé, e-commerce</li>
        <li style="padding: .5rem 0; border-bottom: 1px solid #f0f0f0; font-size: .98rem; color: #444;">✓ Un investissement clair avec des prix transparents dès le départ</li>
        <li style="padding: .5rem 0; font-size: .98rem; color: #444;">✓ Une approche orientée résultats mesurables : trafic, leads, appels entrants</li>
      </ul>

      <h4 style="font-size: 1.15rem; font-weight: 700; margin: 2rem 0 .75rem;">Annecy, Haute-Savoie et bassin genevois</h4>
      <p style="font-size: 1.05rem; line-height: 1.8; color: #333; margin-bottom: 1.5rem;">
        Notre agence web intervient sur tout le bassin annécien : <strong>Annecy-le-Vieux, Cran-Gevrier, Seynod, Pringy, Argonay, Thônes, Rumilly</strong>, et au-delà vers Genève et la Suisse. Nous connaissons le marché local, ses spécificités saisonnières (tourisme, sports d'hiver) et les attentes des consommateurs de Haute-Savoie.
      </p>

      <p style="font-size: 1.05rem; line-height: 1.8; color: #333;">
        Que vous soyez une startup annécienne, un artisan local, un cabinet libéral ou une PME en croissance, MSD Media construit votre présence web pour qu'elle génère de vraies opportunités commerciales. <a href="https://msd-media.com/creation-site-web-annecy/" style="color: #1a1a1a; font-weight: 600;">Découvrez notre offre de création de site web à Annecy</a> ou <a href="https://msd-media.com/tarifs-site-web-annecy/" style="color: #1a1a1a; font-weight: 600;">consultez nos tarifs</a>.
      </p>
    </div>
  </section>
"""

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

STRASBOURG_SERVICES_SECTION = """
  <!-- Section services internes Strasbourg -->
  <section class="section-grid section-services-local" id="services-strasbourg" style="padding: 80px 5%; background: #f9f9f9;">
    <div style="max-width: 860px; margin: 0 auto;">
      <h2 class="animate-fade-opacity section-tag section-tag--dark">Nos services</h2>
      <h3 class="animate-fade-opacity section-title section-title--dark">Tout ce dont votre entreprise<br>à Strasbourg a besoin.</h3>
      <p style="font-size: 1.05rem; line-height: 1.75; color: #444; margin-bottom: 2rem;">
        De la première page à la refonte complète, MSD Media couvre tous les besoins web des entreprises de Strasbourg et d'Alsace. Chaque prestation est pensée pour maximiser votre visibilité locale et vos conversions.
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
        <a href="https://msd-media.com/creation-site-web-strasbourg/" style="display: block; background: #fff; border-radius: 12px; padding: 1.5rem; border: 1px solid #e5e5e5; text-decoration: none; color: inherit; transition: box-shadow .2s;" onmouseover="this.style.boxShadow='0 4px 18px rgba(0,0,0,.1)'" onmouseout="this.style.boxShadow='none'">
          <strong style="display: block; font-size: 1rem; margin-bottom: .4rem;">Création de site web</strong>
          <span style="font-size: .9rem; color: #666;">Site vitrine ou e-commerce sur mesure pour Strasbourg &rarr;</span>
        </a>
        <a href="https://msd-media.com/landing-page-strasbourg/" style="display: block; background: #fff; border-radius: 12px; padding: 1.5rem; border: 1px solid #e5e5e5; text-decoration: none; color: inherit; transition: box-shadow .2s;" onmouseover="this.style.boxShadow='0 4px 18px rgba(0,0,0,.1)'" onmouseout="this.style.boxShadow='none'">
          <strong style="display: block; font-size: 1rem; margin-bottom: .4rem;">Landing page Strasbourg</strong>
          <span style="font-size: .9rem; color: #666;">Page de conversion optimisée pour vos campagnes locales &rarr;</span>
        </a>
        <a href="https://msd-media.com/refonte-site-web-strasbourg/" style="display: block; background: #fff; border-radius: 12px; padding: 1.5rem; border: 1px solid #e5e5e5; text-decoration: none; color: inherit; transition: box-shadow .2s;" onmouseover="this.style.boxShadow='0 4px 18px rgba(0,0,0,.1)'" onmouseout="this.style.boxShadow='none'">
          <strong style="display: block; font-size: 1rem; margin-bottom: .4rem;">Refonte site web</strong>
          <span style="font-size: .9rem; color: #666;">Donnez un nouveau souffle à votre site existant &rarr;</span>
        </a>
        <a href="https://msd-media.com/seo-local-strasbourg/" style="display: block; background: #fff; border-radius: 12px; padding: 1.5rem; border: 1px solid #e5e5e5; text-decoration: none; color: inherit; transition: box-shadow .2s;" onmouseover="this.style.boxShadow='0 4px 18px rgba(0,0,0,.1)'" onmouseout="this.style.boxShadow='none'">
          <strong style="display: block; font-size: 1rem; margin-bottom: .4rem;">SEO local Strasbourg</strong>
          <span style="font-size: .9rem; color: #666;">Classement Google Maps et référencement Alsace &rarr;</span>
        </a>
        <a href="https://msd-media.com/tarifs-site-web-strasbourg/" style="display: block; background: #fff; border-radius: 12px; padding: 1.5rem; border: 1px solid #e5e5e5; text-decoration: none; color: inherit; transition: box-shadow .2s;" onmouseover="this.style.boxShadow='0 4px 18px rgba(0,0,0,.1)'" onmouseout="this.style.boxShadow='none'">
          <strong style="display: block; font-size: 1rem; margin-bottom: .4rem;">Tarifs site web Strasbourg</strong>
          <span style="font-size: .9rem; color: #666;">Transparence totale sur les prix et formules &rarr;</span>
        </a>
      </div>
    </div>
  </section>

  <!-- Section contenu riche Strasbourg -->
  <section class="section-grid section-content-local" id="agence" style="padding: 80px 5%; background: #fff;">
    <div style="max-width: 860px; margin: 0 auto;">
      <h2 class="animate-fade-opacity section-tag section-tag--dark">Agence web à Strasbourg</h2>
      <h3 class="animate-fade-opacity section-title section-title--dark">Pourquoi choisir une agence web<br>locale à Strasbourg ?</h3>

      <p style="font-size: 1.05rem; line-height: 1.8; color: #333; margin-bottom: 1.5rem;">
        Strasbourg est la capitale de l'Alsace et le siège du Parlement européen. C'est aussi une métropole dynamique où les entreprises — artisans, agences, hôtels, cabinets, startups — ont de plus en plus besoin d'une présence web solide pour capter des clients locaux sur Google. L'Eurométropole de Strasbourg concentre plus de 500 000 habitants et un tissu économique dense : la concurrence en ligne y est réelle.
      </p>

      <p style="font-size: 1.05rem; line-height: 1.8; color: #333; margin-bottom: 1.5rem;">
        MSD Media crée des sites internet pour les entreprises de Strasbourg qui veulent être visibles localement : <strong>design premium, performance technique, SEO Alsace intégré</strong> dès la mise en ligne. Pas de délai interminable : votre première version est livrée en 14 jours, avec une stratégie de conversion adaptée au marché alsacien.
      </p>

      <h4 style="font-size: 1.15rem; font-weight: 700; margin: 2rem 0 .75rem;">Ce que nos clients de Strasbourg apprécient</h4>
      <ul style="list-style: none; padding: 0; margin-bottom: 1.5rem;">
        <li style="padding: .5rem 0; border-bottom: 1px solid #f0f0f0; font-size: .98rem; color: #444;">✓ Un interlocuteur disponible, sans intermédiaire ni agence sous-traitante</li>
        <li style="padding: .5rem 0; border-bottom: 1px solid #f0f0f0; font-size: .98rem; color: #444;">✓ Des sites optimisés pour "agence web Strasbourg", "création site web Alsace" et les recherches locales</li>
        <li style="padding: .5rem 0; border-bottom: 1px solid #f0f0f0; font-size: .98rem; color: #444;">✓ Des réalisations dans des secteurs variés : restauration alsacienne, immobilier, professions libérales, e-commerce</li>
        <li style="padding: .5rem 0; border-bottom: 1px solid #f0f0f0; font-size: .98rem; color: #444;">✓ Des prix transparents et un accompagnement personnalisé de A à Z</li>
        <li style="padding: .5rem 0; font-size: .98rem; color: #444;">✓ Une approche orientée résultats mesurables : trafic organique, leads qualifiés, appels entrants</li>
      </ul>

      <h4 style="font-size: 1.15rem; font-weight: 700; margin: 2rem 0 .75rem;">Strasbourg, Alsace et Eurométropole</h4>
      <p style="font-size: 1.05rem; line-height: 1.8; color: #333; margin-bottom: 1.5rem;">
        Nous accompagnons des entreprises dans toute l'Eurométropole : <strong>Strasbourg, Schiltigheim, Illkirch-Graffenstaden, Hoenheim, Bischheim, Lingolsheim, Ostwald</strong>, mais aussi dans le reste du Bas-Rhin et d'Alsace. Nous connaissons les spécificités du marché local, notamment la présence d'institutions européennes et le bilinguisme franco-allemand.
      </p>

      <p style="font-size: 1.05rem; line-height: 1.8; color: #333;">
        Que vous soyez une startup strasbourgeoise, un artisan local, un cabinet libéral ou une PME alsacienne en croissance, MSD Media construit votre présence web pour générer de vraies opportunités commerciales. <a href="https://msd-media.com/creation-site-web-strasbourg/" style="color: #1a1a1a; font-weight: 600;">Découvrez notre offre de création de site web à Strasbourg</a> ou <a href="https://msd-media.com/tarifs-site-web-strasbourg/" style="color: #1a1a1a; font-weight: 600;">consultez nos tarifs</a>.
      </p>
    </div>
  </section>
"""

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

    # 1. Insert services + content section after the process section (before reviews)
    if "section-services-local" not in html:
        html = html.replace(
            '  <section class="section-reviews section-grid" id="landing-reviews">',
            ANNECY_SERVICES_SECTION + '\n  <section class="section-reviews section-grid" id="landing-reviews">'
        )

    # 2. Add extra FAQ items before closing </div> of faq-container
    if "Quel est le prix d'un site internet à Annecy" not in html:
        html = html.replace(
            '    </div>\n  </section>\n\n\n  <section class="booking-section"',
            ANNECY_EXTRA_FAQ + '    </div>\n  </section>\n\n\n  <section class="booking-section"'
        )

    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print("✅ Annecy: services section + 2 FAQ items added")


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

    # 10. Insert services + content section after process section (before reviews)
    if "section-services-local" not in html:
        html = html.replace(
            '  <section class="section-reviews section-grid" id="landing-reviews">',
            STRASBOURG_SERVICES_SECTION + '\n  <section class="section-reviews section-grid" id="landing-reviews">'
        )

    # 11. Add extra FAQ items
    if "Quel est le prix d'un site internet à Strasbourg" not in html:
        html = html.replace(
            '    </div>\n  </section>\n\n\n  <section class="booking-section"',
            STRASBOURG_EXTRA_FAQ + '    </div>\n  </section>\n\n\n  <section class="booking-section"'
        )

    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print("✅ Strasbourg: schema fixed + services section + 2 FAQ items added")


if __name__ == "__main__":
    fix_annecy()
    fix_strasbourg()
    print("\nDone. Both pages updated for top-1 SEO.")
