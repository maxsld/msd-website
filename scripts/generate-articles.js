import Anthropic from '@anthropic-ai/sdk';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { saveDraftToGitHub } from './github-draft.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
const KEYWORD_POOL = [
  "agence landing page SaaS France",
  "refonte site web B2B",
  "landing page qui convertit",
  "agence web Annecy",
  "création site web entreprise",
  "landing page vs site vitrine",
  "agence web Genève",
  "combien coûte une landing page",
  "site web 14 jours livraison",
  "agence web Lyon B2B",
  "landing page startup",
  "agence web Suisse",
  "optimisation taux de conversion site web",
  "refonte site vitrine PME",
  "agence web Chambéry",
  "site web sur mesure vs template",
  "agence web Belgique B2B",
  "landing page entrepreneur",
  "vitesse chargement site web SEO",
  "agence web sans abonnement",
  "création site web Strasbourg",
  "agence web spécialisée conversion",
  "site web artisan PME France",
  "landing page high ticket",
  "coût refonte site web PME",
];

function pickKeywords(pool, n = 3) {
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const shuffled = [...pool].sort((a, b) => {
    const ha = parseInt(crypto.createHash('md5').update(a + week).digest('hex').slice(0, 4), 16);
    const hb = parseInt(crypto.createHash('md5').update(b + week).digest('hex').slice(0, 4), 16);
    return ha - hb;
  });
  return shuffled.slice(0, n);
}

// ─── GÉNÉRATION D'UN ARTICLE ──────────────────────────────────────────────────
async function generateArticle(keyword) {
  console.log(`✍️ Génération article pour : "${keyword}"`);

  const today = new Date().toISOString().split('T')[0];

  const prompt = `Tu es expert SEO et rédacteur pour MSD Media, une agence web basée à Annecy (France) spécialisée dans les landing pages et sites web sur mesure pour entreprises B2B, SaaS et entrepreneurs.

Rédige un article de blog SEO complet en français pour le mot-clé : "${keyword}"

CONTEXTE MSD MEDIA :
- Agence positionnée sur la qualité premium, le sur-mesure (zéro template)
- Livraison en 14 jours
- Clients : France, Suisse, Belgique
- Ton : direct, expert, sans bullshit marketing. Jamais condescendant.
- CTA : toujours vers https://cal.com/maxens-soldan-msd-media/30min

FORMAT OBLIGATOIRE (retourne UNIQUEMENT le markdown, rien d'autre) :

---
title: "[Titre optimisé SEO, accrocheur, 55-65 caractères]"
date: "${today}"
description: "[Meta description 140-155 caractères, avec le mot-clé]"
image: "UNSPLASH_PLACEHOLDER"
tags: ["tag1", "tag2", "tag3", "tag4"]
slug: "[slug-url-en-kebab-case]"
keyword: "${keyword}"
---

# [Même titre que dans le frontmatter]

[Introduction de 80-100 mots qui accroche, pose le problème du lecteur cible]

---

## [H2 - premier sous-titre]

[200-250 mots de contenu]

## [H2 - deuxième sous-titre]

[200-250 mots de contenu]

## [H2 - troisième sous-titre]

[200-250 mots de contenu]

## [H2 - conclusion / récap]

[100 mots de conclusion]

---

**Vous cherchez ${keyword.split(' ').slice(0, 3).join(' ')} ?** [Phrase de transition naturelle vers le CTA]

[Réserver un appel →](https://cal.com/maxens-soldan-msd-media/30min)

RÈGLES :
- Minimum 800 mots de contenu total
- Intègre le mot-clé naturellement 4-6 fois
- Pas de contenu générique ou évident
- Des exemples concrets, des chiffres si pertinent
- Ne mentionne jamais de concurrents par nom
- Retourne UNIQUEMENT le markdown brut, sans backticks ni explication`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0].text;

  const slugMatch = content.match(/^slug:\s*"?([^"\n]+)"?/m);
  const slug = slugMatch
    ? slugMatch[1].trim()
    : keyword.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const titleMatch = content.match(/^title:\s*"?([^"\n]+)"?/m);
  const title = titleMatch ? titleMatch[1].trim() : keyword;

  return { slug, title, keyword, content };
}

