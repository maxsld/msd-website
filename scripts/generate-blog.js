#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, 'blog', 'sources');
const OUTPUT_DIR = path.join(ROOT, 'blog', 'articles');
const BLOG_IMAGE_DIR = path.join(ROOT, 'assets', 'img', 'blog');
const SITE_URL = 'https://msd-media.com';
const BRAND = 'MSD Media';
const AUTHOR = 'Maxens Soldan';
const DEFAULT_IMAGE = '/assets/img/maxens-soldan-fondateur-ceo-msd-media-annecy.webp';
const DEFAULT_LISTING_IMAGE = '/assets/img/blog/top-5-applications-productivite-2026.jpg';
const BLOG_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
const PUBLIC_IMAGE_FALLBACKS = [
  DEFAULT_LISTING_IMAGE,
  '/assets/img/logo-black.webp'
];
const LEGACY_ALIASES = {
  'template-2026-landing-page': 'creer-landing-page-qui-convertit'
};
const LEGACY_DATE_OVERRIDES = {
  'maintenance-site-web-annecy': '2026-04-09',
  'referencement-naturel-annecy': '2026-04-09',
  'site-web-agence-immobiliere-alsace': '2026-04-10',
  'site-web-agence-immobiliere-haute-savoie': '2026-04-09',
  'site-web-architecte-strasbourg': '2026-04-10',
  'site-web-artisan-tpe-strasbourg': '2026-04-10',
  'site-web-avocat-strasbourg': '2026-04-10',
  'site-web-coach-sportif-annecy': '2026-04-09',
  'site-web-coach-sportif-strasbourg': '2026-04-10',
  'site-web-coiffeur-annecy': '2026-04-09',
  'site-web-expert-comptable-annecy': '2026-04-09',
  'site-web-kinesitherapeute-annecy': '2026-04-09',
  'site-web-medecin-strasbourg': '2026-04-10',
  'site-web-osteopathe-annecy': '2026-04-09',
  'site-web-restaurant-strasbourg': '2026-04-10',
  'site-web-station-ski-haute-savoie': '2026-04-09',
  'top-5-applications-productivite-2026': '2026-04-09'
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readAllMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .map((f) => path.join(dir, f));
}

