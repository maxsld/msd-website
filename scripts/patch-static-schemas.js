#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SITE_URL = 'https://msd-media.com';

const EXCLUDED_PREFIXES = ['blog/', 'etudes-de-cas/'];
const EXCLUDED_FILES = new Set([
  '404.html',
  '404/index.html',
  'terms/mentions.html',
  'terms/politique-confidentialite.html',
  'confirmation-contact/index.html',
  'confirmation-reservation-appel/index.html'
]);

const SERVICE_PATH_RE =
  /^(index\.html|agence-web-[^/]+\/index\.html|creation-site-[^/]+\/index\.html|landing-page-[^/]+\/index\.html|seo-local-[^/]+\/index\.html|audit-seo-[^/]+\/index\.html|refonte-site-web-[^/]+\/index\.html|tarifs-site-web-[^/]+\/index\.html)$/;

function walkHtmlFiles(dir, rel = '') {
  const full = path.join(dir, rel);
  const entries = fs.readdirSync(full, { withFileTypes: true });
  const out = [];
  for (const e of entries) {
    const relPath = path.join(rel, e.name);
    if (e.isDirectory()) {
      out.push(...walkHtmlFiles(dir, relPath));
    } else if (e.isFile() && e.name.endsWith('.html')) {
      out.push(relPath.replace(/\\/g, '/'));
    }
  }
  return out;
}

function cleanText(input = '') {
  return String(input)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getCanonicalUrl(html, relPath) {
  const m = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i);
  if (m) return m[1].trim();
  if (relPath === 'index.html') return `${SITE_URL}/`;
  return `${SITE_URL}/${relPath.replace(/\/index\.html$/, '/')}`;
}

function getPageTitle(html, relPath) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (m) return cleanText(m[1]) || 'MSD Media';
  return relPath === 'index.html' ? 'MSD Media' : relPath.replace(/\/index\.html$/, '').replace(/-/g, ' ');
}

function inferLocality(relPath) {
  const lower = relPath.toLowerCase();
  if (lower.includes('strasbourg')) {
    return {
      city: 'Strasbourg',
      region: 'Alsace',
      postalCode: '67000',
      geo: { latitude: 48.5734, longitude: 7.7521 }
    };
  }
  return {
    city: 'Annecy',
    region: 'Haute-Savoie',
    postalCode: '74000',
    geo: { latitude: 45.8992, longitude: 6.1294 }
  };
}

function getServiceType(relPath) {
  const lower = relPath.toLowerCase();
  if (lower.includes('landing-page')) return 'Création de landing page';
  if (lower.includes('seo-local') || lower.includes('audit-seo')) return 'SEO local';
  if (lower.includes('refonte-site-web')) return 'Refonte de site web';
  if (lower.includes('tarifs-site-web')) return 'Conseil tarifaire création de site web';
  if (lower.includes('creation-site')) return 'Création de site web';
  if (lower.includes('agence-web')) return 'Services d’agence web';
  return 'Création de site web';
}

function breadcrumbJsonLd(canonical, title) {
  const pathPart = canonical.replace(SITE_URL, '').replace(/\/+$/, '/');
  const isHome = pathPart === '/';
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Accueil',
      item: `${SITE_URL}/`
    }
  ];
  if (!isHome) {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: title,
      item: canonical
    });
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items
  };
}

function localBusinessJsonLd(canonical, relPath) {
  const loc = inferLocality(relPath);
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'MSD Media',
    url: `${SITE_URL}/`,
    image: `${SITE_URL}/assets/img/logo-black.webp`,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: loc.city,
      postalCode: loc.postalCode,
      addressRegion: loc.region,
      addressCountry: 'FR'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: loc.geo.latitude,
      longitude: loc.geo.longitude
    },
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: 30
    },
    areaServed: ['France', 'Suisse', 'Belgique'],
    sameAs: [
      'https://www.linkedin.com/company/msd-media',
      'https://fr.trustpilot.com/review/msd-media.com'
    ],
    mainEntityOfPage: canonical
  };
}

function serviceJsonLd(canonical, title, relPath) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: title,
    serviceType: getServiceType(relPath),
    provider: {
      '@type': 'Organization',
      name: 'MSD Media',
      url: `${SITE_URL}/`
    },
    areaServed: 'France',
    url: canonical
  };
}

function hasType(html, schemaType) {
  const pattern = new RegExp(`"@type"\\s*:\\s*"${schemaType}"`, 'i');
  return pattern.test(html);
}

function injectAutoSchemas(html, relPath) {
  const canonical = getCanonicalUrl(html, relPath);
  const title = getPageTitle(html, relPath);
  const shouldHaveService = SERVICE_PATH_RE.test(relPath);

  const scripts = [];

  if (!hasType(html, 'BreadcrumbList')) {
    scripts.push({ id: 'schema-breadcrumb-auto', data: breadcrumbJsonLd(canonical, title) });
  }

  if (shouldHaveService && !hasType(html, 'LocalBusiness')) {
    scripts.push({ id: 'schema-localbusiness-auto', data: localBusinessJsonLd(canonical, relPath) });
  }

  if (shouldHaveService && !hasType(html, 'Service')) {
    scripts.push({ id: 'schema-service-auto', data: serviceJsonLd(canonical, title, relPath) });
  }

  if (!scripts.length) return html;

  const block =
    '\n<!-- auto-schema:start -->\n' +
    scripts
      .map(
        (s) =>
          `<script id="${s.id}" type="application/ld+json">${JSON.stringify(s.data)}</script>`
      )
      .join('\n') +
    '\n<!-- auto-schema:end -->\n';

  if (html.includes('<!-- auto-schema:start -->') && html.includes('<!-- auto-schema:end -->')) {
    return html.replace(/<!-- auto-schema:start -->[\s\S]*?<!-- auto-schema:end -->/i, block.trim());
  }

  return html.replace('</head>', () => `${block}</head>`);
}

function main() {
  const files = walkHtmlFiles(ROOT).filter((relPath) => {
    if (EXCLUDED_FILES.has(relPath)) return false;
    if (EXCLUDED_PREFIXES.some((p) => relPath.startsWith(p))) return false;
    return true;
  });

  let updated = 0;
  files.forEach((relPath) => {
    const fullPath = path.join(ROOT, relPath);
    const before = fs.readFileSync(fullPath, 'utf8');
    const after = injectAutoSchemas(before, relPath);
    if (after !== before) {
      fs.writeFileSync(fullPath, after, 'utf8');
      updated += 1;
    }
  });

  console.log(`✅ Schémas statiques patchés sur ${updated} page(s).`);
}

main();