// ─── EMAIL ────────────────────────────────────────────────────────────────────
function buildEmailHtml(articles) {
  const baseUrl = process.env.APPROVAL_BASE_URL;
  const weekLabel = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const articleCards = articles
    .map((article, i) => {
      const approveUrl = `${baseUrl}/api/approve?slug=${encodeURIComponent(article.slug)}&token=${encodeURIComponent(article.token)}`;
      const preview = article.content
        .split('\n')
        .filter(
          (l) =>
            l.trim() &&
            !l.startsWith('#') &&
            !l.startsWith('---') &&
            !l.startsWith('title:') &&
            !l.startsWith('date:') &&
            !l.startsWith('description:') &&
            !l.startsWith('image:') &&
            !l.startsWith('tags:') &&
            !l.startsWith('slug:') &&
            !l.startsWith('keyword:') &&
            l.trim() !== ''
        )
        .slice(0, 3)
        .join(' ')
        .substring(0, 200) + '...';

      return `
    <div style="background:#f9f9f9;border:1px solid #e0e0e0;border-radius:8px;padding:24px;margin-bottom:24px;">
      <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Article ${i + 1}</div>
      <h2 style="margin:0 0 8px;font-size:18px;color:#111;">${article.title}</h2>
      <p style="font-size:13px;color:#555;margin:0 0 16px;">
        🎯 Mot-clé : <strong>${article.keyword}</strong> &nbsp;|&nbsp;
        📄 Fichier : <code style="background:#eee;padding:2px 6px;border-radius:4px;">${article.slug}.md</code>
      </p>
      <p style="font-size:14px;color:#444;line-height:1.6;margin:0 0 20px;">${preview}</p>
      <details style="margin-bottom:20px;">
        <summary style="cursor:pointer;font-size:13px;color:#555;font-weight:600;">Voir le contenu complet</summary>
        <pre style="background:#fff;border:1px solid #ddd;border-radius:6px;padding:16px;font-size:12px;overflow:auto;white-space:pre-wrap;margin-top:12px;line-height:1.5;">${article.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </details>
      <a href="${approveUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">✅ Approuver et publier</a>
    </div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:700px;margin:0 auto;padding:32px 16px;color:#111;">
  <div style="margin-bottom:32px;">
    <img src="https://msd-media.com/assets/img/logo-black.webp" alt="MSD Media" style="height:32px;margin-bottom:16px;">
    <h1 style="font-size:22px;margin:0 0 8px;">3 articles SEO à valider — semaine du ${weekLabel}</h1>
    <p style="color:#666;font-size:14px;margin:0;">Clique sur <strong>Approuver et publier</strong> pour chaque article à mettre en ligne. Les articles non approuvés restent en draft.</p>
  </div>
  ${articleCards}
  <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
  <p style="font-size:12px;color:#999;">Généré automatiquement par la machine SEO MSD Media · <a href="https://msd-media.com" style="color:#999;">msd-media.com</a></p>
</body>
</html>`;
}

async function sendEmail(articles) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || 'MSD Media SEO <seo@msd-media.com>',
    to: 'agence@msd-media.com',
    subject: `📝 3 articles SEO à valider — ${dateLabel}`,
    html: buildEmailHtml(articles),
  });

  console.log('📧 Email envoyé à agence@msd-media.com');
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Démarrage de la génération hebdomadaire...');

  const keywords = pickKeywords(KEYWORD_POOL, 3);
  console.log('🎯 Mots-clés sélectionnés :', keywords);

  const articles = [];
  for (const keyword of keywords) {
    const article = await generateArticle(keyword);
    article.token = crypto
      .createHash('sha256')
      .update(article.slug + process.env.ANTHROPIC_API_KEY)
      .digest('hex')
      .slice(0, 32);
    articles.push(article);
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`✅ ${articles.length} articles générés`);

  console.log('💾 Sauvegarde des drafts sur GitHub...');
  for (const article of articles) {
    await saveDraftToGitHub(article);
    await new Promise((r) => setTimeout(r, 500));
  }

  await sendEmail(articles);
}

main().catch((err) => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
