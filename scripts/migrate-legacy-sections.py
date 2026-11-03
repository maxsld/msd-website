#!/usr/bin/env python3
"""
migrate-legacy-sections.py

Refonte 2026 : remplace, dans les pages qui ne sont pas construites sur le modèle de l'accueil
(tarifs, outils, à propos, presse, études de cas…), les anciennes sections communes par leur
version de l'accueil (index.html) :
  - réalisations (realisations-section) → « Nos réalisations récentes » (work)
  - process (process-section)            → frise 21 jours (process)
  - éco-conception (eco-section)         → bloc Environnement (eco)
  - avis (section-reviews)               → avis de l'accueil
  - « Demander à l'IA » (ai-proof)       → version de l'accueil
  - FAQ à onglets (faq section-grid)     → FAQ en deux colonnes, mêmes questions et réponses
  - blocs texte + photo (content-alt)    → blocs « story »
  - citation presse (founder-section)    → retirée (absente de l'accueil)
Le texte de la FAQ ne change pas : son JSON-LD reste valide.
Les icônes du sprite SVG de l'accueil sont recopiées en ligne : les sections n'en dépendent pas.

Usage : python3 scripts/migrate-legacy-sections.py <page.html>…   puis   node scripts/version-assets.mjs
"""
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOME = (ROOT / 'index.html').read_text()
esc = html.escape
strip = lambda h: html.unescape(re.sub(r'<[^>]+>', '', h)).strip()

SYMBOLS = {m.group(1): (m.group(2), m.group(3)) for m in re.finditer(r'<symbol id="([^"]+)" viewBox="([^"]+)">(.*?)</symbol>', HOME, re.S)}


def inline_icons(markup):
    """<svg …><use href="#i-x"/></svg> → <svg … viewBox="…">contenu du symbole</svg>."""
    def rep(m):
        attrs, name = m.group(1), m.group(2)
        vb, inner = SYMBOLS[name]
        return f'<svg{attrs} viewBox="{vb}">{inner}</svg>'
    return re.sub(r'<svg([^>]*)><use href="#([\w-]+)"/></svg>', rep, markup)


def home_section(cls):
    m = re.search(r'[ \t]*<section class="' + re.escape(cls) + r'\b[^"]*"[^>]*>.*?</section>\n?', HOME, re.S)
    return inline_icons(m.group(0))


CLIENT_LOGOS = re.findall(r'<img[^>]*class="client-logos__img[^"]*"[^>]*>', HOME)


def reviews_section():
    sec = home_section('section-reviews')
    # Le bandeau de logos est rempli par le script de l'accueil à partir de la grille de logos du hero,
    # absente de ces pages : on le remplit ici, en deux séries pour la boucle.
    logos = []
    for _ in range(2):
        for img in CLIENT_LOGOS:
            mono = ' is-mono' if 'is-mono' in img else ''
            img = re.sub(r'class="[^"]*"', f'class="logo-marquee__img{mono}"', img)
            img = re.sub(r'alt="[^"]*"', 'alt=""', img)
            logos.append(img)
    return sec.replace('<div class="logo-marquee__track"></div>', '<div class="logo-marquee__track">' + ''.join(logos) + '</div>', 1)


def legacy(src, cls):
    """Sections dont la classe commence par cls (gère les sections imbriquées par simple comptage)."""
    out = []
    for m in re.finditer(r'[ \t]*<section class="' + re.escape(cls) + r'\b[^"]*"[^>]*>', src):
        depth, i = 0, m.start()
        for t in re.finditer(r'<(/?)section\b', src[m.start():]):
            depth += -1 if t.group(1) else 1
            if depth == 0:
                end = m.start() + t.end() + src[m.start() + t.end():].index('>') + 1
                out.append((m.start(), end))
                break
    return out


