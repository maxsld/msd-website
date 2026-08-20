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
// Image de couverture unique pour tous les articles (cover, og:image, twitter:image, JSON-LD).
const ARTICLE_COVER_IMAGE = '/assets/img/img-cover.webp';
const BLOG_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
const PUBLIC_IMAGE_FALLBACKS = [
  DEFAULT_LISTING_IMAGE,
  '/assets/img/logo-black.webp'
];
const LEGACY_ALIASES = {
  'template-2026-landing-page': 'creer-landing-page-qui-convertit'
};

const AUTHOR_AVATAR = '../../../assets/img/maxens-soldan.webp';
const AUTHOR_ROLE = 'Fondateur &amp; CEO de MSD Media';
const TOP_ANNOUNCEMENT_HTML = `<div class="top-announcement" role="banner">
    <span class="top-announcement__badge" data-i18n="announcement_badge">Nouveau</span>
    <span class="top-announcement__text" data-i18n="announcement_text">Recommandez MSD Media et percevez 15% sur chaque projet signé.</span>
    <a class="top-announcement__link" href="https://msd-media.com/affiliation/" data-i18n="announcement_link">Découvrir le programme</a>
  </div>`;
function renderAiSummaryHtml(pageUrl) {
  const prompt = `Résume-moi cet article MSD Media : ${pageUrl}`;
  const encodedPrompt = encodeURIComponent(prompt);

  return `<div class="blog-ai-summary">
          <p class="blog-ai-summary__label">Résumé généré par l'IA</p>
          <div class="blog-ai-summary__actions">
            <a class="hero__btn hero__btn--primary ai-proof__btn ai-proof__btn--chatgpt" href="https://chatgpt.com/?q=${encodedPrompt}" target="_blank" rel="noopener noreferrer" aria-label="Résumer cet article dans ChatGPT">
              <img class="ai-proof__logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/960px-ChatGPT-Logo.svg.png" alt="ChatGPT" width="18" height="18" loading="lazy" decoding="async">
              <span data-i18n="ai_proof_chatgpt">Demander à ChatGPT</span>
            </a>
            <a class="hero__btn hero__btn--primary ai-proof__btn ai-proof__btn--claude" href="https://claude.ai/new?q=${encodedPrompt}" target="_blank" rel="noopener noreferrer" aria-label="Résumer cet article dans Claude">
              <img class="ai-proof__logo" src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Claude_AI_symbol.svg" alt="Claude AI" width="18" height="18" loading="lazy" decoding="async">
              <span data-i18n="ai_proof_claude">Demander à Claude</span>
            </a>
          </div>
        </div>`;
}

// Blocs analytics/consentement partagés avec le reste du site (extraits des
// pages villes). Injectés sur chaque page du blog pour que GA4 + analytics
// maison couvrent aussi les 70+ pages générées.
const TRACKING_BLOCK = fs.readFileSync(path.join(__dirname, 'templates', 'tracking-block.html'), 'utf8');
const COOKIE_BANNER = fs.readFileSync(path.join(__dirname, 'templates', 'cookie-banner.html'), 'utf8');

function injectTracking(html) {
  if (html.includes('_msdLoadTracking')) return html;
  let out = html.replace('</head>', `${TRACKING_BLOCK}\n</head>`);
  if (!out.includes('id="cookie-consent"')) {
    out = out.replace('</body>', `  ${COOKIE_BANNER}\n</body>`);
  }
  return out;
}
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

// Chaque article garde sa propre image (frontmatter `image`, généralement une
// URL Unsplash absolue ; sinon image locale nommée par slug, avec repli sur
// les fallbacks publics génériques).
function resolvePostImage(post = {}) {
  const raw = String(post.image || '').trim();
  if (raw) return raw;
  return normalizePostImage('', post.slug || '');
}

// Une fois un article publié, son image live (og:image du HTML déjà généré)
// fait foi — le frontmatter markdown peut avoir dérivé depuis (retouche
// manuelle de l'image en prod) sans qu'on ait pensé à resynchroniser la
// source. Sans ce garde-fou, chaque rebuild réécrase l'image en prod par
// celle, potentiellement obsolète, du fichier .md.
function getLiveArticleImage(slug) {
  const filePath = path.join(OUTPUT_DIR, slug, 'index.html');
  if (!fs.existsSync(filePath)) return '';
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    const match = html.match(/<meta property="og:image" content="([^"]+)"/i);
    return match ? match[1].replace(/&amp;/g, '&') : '';
  } catch (_) {
    return '';
  }
}

