#!/usr/bin/env python3
"""
Fix SEO/GEO issues across all local pages:
1. NAP: postalCode + addressRegion + addressCountry dans Organization schema
2. Textes "Haute-Savoie" dans meta, descriptions, FAQ et body HTML
3. Alt texts génériques sur avatars Unsplash
4. Hreflang fr-CH pour Genève
5. FAQ uniques par ville (7e question spécifique)
"""

import os, re, sys

ROOT = os.path.dirname(os.path.abspath(__file__))

# ─── Données villes ───────────────────────────────────────────────────────────
# slug → {city, postal, dept (pour addressRegion), country, region (pour textes prose), prép}
CITIES = {
    "annecy":            dict(city="Annecy",           postal="74000", dept="Haute-Savoie",         country="FR", region="Haute-Savoie",      prep="à"),
    "annecy-le-vieux":   dict(city="Annecy-le-Vieux",  postal="74940", dept="Haute-Savoie",         country="FR", region="Haute-Savoie",      prep="à"),
    "bordeaux":          dict(city="Bordeaux",          postal="33000", dept="Gironde",              country="FR", region="Nouvelle-Aquitaine", prep="à"),
    "chambery":          dict(city="Chambéry",          postal="73000", dept="Savoie",               country="FR", region="Savoie",            prep="à"),
    "chamonix":          dict(city="Chamonix",          postal="74400", dept="Haute-Savoie",         country="FR", region="Haute-Savoie",      prep="à"),
    "clermont-ferrand":  dict(city="Clermont-Ferrand",  postal="63000", dept="Puy-de-Dôme",         country="FR", region="Auvergne",           prep="à"),
    "cluses":            dict(city="Cluses",            postal="74300", dept="Haute-Savoie",         country="FR", region="Haute-Savoie",      prep="à"),
    "geneve":            dict(city="Genève",            postal="1201",  dept="Genève",               country="CH", region="Suisse romande",    prep="à"),
    "haute-savoie":      dict(city="Annecy",            postal="74000", dept="Haute-Savoie",         country="FR", region="Haute-Savoie",      prep="en"),
    "lille":             dict(city="Lille",             postal="59000", dept="Nord",                 country="FR", region="Hauts-de-France",   prep="à"),
    "lyon":              dict(city="Lyon",              postal="69001", dept="Métropole de Lyon",    country="FR", region="Auvergne-Rhône-Alpes", prep="à"),
    "marseille":         dict(city="Marseille",         postal="13001", dept="Bouches-du-Rhône",     country="FR", region="Provence-Alpes-Côte d'Azur", prep="à"),
    "montpellier":       dict(city="Montpellier",       postal="34000", dept="Hérault",              country="FR", region="Occitanie",         prep="à"),
    "munich":            dict(city="Munich",            postal="80331", dept="Bayern",               country="DE", region="Bavière",           prep="à"),
    "nantes":            dict(city="Nantes",            postal="44000", dept="Loire-Atlantique",     country="FR", region="Pays de la Loire",  prep="à"),
    "nice":              dict(city="Nice",              postal="06000", dept="Alpes-Maritimes",      country="FR", region="Provence-Alpes-Côte d'Azur", prep="à"),
    "paris":             dict(city="Paris",             postal="75001", dept="Paris",                country="FR", region="Île-de-France",     prep="à"),
    "rennes":            dict(city="Rennes",            postal="35000", dept="Ille-et-Vilaine",      country="FR", region="Bretagne",          prep="à"),
    "strasbourg":        dict(city="Strasbourg",        postal="67000", dept="Bas-Rhin",             country="FR", region="Grand Est",         prep="à"),
    "thonon-les-bains":  dict(city="Thonon-les-Bains",  postal="74200", dept="Haute-Savoie",         country="FR", region="Haute-Savoie",      prep="à"),
    "toulouse":          dict(city="Toulouse",          postal="31000", dept="Haute-Garonne",        country="FR", region="Occitanie",         prep="à"),
}

