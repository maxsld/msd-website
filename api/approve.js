// api/approve.js
// Endpoint Vercel serverless — reçoit le clic "Approuver" et :
//   1. Déplace le draft de blog/sources/drafts/ vers blog/sources/
//   2. Supprime le draft
//   3. Déclenche le workflow build-blog via workflow_dispatch
// URL : https://msd-media.com/api/approve?slug=xxx&token=yyy

import crypto from 'crypto';

export default async function handler(req, res) {
  const { slug, token } = req.query;

  // ── Validation des paramètres ─────────────────────────────────────────────
  if (!slug || !token) {
    return res.status(400).send(html('❌ Paramètres manquants', 'Lien invalide.', '#c0392b'));
  }

  // ── Vérification du token ─────────────────────────────────────────────────
  const expectedToken = crypto
    .createHash('sha256')
    .update(slug + process.env.ANTHROPIC_API_KEY)
    .digest('hex')
    .slice(0, 32);

  if (token !== expectedToken) {
    return res.status(403).send(html('❌ Token invalide', 'Ce lien est invalide ou expiré.', '#c0392b'));
  }

  // ── Récupérer le draft depuis GitHub ──────────────────────────────────────
  try {
    const draftContent = await fetchDraftFromGitHub(slug);
    if (!draftContent) {
      return res.status(404).send(
        html('⚠️ Article introuvable', `L'article "${slug}" n'existe pas ou a déjà été publié.`, '#e67e22')
      );
    }

    // ── Publier dans blog/sources/ et supprimer le draft ──────────────────
    await publishToGitHub(slug, draftContent);

    // ── Déclencher le rebuild du blog ─────────────────────────────────────
    await triggerBlogBuild();

    return res.status(200).send(
      html(
        '✅ Article publié !',
        `L'article <strong>${slug}.md</strong> a été déplacé dans blog/sources/. Le blog se reconstruit automatiquement et sera en ligne dans quelques minutes.`,
        '#27ae60'
      )
    );
  } catch (err) {
    console.error('Erreur publication:', err);
    return res.status(500).send(html('❌ Erreur', `Une erreur est survenue : ${err.message}`, '#c0392b'));
  }
}

// ─── GitHub : récupérer le draft ──────────────────────────────────────────────
async function fetchDraftFromGitHub(slug) {
  const [owner, repo] = process.env.GITHUB_REPO.split('/');
  const path = `blog/sources/drafts/${slug}.md`;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=main`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GH_PAT}`,
        Accept: 'application/vnd.github+json',
      },
    }
  );

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub fetch error: ${response.status}`);

  const data = await response.json();
  return {
    content: Buffer.from(data.content, 'base64').toString('utf-8'),
    sha: data.sha,
  };
}

// ─── GitHub : publier dans blog/sources/ + supprimer le draft ────────────────
async function publishToGitHub(slug, draft) {
  const [owner, repo] = process.env.GITHUB_REPO.split('/');
  const publishPath = `blog/sources/${slug}.md`;
  const draftPath = `blog/sources/drafts/${slug}.md`;

  // 1. Créer/mettre à jour blog/sources/{slug}.md
  const existingSha = await getFileSha(owner, repo, publishPath);
  const publishResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${publishPath}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${process.env.GH_PAT}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `feat(blog): publish ${slug}`,
        content: Buffer.from(draft.content).toString('base64'),
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    }
  );

  if (!publishResponse.ok) {
    const err = await publishResponse.json();
    throw new Error(`GitHub publish error: ${JSON.stringify(err)}`);
  }

  // 2. Supprimer le draft
  await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${draftPath}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.GH_PAT}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `chore: remove draft ${slug}`,
        sha: draft.sha,
      }),
    }
  );
}

// ─── GitHub Actions : déclencher le workflow de rebuild ───────────────────────
async function triggerBlogBuild() {
  const [owner, repo] = process.env.GITHUB_REPO.split('/');

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/build-blog.yml/dispatches`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GH_PAT}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: 'main' }),
    }
  );

  if (!response.ok && response.status !== 204) {
    console.warn(`Workflow dispatch warning: ${response.status}`);
  }
}

async function getFileSha(owner, repo, path) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GH_PAT}`,
        Accept: 'application/vnd.github+json',
      },
    }
  );
  if (response.status === 404) return null;
  const data = await response.json();
  return data.sha;
}

// ─── HTML de réponse ──────────────────────────────────────────────────────────
function html(title, message, color) {
  const icon = title.startsWith('✅') ? '🎉' : title.startsWith('❌') ? '🚫' : '⚠️';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — MSD Media</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; padding: 16px; }
    .card { background: white; border-radius: 12px; padding: 40px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 2px 20px rgba(0,0,0,0.08); }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 22px; margin-bottom: 12px; color: ${color}; }
    p { font-size: 15px; color: #555; line-height: 1.6; }
    .back { display: inline-block; margin-top: 24px; font-size: 13px; color: #999; text-decoration: none; }
    .back:hover { color: #111; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://msd-media.com" class="back">← Retour sur msd-media.com</a>
  </div>
</body>
</html>`;
}
