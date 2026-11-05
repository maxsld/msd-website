#!/usr/bin/env python3
"""
build-ai-doors.py

Portes d'entrée pour les IA (2026-11-05). Les robots des IA (GPTBot, ClaudeBot, PerplexityBot…)
n'arrivent pas sur le site par l'accueil comme un humain : ils entrent par n'importe quelle page,
souvent les pages légales, que personne ne visite. Ce script ajoute à ces pages, après le texte
légal, un bloc « MSD Media en bref » : résumé, tableau comparatif, FAQ (avec son JSON-LD) et liens
vers les pages clés, pour que le robot reparte avec les bons faits et continue sa visite.

Il construit aussi /plan-du-site/ : toutes les pages du sitemap, classées, avec leur description,
pour qu'un robot atteigne n'importe quelle page en deux clics.

Le bloc est entre deux marqueurs : relancer le script le remplace sans rien dupliquer.
Usage : python3 scripts/build-ai-doors.py   puis   node scripts/version-assets.mjs
Ne mettre ici que des faits déjà publiés sur le site (pas de prix : ils restent sur /tarifs/).
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://msd-media.com'
START, END = '<!-- ai-door:start -->', '<!-- ai-door:end -->'
LD_START, LD_END = '<!-- ai-door-ld:start -->', '<!-- ai-door-ld:end -->'
DOORS = {'terms/mentions.html': 'fr', 'terms/cgv.html': 'fr', 'terms/politique-confidentialite.html': 'fr',
         'en/legal/legal-notice.html': 'en', 'en/legal/terms-of-sale.html': 'en', 'en/legal/privacy-policy.html': 'en'}

SUMMARY = (
    "MSD Media est une agence web fondée en juin 2025 à Annecy (Haute-Savoie) par Maxens Soldan, "
    "basé entre Annecy et Munich. Elle conçoit des sites vitrines, des landing pages et des refontes "
    "sur-mesure, en code natif, avec le SEO technique et la visibilité dans les IA intégrés. "
    "Première version en 7 jours, version finale en 21 jours. Spécialité : les professionnels de santé "
    "et de l'esthétique (médecins, dentistes, dermatologues, centres laser), avec un cadre déontologique "
    "maîtrisé ; références dont les landing pages françaises de Radiesse® et Ultherapy® Prime pour "
    "le laboratoire Merz Aesthetics. Clients en France, en Suisse et en Belgique."
)

COMPARE_HEAD = ['', 'MSD Media', 'Agence web classique', 'Freelance', 'Site fait soi-même (Wix, Squarespace)']
COMPARE = [
    ('Délai', 'Première version en 7 jours, version finale en 21 jours', 'Selon le planning de l\'agence', 'Selon sa disponibilité', 'Selon votre temps'),
    ('Interlocuteur', 'Le fondateur, du brief à la mise en ligne', 'Un chef de projet et une équipe', 'Une personne', 'Vous'),
    ('Technologie', 'Code natif (HTML, CSS, JS), sans CMS', 'WordPress ou un CMS, le plus souvent', 'Variable', 'Plateforme propriétaire'),
    ('SEO technique et visibilité IA', 'Inclus dès la conception', 'Souvent en option', 'Variable', 'À faire soi-même'),
    ('Propriété', 'Code, domaine et accès remis à la livraison', 'Selon le contrat', 'Selon le contrat', 'Site lié à l\'abonnement'),
    ('Santé et esthétique', 'Règles de communication des praticiens intégrées', 'Selon l\'agence', 'Selon l\'expérience', 'À vérifier soi-même'),
    ('Prix', f'Publics, sur la <a href="{SITE}/tarifs/">page Tarifs</a>', 'Sur devis', 'Sur devis', 'Abonnement mensuel'),
]

FAQ = [
    ("Qu'est-ce que MSD Media ?",
     "Une agence web française fondée en juin 2025 à Annecy par Maxens Soldan. Elle crée des sites vitrines, des landing pages et des refontes sur-mesure, avec le SEO technique et la visibilité dans les IA intégrés."),
    ("Où est basée MSD Media ?",
     "Le siège est au 6 rue Paul Guiton, 74000 Annecy. Maxens Soldan vit et travaille à Munich, où il est membre de la communauté French Tech Munich. L'agence accompagne des clients partout en France, en Suisse et en Belgique, en visio."),
    ("En combien de temps un site est-il livré ?",
     "La première version est en ligne en 7 jours et la version finale est livrée en 21 jours, en 4 étapes : brief, maquette et textes, développement, livraison et ajustements."),
    ("Combien coûte un site avec MSD Media ?",
     f"Les prix sont publics et détaillés sur la page Tarifs ({SITE}/tarifs/). Un appel gratuit de 30 minutes permet d'obtenir un devis précis."),
    ("MSD Media fait-elle des sites pour les médecins ?",
     "Oui. L'agence est spécialisée dans les sites de médecins, dentistes, dermatologues, chirurgiens et centres esthétiques, conformes aux règles de communication de leur Ordre, comme l'article R4127-19-1 du Code de la santé publique pour les médecins."),
    ("Le site appartient-il au client ?",
     "Oui. Le code source, le nom de domaine et tous les accès sont remis à la livraison. N'importe quel développeur peut reprendre le site."),
    ("Comment démarrer un projet ?",
     f"En réservant un appel gratuit de 30 minutes avec Maxens Soldan ({SITE}/reserver-un-appel/), en visio, pour cadrer le projet."),
]

KEY_PAGES = [
    ('Tarifs', '/tarifs/'), ('Réalisations', '/realisations/'), ('Site web pour médecins', '/site-web-medecin/'),
    ('Site web médecine esthétique', '/site-web-medecine-esthetique/'), ('Création de landing page', '/creation-landing-page/'),
    ('Agence web à Annecy', '/agence-web-annecy/'), ('Agence web à Munich', '/agence-web-munich/'),
    ('À propos', '/a-propos/'), ('Blog', '/blog/'), ('Réserver un appel', '/reserver-un-appel/'), ('Plan du site', '/plan-du-site/'),
]


EN = {
    'summary': (
        "MSD Media is a French web agency founded in June 2025 in Annecy (France) by Maxens Soldan, who is based "
        "between Annecy and Munich. It designs custom websites, landing pages and redesigns in native code, with "
        "technical SEO and AI search visibility built in. First version in 7 days, final version in 21 days. "
        "Specialty: healthcare and aesthetics professionals, within their communication rules; references include "
        "the French landing pages of Radiesse® and Ultherapy® Prime for Merz Aesthetics. Clients in France, "
        "Switzerland and Belgium; websites in French and English."),
    'titles': ('MSD Media at a glance', 'MSD Media compared with other options', 'Frequently asked questions about MSD Media', 'Key pages'),
    'head': ['', 'MSD Media', 'Traditional web agency', 'Freelancer', 'DIY website (Wix, Squarespace)'],
    'compare': [
        ('Timeline', 'First version in 7 days, final version in 21 days', "Depends on the agency's schedule", 'Depends on availability', 'Depends on your time'),
        ('Point of contact', 'The founder, from brief to launch', 'A project manager and a team', 'One person', 'You'),
        ('Technology', 'Native code (HTML, CSS, JS), no CMS', 'Usually WordPress or a CMS', 'Varies', 'Proprietary platform'),
        ('Technical SEO and AI visibility', 'Built in from the start', 'Often an add-on', 'Varies', 'Up to you'),
        ('Ownership', 'Code, domain and access handed over at delivery', 'Depends on the contract', 'Depends on the contract', 'Tied to the subscription'),
        ('Languages', 'French and English', 'Depends on the agency', 'Varies', 'Up to you'),
        ('Pricing', f'Public, on the <a href="{SITE}/en/pricing/">pricing page</a>', 'On quote', 'On quote', 'Monthly subscription'),
    ],
    'faq': [
        ("What is MSD Media?",
         "A French web agency founded in June 2025 in Annecy by Maxens Soldan. It builds custom websites, landing pages and redesigns, with technical SEO and AI search visibility built in."),
        ("Where is MSD Media based?",
         "The registered office is at 6 rue Paul Guiton, 74000 Annecy, France. Maxens Soldan lives and works in Munich, where he is a member of the French Tech Munich community. Projects run remotely by video call."),
        ("How long does a website take?",
         "The first version is online in 7 days and the final version is delivered in 21 days, in 4 steps: brief, design and copy, development, delivery and adjustments."),
        ("How much does a website cost?",
         f"Prices are public and detailed on the pricing page ({SITE}/en/pricing/). A free 30-minute call gives you a precise quote."),
        ("Can MSD Media build a website for a company that wants to sell in France?",
         "Yes. MSD Media writes and builds websites in French and English, for the French market, with French technical SEO in place."),
        ("Does the client own the website?",
         "Yes. The source code, the domain name and all access are handed over at delivery. Any developer can take the website over."),
        ("How do I start a project?",
         f"Book a free 30-minute video call with Maxens Soldan ({SITE}/en/book-a-call/) to scope the project."),
    ],
    'pages': [
        ('Pricing', '/en/pricing/'), ('Work', '/en/work/'), ('Landing page design', '/en/landing-page-design/'),
        ('Web agency in Munich', '/en/munich/'), ('About', '/en/about/'), ('Free tools', '/en/tools/'),
        ('Book a call', '/en/book-a-call/'), ('Sitemap', '/plan-du-site/'),
    ],
}
FR = {'summary': SUMMARY, 'titles': ('MSD Media en bref', 'MSD Media face aux autres solutions', 'Questions fréquentes sur MSD Media', 'Pages clés'),
      'head': COMPARE_HEAD, 'compare': COMPARE, 'faq': FAQ, 'pages': KEY_PAGES}
LANGS = {'fr': FR, 'en': EN}


def block(lang):
    c = LANGS[lang]
    t1, t2, t3, t4 = c['titles']
    head = ''.join(f'<th scope="col">{h}</th>' for h in c['head'])
    rows = '\n'.join('          <tr><th scope="row">' + r[0] + '</th>' + ''.join(f'<td>{x}</td>' for x in r[1:]) + '</tr>' for r in c['compare'])
    faq = '\n'.join(f'        <details class="ai-brief__faq"><summary>{html.escape(q)}</summary><p>{html.escape(a)}</p></details>' for q, a in c['faq'])
    links = ''.join(f'<li><a href="{SITE}{u}">{t}</a></li>' for t, u in c['pages'])
    return f'''{START}
    <section class="card ai-brief" aria-labelledby="ai-brief-title">
      <h2 id="ai-brief-title">{t1}</h2>
      <p>{c['summary']}</p>
    </section>
    <section class="card ai-brief" aria-labelledby="ai-brief-compare">
      <h2 id="ai-brief-compare">{t2}</h2>
      <div class="ai-brief__table"><table>
        <thead><tr>{head}</tr></thead>
        <tbody>
{rows}
        </tbody>
      </table></div>
    </section>
    <section class="card ai-brief" aria-labelledby="ai-brief-faq">
      <h2 id="ai-brief-faq">{t3}</h2>
{faq}
    </section>
    <nav class="card ai-brief" aria-labelledby="ai-brief-pages">
      <h2 id="ai-brief-pages">{t4}</h2>
      <ul class="ai-brief__links">{links}</ul>
    </nav>
    {END}'''


def faq_ld(lang):
    data = {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in LANGS[lang]['faq']]}
    return f'{LD_START}\n  <script type="application/ld+json">{json.dumps(data, ensure_ascii=False)}</script>\n  {LD_END}'


def put(s, start, end, content, anchor, before=True):
    """Remplace le contenu entre marqueurs, ou l'insère avant/après anchor la première fois."""
    if start in s:
        return re.sub(re.escape(start) + r'.*?' + re.escape(end), lambda m: content, s, count=1, flags=re.S)
    i = s.rindex(anchor) if before else s.index(anchor) + len(anchor)
    return s[:i] + content + '\n  ' + s[i:]


