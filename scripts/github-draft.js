// Sauvegarde un article draft dans blog/sources/drafts/ sur GitHub
// Importé par generate-articles.js

async function saveDraftToGitHub(article) {
  const [owner, repo] = process.env.GITHUB_REPO.split('/');
  const path = `blog/sources/drafts/${article.slug}.md`;

  // Récupérer le sha si un draft existe déjà (pour l'update)
  let existingSha = null;
  const checkResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GH_PAT}`,
        Accept: 'application/vnd.github+json',
      },
    }
  );
  if (checkResponse.ok) {
    const existing = await checkResponse.json();
    existingSha = existing.sha;
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${process.env.GH_PAT}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `draft: ${article.slug}`,
        content: Buffer.from(article.content).toString('base64'),
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`GitHub draft save error: ${JSON.stringify(err)}`);
  }

  console.log(`💾 Draft sauvegardé : blog/sources/drafts/${article.slug}.md`);
}

export { saveDraftToGitHub };
