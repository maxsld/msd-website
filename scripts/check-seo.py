#!/usr/bin/env python3
"""Vérifie le site généré, sans réseau ni modification de fichier."""
from pathlib import Path
from html import unescape
from html.parser import HTMLParser
from collections import Counter
from urllib.parse import urljoin, urlsplit, unquote
import json
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
SITE = 'https://msd-media.com'

class FaqPairs(HTMLParser):
    """Lit les réponses de la FAQ visible, liens et balises imbriqués compris."""
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def __init__(self, text):
        super().__init__()
        self.depth = 0; self.capture = None; self.capture_depth = 0
        self.text = ''; self.question = ''; self.pairs = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        if tag in self.VOID: return
        self.depth += 1
        classes = dict(attrs).get('class', '').split()
        for kind in ('faq-question', 'faq-answer'):
            if kind in classes:
                self.capture = kind; self.capture_depth = self.depth; self.text = ''

    def handle_endtag(self, tag):
        if tag in self.VOID: return
        if self.capture and self.depth == self.capture_depth:
            text = re.sub(r'\s+', ' ', self.text).strip()
            if self.capture == 'faq-question': self.question = text.rstrip('+−– ').strip()
            elif self.question and text: self.pairs.append((self.question, text)); self.question = ''
            self.capture = None
        self.depth = max(0, self.depth - 1)

    def handle_data(self, value):
        if self.capture: self.text += value


def sync_static_faqs():
    changed = 0
    for file in ROOT.rglob('*.html'):
        if any(part in {'node_modules', '.git', 'kit', 'kits', 'graphify-out'} for part in file.relative_to(ROOT).parts): continue
        text = file.read_text()
        if re.search(r'<body\b[^>]*class="[^"]*blog-article-page', text): continue
        pairs = FaqPairs(text).pairs
        def replace(match):
            nonlocal changed
            schema = json.loads(match[1])
            def repair(node):
                if not isinstance(node, dict): return node
                if node.get('@type') == 'FAQPage':
                    if not pairs: return None
                    node['mainEntity'] = [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in pairs]
                if '@graph' in node: node['@graph'] = [n for n in (repair(n) for n in node['@graph']) if n]
                return node
            updated = repair(schema)
            if updated == json.loads(match[1]): return match[0]
            changed += 1
            return '<script type="application/ld+json">' + json.dumps(updated, ensure_ascii=False, indent=2) + '</script>' if updated else ''
        result = re.sub(r'<script type="application/ld\+json">([\s\S]*?)</script>', replace, text)
        if result != text: file.write_text(result)
    print(f'{changed} blocs JSON-LD synchronisés avec les FAQ visibles.')

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.title = ''; self.h1 = 0; self.canonicals = []; self.robots = ''
        self.links = []; self.assets = []; self.schemas = []; self.visible = []
        self.hidden = 0; self.script = None; self.in_title = False
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag in ('script', 'style'): self.hidden += 1
        if tag == 'script' and attrs.get('type') == 'application/ld+json': self.script = ''
        if tag == 'title': self.in_title = True
        if tag == 'h1': self.h1 += 1
        if tag == 'link' and attrs.get('rel') == 'canonical': self.canonicals.append(attrs.get('href'))
        if tag == 'meta' and attrs.get('name') == 'robots': self.robots = attrs.get('content', '')
        if tag == 'a' and attrs.get('href'): self.links.append(attrs['href'])
        if tag in ('script', 'img', 'source') and attrs.get('src'): self.assets.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') in ('stylesheet', 'preload'): self.assets.append(attrs.get('href', ''))

    def handle_endtag(self, tag):
        if tag == 'script' and self.script is not None:
            self.schemas.append(json.loads(self.script)); self.script = None
        if tag in ('script', 'style'): self.hidden = max(0, self.hidden - 1)
        if tag == 'title': self.in_title = False

    def handle_data(self, value):
        if self.script is not None: self.script += value
        if self.in_title: self.title += value
        if not self.hidden: self.visible.append(value)