function getListingImage(postOrLink = {}) {
  return resolvePostImage(postOrLink);
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

// Extrait les vraies paires question/réponse d'une section FAQ (h2 "FAQ" ou
// "questions fréquentes" suivi de h3 interrogatifs + paragraphe de réponse).
function extractFaqPairsFromHtml(html = '') {
  const faqStart = String(html).search(/<h2[^>]*>(?:(?!<\/h2>)[\s\S])*?(FAQ|[Qq]uestions?\s+fr[ée]quentes)[\s\S]*?<\/h2>/);
  if (faqStart === -1) return [];
  const rest = String(html).slice(faqStart);
  const endOfSection = rest.slice(5).search(/<h2[\s>]/);
  const section = endOfSection === -1 ? rest : rest.slice(0, endOfSection + 5);
  const pairs = [...section.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/gi)]
    .map((m) => ({
      question: m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      answer: m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    }))
    .filter((p) => p.question && p.answer);
  return pairs.slice(0, 8);
}

function buildArticleFaqJsonLd(post = {}, pageUrl = '') {
  const webPageRef = {
    '@type': 'WebPage',
    '@id': pageUrl
  };
  const faqPairs = extractFaqPairsFromHtml(post.html || '');
  if (faqPairs.length >= 2) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqPairs.map((p) => ({
        '@type': 'Question',
        name: p.question,
        acceptedAnswer: { '@type': 'Answer', text: p.answer }
      })),
      mainEntityOfPage: webPageRef
    };
  }
  const headings = extractHeadingsFromHtml(post.html || '', 3);
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

