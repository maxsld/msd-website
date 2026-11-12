// Routing Middleware Vercel : un visiteur basé hors des pays francophones, dont le navigateur
// n'est pas en français, est redirigé vers la version anglaise de la page quand elle existe.
// Les robots ne sont jamais redirigés (Google explore depuis les États-Unis : le référencement
// français doit rester intact), et un choix de langue fait dans le sélecteur (cookie) prime.

export const config = {
  matcher: ['/((?!assets/|api/|en/|_vercel|.*\\.(?:css|js|mjs|json|xml|txt|png|jpe?g|webp|avif|svg|ico|pdf|woff2?|mp4|webmanifest)$).*)'],
};

// Page française -> page anglaise. Bloc régénéré par scripts/build-en-pages.mjs.
// ROUTES:START
const ROUTES = {
  "/": "/en/",
  "/agence-web-munich/": "/en/munich/",
  "/tarifs/": "/en/pricing/",
  "/tarifs/msd-care/": "/en/pricing/msd-care/",
  "/a-propos/": "/en/about/",
  "/contact/": "/en/contact/",
  "/reserver-un-appel/": "/en/book-a-call/",
  "/creation-landing-page/": "/en/landing-page-design/",
  "/outils/": "/en/tools/",
  "/affiliation/": "/en/referral-program/",
  "/realisations/": "/en/work/",
  "/realisations/agence-3xl/": "/en/work/agence-3xl/",
  "/realisations/aristoi-academia/": "/en/work/aristoi-academia/",
  "/realisations/carroz-sports/": "/en/work/carroz-sports/",
  "/realisations/em-motors/": "/en/work/em-motors/",
  "/realisations/hairtattoo/": "/en/work/hairtattoo/",
  "/realisations/laurence-daien-maestripieri/": "/en/work/laurence-daien-maestripieri/",
  "/realisations/marie-troccaz/": "/en/work/marie-troccaz/",
  "/realisations/maxime-sciare/": "/en/work/maxime-sciare/",
  "/realisations/merz-radiesse/": "/en/work/merz-radiesse/",
  "/realisations/merz-ultherapy-prime/": "/en/work/merz-ultherapy-prime/",
  "/realisations/nation-startup/": "/en/work/nation-startup/",
  "/terms/mentions.html": "/en/legal/legal-notice.html",
  "/terms/cgv.html": "/en/legal/terms-of-sale.html",
  "/terms/politique-confidentialite.html": "/en/legal/privacy-policy.html"
};
// ROUTES:END

// Pays où le site reste en français : France (DOM-TOM compris), Belgique, Suisse, Luxembourg, Monaco
const FRENCH_COUNTRIES = new Set(['FR', 'BE', 'CH', 'LU', 'MC', 'RE', 'GP', 'MQ', 'GF', 'YT', 'PM', 'NC', 'PF', 'WF', 'BL', 'MF']);
const BOT = /bot|crawl|spider|slurp|google|bing|yandex|baidu|duckduck|facebookexternalhit|embedly|preview|lighthouse|pagespeed|headless|chatgpt|gptbot|claude|perplexity|curl|wget|python|node-fetch|axios/i;
const LANG_COOKIE = 'msd_site_lang';

// Continue vers la page demandée (équivalent de next() de @vercel/functions, sans dépendance)
const passThrough = () => new Response(null, { headers: { 'x-middleware-next': '1' } });

export default function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname.endsWith('/') || url.pathname.endsWith('.html') ? url.pathname : url.pathname + '/';
  const target = ROUTES[path];
  if (!target || request.method !== 'GET') return passThrough();

  if (BOT.test(request.headers.get('user-agent') || '')) return passThrough();

  const cookie = (request.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${LANG_COOKIE}=([a-z]{2})`));
  const chosen = cookie && cookie[1];
  if (chosen === 'fr') return passThrough();

  if (chosen !== 'en') {
    const country = (request.headers.get('x-vercel-ip-country') || '').toUpperCase();
    if (!country || FRENCH_COUNTRIES.has(country)) return passThrough();
    // Navigateur réglé en français (francophone à l'étranger) : on garde le français
    const primary = (request.headers.get('accept-language') || '').split(',')[0].trim().toLowerCase();
    if (primary.startsWith('fr')) return passThrough();
  }

  const dest = new URL(target + url.search + url.hash, url.origin);
  return new Response(null, {
    status: 307,
    headers: { location: dest.toString(), 'cache-control': 'private, no-store', vary: 'cookie, accept-language' },
  });
}