def local_file(url):
    path = unquote(urlsplit(url).path).lstrip('/')
    return ROOT / (path if Path(path).suffix else path.rstrip('/') + '/index.html').lstrip('/')


def graph_nodes(schema):
    if isinstance(schema, list):
        for item in schema: yield from graph_nodes(item)
    elif isinstance(schema, dict):
        yield schema
        for item in schema.get('@graph', []): yield from graph_nodes(item)


def main():
    errors = []; urls = []; pages = {}
    for name in ('sitemap.xml', 'blog/sitemap.xml'):
        urls += [node.text for node in ET.parse(ROOT / name).findall('.//{*}loc')]
    duplicates = [url for url, n in Counter(urls).items() if n > 1]
    if duplicates: errors.append(f'URL répétées dans les sitemaps : {duplicates}')
    for url in urls:
        file = local_file(url)
        if not file.is_file(): errors.append(f'Page du sitemap absente : {url}'); continue
        try: page = Page(file.read_text())
        except Exception as exc: errors.append(f'HTML/JSON-LD invalide dans {file}: {exc}'); continue
        pages[url] = page
        if page.canonicals != [url]: errors.append(f'Canonical incohérente : {url}: {page.canonicals}')
        if page.h1 != 1: errors.append(f'{page.h1} H1 dans {url}')
        if 'noindex' in page.robots: errors.append(f'Page noindex dans le sitemap : {url}')
        for src in page.assets:
            absolute = urljoin(url, src)
            if urlsplit(absolute).netloc == 'msd-media.com' and not local_file(absolute).is_file():
                errors.append(f'Ressource absente : {url} → {src}')
        visible = re.sub(r'\s+', ' ', unescape(' '.join(page.visible)))
        for schema in page.schemas:
            for node in graph_nodes(schema):
                if node.get('@type') == 'FAQPage':
                    for question in node.get('mainEntity', []):
                        answer = unescape(question.get('acceptedAnswer', {}).get('text', ''))
                        if not answer or 'Retrouvez les détails dans cet article' in answer:
                            errors.append(f'Réponse FAQ vide ou générique : {url}')
                        # Les liens/emphases peuvent séparer les nœuds texte au
                        # milieu d'un mot ou avant une ponctuation.
                        if re.sub(r'\s+', '', answer) not in re.sub(r'\s+', '', visible):
                            errors.append(f'Réponse FAQ absente du contenu visible : {url}: {answer[:65]}')
                if node.get('@type') == 'Article':
                    published, modified = node.get('datePublished'), node.get('dateModified')
                    if published and modified and modified < published: errors.append(f'Dates incohérentes : {url}')
                    if '/blog/articles/' in url and modified and modified > published:
                        if not re.search(r'<time\b[^>]*datetime="' + re.escape(modified) + '"', file.read_text()):
                            errors.append(f'Date de mise à jour non affichée : {url}')
    titles = Counter(p.title for p in pages.values())
    if any(n > 1 for n in titles.values()): errors.append('Titres dupliqués dans le sitemap')
    service = SITE + '/creation-landing-page/'
    if service not in pages: errors.append('Offre landing page absente du sitemap')
    for slug, target in [('site-internet-dentiste-ce-qui-est-autorise', '/site-web-dentiste/'), ('avis-google-medecin-que-repondre', '/site-web-medecin/'), ('site-internet-medecine-esthetique-ce-qui-est-autorise', '/site-web-medecine-esthetique/')]:
        page = pages.get(SITE + '/blog/articles/' + slug + '/')
        if not page or target not in page.links: errors.append(f'Lien vers l’offre santé manquant : {slug}')
    if errors:
        print('\n'.join(errors)); raise SystemExit(1)
    print(f'SEO vérifié : {len(pages)} URL, canonical, H1, ressources, FAQ, dates et liens santé cohérents ; aucun doublon de sitemap.')

if __name__ == '__main__':
    if '--sync-faq' in sys.argv: sync_static_faqs()
    main()