function escapeHtml(input = '') {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toAbsoluteUrl(input = '') {
  if (!input) return `${SITE_URL}${DEFAULT_IMAGE}`;
  if (/^https?:\/\//i.test(input)) return input;
  if (input.startsWith('/')) return `${SITE_URL}${input}`;
  return `${SITE_URL}/${input.replace(/^\/+/, '')}`;
}

function findLocalBlogImageBySlug(slug = '') {
  if (!slug) return '';
  for (const ext of BLOG_IMAGE_EXTENSIONS) {
    const file = path.join(BLOG_IMAGE_DIR, `${slug}${ext}`);
    if (fs.existsSync(file)) {
      return `/assets/img/blog/${slug}${ext}`;
    }
  }
  return '';
}

function normalizePostImage(rawImage = '', slug = '') {
  const candidate = String(rawImage || '').trim();
  const localBySlug = findLocalBlogImageBySlug(slug);

  // Prefer a local slug-matched image when available.
  if (localBySlug) return localBySlug;

  const toLocalAssetPath = (url) => {
    if (!url) return '';
    if (url.startsWith('/assets/')) return url;
    if (url.startsWith(`${SITE_URL}/assets/`)) return url.replace(SITE_URL, '');
    return '';
  };

  const localAssetCandidate = toLocalAssetPath(toAbsoluteUrl(candidate));
  if (localAssetCandidate) {
    const isMaxensImage = localAssetCandidate.includes('maxens-soldan-fondateur-ceo-msd-media-annecy');
    if (isMaxensImage && slug !== 'maxens-soldan') {
      // Keep Maxens portrait exclusively for the dedicated article.
    } else {
    const fullPath = path.join(ROOT, localAssetCandidate.replace(/^\//, ''));
    if (fs.existsSync(fullPath)) return localAssetCandidate;
    }
  }

  // Guaranteed local fallback to avoid broken external images.
  for (const fallbackPath of PUBLIC_IMAGE_FALLBACKS) {
    const fullPath = path.join(ROOT, fallbackPath.replace(/^\//, ''));
    if (fs.existsSync(fullPath)) return fallbackPath;
  }

  return DEFAULT_IMAGE;
}

function imagePathForPage(imagePath = '', assetPrefix = '../assets') {
  const normalized = String(imagePath || '').trim();
  if (!normalized) return `${assetPrefix}/img/blog/top-5-applications-productivite-2026.jpg`;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (normalized.startsWith('/assets/')) {
    return `${assetPrefix}${normalized.slice('/assets'.length)}`;
  }
  return normalized;
}

function getListingImage(post) {
  const image = post?.image || DEFAULT_IMAGE;
  if (post?.slug === 'maxens-soldan') return DEFAULT_LISTING_IMAGE;
  if (String(image).includes('maxens-soldan-fondateur-ceo-msd-media-annecy')) return DEFAULT_LISTING_IMAGE;
  return image;
}

function slugify(input = '') {
  return String(input)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'article';
}

function parseFrontmatter(content) {
  const normalized = content.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return { data: {}, body: normalized };
  }

  const end = normalized.indexOf('\n---\n', 4);
  if (end === -1) {
    return { data: {}, body: normalized };
  }

  const raw = normalized.slice(4, end).trim();
  const body = normalized.slice(end + 5);
  const data = {};

  raw.split('\n').forEach((line) => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if (!value) {
      data[key] = '';
      return;
    }

    try {
      if (value.startsWith('[') || value.startsWith('{') || value.startsWith('"')) {
        data[key] = JSON.parse(value);
        return;
      }
    } catch (_) {}

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    data[key] = value;
  });

  return { data, body };
}

function stripLeadingMarkdownH1(markdown = '') {
  const normalized = markdown.replace(/\r\n/g, '\n');
  return normalized.replace(/^\s*#\s+.+\n+/, '');
}

function inlineMarkdownToHtml(text) {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return out;
}

function markdownTableToHtml(lines) {
  const rows = lines.map((line) =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => inlineMarkdownToHtml(cell.trim()))
  );

  if (rows.length < 2) return '';
  const head = rows[0];
  const bodyRows = rows.slice(2);

  const thead = `<thead><tr>${head.map((c) => `<th>${c}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${bodyRows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('')}</tbody>`;

  return `<div class="blog-table-wrap"><table class="blog-table">${thead}${tbody}</table></div>`;
}

function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  const htmlParts = [];
  const toc = [];

  const pushHeading = (level, text) => {
    const plain = text.trim();
    const id = slugify(plain);
    if (level >= 2 && level <= 3) {
      toc.push({ level, text: plain, id });
    }
    htmlParts.push(`<h${level} id="${id}">${inlineMarkdownToHtml(plain)}</h${level}>`);
  };

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (/^---\s*$/.test(line.trim())) {
      htmlParts.push('<hr />');
      i += 1;
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      pushHeading(h[1].length, h[2]);
      i += 1;
      continue;
    }

    if (/^\|.+\|\s*$/.test(line) && i + 1 < lines.length && /^\|?\s*[-:]+\s*(\|\s*[-:]+\s*)+\|?$/.test(lines[i + 1])) {
      const tableLines = [line, lines[i + 1]];
      i += 2;
      while (i < lines.length && /^\|.+\|\s*$/.test(lines[i])) {
        tableLines.push(lines[i]);
        i += 1;
      }
      htmlParts.push(markdownTableToHtml(tableLines));
      continue;
    }

    if (/^[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s+/, ''));
        i += 1;
      }
      htmlParts.push(`<ul>${items.map((item) => `<li>${inlineMarkdownToHtml(item)}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      htmlParts.push(`<ol>${items.map((item) => `<li>${inlineMarkdownToHtml(item)}</li>`).join('')}</ol>`);
      continue;
    }

    if (/^>\s+/.test(line)) {
      const blocks = [];
      while (i < lines.length && /^>\s+/.test(lines[i])) {
        blocks.push(lines[i].replace(/^>\s+/, ''));
        i += 1;
      }
      htmlParts.push(`<blockquote><p>${inlineMarkdownToHtml(blocks.join(' '))}</p></blockquote>`);
      continue;
    }

    if (/^```/.test(line.trim())) {
      const lang = line.trim().replace(/^```/, '').trim();
      i += 1;
      const codeLines = [];
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      htmlParts.push(`<pre><code class="language-${escapeHtml(lang)}">${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    const paragraph = [line.trim()];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^[-*+]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^>\s+/.test(lines[i]) &&
      !/^```/.test(lines[i].trim()) &&
      !/^\|.+\|\s*$/.test(lines[i]) &&
      !/^---\s*$/.test(lines[i].trim())
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }

    htmlParts.push(`<p>${inlineMarkdownToHtml(paragraph.join(' '))}</p>`);
  }

  return { html: htmlParts.join('\n'), toc };
}

function markdownToPlainText(markdown = '') {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/^#+\s+/gm, '')
    .replace(/[>*_\-]/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function estimateReadTime(text = '') {
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 220));
  return { words, minutes };
}

function formatFrenchDate(dateInput = '') {
  const raw = String(dateInput || '').trim();
  const parsed = new Date(raw.length <= 10 ? `${raw}T00:00:00` : raw);
  if (Number.isNaN(parsed.getTime())) return raw || new Date().toISOString().slice(0, 10);
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(parsed);
}

function getCardTopicTag(post = {}) {
  const content = [post.slug, post.title, post.description, post.keyword, ...(post.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const taxonomy = [
    {
      label: 'Landing page',
      className: 'case-study-card__tag--landing',
      pattern: /landing page|landing-page|squeeze page|cro|taux de conversion/,
      weight: 1.2
    },
    {
      label: 'SEO',
      className: 'case-study-card__tag--seo',
      pattern: /seo|referencement|référencement|serp|backlink|search console/,
      weight: 1.15
    },
    {
      label: 'IA',
      className: 'case-study-card__tag--ia',
      pattern: /geo|aeo|google ai|ai overviews|chatgpt|perplexity|gemini|llm|schema\.org|schema org|moteur generatif|moteur génératif/,
      weight: 1.15
    },
    {
      label: 'Site web',
      className: 'case-study-card__tag--siteweb',
      pattern: /site web|site internet|creation site|création site|refonte|maintenance|wordpress|webflow|nocode/,
      weight: 1.1
    },
    {
      label: 'Local',
      className: 'case-study-card__tag--local',
      pattern: /annecy|haute-savoie|strasbourg|lyon|paris|marseille|toulouse|bordeaux|geneve|genève|chambery|chambéry|local/,
      weight: 0.72
    },
    {
      label: 'Conversion',
      className: 'case-study-card__tag--conversion',
      pattern: /conversion|lead|leads|acquisition|tunnel|cta|offre/,
      weight: 1
    }
  ];

  const scored = taxonomy
    .map((tag) => {
      const matches = content.match(new RegExp(tag.pattern.source, 'g')) || [];
      return { ...tag, score: matches.length * (tag.weight || 1) };
    })
    .sort((a, b) => b.score - a.score);

  if (scored[0] && scored[0].score > 0) {
    return { label: scored[0].label, className: scored[0].className };
  }

  return { label: 'Blog', className: 'case-study-card__tag--blog' };
}

function estimateReadTimeFromHtml(articleHtml = '') {
  const text = String(articleHtml || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return estimateReadTime(text);
}

function extractHeadingsFromHtml(html = '', max = 3) {
  const matches = [...String(html).matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi)];
  return matches
    .map((m) =>
      String(m[1] || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean)
    .slice(0, max);
}

function buildArticleFaqJsonLd(post = {}, pageUrl = '') {
  const headings = extractHeadingsFromHtml(post.html || '', 3);
  const webPageRef = {
    '@type': 'WebPage',
    '@id': pageUrl
  };
  const baseQuestions = headings.length
    ? headings.map((h) => ({
        '@type': 'Question',
        name: /\?$/.test(h) ? h : `${h} ?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Retrouvez les détails dans cet article dédié de MSD Media sur ${post.title}.`
        }
      }))
    : [
        {
          '@type': 'Question',
          name: `Quels points clés retenir sur ${post.title} ?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Cet article présente les méthodes, erreurs à éviter et actions concrètes liées à ${post.title}.`
          }
        },
        {
          '@type': 'Question',
          name: 'Quel est le délai pour mettre en place ces recommandations ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'La mise en place varie selon votre contexte, mais les premières optimisations peuvent être lancées immédiatement.'
          }
        },
        {
          '@type': 'Question',
          name: 'Comment passer à l’action avec MSD Media ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Vous pouvez réserver un appel pour définir un plan d’action adapté à votre activité.'
          }
        }
      ];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: baseQuestions,
    mainEntityOfPage: webPageRef
  };
}

function getRelated(posts, current, max = 4) {
  const currentTags = new Set(current.tags || []);
  return posts
    .filter((p) => p.slug !== current.slug)
    .map((p) => {
      const score = (p.tags || []).reduce((acc, t) => acc + (currentTags.has(t) ? 1 : 0), 0);
      return { post: p, score };
    })
    .sort((a, b) => b.score - a.score || new Date(b.post.date) - new Date(a.post.date))
    .slice(0, max)
    .map((x) => x.post);
}

function getInternalServiceLinks(post = {}, extraContext = '') {
  const context = [
    post.slug,
    post.title,
    post.description,
    post.keyword,
    ...(post.tags || []),
    extraContext
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const strasbourgLinks = [
    { href: '/seo-local-strasbourg/', label: 'SEO local à Strasbourg' },
    { href: '/refonte-site-web-strasbourg/', label: 'Refonte de site web à Strasbourg' },
    { href: '/contact/', label: 'Tarifs site web à Strasbourg' },
    { href: '/creation-site-web-strasbourg/', label: 'Création de site web à Strasbourg' },
    { href: '/landing-page-strasbourg/', label: 'Landing page à Strasbourg' }
  ];

  const annecyLinks = [
    { href: '/seo-local-annecy/', label: 'SEO local à Annecy' },
    { href: '/refonte-site-web-annecy/', label: 'Refonte de site web à Annecy' },
    { href: '/contact/', label: 'Tarifs site web à Annecy' },
    { href: '/creation-site-web-annecy/', label: 'Création de site web à Annecy' },
    { href: '/landing-page-annecy/', label: 'Landing page à Annecy' }
  ];

  if (/strasbourg|alsace/.test(context)) return strasbourgLinks.slice(0, 4);
  if (/annecy|haute-savoie/.test(context)) return annecyLinks.slice(0, 4);
  if (/landing page|cro|conversion/.test(context)) {
    return [
      { href: '/landing-page-strasbourg/', label: 'Landing page à Strasbourg' },
      { href: '/landing-page-annecy/', label: 'Landing page à Annecy' },
      { href: '/contact/', label: 'Tarifs site web à Strasbourg' }
    ];
  }

  return [
    { href: '/seo-local-strasbourg/', label: 'SEO local à Strasbourg' },
    { href: '/refonte-site-web-strasbourg/', label: 'Refonte de site web à Strasbourg' },
    { href: '/contact/', label: 'Tarifs site web à Strasbourg' }
  ];
}

function renderInternalLinksSection(post = {}, extraContext = '') {
  const links = getInternalServiceLinks(post, extraContext);
  if (!links.length) return '';
  return `<section class="blog-internal-links"><h2>Liens utiles</h2><ul class="blog-internal-links__list">${links
    .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
    .join('')}</ul></section>`;
}

function renderBookingSection(assetPrefix) {
  return `<section class="booking-section" id="rdv">
    <div class="booking-section__inner">
      <h2 class="section-tag section-tag--light">Réserver un appel</h2>
      <h2 class="section-title section-title--light">Libérez le véritable <br> potentiel de votre site.</h2>
      <div class="booking-section__embed">
        <iframe
          src="https://cal.com/maxens-soldan-msd-media/30min?embed=true&theme=dark"
          title="Prendre rendez-vous avec MSD Media"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  </section>`;
}

function renderFullFooter(assetPrefix) {
  return `<footer class="site-footer">
    <div class="footer-container">
      <div class="footer-left">
        <img src="${assetPrefix}/img/logo-black.webp" alt="Logo MSD Media" class="footer-logo">
        <p class="footer-contact-text"><span class="footer-contact-title">Nous contacter</span><br><a href="mailto:agence@msd-media.com">agence@msd-media.com</a></p>
      </div>
      <div class="footer-offices">
        <article class="footer-office-card">
          <h4 class="footer-office-city">Annecy</h4>
          <p class="footer-office-time" data-office-time data-timezone="Europe/Paris">--:--</p>
          <p class="footer-office-address">6 Rue Paul Guiton <br> 74000 Annecy, France</p>
        </article>
        <article class="footer-office-card">
          <h4 class="footer-office-city">Munich</h4>
          <p class="footer-office-time" data-office-time data-timezone="Europe/Paris">--:--</p>
          <p class="footer-office-address">Munich, Bavière, Allemagne</p>
        </article>
      </div>
      <div class="footer-contact">
        <div class="footer-social">
          <a href="https://www.linkedin.com/in/maxens-soldan/" target="_blank" aria-label="Profil LinkedIn"><i class="fa-brands fa-linkedin"></i></a>
          <a href="https://instagram.com/" target="_blank" aria-label="Profil Instagram"><i class="fa-brands fa-instagram"></i></a>
          <a href="https://wa.me/33783141287" target="_blank" aria-label="Contacter sur WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
          <a href="mailto:agence@msd-media.com" aria-label="E-mail"><i class="fa-solid fa-envelope"></i></a>
        </div>
      </div>
    </div>
    <div class="footer-cities">
      <ul>
        <li><a href="https://msd-media.com/agence-web-annecy/">Annecy</a></li>
        <li><a href="https://msd-media.com/agence-web-chambery/">Chambéry</a></li>
        <li><a href="https://msd-media.com/agence-web-geneve/">Genève</a></li>
        <li><a href="https://msd-media.com/agence-web-lyon/">Lyon</a></li>
        <li><a href="https://msd-media.com/agence-web-strasbourg/">Strasbourg</a></li>
        <li><a href="https://msd-media.com/agence-web-paris/">Paris</a></li>
        <li><a href="https://msd-media.com/agence-web-marseille/">Marseille</a></li>
        <li><a href="https://msd-media.com/agence-web-toulouse/">Toulouse</a></li>
        <li><a href="https://msd-media.com/agence-web-bordeaux/">Bordeaux</a></li>
        <li><a href="https://msd-media.com/agence-web-lille/">Lille</a></li>
        <li><a href="https://msd-media.com/agence-web-nantes/">Nantes</a></li>
        <li><a href="https://msd-media.com/agence-web-montpellier/">Montpellier</a></li>
        <li><a href="https://msd-media.com/agence-web-nice/">Nice</a></li>
        <li><a href="https://msd-media.com/agence-web-rennes/">Rennes</a></li>
        <li><a href="https://msd-media.com/agence-web-clermont-ferrand/">Clermont-Ferrand</a></li>
      </ul>
    </div>
    <div class="footer-legal">
      <a href="https://msd-media.com/terms/mentions.html" target="_blank">Mentions légales</a>
      <a href="https://msd-media.com/terms/politique-confidentialite.html" target="_blank">Politique de confidentialité</a>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 MSD Media. Tous droits réservés.</p>
    </div>
  </footer>`;
}

function renderArticlePage(post, allPosts) {
  const pageUrl = `${SITE_URL}/blog/articles/${post.slug}/`;
  const imageRaw = post.image || DEFAULT_IMAGE;
  const image = imagePathForPage(imageRaw, '../../../assets');
  const imageAbsolute = toAbsoluteUrl(imageRaw);
  const keywords = [post.keyword, ...(post.tags || [])].filter(Boolean).join(', ');

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: { '@id': SITE_URL + '/' } },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: { '@id': SITE_URL + '/blog/' } },
      { '@type': 'ListItem', position: 3, name: post.title, item: { '@id': pageUrl } }
    ]
  };

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: imageAbsolute,
    author: {
      '@type': 'Person',
      name: AUTHOR
    },
    publisher: {
      '@type': 'Organization',
      name: BRAND,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/assets/img/logo-black.webp`
      }
    },
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': pageUrl
    },
    articleSection: 'Blog SEO',
    inLanguage: 'fr-FR',
    keywords: (post.tags || []).join(', ')
  };
  articleJsonLd.aggregateRating = {
    '@type': 'AggregateRating',
    ratingValue: '5',
    reviewCount: '100',
    bestRating: '5',
    worstRating: '1'
  };

  const faqJsonLd = buildArticleFaqJsonLd(post, pageUrl);

  const related = getRelated(allPosts, post);
  const articleMetaLine = `Publié le ${formatFrenchDate(post.date)} • ${post.reading.minutes} min de lecture`;
  const internalLinksHtml = renderInternalLinksSection(post, post.html || '');

  const relatedHtml = related.length
    ? `<section class="blog-related"><h2>Articles liés</h2><ul class="blog-related-links">${related
        .map(
          (r) => `<li><a href="/blog/articles/${r.slug}/">${escapeHtml(r.title)}</a></li>`
        )
        .join('')}</ul></section>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(post.title)} | ${BRAND}</title>
  <meta name="description" content="${escapeHtml(post.description)}" />
  <meta name="keywords" content="${escapeHtml(keywords)}" />
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
  <link rel="canonical" href="${pageUrl}" />

  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(post.title)}" />
  <meta property="og:description" content="${escapeHtml(post.description)}" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:image" content="${escapeHtml(imageAbsolute)}" />
  <meta property="og:site_name" content="${BRAND}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(post.title)}" />
  <meta name="twitter:description" content="${escapeHtml(post.description)}" />
  <meta name="twitter:image" content="${escapeHtml(imageAbsolute)}" />

  <link rel="icon" type="image/png" href="${SITE_URL}/assets/img/favicon-96x96.png" sizes="96x96" />
  <link rel="icon" type="image/svg+xml" href="${SITE_URL}/assets/img/favicon.svg" />
  <link rel="shortcut icon" href="${SITE_URL}/assets/img/favicon.ico" />

  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@100..900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../../assets/css/style.css" />
  <link rel="stylesheet" href="../../../assets/css/animations.css" />
  <link rel="stylesheet" href="../../../assets/css/responsive.css" />
  <script src="https://kit.fontawesome.com/ddff5b2124.js" crossorigin="anonymous"></script>

  <script type="application/ld+json">${JSON.stringify(articleJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(faqJsonLd)}</script>
</head>
<body class="blog-article-page" data-asset-base="../../../assets">
  <header class="navbar">
    <div class="nav-left">
      <a href="${SITE_URL}/"><img src="../../../assets/img/logo-black.webp" alt="MSD Media logo" class="logo" /></a>
      <div class="nav-menu" data-nav-menu>
        <button class="nav-menu-toggle" type="button" aria-label="Ouvrir le menu des pages" aria-expanded="false" data-nav-menu-toggle>
          <span class="nav-menu-toggle__arrow" aria-hidden="true"></span>
        </button>
        <div class="nav-menu-dropdown" data-nav-menu-dropdown>
          <button class="nav-menu-close" type="button" aria-label="Fermer le menu" data-nav-menu-close>×</button>
          <a href="${SITE_URL}/">Accueil</a>
          <a href="${SITE_URL}/blog/">Blog</a>
          <a href="${SITE_URL}/etudes-de-cas/">Études de cas</a>
          <a href="${SITE_URL}/contact/">Contact</a>
          <a href="${SITE_URL}/recrutement/">Recrutement</a>
          <a href="${SITE_URL}/affiliation/">Affiliation</a>
        </div>
      </div>
    </div>
    <div class="nav-right">
      <a href="https://cal.com/maxens-soldan-msd-media/30min" class="contact-button" target="_blank">Réserver un appel</a>
      <a href="https://wa.me/33783141287" class="whatsapp-nav-button" target="_blank" aria-label="Chat on WhatsApp">
        <i class="fa-brands fa-whatsapp"></i>
      </a>
    </div>
  </header>

  <main>
    <section class="hero">
      <h2 class="section-tag section-tag--dark">Article</h2>
      <h1 class="hero__title"><span>${escapeHtml(post.title)}</span></h1>
      <p class="blog-article-meta">${escapeHtml(articleMetaLine)}</p>
      <div class="hero__actions" aria-label="Actions principales">
        <a class="hero__btn hero__btn--primary" href="https://cal.com/maxens-soldan-msd-media/30min" target="_blank">Réserver un appel</a>
        <a class="hero__btn hero__btn--secondary" href="/blog/">Retour au blog</a>
      </div>
    </section>

    <section class="section-grid blog-article-shell">
      <article class="blog-article-content" itemscope itemtype="https://schema.org/Article">
        <meta itemprop="headline" content="${escapeHtml(post.title)}" />
        <meta itemprop="datePublished" content="${escapeHtml(post.date)}" />
        <meta itemprop="dateModified" content="${escapeHtml(post.date)}" />
        <meta itemprop="author" content="${AUTHOR}" />
        ${post.slug === 'maxens-soldan' ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(post.title)}" loading="lazy" style="width:100%;border-radius:18px;margin-bottom:1.25rem;" />` : ''}
        ${post.html}
      </article>
      ${internalLinksHtml}
      ${relatedHtml}
    </section>
  </main>

  ${renderBookingSection('../../../assets')}
  ${renderFullFooter('../../../assets')}

  <script src="../../../assets/js/script.js"></script>
</body>
</html>`;
}

function renderBlogIndex(posts) {
  const cards = posts
    .map((post) => {
      const topicTag = getCardTopicTag(post);
      return `<a class="case-study-card case-study-card--text case-study-card--clickable" href="/blog/articles/${post.slug}/">
        <span class="case-study-card__overlay" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span>
        <span class="case-study-card__tag ${topicTag.className}">${escapeHtml(topicTag.label)}</span>
        <h3 class="case-study-card__title">${escapeHtml(post.title)}</h3>
        <p class="case-study-card__meta">${escapeHtml(formatFrenchDate(post.date))} • ${post.reading?.minutes || 1} min de lecture</p>
        <p class="case-study-card__description">${escapeHtml(post.description)}</p>
      </a>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blog MSD Media | SEO, Sites Web, Landing Pages & Conversion</title>
  <meta name="description" content="Articles MSD Media sur le SEO, la création de site web, les landing pages et la conversion. Guides concrets pour développer votre visibilité et vos résultats." />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${SITE_URL}/blog/" />
  <meta property="og:title" content="Blog MSD Media | SEO, Sites Web, Landing Pages & Conversion" />
  <meta property="og:description" content="Articles MSD Media sur le SEO, la création de site web, les landing pages et la conversion." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${SITE_URL}/blog/" />
  <meta property="og:image" content="${toAbsoluteUrl(DEFAULT_LISTING_IMAGE)}" />
  <link rel="icon" type="image/png" href="${SITE_URL}/assets/img/favicon-96x96.png" sizes="96x96" />
  <link rel="icon" type="image/svg+xml" href="${SITE_URL}/assets/img/favicon.svg" />
  <link rel="shortcut icon" href="${SITE_URL}/assets/img/favicon.ico" />
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@100..900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../assets/css/style.css" />
  <link rel="stylesheet" href="../assets/css/animations.css" />
  <link rel="stylesheet" href="../assets/css/responsive.css" />
  <script src="https://kit.fontawesome.com/ddff5b2124.js" crossorigin="anonymous"></script>
</head>
<body class="blog-index-page" data-asset-base="../assets">
  <header class="navbar">
    <div class="nav-left">
      <a href="${SITE_URL}/"><img src="../assets/img/logo-black.webp" alt="MSD Media logo" class="logo" /></a>
      <div class="nav-menu" data-nav-menu>
        <button class="nav-menu-toggle" type="button" aria-label="Ouvrir le menu des pages" aria-expanded="false" data-nav-menu-toggle>
          <span class="nav-menu-toggle__arrow" aria-hidden="true"></span>
        </button>
        <div class="nav-menu-dropdown" data-nav-menu-dropdown>
          <button class="nav-menu-close" type="button" aria-label="Fermer le menu" data-nav-menu-close>×</button>
          <a href="${SITE_URL}/">Accueil</a>
          <a href="${SITE_URL}/etudes-de-cas/">Études de cas</a>
          <a href="${SITE_URL}/blog/">Blog</a>
          <a href="${SITE_URL}/contact/">Contact</a>
          <a href="${SITE_URL}/recrutement/">Recrutement</a>
          <a href="${SITE_URL}/affiliation/">Affiliation</a>
        </div>
      </div>
    </div>
    <div class="nav-right">
      <a href="https://cal.com/maxens-soldan-msd-media/30min" class="contact-button" target="_blank">Réserver un appel</a>
      <a href="https://wa.me/33783141287" class="whatsapp-nav-button" target="_blank" aria-label="Chat on WhatsApp">
        <i class="fa-brands fa-whatsapp"></i>
      </a>
    </div>
  </header>

  <main>
    <section class="hero">
      <h2 class="section-tag section-tag--dark">Blog</h2>
      <h1 class="hero__title"><span>Blog MSD Media</span><span class="hero__title-word-wrap"><span>articles web, SEO et conversion.</span></span></h1>
      <div class="hero__actions" aria-label="Actions principales">
        <a class="hero__btn hero__btn--primary" href="https://cal.com/maxens-soldan-msd-media/30min" target="_blank">Réserver un appel</a>
        <a class="hero__btn hero__btn--secondary" href="/agence-web-annecy/">Découvrir l'agence</a>
      </div>
    </section>

    <section class="blog-search" aria-label="Recherche d'articles">
      <div class="blog-search__inner">
        <span class="blog-search__icon" aria-hidden="true"><i class="fa-solid fa-magnifying-glass"></i></span>
        <input id="blog-search-input" class="blog-search__input" type="search" placeholder="Rechercher un article..." autocomplete="off" />
        <p id="blog-search-empty" class="blog-search__empty" hidden>Aucun article trouvé.</p>
      </div>
    </section>

    <section class="case-studies-section">
      <div class="case-studies-inner">
        <div class="case-studies-grid">
          ${cards}
        </div>
      </div>
    </section>
  </main>

  ${renderBookingSection('../assets')}
  ${renderFullFooter('../assets')}

  <script src="../assets/js/script.js"></script>
  <script>
    (() => {
      const input = document.getElementById('blog-search-input');
      const empty = document.getElementById('blog-search-empty');
      const cards = Array.from(document.querySelectorAll('.case-study-card'));
      if (!input || !cards.length) return;

      const applyFilter = () => {
        const query = input.value.trim().toLowerCase();
        let visible = 0;
        cards.forEach((card) => {
          const title = card.querySelector('.case-study-card__title')?.textContent || '';
          const tag = card.querySelector('.case-study-card__tag')?.textContent || '';
          const description = card.querySelector('.case-study-card__description')?.textContent || '';
          const haystack = (title + ' ' + tag + ' ' + description).toLowerCase();
          const matches = !query || haystack.includes(query);
          card.style.display = matches ? '' : 'none';
          if (matches) visible += 1;
        });
        if (empty) empty.hidden = visible !== 0;
      };

      input.addEventListener('input', applyFilter);
    })();
  </script>
</body>
</html>`;
}

function enforceTextOnlyPolicyOnAllArticlePages() {
  if (!fs.existsSync(OUTPUT_DIR)) return;
  const dirs = fs
    .readdirSync(OUTPUT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  dirs.forEach((slug) => {
    const filePath = path.join(OUTPUT_DIR, slug, 'index.html');
    if (!fs.existsSync(filePath)) return;
    let html = fs.readFileSync(filePath, 'utf8');

    const dateRaw =
      (html.match(/"datePublished"\s*:\s*"([^"]+)"/i) || [])[1] ||
      (html.match(/<meta itemprop="datePublished" content="([^"]+)"/i) || [])[1] ||
      new Date().toISOString().slice(0, 10);

    const articleBlock = (html.match(/<article\b[\s\S]*?<\/article>/i) || [])[0] || '';
    const pageUrl =
      (html.match(/<link rel="canonical" href="([^"]+)"/i) || [])[1] ||
      `${SITE_URL}/blog/articles/${slug}/`;
    const pageTitle =
      (html.match(/<title>([^<]+)<\/title>/i) || [])[1] ||
      slug.replace(/-/g, ' ');
    const readTime = estimateReadTimeFromHtml(articleBlock);
    const metaLine = `Publié le ${formatFrenchDate(dateRaw)} • ${readTime.minutes} min de lecture`;
    const metaHtml = `<p class="blog-article-meta">${escapeHtml(metaLine)}</p>`;

    if (/class="blog-article-meta"/i.test(html)) {
      html = html.replace(/<p class="blog-article-meta">[\s\S]*?<\/p>/i, metaHtml);
    } else {
      html = html.replace(/(<h1 class="hero__title">[\s\S]*?<\/h1>)/i, `$1\n      ${metaHtml}`);
    }

    html = html.replace(/(<section class="section-grid blog-article-shell">[\s\S]*?<\/section>)/i, (sectionHtml) => {
      let cleaned = sectionHtml.replace(/<img\b[^>]*>\s*/gi, '');
      if (slug === 'maxens-soldan') {
        cleaned = cleaned.replace(
          /(<article[^>]*>[\s\S]*?<meta itemprop="author"[^>]*>\s*)/i,
          `$1\n        <img src="../../../assets/img/blog/maxens-soldan.webp" alt="Qui est Maxens Soldan ? Fondateur &amp; CEO de MSD Media" loading="lazy" style="width:100%;border-radius:18px;margin-bottom:1.25rem;" />\n`
        );
      }
      return cleaned;
    });

    const relatedSections = [...html.matchAll(/<section class="blog-related">[\s\S]*?<\/section>/gi)].map((m) => m[0]);
    const relatedLinks = [];
    relatedSections.forEach((section) => {
      const linkRegex = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      while ((m = linkRegex.exec(section))) {
        const href = m[1].trim();
        const text = m[2]
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (href && text) relatedLinks.push({ href, text });
      }
    });
    const uniqueRelatedLinks = relatedLinks.filter(
      (link, idx, arr) => arr.findIndex((x) => x.href === link.href) === idx
    );
    const relatedHtml = uniqueRelatedLinks.length
      ? `<section class="blog-related"><h2>Articles liés</h2><ul class="blog-related-links">${uniqueRelatedLinks
          .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.text)}</a></li>`)
          .join('')}</ul></section>`
      : '';

    html = html.replace(/<section class="blog-related">[\s\S]*?<\/section>/gi, '');
    html = html.replace(/<section class="blog-internal-links">[\s\S]*?<\/section>/gi, '');
    const legacyTitle =
      (html.match(/<meta property="og:title" content="([^"]+)"/i) || [])[1] ||
      (html.match(/<h1 class="hero__title">[\s\S]*?<span>([\s\S]*?)<\/span>/i) || [])[1] ||
      slug.replace(/-/g, ' ');
    const internalLinksHtml = renderInternalLinksSection({ slug, title: legacyTitle }, articleBlock);
    html = html.replace(/(<\/article>\s*)<\/section>/i, `$1${internalLinksHtml || ''}${relatedHtml || ''}</section>`);

    if (!/"@type"\s*:\s*"FAQPage"/i.test(html)) {
      const faqJsonLd = buildArticleFaqJsonLd({ title: pageTitle, html: articleBlock }, pageUrl);
      html = html.replace(
        '</head>',
        `  <script type="application/ld+json">${JSON.stringify(faqJsonLd)}</script>\n</head>`
      );
    }

    if (!/"aggregateRating"\s*:/i.test(html)) {
      const ratingJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: BRAND,
        url: SITE_URL,
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '5',
          reviewCount: '100',
          bestRating: '5',
          worstRating: '1'
        },
        mainEntityOfPage: pageUrl
      };
      html = html.replace(
        '</head>',
        `  <script type="application/ld+json">${JSON.stringify(ratingJsonLd)}</script>\n</head>`
      );
    }

    fs.writeFileSync(filePath, html, 'utf8');
  });
}