def faq_section(old):
    title = strip(re.sub(r'<br\s*/?>', ' ', (re.search(r'<h[23][^>]*>(.*?)</h[23]>', old, re.S) or [None, 'Questions fréquentes'])[1]))
    title = re.sub(r'\s+', ' ', title)
    if title.lower().startswith('des questions'):
        title = 'Questions fréquentes'
    items = []
    for q, a in re.findall(r'<button class="faq-question"[^>]*>\s*<span[^>]*>(.*?)</span>.*?</button>\s*<div class="faq-answer"[^>]*>(.*?)</div>\s*</div>', old, re.S):
        a = a.strip()
        items.append(f'            <details class="faq__item"><summary>{q.strip()}</summary>{a if a.startswith("<p") else "<p>" + a + "</p>"}</details>')
    half = (len(items) + 1) // 2
    return f'''    <section class="faq" id="faq">
      <div class="container">
        <h2 class="h2">{esc(title)}</h2>
        <div class="faq__grid">
          <div class="faq__col">
{chr(10).join(items[:half])}
          </div>
          <div class="faq__col">
{chr(10).join(items[half:])}
          </div>
        </div>
      </div>
    </section>
''', len(items)


def story_section(old):
    rows = []
    for i, art in enumerate(re.findall(r'<article class="about-alt-block[^"]*"[^>]*>(.*?)</article>', old, re.S)):
        img = re.search(r'<img[^>]*>', art).group(0)
        txt = art[art.index('about-alt-text'):]
        txt = txt[txt.index('>') + 1:]
        tag = re.search(r'<(?:span|p) class="section-tag[^"]*"[^>]*>(.*?)</(?:span|p)>', txt, re.S)
        h = re.search(r'<h[23][^>]*>(.*?)</h[23]>', txt, re.S)
        paras = [p.strip() for p in re.findall(r'<p(?: [^>]*)?>(.*?)</p>', txt, re.S) if not (tag and p.strip() == tag.group(1).strip())]
        extra = ''.join(re.findall(r'<(?:a|div) class="[^"]*(?:btn|actions)[^"]*".*?</(?:a|div)>', txt, re.S))
        eyebrow = f'<span class="story__eyebrow">{strip(tag.group(1))}</span>\n            ' if tag else ''
        body = '\n'.join(f'            <p>{p}</p>' for p in paras)
        rows.append(f'''        <div class="story__row{' story__row--reverse' if i % 2 else ''}">
          <div class="story__text">
            {eyebrow}<h2 class="story__title">{h.group(1).strip() if h else ''}</h2>
{body}{extra}
          </div>
          <div class="story__img">{img}</div>
        </div>''')
    return f'''    <section class="story">
      <div class="container">
{chr(10).join(rows)}
      </div>
    </section>
'''


REPLACE = {
    'realisations-section': lambda old: home_section('work'),
    'process-section': lambda old: home_section('process'),
    'eco-section': lambda old: home_section('eco'),
    'section-reviews': lambda old: reviews_section(),
    'ai-proof': lambda old: home_section('ai-proof'),
    'section-grid founder-section': lambda old: '',
    'section-grid content-alt-section': story_section,
}


def migrate(path):
    s = path.read_text()
    log = []
    for cls, fn in REPLACE.items():
        for a, b in reversed(legacy(s, cls)):
            s = s[:a] + fn(s[a:b]) + s[b:]
            log.append(cls.split()[-1])
    for a, b in reversed(legacy(s, 'faq section-grid')):
        new, n = faq_section(s[a:b])
        s = s[:a] + new + s[b:]
        log.append(f'faq({n})')
    # Feuilles de style et script des sections de l'accueil
    prefix = '../' * (len(path.relative_to(ROOT).parts) - 1)
    if log and 'sections-v2' not in s:
        s = re.sub(r'([ \t]*)(<link rel="stylesheet" href="[^"]*assets/css/theme-v2[^"]*">)', lambda m: f'{m.group(1)}{m.group(2)}\n{m.group(1)}<link rel="stylesheet" href="{prefix}assets/css/sections-v2.css">\n{m.group(1)}<link rel="stylesheet" href="{prefix}assets/css/sector-v2.css">', s, count=1)
    if log and 'home-v2.js' not in s and 'home-v2.min.js' not in s:
        s = re.sub(r'([ \t]*)(<script src="[^"]*assets/js/theme-v2[^"]*"[^>]*></script>)', lambda m: f'{m.group(1)}{m.group(2)}\n{m.group(1)}<script src="{prefix}assets/js/home-v2.js" defer></script>', s, count=1)
    # Liens absolus des images de l'accueil (assets/…) recalés pour la profondeur de la page
    if prefix:
        s = re.sub(r'(?<=[\s",(])assets/(?=img|video)', prefix + 'assets/', s)
    path.write_text(s)
    return log


if __name__ == '__main__':
    for f in sys.argv[1:]:
        print(f, migrate(ROOT / f))
