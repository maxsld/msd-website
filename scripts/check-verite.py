#!/usr/bin/env python3
"""
check-verite.py

Contrôle de cohérence des faits commerciaux (2026-11-10), adossé à seo-pilot/FAITS.md.
Il ne prouve pas qu'une affirmation est vraie : il repère les écarts avec le registre.

Bloquant :
  - prix MSD Media hors de /tarifs/ et /en/pricing/ ;
  - délai présenté comme « contractuel » (les CGV disent « indicatif ») ;
  - lien vers la réalisation Belotero ;
  - année de fondation autre que 2025 ;
  - clients en Allemagne.
Avertissement (à relire, pas forcément faux) :
  - affirmations qui demandent une preuve (garanti, n°1, systématiquement, notes sur 5, « 30 clients ») ;
  - tirets cadratins dans le texte visible (règle de style de RULES.md).

Périmètre : pages HTML du sitemap (FR et EN), sources du blog, data/*.json, llms.txt.
Sortie : seo-pilot/data/verite.md. Usage : python3 scripts/check-verite.py [--strict]
(--strict : code de sortie 1 s'il reste un écart bloquant).
"""
import html
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://msd-media.com'

PRICE_PAGES = {'/tarifs/', '/en/pricing/', '/tarifs/msd-care/', '/en/pricing/msd-care/'}
# Pages où un montant en euros n'est pas un prix MSD (indemnité légale, fourchettes de formulaire).
EURO_OK = {'/terms/cgv.html', '/en/legal/terms-of-sale.html', '/affiliation/', '/en/referral-program/'}

MSD_PRICE = re.compile(r'\b(1[\s  ]?990|3[\s  ]?990|490)[\s  ]?(€|euros?)|€[\s  ]?(1,990|3,990|490)\b', re.I)
EURO = re.compile(r'\d[\d\s  .,]*[\s  ]?(€|euros?)|€[\s  ]?\d', re.I)
SELF = re.compile(r"MSD Media|MSD Care|chez nous|nos offres|notre offre|nos landing|nos sites|nos tarifs|nos prix|démarrent|our offers|our pricing|starts? at", re.I)

BLOCKERS = [
    ('Délai dit contractuel (les CGV disent indicatif)', re.compile(r'(d[ée]lai|livraison|21 jours)[^.]{0,80}contractuel|contractuel[^.]{0,60}(d[ée]lai|21 jours)|contractual[^.]{0,40}(deadline|delivery)', re.I)),
    ('Réalisation Belotero', re.compile(r'merz-belotero|r[ée]alisation[^.]{0,40}Belotero', re.I)),
    ('Année de fondation', re.compile(r'(fond[ée]e?|cr[ée]{2}e?|founded)\s+(en\s+|in\s+)?(?:\w+\s+)?(20(?:1\d|2[0-46-9]))', re.I)),
    ('Clients en Allemagne', re.compile(r'clients? (en|d\x27) ?Allemagne|clients in Germany', re.I)),
]
WARNINGS = [
    ('Garantie', re.compile(r'\bgaranti(e|es|s)?\b|\bguaranteed?\b', re.I)),
    ('Numéro 1', re.compile(r'\bn[°o]\s?1\b|num[ée]ro 1\b|number one', re.I)),
    ('Systématiquement', re.compile(r'syst[ée]matiquement', re.I)),
    ('Note sur 5 attribuée à MSD Media', re.compile(r'(MSD Media|Trustpilot|nos avis)[^.]{0,60}\d[,.]?\d? ?/ ?5', re.I)),
    ('Nombre de clients', re.compile(r'\d+ ?\+? clients (accompagnés|satisfaits)', re.I)),
]
EM_DASH = '—'


def visible_text(raw, is_html):
    if not is_html:
        return raw
    raw = re.sub(r'<script(?![^>]*ld\+json)[\s\S]*?</script>|<style[\s\S]*?</style>', ' ', raw, flags=re.I)
    metas = '\n'.join(re.findall(r'<meta[^>]+content="([^"]*)"', raw))
    text = re.sub(r'<[^>]+>', ' ', raw)
    return html.unescape(metas + ' \n ' + text)


def sentences(text):
    for s in re.split(r'(?<=[.!?])\s+|\n+|\s\|\s|",\s*"', text):
        s = re.sub(r'\s+', ' ', s).strip()
        if s:
            yield s