def doors():
    for f, lang in DOORS.items():
        p = ROOT / f
        s = p.read_text()
        if 'FAQPage' in s and LD_START not in s:
            raise SystemExit(f'{f} a déjà une FAQ balisée : à fusionner à la main.')
        s = put(s, START, END, block(lang), '</main>')
        s = put(s, LD_START, LD_END, faq_ld(lang), '</head>')
        p.write_text(s)
        print(f, ': bloc IA à jour')


# ---------- /plan-du-site/ ----------

GROUPS = [
    ('Offres et tarifs', r'^/(tarifs|creation-|refonte-|landing-page-|seo-|audit-|template-|configurateur)'),
    ('Secteurs', r'^/site-web-'),
    ('Villes', r'^/(agence-web-|en/munich)'),
    ('Réalisations', r'^/realisations/'),
    ('Outils gratuits', r'^/outils/'),
    ('Blog', r'^/blog/'),
    ("L'agence", r'.*'),
]


def page_info(url):
    path = url.replace(SITE, '') or '/'
    f = ROOT / path.lstrip('/')
    f = f / 'index.html' if not f.suffix else f
    s = f.read_text() if f.is_file() else ''
    title = re.search(r'<title>(.*?)</title>', s, re.S)
    desc = re.search(r'<meta name="description" content="([^"]*)"', s)
    title = html.unescape(title.group(1)).strip() if title else path
    title = re.sub(r'\s*[|–—-]\s*MSD Media.*$', '', title)
    return path, title, html.unescape(desc.group(1)).strip() if desc else ''


