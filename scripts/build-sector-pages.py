#!/usr/bin/env python3
"""
build-sector-pages.py

Pages secteur (site-web-*/) et pages de service (création de site, landing page, agence web, audit,
SEO local, refonte) construites sur le modèle exact de l'accueil (index.html).
Le contenu propre à chaque page vient de data/sectors.json et data/services.json : titre, sous-titre,
blocs de texte, cartes, FAQ et, pour les secteurs, textes des visuels animés de l'« offre tout compris ».
Le <head> SEO (title, description, canonical, Open Graph, JSON-LD) est repris de la page existante ;
seule la FAQ du JSON-LD est régénérée, à partir du texte visible.

Usage : python3 scripts/build-sector-pages.py [slug…]   puis   node scripts/version-assets.mjs
À relancer quand l'accueil change, pour que les pages secteur restent alignées.
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = {**json.loads((ROOT / 'data' / 'sectors.json').read_text()), **json.loads((ROOT / 'data' / 'services.json').read_text())}
TEMPLATES = {'fr': (ROOT / 'index.html').read_text(), 'en': (ROOT / 'en' / 'index.html').read_text()}
TEMPLATE = TEMPLATES['fr']
CAL = 'https://cal.com/maxens-soldan-msd-media/30min'

esc = html.escape
strip = lambda h: html.unescape(re.sub(r'<[^>]+>', '', h)).strip()


def section(src, cls):
    """Renvoie la section <section class="cls…">…</section> (première occurrence) de src."""
    m = re.search(r'[ \t]*<section class="' + re.escape(cls) + r'\b[^"]*"[^>]*>.*?</section>\n?', src, re.S)
    if not m:
        raise ValueError(f'section {cls} absente du modèle')
    return m


# ---------- Head : SEO de la page, technique (polices, CSS, suivi, consentement) de l'accueil ----------
SEO_PATTERNS = [
    r'[ \t]*<title>.*?</title>\n?',
    r'[ \t]*<meta name="(?:description|title|keywords|robots|googlebot|bingbot|author|geo\.[a-z]+|ICBM)"[^>]*>\n?',
    r'[ \t]*<meta property="(?:og|article):[^"]+"[^>]*>\n?',
    r'[ \t]*<meta name="twitter:[^"]+"[^>]*>\n?',
    r'[ \t]*<link rel="(?:canonical|alternate)"[^>]*>\n?',
    r'[ \t]*<script[^>]*type="application/ld\+json"[^>]*>.*?</script>\n?',
    r'[ \t]*<!-- (?:Mots-clés|Auteur|Canonical|Open Graph[^>]*|Twitter Card) -->\n?',
]


def seo_head(page_head):
    parts = []
    for pat in SEO_PATTERNS:
        parts += [m.group(0).strip() for m in re.finditer(pat, page_head, re.S) if not m.group(0).strip().startswith('<!--')]
    return parts


def build_head(page_html, faq, template=TEMPLATE):
    tpl_head = template[template.index('<head>') + 6:template.index('</head>')]
    for pat in SEO_PATTERNS:
        tpl_head = re.sub(pat, '', tpl_head, flags=re.S)
    page_head = page_html[page_html.index('<head>') + 6:page_html.index('</head>')]
    seo = seo_head(page_head)
    # FAQ du JSON-LD = texte visible de la FAQ de la page
    for i, block in enumerate(seo):
        m = re.match(r'(<script[^>]*type="application/ld\+json"[^>]*>)(.*?)(</script>)', block, re.S)
        if not m:
            continue
        data = json.loads(m.group(2))
        nodes = data.get('@graph', [data])
        for n in nodes:
            if n.get('@type') == 'FAQPage':
                n['mainEntity'] = [{'@type': 'Question', 'name': strip(q['q']), 'acceptedAnswer': {'@type': 'Answer', 'text': strip(q['a'])}} for q in faq]
        seo[i] = m.group(1) + json.dumps(data, ensure_ascii=False) + m.group(3)
    head = '\n  ' + '\n  '.join(seo) + tpl_head
    head = head.replace('assets/css/home-v2', 'assets/css/home-v2', 1)
    head = re.sub(r'([ \t]*<link rel="stylesheet" href="((?:\.\./)*)assets/css/home-v2[^"]*">)', r'\1\n  <link rel="stylesheet" href="\2assets/css/sector-v2.css">', head, count=1)
    return head


# ---------- Corps ----------
def hero(body, d):
    # Titre toujours sur deux lignes : « On fait des sites web » / « pour les médecins. »
    # (pages de service : les deux lignes viennent de data/services.json)
    first, sep, rest = d['h1'].partition(' pour ')
    lines = d.get('h1_lines') or ([first, sep.strip() + ' ' + rest] if sep else [d['h1']])
    chars = max(len(l) for l in lines)
    h1 = ' '.join(f'<span class="h1-line">{esc(l)}</span>' for l in lines)
    # Secteurs : deux lignes partout (taille ajustée sur mobile). Services : deux lignes sur ordinateur,
    # retour à la ligne normal sur mobile (leurs lignes sont trop longues pour tenir en entier).
    cls = 'h1-split' if 'h1_lines' not in d else 'h1-split h1-split--wrap'
    if len(lines) == 1:
        h1, cls = esc(lines[0]), ''
    attrs = f' class="{cls}" style="--chars:{chars}"' if cls else ''
    body = re.sub(r'(<section class="hero">.*?)<h1>.*?</h1>', lambda m: m.group(1) + f'<h1{attrs}>{h1}</h1>', body, count=1, flags=re.S)
    body = re.sub(r'(<p class="hero__sub">).*?(</p>)', lambda m: m.group(1) + d['subtitle'] + m.group(2), body, count=1, flags=re.S)
    return body


def story(d):
    rows = []
    f = d.get('focus')
    if f:
        paras = '\n'.join(f'          <p>{p}</p>' for p in f['paragraphs'])
        links = ''.join(f'<a href="{l["href"]}">{esc(l["label"])}</a>' for l in f.get('links', []))
        nav = f'\n          <nav class="story__links" aria-label="{esc(f.get("nav_label") or "Nos prestations")}">{links}</nav>' if links else ''
        rows.append(f'''        <div class="story__focus">
          <h2 class="story__title">{f['title']}</h2>
{paras}{nav}
        </div>''')
    for i, b in enumerate(d['story']):
        paras = '\n'.join(f'            <p>{p}</p>' for p in b['paragraphs'])
        eyebrow = f'<span class="story__eyebrow">{esc(b["eyebrow"])}</span>\n            ' if b.get('eyebrow') else ''
        # Visuel animé (même famille que l'offre tout compris de l'accueil) ou photo
        if b.get('viz'):
            media = f'<div class="story__img story__img--viz"><div class="feat">{b["viz"]}</div></div>'
        else:
            media = f'<div class="story__img"><img src="{b["img"]}" alt="{esc(b["alt"] or "")}" width="{b["width"]}" height="{b["height"]}" loading="lazy" decoding="async"></div>'
        rows.append(f'''        <div class="story__row{' story__row--reverse' if i % 2 else ''}">
          <div class="story__text">
            {eyebrow}<h2 class="story__title">{b['title']}</h2>
{paras}
          </div>
          {media}
        </div>''')
    return f'''    <section class="story" id="secteur">
      <div class="container">
{chr(10).join(rows)}
      </div>
    </section>
'''


def card_sections(d):
    out = []
    for sec in d['cards']:
        items = []
        for c in sec['cards']:
            num = f'<span class="scard__num">{c["num"]}</span>' if c.get('num') else ''
            link = f'<span class="scard__link">{esc(c["link"] or "Voir la page")} <svg><use href="#i-arrow"/></svg></span>' if c.get('href') else ''
            inner = f'{num}<h3>{c["title"]}</h3><p>{c["text"]}</p>{link}'
            if c.get('href'):
                ext = ' target="_blank" rel="noopener noreferrer"' if c.get('external') else ''
                items.append(f'          <a class="scard" href="{c["href"]}"{ext}>{inner}</a>')
            else:
                items.append(f'          <article class="scard">{inner}</article>')
        intro = ''.join(f'\n        <p class="sub">{p}</p>' for p in sec['intro'])
        outro = ''.join(f'\n        <p class="scards__outro">{p}</p>' for p in sec.get('outro', []))
        sid = f' id="{sec["id"]}"' if sec.get('id') else ''
        out.append(f'''    <section class="scards"{sid}>
      <div class="container">
        <h2 class="h2">{sec['title']}</h2>{intro}
        <div class="scards__grid scards__grid--{min(len(sec['cards']), 5)}">
{chr(10).join(items)}
        </div>{outro}
      </div>
    </section>
''')
    return ''.join(out)


def package(body, d):
    # Pages de service : l'offre de l'accueil telle quelle
    if 'package' not in d:
        return body
    p = d['package']
    m = section(body, 'package')
    pkg = m.group(0)
    sub = f'Pensé pour {p["pour"]} qui veulent un site à la hauteur. Design, textes et technique réunis.'
    pkg = re.sub(r'<h2 class="h2">.*?</h2>', f'<h2 class="h2">Tout ce dont le site {esc(p["who"])} a besoin, dans une seule offre.</h2>', pkg, count=1, flags=re.S)
    pkg = re.sub(r'<p class="sub">.*?</p>', f'<p class="sub">{esc(sub)}</p>', pkg, count=1, flags=re.S)
    # 1. Maquette du site du secteur
    pkg = pkg.replace('<span class="viz-url">votre-site.fr</span>', f'<span class="viz-url">{esc(p["url"])}</span>')
    pkg = re.sub(r'<div class="viz-hero">\s*<div>.*?</div>', f'''<div class="viz-hero">
<div>
<span class="viz-brand">{esc(p["brand"])}</span>
<span class="viz-hero__title">{esc(p["hero"])}</span>
<span class="viz-line viz-line--md"></span>
<span class="viz-btn">{esc(p["cta"])}</span>
</div>''', pkg, count=1, flags=re.S)
    # 2. Copywriting : version « conformité » pour les métiers de santé
    if p.get('health'):
        copy = f'''<div class="viz viz--copy viz--comply" aria-hidden="true">
<div class="viz-doc">
<p class="viz-doc__label">Titre de la page d'accueil</p>
<p class="viz-doc__before">{esc(p["before"])}</p>
<span class="viz-flag viz-flag--bad">✕ Promesse de résultat</span>
<p class="viz-doc__after">{esc(p["after"])}</p>
<span class="viz-flag viz-flag--ok">✓ Information loyale et claire</span>
</div>
</div>
<h3>Textes conformes à votre déontologie</h3><p>Chaque phrase relue au regard des règles de votre profession, avant la mise en ligne.</p>'''
    else:
        copy = f'''<div class="viz viz--copy" aria-hidden="true">
<div class="viz-doc">
<p class="viz-doc__label">Titre de la page d'accueil</p>
<p class="viz-doc__before">{esc(p["before"])}</p>
<p class="viz-doc__after">{esc(p["after"])}</p>
<span class="viz-line viz-line--lg"></span><span class="viz-line viz-line--md"></span>
<span class="viz-doc__tag">✓ Validé par le client</span>
</div>
</div>
<h3>Copywriting orienté conversion</h3><p>Des textes rédigés après un échange avec vous, puis validés ensemble.</p>'''
    pkg = re.sub(r'<div class="viz viz--copy".*?</p>\s*(?=</div>)', copy + '\n', pkg, count=1, flags=re.S)
    # 3. SEO : la recherche se tape, puis le site apparaît en tête
    seo = f'''<div class="viz viz--seo viz--search" aria-hidden="true">
<div class="viz-search"><svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10.5 10.5 14 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg><span class="viz-search__q" style="--n:{len(p["query"])}">{esc(p["query"])}</span></div>
<div class="viz-serp">
<span class="viz-serp__rank">1</span>
<span class="viz-serp__url"><i>m</i>{esc(p["url"])}</span>
<span class="viz-serp__title">{esc(p["serp"])}</span>
<span class="viz-line viz-line--lg"></span><span class="viz-line viz-line--md"></span>
</div>
<div class="viz-gauge"><b>99</b><small>Performance</small></div>
</div>'''
    pkg = re.sub(r'<div class="viz viz--seo".*?<div class="viz-gauge">.*?</div>\s*</div>', seo, pkg, count=1, flags=re.S)
    # 5. Prise de rendez-vous : le curseur choisit un créneau, puis la confirmation s'affiche
    rdv = f'''<div class="viz viz--rdv viz--book" aria-hidden="true">
<div class="viz-cal">
<p class="viz-cal__head">{esc(p["rdv_head"])}</p>
<div class="viz-cal__days"><span>L</span><span>M</span><span class="is-on">M</span><span>J</span><span>V</span></div>
<div class="viz-cal__slots"><span>09:30</span><span class="viz-cal__pick">11:00</span><span>14:30</span><span>16:00</span></div>
<span class="viz-cal__btn">{esc(p["rdv_btn"])}</span>
</div>
<span class="viz-pointer"></span>
<span class="viz-toast"><b>✓</b>{esc(p["toast"])}</span>
</div>
<h3>{esc(p["rdv_title"])}</h3><p>{esc(p["rdv_desc"])}</p>'''
    pkg = re.sub(r'<div class="viz viz--rdv".*?</p>\s*(?=</div>)', rdv + '\n', pkg, count=1, flags=re.S)
    # 7. Suivi des conversions : étapes du secteur
    labels = iter(p['funnel'])
    pkg = re.sub(r'(<div class="viz-funnel__row"><span>)[^<]*(</span>)', lambda m: m.group(1) + esc(next(labels)) + m.group(2), pkg)
    pkg = pkg.replace('<span class="c-tag">&lt;h1&gt;</span>Votre activité, en ligne', f'<span class="c-tag">&lt;h1&gt;</span>{esc(p["hero"])}', 1)
    pkg = pkg.replace('&gt;</span>Prendre RDV<span class="c-tag">', f'&gt;</span>{esc(p["cta"])}<span class="c-tag">', 1)
    return body[:m.start()] + pkg + body[m.end():]


def faq(body, d):
    items = [f'            <details class="faq__item"><summary>{esc(q["q"])}</summary>{q["a"] if q["a"].lstrip().startswith("<p") else "<p>" + q["a"] + "</p>"}</details>' for q in d['faq']]
    half = (len(items) + 1) // 2
    grid = f'''<div class="faq__grid">
          <div class="faq__col">
{chr(10).join(items[:half])}
          </div>
          <div class="faq__col">
{chr(10).join(items[half:])}
          </div>
        </div>'''
    m = section(body, 'faq')
    sec = m.group(0)
    sec = re.sub(r'<div class="faq__grid">.*</div>\s*</div>\s*(?=</div>\s*</section>)', grid + '\n      ', sec, count=1, flags=re.S)
    if d.get('faq_title'):
        title = d['faq_title']
    elif 'package' in d:
        title = f'Questions fréquentes : site internet pour {d["package"]["label"]}'
    else:
        topic = d['h1_lines'][0].split(',')[0].rstrip('.')
        title = f'Questions fréquentes : {topic[0].lower() + topic[1:]}'
    sec = re.sub(r'<h2 class="h2">.*?</h2>', f'<h2 class="h2">{esc(title)}</h2>', sec, count=1)
    return body[:m.start()] + sec + body[m.end():]


def build(slug):
    d = DATA[slug]
    lang = d.get('lang', 'fr')
    template = TEMPLATES[lang]
    page_path = ROOT / slug / 'index.html'
    page = page_path.read_text()
    body = template[template.index('<body'):template.index('</html>')]
    body = re.sub(r'<body[^>]*>', '<body class="sector-page">', body, count=1)
    body = hero(body, d)
    m = section(body, 'belief')
    body = body[:m.start()] + story(d) + card_sections(d) + body[m.end():]
    body = package(body, d)
    body = faq(body, d)
    # Sélecteur de langue : renvoie vers la version de cette page dans l'autre langue
    for code, url in (d.get('alternates') or {}).items():
        body = re.sub(r'(<li><a href=")[^"]*(" data-lang="' + code + r'")', lambda m: m.group(1) + url + m.group(2), body, count=1)
    head = build_head(page, d['faq'], template)
    out = f'<!DOCTYPE html>\n<html lang="{lang}">\n<head>' + head + '</head>\n' + body + '</html>\n'
    # Chemins relatifs recalés sur la profondeur de la page (le modèle anglais est déjà un niveau plus bas)
    depth = len(Path(slug).parts)
    out = re.sub(r'(["\'(])(?:\.\./)*assets/', lambda m: m.group(1) + '../' * depth + 'assets/', out)
    page_path.write_text(out)
    return len(d['faq'])


if __name__ == '__main__':
    slugs = sys.argv[1:] or sorted(DATA)
    for slug in slugs:
        n = build(slug)
        print(f'{slug} : page reconstruite ({n} questions de FAQ).')