function parseLegacyArticleIndex(slug = '') {
  const filePath = path.join(OUTPUT_DIR, slug, 'index.html');
  if (!fs.existsSync(filePath)) return null;
  const html = fs.readFileSync(filePath, 'utf8');

  const get = (regex) => {
    const match = html.match(regex);
    return match ? match[1].trim() : '';
  };

  const title =
    get(/<meta property="og:title" content="([^"]+)"/i) ||
    get(/<title>([^<]+)<\/title>/i) ||
    slug.replace(/-/g, ' ');
  const description =
    get(/<meta name="description" content="([^"]*)"/i) ||
    get(/<meta property="og:description" content="([^"]*)"/i);
  const image =
    get(/<meta property="og:image" content="([^"]+)"/i) ||
    get(/<img src="([^"]+)"/i) ||
    DEFAULT_IMAGE;
  const dateFromPage =
    get(/"datePublished"\s*:\s*"([^"]+)"/i) ||
    get(/<meta itemprop="datePublished" content="([^"]+)"/i) ||
    fs.statSync(filePath).mtime.toISOString().slice(0, 10);
  const date = LEGACY_DATE_OVERRIDES[slug] || dateFromPage;

  return {
    title,
    slug,
    date: date.slice(0, 10),
    description,
    tags: [],
    keyword: '',
    image: normalizePostImage(image, slug),
    reading: estimateReadTimeFromHtml((html.match(/<article\b[\s\S]*?<\/article>/i) || [''])[0] || '')
  };
}

