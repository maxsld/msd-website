const OPENAI_API_BASE = "https://api.openai.com/v1";
const DEFAULT_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-5";
const DEFAULT_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY manquant côté serveur." });
  }

  try {
    const payload = normalizePayload(req.body || {});
    if (payload.mode === "existing" && !payload.siteUrl) {
      return res.status(400).json({ error: "URL du site manquante." });
    }
    if (payload.mode === "scratch" && !payload.brandName && !payload.brief) {
      return res.status(400).json({ error: "Brief ou nom de marque manquant." });
    }

    let siteContext = null;
    if (payload.mode === "existing") {
      try {
        siteContext = await fetchSiteContext(payload.siteUrl);
      } catch (error) {
        siteContext = { url: ensureUrl(payload.siteUrl), title: "", description: "", h1: "", headings: [] };
      }
    }

    const concept = await generateConcept(payload, siteContext);
    const imageB64 = await generateImage(concept, payload, siteContext);

    return res.status(200).json({
      ...concept,
      imageB64
    });
  } catch (error) {
    console.error("generate-site-concept error:", error);
    return res.status(500).json({ error: error.message || "Erreur inattendue." });
  }
}

function normalizePayload(body) {
  return {
    mode: body.mode === "scratch" ? "scratch" : "existing",
    siteUrl: String(body.siteUrl || "").trim(),
    style: String(body.style || "").trim(),
    colors: String(body.colors || "").trim(),
    notes: String(body.notes || "").trim(),
    brandName: String(body.brandName || "").trim(),
    sector: String(body.sector || "").trim(),
    brief: String(body.brief || "").trim()
  };
}

async function fetchSiteContext(rawUrl) {
  const url = ensureUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; MSD Media Configurator/1.0)"
      }
    });

    if (!response.ok) {
      throw new Error(`Impossible de lire le site (${response.status}).`);
    }

    const html = await response.text();
    return {
      url,
      title: matchTag(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
      description: matchTag(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i),
      h1: matchTag(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i),
      headings: collectHeadings(html).slice(0, 4)
    };
  } finally {
    clearTimeout(timeout);
  }
}

function matchTag(input, regex) {
  const match = String(input || "").match(regex);
  return stripHtml(match ? match[1] : "");
}

function collectHeadings(html) {
  const matches = [...String(html || "").matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi)];
  return matches.map((match) => stripHtml(match[1])).filter(Boolean);
}

function stripHtml(input) {
  return String(input || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ensureUrl(input) {
  const value = String(input || "").trim();
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

async function generateConcept(payload, siteContext) {
  const system = [
    "Tu es un directeur créatif web haut de gamme.",
    "Ta mission: proposer une hero section beaucoup plus premium, claire et vendeuse.",
    "Réponds uniquement en JSON valide selon le schéma demandé.",
    "Les textes doivent être courts, crédibles, commerciaux et non génériques."
  ].join(" ");

  const user = buildConceptPrompt(payload, siteContext);
  const schema = {
    name: "site_concept",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        format: { type: "string", enum: ["split", "centered", "editorial"] },
        siteUrl: { type: "string" },
        logoText: { type: "string" },
        badge: { type: "string" },
        title: { type: "string" },
        subtitle: { type: "string" },
        cta: { type: "string" },
        navItems: {
          type: "array",
          items: { type: "string" },
          minItems: 3,
          maxItems: 3
        },
        colors: {
          type: "object",
          additionalProperties: false,
          properties: {
            background: { type: "string" },
            text: { type: "string" },
            button: { type: "string" },
            accent: { type: "string" }
          },
          required: ["background", "text", "button", "accent"]
        },
        imagePrompt: { type: "string" }
      },
      required: ["format", "siteUrl", "logoText", "badge", "title", "subtitle", "cta", "navItems", "colors", "imagePrompt"]
    },
    strict: true
  };

  const response = await fetch(`${OPENAI_API_BASE}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: DEFAULT_TEXT_MODEL,
      input: [
        { role: "system", content: [{ type: "input_text", text: system }] },
        { role: "user", content: [{ type: "input_text", text: user }] }
      ],
      text: {
        format: {
          type: "json_schema",
          ...schema
        }
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Échec de génération du concept.");
  }

  const raw = data.output_text || extractOutputText(data);
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error("Réponse OpenAI non exploitable pour le concept.");
  }

  return parsed;
}

function extractOutputText(data) {
  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) {
        parts.push(content.text);
      }
    }
  }
  return parts.join("\n");
}

function buildConceptPrompt(payload, siteContext) {
  if (payload.mode === "existing") {
    return [
      "Contexte: on repart d'un site existant pour proposer une version beaucoup plus premium.",
      `URL: ${siteContext?.url || payload.siteUrl}`,
      `Titre actuel: ${siteContext?.title || "N/A"}`,
      `Description actuelle: ${siteContext?.description || "N/A"}`,
      `H1 actuel: ${siteContext?.h1 || "N/A"}`,
      `Autres titres: ${(siteContext?.headings || []).join(" | ") || "N/A"}`,
      `Style souhaité: ${payload.style || "premium, clair, moderne"}`,
      `Couleurs à garder ou viser: ${payload.colors || "libre"}`,
      `Notes complémentaires: ${payload.notes || "aucune"}`,
      "Donne une direction plus haut de gamme, plus conversion, avec un vrai angle de marque."
    ].join("\n");
  }

  return [
    "Contexte: on part de zéro pour imaginer une hero section premium.",
    `Nom de marque: ${payload.brandName || "Non renseigné"}`,
    `Secteur: ${payload.sector || "Non renseigné"}`,
    `Brief: ${payload.brief || "Non renseigné"}`,
    `Couleurs souhaitées: ${payload.colors || "libre"}`,
    `Style visuel: ${payload.style || "premium, moderne"}`,
    "Construis une première direction crédible, premium et claire."
  ].join("\n");
}

async function generateImage(concept, payload, siteContext) {
  const prompt = [
    "Create a polished website hero mockup.",
    `Format: ${concept.format}.`,
    `Brand: ${concept.logoText}.`,
    `Headline: ${concept.title}.`,
    `Subheadline: ${concept.subtitle}.`,
    `CTA: ${concept.cta}.`,
    `Visual direction: ${payload.style || "premium modern editorial"}.`,
    `Palette: background ${concept.colors.background}, text ${concept.colors.text}, accent ${concept.colors.accent}.`,
    payload.mode === "existing"
      ? `Reference context from existing site: ${siteContext?.title || ""} ${siteContext?.description || ""}. Make it feel significantly more premium.`
      : `Brand brief: ${payload.brief || payload.sector || ""}.`,
    "Show a modern high-end website hero section, no browser chrome, no watermarks, elegant typography, refined spacing."
  ].join(" ");

  const response = await fetch(`${OPENAI_API_BASE}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: DEFAULT_IMAGE_MODEL,
      prompt,
      size: "1536x1024",
      quality: "medium"
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Échec de génération de l’image.");
  }

  return data.data?.[0]?.b64_json || "";
}
