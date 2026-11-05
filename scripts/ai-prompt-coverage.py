#!/usr/bin/env python3
"""
ai-prompt-coverage.py

Couverture des prompts IA (2026-11-05). On ne connaît pas le volume des prompts tapés dans ChatGPT ;
on part donc des mots-clés qu'une IA retient d'un prompt (data/ai-prompts.json : cibles, besoins,
lieux, intentions) et on les croise. Pour chaque combinaison, le script cherche une page du sitemap
qui réunit les termes dans ses éléments structurants : title, meta description, H1, H2, H3 et
questions de FAQ. C'est là qu'une IA va chercher la réponse à citer.

Sortie : seo-pilot/data/prompts-ia.md (couverture par croisement, trous classés, exemples de prompts).
Usage : python3 scripts/ai-prompt-coverage.py
"""
import html
import itertools
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://msd-media.com'
M = json.loads((ROOT / 'data/ai-prompts.json').read_text())
DIMS = ['cibles', 'besoins', 'lieux', 'intentions']
LABEL = {'cibles': 'cible', 'besoins': 'besoin', 'lieux': 'lieu', 'intentions': 'intention'}


def norm(t):
    t = unicodedata.normalize('NFKD', html.unescape(t)).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'\s+', ' ', t.replace('’', "'"))


def pages():
    urls = []
    for sm in ('sitemap.xml', 'blog/sitemap.xml'):
        urls += re.findall(r'<loc>([^<]+)</loc>', (ROOT / sm).read_text())
    out = {}
    for u in dict.fromkeys(urls):
        path = u.replace(SITE, '') or '/'
        if path.startswith('/en/'):
            continue  # la matrice est en français
        f = ROOT / path.lstrip('/')
        f = f / 'index.html' if not f.suffix else f
        if not f.is_file():
            continue
        s = f.read_text()
        parts = re.findall(r'<title>(.*?)</title>', s, re.S)
        parts += re.findall(r'<meta name="description" content="([^"]*)"', s)
        parts += re.findall(r'<h[123][^>]*>(.*?)</h[123]>', s, re.S)
        parts += re.findall(r'<summary[^>]*>(.*?)</summary>', s, re.S)
        parts += re.findall(r'"@type":\s*"Question",\s*"name":\s*"([^"]+)"', s)
        out[path] = ' | '.join(norm(re.sub(r'<[^>]+>', ' ', p)) for p in parts)
    return out


def matcher(variants):
    return re.compile('|'.join(r'\b' + re.escape(v) for v in variants))


def main():
    idx = pages()
    rx = {d: {k: matcher(v) for k, v in M[d].items()} for d in DIMS}
    hits = {d: {k: {p for p, t in idx.items() if r.search(t)} for k, r in rx[d].items()} for d in DIMS}

    lines = ['# Couverture des prompts IA', '',
             f'Relevé automatique ({len(idx)} pages françaises du sitemap). Une combinaison est couverte quand une même page réunit '
             'les termes dans son title, sa description, ses titres H1 à H3 ou ses questions de FAQ. '
             'Matrice : `data/ai-prompts.json`. Méthode : on croise qui, quoi, où et quelle intention, faute de volume de recherche pour les prompts.', '']

    lines += ['## Couverture par terme', '']
    for d in DIMS:
        row = ', '.join(f'{k} {len(v)}' for k, v in hits[d].items())
        lines.append(f'- **{d.capitalize()}** (nombre de pages) : {row}')
    lines.append('')

    gaps_all = []
    for a, b in itertools.combinations(DIMS, 2):
        total = covered = 0
        gaps = []
        for ka, kb in itertools.product(M[a], M[b]):
            total += 1
            both = hits[a][ka] & hits[b][kb]
            if both:
                covered += 1
            else:
                gaps.append((ka, kb, len(hits[a][ka]) + len(hits[b][kb])))
        gaps_all.append((a, b, covered, total, gaps))

    lines += ['## Couverture par croisement', '', '| Croisement | Couvert |', '|---|---|']
    for a, b, c, t, _ in gaps_all:
        lines.append(f'| {LABEL[a]} × {LABEL[b]} | {c}/{t} ({round(100 * c / t)} %) |')
    lines.append('')

    # Les croisements qui comptent pour l'agence : cible santé × intention, cible × lieu, besoin × lieu.
    lines += ['## Trous à combler en priorité', '',
              'Classés du plus proche au plus loin : les deux termes existent déjà chacun sur le site, il manque la page (ou la question de FAQ) qui les réunit.', '']
    for a, b, c, t, gaps in gaps_all:
        if (a, b) not in (('cibles', 'lieux'), ('cibles', 'intentions'), ('besoins', 'lieux'), ('besoins', 'intentions'), ('lieux', 'intentions')):
            continue
        top = sorted(gaps, key=lambda g: -g[2])[:8]
        if top:
            lines.append(f'- **{LABEL[a]} × {LABEL[b]}** : ' + ' ; '.join(f'{x} + {y}' for x, y, _ in top))
    lines.append('')

    lines += ['## Exemples de prompts non couverts', '']
    shown = 0
    for (a, b, c, t, gaps) in gaps_all:
        if (a, b) != ('cibles', 'lieux'):
            continue
        for x, y, _ in sorted(gaps, key=lambda g: -g[2])[:5]:
            lines.append(f'- « Quelle agence pour le site web d\'un {x} à {y} ? »')
            shown += 1
    for (a, b, c, t, gaps) in gaps_all:
        if (a, b) != ('cibles', 'intentions'):
            continue
        for x, y, _ in sorted(gaps, key=lambda g: -g[2])[:5]:
            lines.append(f'- Site de {x}, intention « {y} » : aucune page ne réunit les deux.')
    lines.append('')
    out = ROOT / 'seo-pilot/data/prompts-ia.md'
    out.write_text('\n'.join(lines))
    print(f'{out.relative_to(ROOT)} : ' + ', '.join(f'{LABEL[a]}×{LABEL[b]} {c}/{t}' for a, b, c, t, _ in gaps_all))


if __name__ == '__main__':
    main()