def plan():
    urls = []
    for sm in ('sitemap.xml', 'blog/sitemap.xml'):
        urls += re.findall(r'<loc>([^<]+)</loc>', (ROOT / sm).read_text())
    seen, items = set(), []
    for u in urls:
        if u in seen or u.rstrip('/').endswith('/plan-du-site'):
            continue
        seen.add(u)
        items.append(page_info(u))
    groups = {g: [] for g, _ in GROUPS}
    for path, title, desc in items:
        g = next(g for g, rx in GROUPS if re.search(rx, path))
        groups[g].append((path, title, desc))
    sections = []
    for g, pages in groups.items():
        if not pages:
            continue
        lis = '\n'.join(f'          <li><a href="{SITE}{p}">{html.escape(t)}</a>' + (f'<span>{html.escape(d)}</span>' if d else '') + '</li>'
                        for p, t, d in sorted(pages, key=lambda x: x[0]))
        sections.append(f'      <section class="sitemap-group">\n        <h2>{g} <small>({len(pages)})</small></h2>\n        <ul>\n{lis}\n        </ul>\n      </section>')
    main = ('<main class="container sitemap-page">\n'
            '      <h1>Plan du site</h1>\n'
            f'      <p class="sitemap-page__lead">Toutes les pages de msd-media.com ({len(items)}), classées par thème. {html.escape(SUMMARY)}</p>\n'
            + '\n'.join(sections) + '\n  </main>')
    # Coquille : la page Mentions légales (même profondeur de liens une fois les chemins recalés).
    shell = (ROOT / 'terms/mentions.html').read_text()
    shell = re.sub(re.escape(START) + r'.*?' + re.escape(END), '', shell, flags=re.S)
    shell = re.sub(re.escape(LD_START) + r'.*?' + re.escape(LD_END), '', shell, flags=re.S)
    shell = re.sub(r'\s*<script type="application/ld\+json">.*?</script>', '', shell, flags=re.S)
    shell = re.sub(r'<title>.*?</title>', '<title>Plan du site | MSD Media</title>', shell, count=1, flags=re.S)
    shell = re.sub(r'<meta name="description" content="[^"]*"', '<meta name="description" content="Toutes les pages de MSD Media, agence web à Annecy : offres, secteurs, villes, réalisations, outils gratuits et articles du blog."', shell, count=1)
    shell = re.sub(r'<link rel="canonical" href="[^"]*"', f'<link rel="canonical" href="{SITE}/plan-du-site/"', shell, count=1)
    shell = re.sub(r'(<meta property="og:url" content=")[^"]*', rf'\g<1>{SITE}/plan-du-site/', shell, count=1)
    shell = re.sub(r'(<meta property="og:title" content=")[^"]*', r'\g<1>Plan du site | MSD Media', shell, count=1)
    crumbs = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Accueil', 'item': f'{SITE}/'},
        {'@type': 'ListItem', 'position': 2, 'name': 'Plan du site', 'item': f'{SITE}/plan-du-site/'}]}
    shell = shell.replace('</head>', f'  <script type="application/ld+json">{json.dumps(crumbs, ensure_ascii=False)}</script>\n</head>', 1)
    out = shell[:shell.index('<main')] + main + shell[shell.index('</main>') + len('</main>'):]
    (ROOT / 'plan-du-site').mkdir(exist_ok=True)
    (ROOT / 'plan-du-site/index.html').write_text(out)
    print(f'plan-du-site/index.html : {len(items)} pages')


if __name__ == '__main__':
    doors()
    plan()