def files():
    urls = []
    for sm in ('sitemap.xml', 'blog/sitemap.xml'):
        urls += re.findall(r'<loc>([^<]+)</loc>', (ROOT / sm).read_text())
    for u in dict.fromkeys(urls):
        path = u.replace(SITE, '') or '/'
        f = ROOT / path.lstrip('/')
        f = f / 'index.html' if not f.suffix else f
        if f.is_file():
            yield path, f
    for f in sorted((ROOT / 'blog/sources').glob('*.md')):
        yield f'blog/sources/{f.name}', f
    for f in sorted((ROOT / 'data').glob('*.json')):
        if f.name != 'ai-prompts.json':
            yield f'data/{f.name}', f
    yield 'llms.txt', ROOT / 'llms.txt'


def short(s, n=170):
    return s if len(s) <= n else s[:n - 1] + '…'


def main():
    block = defaultdict(list)
    warn = defaultdict(list)
    dashes = Counter()
    for label, f in files():
        raw = f.read_text(errors='ignore')
        is_html = f.suffix == '.html'
        text = visible_text(raw, is_html)
        if f.suffix == '.json':
            text = ' \n '.join(v for v in re.findall(r'"(?:[^"\\]|\\.)*"', raw))
            text = text.replace('\\"', '"')
        seen = set()
        for s in sentences(text):
            if s in seen:
                continue
            seen.add(s)
            if label not in PRICE_PAGES and label not in EURO_OK:
                if MSD_PRICE.search(s) or (EURO.search(s) and SELF.search(s)):
                    block['Prix MSD Media hors de /tarifs/'].append((label, short(s)))
            for name, rx in BLOCKERS:
                if rx.search(s) and not (name == 'Année de fondation' and '2025' in rx.search(s).group(0)) \
                        and not re.search(r"(n'est pas|non|not) contractu", s, re.I):
                    block[name].append((label, short(s)))
            for name, rx in WARNINGS:
                if rx.search(s):
                    warn[name].append((label, short(s)))
        if not label.startswith(('data/', 'llms')) and '/en/' not in label:
            n = text.count(EM_DASH)
            if n:
                dashes[label] = n

    total_block = sum(len(v) for v in block.values())
    lines = ['# Vérité commerciale', '',
             f'Relevé automatique de `scripts/check-verite.py`, à comparer au registre `seo-pilot/FAITS.md`. '
             f'{total_block} écart(s) bloquant(s). Un écart bloquant dans une page que l\'agence a le droit de modifier se corrige '
             'dans la source (JSON, Markdown) ; dans l\'accueil, `llms.txt`, les CGV ou un prix, il remonte à Maxens dans « À toi ».', '']
    lines += ['## Bloquant', '']
    if not block:
        lines.append('Aucun.')
    for name, items in block.items():
        lines.append(f'### {name} ({len(items)})')
        lines += [f'- `{p}` : « {s} »' for p, s in items[:25]]
        if len(items) > 25:
            lines.append(f'- … et {len(items) - 25} autre(s)')
        lines.append('')
    lines += ['## À relire (preuve à vérifier dans FAITS.md)', '']
    for name, items in warn.items():
        lines.append(f'### {name} ({len(items)})')
        lines += [f'- `{p}` : « {s} »' for p, s in items[:12]]
        if len(items) > 12:
            lines.append(f'- … et {len(items) - 12} autre(s)')
        lines.append('')
    lines += ['## Tirets cadratins dans le texte visible', '',
              f'{sum(dashes.values())} tirets dans {len(dashes)} fichiers. On les retire quand on retouche une page pour une autre raison '
              '(deux phrases, ou deux-points), jamais en passe globale. Les plus touchés :', '']
    lines += [f'- `{p}` : {n}' for p, n in dashes.most_common(15)]
    lines.append('')
    out = ROOT / 'seo-pilot/data/verite.md'
    out.write_text('\n'.join(lines))
    print(f'{out.relative_to(ROOT)} : {total_block} bloquant(s) '
          + ', '.join(f'{k} {len(v)}' for k, v in block.items())
          + f' ; {sum(len(v) for v in warn.values())} à relire ; {sum(dashes.values())} tirets cadratins')
    if '--strict' in sys.argv and total_block:
        sys.exit(1)


if __name__ == '__main__':
    main()