function collectLegacyOnlyPosts(posts) {
  const knownSlugs = new Set(posts.map((p) => p.slug));
  const dirs = fs
    .readdirSync(OUTPUT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  const legacyPosts = [];
  dirs.forEach((slug) => {
    if (knownSlugs.has(slug)) return;
    const parsed = parseLegacyArticleIndex(slug);
    if (parsed) legacyPosts.push(parsed);
  });

  return legacyPosts;
}

function renderRss(posts) {
  const items = posts
    .slice(0, 50)
    .map((p) => {
      const link = `${SITE_URL}/blog/articles/${p.slug}/`;
      return `<item>
  <title><![CDATA[${p.title}]]></title>
  <link>${link}</link>
  <guid>${link}</guid>
  <pubDate>${new Date(p.date).toUTCString()}</pubDate>
  <description><![CDATA[${p.description}]]></description>
</item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>${BRAND} - Blog</title>
  <link>${SITE_URL}/blog/</link>
  <description>Articles SEO, création de site web et conversion</description>
  <language>fr-fr</language>
  ${items}
</channel>
</rss>`;
}

function renderBlogSitemap(posts) {
  const urls = posts
    .map((p) => `  <url>\n    <loc>${SITE_URL}/blog/articles/${p.slug}/</loc>\n    <lastmod>${p.date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.65</priority>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

function patchMainSitemap(posts) {
  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) return;

  let xml = fs.readFileSync(sitemapPath, 'utf8');
  const markerStart = '<!-- blog-articles:start -->';
  const markerEnd = '<!-- blog-articles:end -->';
  const snippet = posts
    .map(
      (p) => `  <url>\n    <loc>${SITE_URL}/blog/articles/${p.slug}/</loc>\n    <lastmod>${p.date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.65</priority>\n  </url>`
    )
    .join('\n');

  const block = `${markerStart}\n${snippet}\n${markerEnd}`;

  if (xml.includes(markerStart) && xml.includes(markerEnd)) {
    xml = xml.replace(new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}`), block);
  } else {
    xml = xml.replace('</urlset>', `${block}\n</urlset>`);
  }

  fs.writeFileSync(sitemapPath, xml, 'utf8');
}

function main() {
  ensureDir(OUTPUT_DIR);

  const files = readAllMarkdownFiles(SOURCE_DIR);
  if (!files.length) {
    console.error('Aucun fichier markdown trouvé dans blog/sources');
    process.exit(1);
  }

  const posts = [];

  files.forEach((filePath) => {
    const source = fs.readFileSync(filePath, 'utf8');
    const { data, body } = parseFrontmatter(source);
    const cleanedBody = stripLeadingMarkdownH1(body);
    const plain = markdownToPlainText(cleanedBody);
    const reading = estimateReadTime(plain);

    const title = data.title || path.basename(filePath, '.md');
    const slug = data.slug || slugify(title);
    const date = data.date || new Date().toISOString().slice(0, 10);
    const description = data.description || plain.slice(0, 155);
    const tags = Array.isArray(data.tags) ? data.tags : [];
    const keyword = data.keyword || tags[0] || '';
    const image = normalizePostImage(data.image, slug);

    const { html, toc } = markdownToHtml(cleanedBody);

    posts.push({
      title,
      slug,
      date,
      description,
      tags,
      keyword,
      image,
      html,
      toc,
      reading,
      sourceFile: path.basename(filePath)
    });
  });

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const legacyOnlyPosts = collectLegacyOnlyPosts(posts);
  const allPostsForIndex = [...posts, ...legacyOnlyPosts].sort((a, b) => new Date(b.date) - new Date(a.date));

  posts.forEach((post) => {
    const dir = path.join(OUTPUT_DIR, post.slug);
    ensureDir(dir);
    const html = renderArticlePage(post, posts);
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
  });

  Object.entries(LEGACY_ALIASES).forEach(([legacySlug, targetSlug]) => {
    const targetDir = path.join(OUTPUT_DIR, targetSlug);
    const legacyDir = path.join(OUTPUT_DIR, legacySlug);
    const targetFile = path.join(targetDir, 'index.html');
    if (!fs.existsSync(targetFile)) return;
    ensureDir(legacyDir);
    fs.copyFileSync(targetFile, path.join(legacyDir, 'index.html'));
  });

  fs.writeFileSync(path.join(ROOT, 'blog', 'index.html'), renderBlogIndex(allPostsForIndex), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'blog', 'feed.xml'), renderRss(posts), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'blog', 'sitemap.xml'), renderBlogSitemap(allPostsForIndex), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'blog', 'articles-manifest.json'), JSON.stringify(posts, null, 2), 'utf8');

  enforceTextOnlyPolicyOnAllArticlePages();
  patchMainSitemap(allPostsForIndex);

  console.log(`✅ ${posts.length} articles générés dans blog/articles/`);
  console.log(`✅ ${legacyOnlyPosts.length} articles legacy ajoutés à blog/index.html`);
  console.log('✅ blog/index.html, blog/feed.xml, blog/sitemap.xml et sitemap.xml mis à jour');
}

main();