# ─── Question unique par ville (7e FAQ) ───────────────────────────────────────
CITY_FAQ_Q7 = {
    "bordeaux":          ("Quels secteurs d'activité font appel à MSD Media à Bordeaux ?",
                          "Nous accompagnons des PME, agences immobilières, cabinets de conseil, commerces locaux et start-ups de la métropole bordelaise. Chaque projet intègre un SEO ancré dans l'écosystème entrepreneurial de Bordeaux et de la Gironde."),
    "chambery":          ("MSD Media travaille-t-il avec les entreprises de la Savoie ?",
                          "Oui. Nous créons des sites web et landing pages pour des TPE et PME chambériennes dans les secteurs du tourisme montagne, de l'immobilier et du commerce local. SEO calibré pour les recherches en Savoie et dans les Alpes."),
    "clermont-ferrand":  ("Quels types d'entreprises de Clermont-Ferrand travaillent avec MSD Media ?",
                          "Nous collaborons avec des PME, professionnels de santé, cabinets juridiques et start-ups du Puy-de-Dôme. Notre SEO local cible les recherches clermontoise dans un marché en forte croissance digitale."),
    "geneve":            ("MSD Media accompagne-t-il des entreprises basées à Genève ?",
                          "Oui. Nous créons des sites web et landing pages pour des PME et indépendants genevois dans les secteurs finance, horlogerie, conseil et services aux entreprises. Notre approche SEO est adaptée aux recherches en Suisse romande et au marché franco-suisse."),
    "lille":             ("Quels secteurs lillois font appel à MSD Media pour leur site web ?",
                          "Nous accompagnons des commerces, ESN, cabinets RH et PME des Hauts-de-France. Notre SEO local cible les recherches métropolitaines lilloises et l'ensemble du marché nordiste."),
    "lyon":              ("MSD Media a-t-il de l'expérience avec les entreprises lyonnaises ?",
                          "Oui. Nous avons accompagné des cabinets de conseil, e-commerces, acteurs de la santé et start-ups de la French Tech Lyon. Notre SEO local est optimisé pour la métropole lyonnaise et la région Auvergne-Rhône-Alpes."),
    "marseille":         ("Quels secteurs marseillais font appel à MSD Media ?",
                          "Nous accompagnons des PME, acteurs du tourisme, du transport maritime, de la logistique et du commerce local à Marseille. Notre SEO local cible les recherches dans les Bouches-du-Rhône et sur la métropole Aix-Marseille."),
    "montpellier":       ("MSD Media travaille-t-il avec les entreprises du secteur tech de Montpellier ?",
                          "Oui. Montpellier est l'une des villes les plus dynamiques pour les start-ups et ESN en France. Nous accompagnons des entrepreneurs et PME montpelliérains avec des sites orientés conversion et un SEO local fort sur l'Hérault."),
    "munich":            ("MSD Media crée-t-il des sites pour des entreprises basées à Munich ?",
                          "Oui. Nous développons des sites web et landing pages pour des entreprises franco-allemandes, start-ups et PME établies à Munich. Notre approche est adaptée aux marchés germanophone et francophone, avec un SEO pensé pour le marché bavarois."),
    "nantes":            ("Quels secteurs nantais travaillent avec MSD Media ?",
                          "Nous accompagnons des start-ups de la French Tech Nantes, des PME industrielles, des acteurs du tourisme ligérien et du commerce local. SEO optimisé pour la métropole nantaise et la Loire-Atlantique."),
    "nice":              ("MSD Media accompagne-t-il les entreprises de la Côte d'Azur ?",
                          "Oui. Nous créons des sites web pour des hôtels, restaurants, agences immobilières, cabinets de santé et start-ups de Nice et des Alpes-Maritimes. Notre SEO local cible les recherches sur la Côte d'Azur et en PACA."),
    "paris":             ("MSD Media accompagne-t-il les start-ups et PME parisiennes ?",
                          "Oui. Nous travaillons avec des entrepreneurs, start-ups et PME de Paris et d'Île-de-France dans tous secteurs : conseil, fintech, retail, santé et services B2B. Notre SEO local cible les recherches parisiennes et franciliennes dans un marché ultra-compétitif."),
    "rennes":            ("Quels secteurs rennais font appel à MSD Media ?",
                          "Nous accompagnons des acteurs de la French Tech Rennes, PME agroalimentaires, cabinets de conseil et commerces locaux. SEO calibré pour les recherches en Ille-et-Vilaine et en Bretagne."),
    "toulouse":          ("MSD Media a-t-il de l'expérience avec les entreprises toulouse ?",
                          "Oui. Nous accompagnons des start-ups, PME aéronautiques, acteurs de la santé et du commerce local à Toulouse. Notre SEO local cible la Ville Rose et la Haute-Garonne, avec une vraie connaissance du tissu économique occitan."),
    "strasbourg":        ("MSD Media accompagne-t-il les entreprises de l'Eurométropole de Strasbourg ?",
                          "Oui. Nous créons des sites web pour des PME, institutions et entrepreneurs strasbourgeois avec un regard transfrontalier franco-allemand. Notre SEO local cible les recherches en Alsace, dans le Bas-Rhin et le marché rhénan."),
}