function getRelated(posts, current, max = 3) {
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

function renderRelatedCards(related = []) {
  const cards = related.slice(0, 3).map((postOrLink) => {
    const slug = postOrLink.slug || slugFromBlogHref(postOrLink.href || '');
    const href = postOrLink.href || `/blog/articles/${slug}/`;
    const title = postOrLink.title || postOrLink.text || slug.replace(/-/g, ' ');
    const topicTag = getCardTopicTag(postOrLink);
    const image = imagePathForPage(getListingImage(postOrLink), '../../../assets');
    const minutes = postOrLink.reading?.minutes || 1;

    return `<a class="blog-card" href="${escapeHtml(href)}">
          <img src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async">
          <span class="blog-card__content">
            <h3 class="blog-card__title">${escapeHtml(title)}</h3>
            <span class="blog-card__details">
              <span class="blog-card__duration"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${minutes} min</span>
              <span class="blog-card__tag">${escapeHtml(topicTag.label)}</span>
            </span>
          </span>
        </a>`;
  });

  return cards.length
    ? `<section class="blog-related"><h2>Articles liés</h2><div class="blog-related-grid">${cards.join('')}</div></section>`
    : '';
}

function renderBlogFeaturedCarousel(posts = []) {
  const slides = posts.slice(0, 5).map((post, index) => {
    const topicTag = getCardTopicTag(post);
    const image = imagePathForPage(getListingImage(post), '../assets');
    return `<a class="blog-hero-carousel__slide" href="/blog/articles/${post.slug}/" aria-label="${escapeHtml(post.title)}">
            <span class="blog-hero-carousel__media">
              <img src="${escapeHtml(image)}" alt="" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async">
            </span>
            <span class="blog-hero-carousel__content">
              <span class="blog-hero-carousel__meta">
                <span class="blog-featured__duration"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${post.reading?.minutes || 1} min</span>
                <span class="blog-featured__tag">${escapeHtml(topicTag.label)}</span>
              </span>
              <span class="blog-hero-carousel__title">${escapeHtml(post.title)}</span>
              <span class="blog-hero-carousel__desc">${escapeHtml(post.description || '')}</span>
            </span>
          </a>`;
  });

  const dots = posts.slice(0, 5).map((post, index) =>
    `<button class="blog-hero-carousel__dot${index === 0 ? ' is-active' : ''}" type="button" aria-label="Afficher l'article ${index + 1}" data-blog-carousel-dot="${index}"></button>`
  );

  return `<section class="blog-hero-carousel" aria-label="Derniers articles">
      <div class="blog-hero-carousel__inner" data-blog-carousel>
        <button class="blog-hero-carousel__arrow blog-hero-carousel__arrow--prev" type="button" aria-label="Article précédent" data-blog-carousel-prev>
          <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
        </button>
        <div class="blog-hero-carousel__viewport">
          <div class="blog-hero-carousel__track" data-blog-carousel-track>
            ${slides.join('\n')}
          </div>
        </div>
        <button class="blog-hero-carousel__arrow blog-hero-carousel__arrow--next" type="button" aria-label="Article suivant" data-blog-carousel-next>
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        </button>
        <div class="blog-hero-carousel__dots" aria-hidden="true">
          ${dots.join('\n')}
        </div>
      </div>
    </section>`;
}

function slugFromBlogHref(href = '') {
  const match = String(href).match(/\/blog\/articles\/([^/]+)\//i);
  return match ? match[1] : '';
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

function renderSiteHeader() {
  return `<header class="navbar">
    <div class="nav-left">
      <a href="${SITE_URL}/" aria-label="Accueil MSD Media">
        <img height="151" width="372" src="${SITE_URL}/assets/img/logo-black.webp" alt="MSD Media logo" class="logo" loading="eager">
        <span style="position:absolute;left:-9999px;">Accueil MSD Media</span>
      </a>
      <div class="nav-menu" data-nav-menu>
        <button class="nav-menu-toggle" type="button" aria-label="Ouvrir le menu des pages" aria-expanded="false" data-nav-menu-toggle>
          <span class="nav-menu-toggle__arrow" aria-hidden="true"></span>
        </button>
        <div class="nav-menu-dropdown" data-nav-menu-dropdown>
          <button class="nav-menu-close" type="button" aria-label="Fermer le menu" data-nav-menu-close>×</button>
          <a href="${SITE_URL}/" data-i18n="nav_home">Accueil</a>
          <a href="${SITE_URL}/realisations/" data-i18n="nav_realisations">Réalisations</a>
          <a href="${SITE_URL}/blog/" data-i18n="nav_blog">Blog</a>
          <a href="${SITE_URL}/contact/" data-i18n="nav_contact">Contact</a>
          <a href="${SITE_URL}/recrutement/" data-i18n="nav_recruitment">Recrutement</a>
          <a href="${SITE_URL}/affiliation/" data-i18n="nav_affiliation">Affiliation</a>
        </div>
      </div>
    </div>

    <nav class="nav-center" aria-label="Navigation principale">
      <div class="nav-dropdown-item">
        <a href="${SITE_URL}/blog/"><span class="nav-link-label" data-i18n="nav_resources">Ressources</span> <i class="fa-solid fa-chevron-down nav-dropdown-arrow" aria-hidden="true"></i></a>
        <div class="nav-megamenu">
          <div class="nav-megamenu__inner">
            <div class="nav-megamenu__links">
              <a href="${SITE_URL}/blog/" data-i18n="nav_blog">Blog</a>
              <a href="${SITE_URL}/glossaire/" data-i18n="nav_glossary">Glossaire</a>
              <a href="${SITE_URL}/realisations/" data-i18n="nav_realisations">Réalisations</a>
              <a href="${SITE_URL}/recrutement/" data-i18n="nav_recruitment">Recrutement</a>
              <a href="${SITE_URL}/#faq" data-i18n="nav_faq">FAQ</a>
            </div>
            <div class="nav-megamenu__media">
              <img src="${SITE_URL}/assets/img/navbar-img.png" alt="Aperçu des ressources MSD Media : blog, glossaire, réalisations" loading="lazy" decoding="async">
            </div>
          </div>
        </div>
      </div>
      <div class="nav-dropdown-item">
        <a href="${SITE_URL}/#secteurs"><span class="nav-link-label" data-i18n="nav_sector">Secteur</span> <i class="fa-solid fa-chevron-down nav-dropdown-arrow" aria-hidden="true"></i></a>
        <div class="nav-megamenu">
          <div class="nav-megamenu__inner">
            <div class="nav-megamenu__links">
              <a href="${SITE_URL}/site-web-avocat/" data-i18n="nav_lawyers">Avocats &amp; juristes</a>
              <a href="${SITE_URL}/site-web-medecin/" data-i18n="nav_doctors">Médecins &amp; santé</a>
              <a href="${SITE_URL}/site-web-immobilier/" data-i18n="nav_real_estate">Immobilier</a>
              <a href="${SITE_URL}/site-web-restaurant/" data-i18n="nav_restaurants">Restaurants &amp; cafés</a>
              <a href="${SITE_URL}/site-web-artisan/" data-i18n="nav_artisans">Artisans &amp; TPE</a>
              <a href="${SITE_URL}/site-web-architecte/" data-i18n="nav_architects">Architectes</a>
            </div>
            <div class="nav-megamenu__media">
              <img src="${SITE_URL}/assets/img/navbar-img2.png" alt="Aperçu des secteurs accompagnés par MSD Media" loading="lazy" decoding="async">
            </div>
          </div>
        </div>
      </div>
      <a href="${SITE_URL}/realisations/" data-i18n="nav_realisations">Réalisations</a>
      <a href="${SITE_URL}/tarifs/" data-i18n="nav_pricing">Tarifs</a>
    </nav>

    <div class="nav-right">
      <label class="lang-switch" for="lang-select">
        <span class="lang-switch__label">Langue</span>
        <select class="lang-switch__select" id="lang-select" data-lang-select aria-label="Choisir la langue">
          <option value="fr">🇫🇷 FR</option>
          <option value="en">🇬🇧 EN</option>
        </select>
      </label>
      <a href="https://cal.com/maxens-soldan-msd-media/30min" class="contact-button" target="_blank" data-i18n="nav_call">Réserver un appel</a>
      <a href="https://wa.me/33783141287" class="whatsapp-nav-button" target="_blank" aria-label="Chat on WhatsApp">
        <i class="fa-brands fa-whatsapp"></i>
      </a>
    </div>
  </header>`;
}

function renderBookingSection(assetPrefix) {
  return `<section class="ai-proof section-grid" id="ai-proof">
    <div class="ai-proof__inner">
      <img
        class="ai-proof__msd-logo"
        src="https://msd-media.com/assets/img/logo-black.webp"
        alt="MSD Media"
        loading="lazy"
        decoding="async"
      >
      <h3 class="section-title section-title--dark" data-i18n="ai_proof_title">Toujours pas sûr que MSD Media soit fait pour vous ?</h3>
      <p class="ai-proof__lead" data-i18n="ai_proof_lead">Laissez ChatGPT ou Claude réfléchir pour vous. Cliquez sur un bouton et découvrez ce que votre IA préférée dit à propos de MSD Media.</p>
      <div class="ai-proof__actions">
        <a
          class="hero__btn hero__btn--primary ai-proof__btn ai-proof__btn--chatgpt"
          href="https://chatgpt.com/?q=dis%20moi%20pourquoi%20msd%20media%20est%20un%20bon%20choix%20pour%20cr%C3%A9er%20mon%20site%20web"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Poser la question dans ChatGPT"
        >
          <img class="ai-proof__logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/ChatGPT-Logo.svg/960px-ChatGPT-Logo.svg.png" alt="ChatGPT" width="18" height="18" loading="lazy" decoding="async">
          <span data-i18n="ai_proof_chatgpt">Demander à ChatGPT</span>
        </a>
        <a
          class="hero__btn hero__btn--primary ai-proof__btn ai-proof__btn--claude"
          href="https://claude.ai/new?q=dis%20moi%20pourquoi%20msd%20media%20est%20un%20bon%20choix%20pour%20cr%C3%A9er%20mon%20site%20web"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Poser la question dans Claude"
        >
          <img class="ai-proof__logo" src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Claude_AI_symbol.svg" alt="Claude AI" width="18" height="18" loading="lazy" decoding="async">
          <span data-i18n="ai_proof_claude">Demander à Claude</span>
        </a>
      </div>
    </div>
  </section>

  <section class="booking-section" id="rdv">
    <div class="booking-section__inner">
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
        <img height="151" width="372" src="${SITE_URL}/assets/img/logo-black.webp" alt="Logo MSD Media" class="footer-logo" loading="lazy" decoding="async">
        <p class="footer-contact-text"><span class="footer-contact-title" data-i18n="footer_contact_title">Nous contacter</span><br><a href="mailto:maxens.soldan@msd-media.com">maxens.soldan@msd-media.com</a></p>
      </div>
      <div class="footer-offices">
        <article class="footer-office-card">
          <p class="footer-office-city">Annecy</p>
          <p class="footer-office-address">6 Rue Paul Guiton <br> 74000 Annecy, France</p>
        </article>
        <article class="footer-office-card">
          <p class="footer-office-city">Munich</p>
          <p class="footer-office-address">Munich, Bavière, Allemagne</p>
        </article>
      </div>
      <div class="footer-contact">
        <div class="footer-social">
          <a href="https://www.linkedin.com/in/maxens-soldan/" target="_blank" aria-label="Profil LinkedIn"><i class="fa-brands fa-linkedin"></i></a>
          <a href="https://instagram.com/" target="_blank" aria-label="Profil Instagram"><i class="fa-brands fa-instagram"></i></a>
          <a href="https://wa.me/33783141287" target="_blank" aria-label="Contacter sur WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
          <a href="mailto:maxens.soldan@msd-media.com" aria-label="E-mail"><i class="fa-solid fa-envelope"></i></a>
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
    <div class="footer-columns">
      <div class="footer-column">
        <p class="footer-column__title" data-i18n="footer_col_company">Entreprise</p>
        <ul>
          <li><a href="https://msd-media.com/a-propos/" data-i18n="footer_about">À propos</a></li>
          <li><a href="https://msd-media.com/realisations/" data-i18n="footer_references">Références</a></li>
          <li><a href="https://msd-media.com/tarifs/" data-i18n="nav_pricing">Tarifs</a></li>
          <li><a href="https://cal.com/maxens-soldan-msd-media/30min" target="_blank" data-i18n="footer_book_call">Réserver un appel</a></li>
          <li><a href="https://msd-media.com/contact/" data-i18n="footer_contact_commercial">Contact commercial</a></li>
          <li><a href="https://msd-media.com/affiliation/" data-i18n="footer_affiliate">Apporteur d'affaires</a></li>
        </ul>
      </div>
      <div class="footer-column">
        <p class="footer-column__title" data-i18n="footer_col_resources">Ressources</p>
        <ul>
          <li><a href="https://msd-media.com/blog/" data-i18n="nav_blog">Blog</a></li>
          <li><a href="https://msd-media.com/glossaire/" data-i18n="footer_glossary">Glossaire</a></li>
          <li><a href="https://msd-media.com/realisations/" data-i18n="nav_realisations">Réalisations</a></li>
          <li><a href="https://msd-media.com/recrutement/" data-i18n="nav_recruitment">Recrutement</a></li>
          <li><a href="https://msd-media.com/#faq" data-i18n="nav_faq">FAQ</a></li>
        </ul>
      </div>

      <div class="footer-column" id="secteurs">
        <p class="footer-column__title" data-i18n="footer_col_sectors">Secteurs</p>
        <ul>
          <li><a href="https://msd-media.com/site-web-avocat/" data-i18n="nav_lawyers">Avocats & juristes</a></li>
          <li><a href="https://msd-media.com/site-web-medecin/" data-i18n="nav_doctors">Médecins & santé</a></li>
          <li><a href="https://msd-media.com/site-web-immobilier/" data-i18n="nav_real_estate">Immobilier</a></li>
          <li><a href="https://msd-media.com/site-web-restaurant/" data-i18n="nav_restaurants">Restaurants & cafés</a></li>
          <li><a href="https://msd-media.com/site-web-artisan/" data-i18n="nav_artisans">Artisans & TPE</a></li>
          <li><a href="https://msd-media.com/site-web-architecte/" data-i18n="nav_architects">Architectes</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-legal">
      <a href="https://msd-media.com/terms/mentions.html" target="_blank" data-i18n="footer_legal_mentions">Mentions légales</a>
      <a href="https://msd-media.com/terms/politique-confidentialite.html" target="_blank" data-i18n="footer_privacy_policy">Politique de confidentialité</a>
      <a href="https://msd-media.com/terms/cgv.html" target="_blank" data-i18n="footer_terms_sale">Conditions générales de vente</a>
    </div>
    <div class="footer-bottom">
      <p>&copy; <span class="copyright-year">2026</span> <span data-i18n="footer_copyright">MSD Media. Tous droits réservés.</span></p>
    </div>
  </footer>`;
}

function renderArticlePage(post, allPosts) {
  const pageUrl = `${SITE_URL}/blog/articles/${post.slug}/`;
  const imageRaw = resolvePostImage(post);
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
      '@id': `${SITE_URL}/#maxens-soldan`,
      name: AUTHOR,
      url: `${SITE_URL}/blog/articles/maxens-soldan/`,
      jobTitle: 'Fondateur & CEO',
      worksFor: { '@id': `${SITE_URL}/#organization` },
      sameAs: ['https://www.linkedin.com/in/maxens-soldan/']
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
  const faqJsonLd = buildArticleFaqJsonLd(post, pageUrl);

  const related = getRelated(allPosts, post);
  const minutesLabel = post.reading.minutes === 1 ? '1 minute' : `${post.reading.minutes} minutes`;
  const relatedHtml = renderRelatedCards(related);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(post.title)} | ${BRAND}</title>
  <meta name="description" content="${escapeHtml(post.description)}" />
  <meta name="keywords" content="${escapeHtml(keywords)}" />
  <meta name="robots" content="${post.noindex ? 'noindex, follow' : 'index, follow, max-snippet:-1, max-image-preview:large'}" />
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
  <link rel="preload" href="../../../assets/css/animations.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <link rel="stylesheet" href="../../../assets/css/responsive.css" />
  <script src="https://kit.fontawesome.com/ddff5b2124.js" crossorigin="anonymous"></script>

  <script type="application/ld+json">${JSON.stringify(articleJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>
  <script type="application/ld+json">${JSON.stringify(faqJsonLd)}</script>
</head>
<body class="blog-article-page" data-asset-base="../../../assets">
  ${TOP_ANNOUNCEMENT_HTML}
  ${renderSiteHeader()}

  <main>
    <section class="hero">
      <div class="blog-article-hero__row">
        <div class="blog-article-hero__text">
          <p class="blog-breadcrumb blog-breadcrumb--hero"><a href="/blog/">Blog</a> <span aria-hidden="true">/</span> <span class="blog-breadcrumb__current">${escapeHtml(post.title)}</span></p>
          <h2 class="section-tag section-tag--dark">IA</h2>
          <h1 class="hero__title"><span>${escapeHtml(post.title)}</span></h1>
          <p class="blog-article-meta"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${minutesLabel} <span class="blog-article-meta__dot" aria-hidden="true">&middot;</span> ${escapeHtml(formatFrenchDate(post.date))}</p>
        </div>
        <div class="blog-article-cover">
          <img src="${image}" alt="" loading="eager" width="1600" height="686">
        </div>
      </div>
    </section>

    <section class="section-grid blog-article-shell">
      <div class="blog-toc" id="blog-toc"></div>
      <article class="blog-article-content" itemscope itemtype="https://schema.org/Article">
        <meta itemprop="headline" content="${escapeHtml(post.title)}" />
        <meta itemprop="datePublished" content="${escapeHtml(post.date)}" />
        <meta itemprop="dateModified" content="${escapeHtml(post.date)}" />
        <meta itemprop="author" content="${AUTHOR}" />

        ${renderAiSummaryHtml(pageUrl)}
        ${post.slug === 'maxens-soldan' ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(post.title)}" loading="lazy" style="width:100%;border-radius:18px;margin-bottom:1.25rem;" />` : ''}
        ${post.html}
      </article>
    </section>
    ${relatedHtml}
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
      const image = imagePathForPage(getListingImage(post), '../assets');
      return `<a href="/blog/articles/${post.slug}/" class="blog-card" data-title="${escapeHtml(post.title.toLowerCase())}" data-desc="${escapeHtml((post.description || '').toLowerCase())}">
        <img src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async">
        <span class="blog-card__content">
          <h3 class="blog-card__title">${escapeHtml(post.title)}</h3>
          <span class="blog-card__details">
            <span class="blog-card__duration"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${post.reading?.minutes || 1} min</span>
            <span class="blog-card__tag">${escapeHtml(topicTag.label)}</span>
          </span>
        </span>
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
  <link rel="preload" href="../assets/css/animations.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <link rel="stylesheet" href="../assets/css/responsive.css" />
  <script src="https://kit.fontawesome.com/ddff5b2124.js" crossorigin="anonymous"></script>
</head>
<body class="blog-index-page" data-asset-base="../assets">
  ${renderSiteHeader()}

  <main>
    <section class="hero">
      <h2 class="section-tag section-tag--dark">Blog MSD Media</h2>
      <h1 class="hero__title"><span>Conseils, analyses et stratégies</span></h1>
      <p class="hero__subheading">Des guides concrets pour mieux comprendre le web, améliorer votre visibilité et transformer votre site en levier de croissance.</p>
      <div class="hero__actions" aria-label="Actions principales">
        <a class="hero__btn hero__btn--primary" href="https://cal.com/maxens-soldan-msd-media/30min" target="_blank">Réserver un appel</a>
        <a class="hero__btn hero__btn--secondary" href="/agence-web-annecy/">Découvrir l'agence</a>
      </div>
    </section>

    ${renderBlogFeaturedCarousel(posts)}

    <section class="blog-search" aria-label="Recherche d'articles">
      <div class="blog-search__inner">
        <h2 class="blog-grid-heading">Nos derniers articles</h2>
        <span class="blog-search__icon" aria-hidden="true"><i class="fa-solid fa-magnifying-glass"></i></span>
        <input id="blog-search-input" class="blog-search__input" type="search" placeholder="Rechercher un article..." autocomplete="off" />
        <p id="blog-search-empty" class="blog-search__empty" hidden>Aucun article trouvé.</p>
      </div>
    </section>

    <section class="case-studies-section">
      <div class="case-studies-inner">
        <div class="blog-grid">
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
      const root = document.querySelector('[data-blog-carousel]');
      if (!root) return;
      if (root.dataset.carouselReady === 'true') return;
      const track = root.querySelector('[data-blog-carousel-track]');
      const slides = Array.from(root.querySelectorAll('.blog-hero-carousel__slide'));
      const dots = Array.from(root.querySelectorAll('[data-blog-carousel-dot]'));
      const prev = root.querySelector('[data-blog-carousel-prev]');
      const next = root.querySelector('[data-blog-carousel-next]');
      if (!track || !slides.length) return;

      let current = 0;
      const goTo = (index) => {
        current = (index + slides.length) % slides.length;
        track.style.transform = 'translateX(-' + current * 100 + '%)';
        dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === current));
      };

      prev?.addEventListener('click', () => goTo(current - 1));
      next?.addEventListener('click', () => goTo(current + 1));
      dots.forEach((dot, index) => dot.addEventListener('click', () => goTo(index)));
    })();

    (() => {
      const input = document.getElementById('blog-search-input');
      const empty = document.getElementById('blog-search-empty');
      const cards = Array.from(document.querySelectorAll('.blog-card'));
      if (!input || !cards.length) return;

      const applyFilter = () => {
        const query = input.value.trim().toLowerCase();
        let visible = 0;
        cards.forEach((card) => {
          const title = card.querySelector('.blog-card__title')?.textContent || '';
          const tag = card.querySelector('.blog-card__tag')?.textContent || '';
          const description = card.dataset.desc || '';
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

function removeClassedDivBlock(html, className) {
  const classNeedle = `class="${className}`;
  let output = html;
  let start = output.indexOf(classNeedle);

  while (start !== -1) {
    start = output.lastIndexOf('<div', start);
    if (start === -1) break;

    const tagRe = /<\/?div\b[^>]*>/gi;
    tagRe.lastIndex = start;
    let depth = 0;
    let end = -1;
    let match;

    while ((match = tagRe.exec(output))) {
      if (match[0].startsWith('</')) {
        depth -= 1;
        if (depth === 0) {
          end = tagRe.lastIndex;
          break;
        }
      } else {
        depth += 1;
      }
    }

    if (end === -1) break;
    output = `${output.slice(0, start)}\n        ${output.slice(end)}`;
    start = output.indexOf(classNeedle, start);
  }

  return output;
}

function enforceTextOnlyPolicyOnAllArticlePages(allPosts = []) {
  if (!fs.existsSync(OUTPUT_DIR)) return;
  const postsBySlug = new Map(allPosts.map((post) => [post.slug, post]));
  const dirs = fs
    .readdirSync(OUTPUT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  dirs.forEach((slug) => {
    const filePath = path.join(OUTPUT_DIR, slug, 'index.html');
    if (!fs.existsSync(filePath)) return;
    let html = fs.readFileSync(filePath, 'utf8');
    html = html.replace(/<header class="navbar">[\s\S]*?<\/header>/i, renderSiteHeader());

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
    const minutesLabel = readTime.minutes === 1 ? '1 minute' : `${readTime.minutes} minutes`;

    // Rebuild the hero (breadcrumb, tag, title, meta, author, cover image —
    // no CTA buttons) whether or not it's already in the new shape, keeping
    // this pass idempotent and self-healing for hand-authored/legacy pages.
    const heroRe = /<section class="hero">[\s\S]*?<\/section>\s*(?:<div class="blog-article-cover">[\s\S]*?<\/div>\s*)?/i;
    const heroMatch = html.match(heroRe);
    if (heroMatch) {
      const oldBlock = heroMatch[0];
      const titleSpan =
        (oldBlock.match(/<h1 class="hero__title"><span>([\s\S]*?)<\/span><\/h1>/i) || [])[1] || escapeHtml(pageTitle);
      const existingTag =
        (oldBlock.match(/<h2 class="section-tag section-tag--dark">([\s\S]*?)<\/h2>/i) || [])[1];
      const tagLabel = existingTag && existingTag.trim() ? existingTag.trim() : 'IA';
      // Chaque article garde sa propre image (frontmatter), plus de cover unique forcée.
      const postForImage = postsBySlug.get(slug);
      const coverSrc = postForImage
        ? imagePathForPage(resolvePostImage(postForImage), '../../../assets')
        : '../../../assets/img/img-cover.webp';
      const newBlock = `<section class="hero">
      <div class="blog-article-hero__row">
        <div class="blog-article-hero__text">
          <p class="blog-breadcrumb blog-breadcrumb--hero"><a href="/blog/">Blog</a> <span aria-hidden="true">/</span> <span class="blog-breadcrumb__current">${titleSpan}</span></p>
          <h2 class="section-tag section-tag--dark">${escapeHtml(tagLabel)}</h2>
          <h1 class="hero__title"><span>${titleSpan}</span></h1>
          <p class="blog-article-meta"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${minutesLabel} <span class="blog-article-meta__dot" aria-hidden="true">&middot;</span> ${escapeHtml(formatFrenchDate(dateRaw))}</p>
        </div>
        <div class="blog-article-cover">
          <img src="${coverSrc}" alt="" loading="eager" width="1600" height="686">
        </div>
      </div>
    </section>

`;
      html = html.replace(oldBlock, newBlock);
    }

    // Drop the duplicated author block that used to live in the white
    // content area now that it lives in the hero.
    html = html.replace(
      /\s*<div class="blog-article-author">[\s\S]*?<\/div>\s*(?=<div class="blog-article-share">)/i,
      '\n\n        '
    );

    // Drop share widgets and rebuild the AI summary from the canonical
    // constant below. The summary has nested divs, so remove it structurally.
    html = html.replace(/\s*<div class="blog-article-share(?: blog-article-share--bottom)?">[\s\S]*?<\/div>\s*/gi, '\n        ');
    html = removeClassedDivBlock(html, 'blog-ai-summary');

    html = html.replace(/(<section class="section-grid blog-article-shell">[\s\S]*?<\/section>)/i, (sectionHtml) => {
      let cleaned = sectionHtml.replace(/<article\b[^>]*>[\s\S]*?<\/article>/i, (articleHtml) =>
        articleHtml.replace(/<img\b[^>]*>\s*/gi, '')
      );
      if (slug === 'maxens-soldan') {
        cleaned = cleaned.replace(
          /(<article[^>]*>[\s\S]*?<meta itemprop="author"[^>]*>\s*)/i,
          `$1\n        <img src="../../../assets/img/blog/maxens-soldan.webp" alt="Qui est Maxens Soldan ? Fondateur &amp; CEO de MSD Media" loading="lazy" style="width:100%;border-radius:18px;margin-bottom:1.25rem;" />\n`
        );
      }
      return cleaned;
    });

    // Re-add the AI-summary badge inside the article. Its icons must survive
    // the text-only image policy above, so it's injected after that pass runs.
    if (/<meta itemprop="author"[^>]*>\s*/i.test(html)) {
      html = html.replace(
        /(<meta itemprop="author"[^>]*>\s*)/i,
        (m) => `${m}\n        ${renderAiSummaryHtml(pageUrl)}`
      );
    }

    const relatedSections = [...html.matchAll(/<section class="blog-related">[\s\S]*?<\/section>/gi)].map((m) => m[0]);
    const relatedLinks = [];
    relatedSections.forEach((section) => {
      const linkRegex = /<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      while ((m = linkRegex.exec(section))) {
        const href = m[1].trim();
        const inner = m[2];
        const cardTitle =
          (inner.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i) || [])[1]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const text = cardTitle || inner
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const image =
          (inner.match(/<img[^>]*src="([^"]+)"/i) || [])[1] ||
          normalizePostImage('', slugFromBlogHref(href));
        if (href && text) {
          const relatedSlug = slugFromBlogHref(href);
          relatedLinks.push(postsBySlug.get(relatedSlug) || { slug: relatedSlug, href, text, title: text, image });
        }
      }
    });
    const currentPost = postsBySlug.get(slug) || {
      slug,
      title: pageTitle,
      date: dateRaw,
      tags: []
    };
    const relatedFallbacks = getRelated(allPosts, currentPost, 3);
    const uniqueRelatedLinks = [...relatedLinks, ...relatedFallbacks].filter((link, idx, arr) => {
      const linkSlug = link.slug || slugFromBlogHref(link.href || '');
      const linkKey = linkSlug || link.href;
      if (!linkKey || linkSlug === slug) return false;
      return arr.findIndex((x) => {
        const xSlug = x.slug || slugFromBlogHref(x.href || '');
        return (xSlug || x.href) === linkKey;
      }) === idx;
    });
    const relatedHtml = renderRelatedCards(uniqueRelatedLinks);

    html = html.replace(/<section class="blog-related">[\s\S]*?<\/section>/gi, '');
    html = html.replace(/<section class="blog-internal-links">[\s\S]*?<\/section>/gi, '');
    html = html.replace(/(<\/article>\s*)<\/section>/i, `$1</section>${relatedHtml || ''}`);
    html = html.replace(/\s*<section class="ai-proof[\s\S]*?<\/section>\s*/gi, '\n');
    html = html.replace(/\s*<section class="booking-section"[\s\S]*?<\/section>\s*/gi, '\n');
    html = html.replace(/\s*<footer class="site-footer">[\s\S]*?<\/footer>\s*/gi, '\n');
    html = html.replace(/<\/main>/i, `</main>\n\n  ${renderBookingSection('../../../assets')}\n\n  ${renderFullFooter('../../../assets')}`);

    if (!/"@type"\s*:\s*"FAQPage"/i.test(html)) {
      const faqJsonLd = buildArticleFaqJsonLd({ title: pageTitle, html: articleBlock }, pageUrl);
      html = html.replace(
        '</head>',
        `  <script type="application/ld+json">${JSON.stringify(faqJsonLd)}</script>\n</head>`
      );
    }

    // Les notes fabriquées (aggregateRating) sur des articles violent les
    // consignes structured data de Google : on les retire de tout JSON-LD.
    html = html.replace(
      /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>\n?)/gi,
      (match, open, json, close) => {
        if (!/"aggregateRating"/.test(json)) return match;
        try {
          const obj = JSON.parse(json);
          if (obj['@type'] === 'Organization' && obj.aggregateRating && obj.mainEntityOfPage) {
            return '';
          }
          delete obj.aggregateRating;
          return `${open}${JSON.stringify(obj)}${close}`;
        } catch (_) {
          return match;
        }
      }
    );

    fs.writeFileSync(filePath, injectTracking(html), 'utf8');
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
    image: resolvePostImage({ image, slug }),
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
    const image = getLiveArticleImage(slug) || resolvePostImage({ image: data.image, slug });
    const noindex = data.noindex === true || data.noindex === 'true';

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
      noindex,
      sourceFile: path.basename(filePath)
    });
  });

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const legacyOnlyPosts = collectLegacyOnlyPosts(posts);
  const allPostsForIndex = [...posts, ...legacyOnlyPosts].sort((a, b) => new Date(b.date) - new Date(a.date));

  posts.forEach((post) => {
    const dir = path.join(OUTPUT_DIR, post.slug);
    ensureDir(dir);
    const html = injectTracking(renderArticlePage(post, posts));
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

  fs.writeFileSync(path.join(ROOT, 'blog', 'index.html'), injectTracking(renderBlogIndex(allPostsForIndex)), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'blog', 'feed.xml'), renderRss(posts), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'blog', 'sitemap.xml'), renderBlogSitemap(allPostsForIndex), 'utf8');
  fs.writeFileSync(path.join(ROOT, 'blog', 'articles-manifest.json'), JSON.stringify(posts, null, 2), 'utf8');

  enforceTextOnlyPolicyOnAllArticlePages(allPostsForIndex);
  patchMainSitemap(allPostsForIndex);

  console.log(`✅ ${posts.length} articles générés dans blog/articles/`);
  console.log(`✅ ${legacyOnlyPosts.length} articles legacy ajoutés à blog/index.html`);
  console.log('✅ blog/index.html, blog/feed.xml, blog/sitemap.xml et sitemap.xml mis à jour');
}

main();