# ─── Préposition "de" avec élision ───────────────────────────────────────────
def de(s):
    return "d'" + s if s[0].lower() in "aeiouéèêëàâîïôùûü" else "de " + s


# ─── Fixes par page ───────────────────────────────────────────────────────────
def fix_file(path, city_slug, d):
    city    = d['city']
    postal  = d['postal']
    dept    = d['dept']
    country = d['country']
    region  = d['region']
    prep    = d['prep']

    with open(path, encoding="utf-8") as f:
        content = f.read()
    original = content

    # ── 1. NAP: postalCode dans Organization schema ─────────────────────────
    # La clé: le bloc Organization a "addressLocality" puis "postalCode" sans "streetAddress" avant.
    # Le bloc LocalBusiness a "streetAddress" AVANT "postalCode" → ne pas toucher.
    content = re.sub(
        r'("addressLocality":\s*"[^"]+",\s*\n\s*"postalCode":\s*)"74000"',
        r'\g<1>"' + postal + '"',
        content
    )

    # ── 2. NAP: addressRegion ───────────────────────────────────────────────
    # Uniquement si suivi de addressCountry (pattern Organization, pas LocalBusiness qui n'a pas addressRegion)
    content = re.sub(
        r'("addressRegion":\s*)"Haute-Savoie"',
        r'\g<1>"' + dept + '"',
        content
    )

    # ── 3. NAP: addressCountry (FR → CH pour Genève, FR → DE pour Munich) ──
    if country != "FR":
        # Remplacer "addressCountry": "FR" UNIQUEMENT dans le bloc Organization
        # (identifié par le fait qu'il est précédé de addressRegion dans les 3 lignes)
        content = re.sub(
            r'("addressRegion":\s*"' + re.escape(dept) + r'",\s*\n\s*"addressCountry":\s*)"FR"',
            r'\g<1>"' + country + '"',
            content
        )

    # ── 4. Textes "Haute-Savoie" → références locales ──────────────────────
    if dept != "Haute-Savoie":  # Ne rien toucher pour les villes déjà en Haute-Savoie
        # Ordered most-specific to least-specific

        # "[city] et la Haute-Savoie" → "[city] et [region]"
        content = content.replace(f"{city} et la Haute-Savoie", f"{city} et {region}")
        # "[city] et Haute-Savoie"
        content = content.replace(f"{city} et Haute-Savoie", f"{city} et {region}")
        # "Haute-Savoie et [city]"
        content = content.replace(f"Haute-Savoie et {city}", f"{city} et {region}")
        # "la Haute-Savoie" → ville ou région selon contexte
        content = content.replace("la Haute-Savoie", region)
        # "entreprises de Haute-Savoie" → "entreprises à [city]"
        content = content.replace("entreprises de Haute-Savoie", f"entreprises {prep} {city}")
        # "en Haute-Savoie" → "à [city]"
        content = content.replace("en Haute-Savoie", f"{prep} {city}")
        # "de Haute-Savoie" → "de/d' [region]"
        content = content.replace("de Haute-Savoie", de(region))
        # Reste (standalone)
        content = content.replace("Haute-Savoie", region)

    # ── 5. Alt texts génériques sur avatars ────────────────────────────────
    content = re.sub(
        r'alt="Poto [^"]*"',
        f'alt="Témoignage client — agence web {prep} {city}"',
        content
    )

    # ── 6. Hreflang fr-CH pour Genève ──────────────────────────────────────
    if city_slug == "geneve":
        # Ajouter fr-CH et fr-FR avant x-default (s'il n'est pas déjà présent)
        if 'hreflang="fr-CH"' not in content:
            content = content.replace(
                '<link rel="alternate" hreflang="fr-FR"',
                '<link rel="alternate" hreflang="fr-CH" href="https://msd-media.com/' + _slug_for_path(path) + '/" />\n  <link rel="alternate" hreflang="fr-FR"',
            )

    # ── 7. FAQ unique : ajouter une 7e question ville-spécifique ───────────
    if city_slug in CITY_FAQ_Q7:
        q7_name, q7_text = CITY_FAQ_Q7[city_slug]
        # Vérifier que la question n'existe pas déjà
        if q7_name not in content:
            # Insérer avant la fermeture du FAQPage mainEntity
            faq_close = '      ]\n    }'
            new_q7 = (
                ',\n'
                '        {\n'
                '          "@type": "Question",\n'
                f'          "name": "{q7_name}",\n'
                '          "acceptedAnswer": {\n'
                '            "@type": "Answer",\n'
                f'            "text": "{q7_text}"\n'
                '          }\n'
                '        }'
            )
            # Trouver la dernière } du mainEntity juste avant ]\n    }
            pattern_close = r'(\s*\}\s*\n\s*\]\s*\n\s*\}(?=\s*,\s*\n\s*\{[^}]*"@type":\s*"LocalBusiness"))'
            if re.search(pattern_close, content):
                content = re.sub(pattern_close, new_q7 + r'\1', content, count=1)

    if content != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    return False


def _slug_for_path(path):
    """Retourne le segment URL de la page à partir du chemin."""
    parts = path.replace(ROOT, "").split(os.sep)
    return parts[1] if len(parts) > 1 else ""


# ─── Pages à traiter ─────────────────────────────────────────────────────────
PREFIXES = ["agence-web", "creation-site-web", "landing-page", "refonte-site-web",
            "creation-site-internet", "creation-site-vitrine"]

def collect_pages():
    pages = []
    for entry in os.scandir(ROOT):
        if not entry.is_dir():
            continue
        folder = entry.name
        for prefix in PREFIXES:
            if folder.startswith(prefix + "-"):
                slug = folder[len(prefix) + 1:]
                if slug in CITIES:
                    html = os.path.join(entry.path, "index.html")
                    if os.path.isfile(html):
                        pages.append((html, slug, CITIES[slug]))
                    break
    return pages


# ─── Main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    pages = collect_pages()
    print(f"Pages trouvées : {len(pages)}")

    changed = 0
    skipped = 0
    for path, slug, data in sorted(pages, key=lambda x: x[0]):
        rel = os.path.relpath(path, ROOT)
        try:
            if fix_file(path, slug, data):
                print(f"  ✓ {rel}")
                changed += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"  ✗ {rel} — ERREUR: {e}", file=sys.stderr)

    print(f"\nRésultat : {changed} pages modifiées, {skipped} inchangées.")
