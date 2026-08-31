#!/usr/bin/env node
// Crawls every local HTML page and builds an internal link graph
// (nodes = pages, edges = <a href> links between them), split by zone
// (nav / footer / content) so the viewer can isolate real editorial links
// from boilerplate navigation. Private tool, not part of the deployed site.

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import path from "path";

const ROOT = process.cwd();
const SITE_HOSTS = new Set(["msd-media.com", "www.msd-media.com"]);
const NON_PAGE_PREFIXES = ["/cdn-cgi/", "/api/", "/assets/", "/scripts/"];
const IGNORE_DIRS = new Set(["node_modules", "graphify-out", ".git", "blog", "scripts"]);
const IGNORE_DIRS_ALLOW_SUBTREE = { blog: new Set(["templates", "sources"]) };

function walk(dir, relBase = "") {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const abs = path.join(dir, entry);
    const rel = relBase ? `${relBase}/${entry}` : entry;
    const st = statSync(abs);
    if (st.isDirectory()) {
      if (entry.startsWith(".")) continue;
      if (IGNORE_DIRS.has(entry) && !(entry === "blog")) continue;
      if (entry === "blog") {
        // walk blog/ but skip its templates/ and sources/ subdirs
        for (const sub of readdirSync(abs)) {
          const subAbs = path.join(abs, sub);
          if (statSync(subAbs).isDirectory()) {
            if (IGNORE_DIRS_ALLOW_SUBTREE.blog.has(sub)) continue;
            out.push(...walk(subAbs, `blog/${sub}`));
          } else if (sub.endsWith(".html")) {
            out.push(`blog/${sub}`);
          }
        }
        continue;
      }
      out.push(...walk(abs, rel));
    } else if (entry.endsWith(".html")) {
      out.push(rel);
    }
  }
  return out;
}

const files = walk(ROOT);

function fileToCanonicalPath(relFile) {
  let p = "/" + relFile.replace(/\\/g, "/");
  if (p.endsWith("/index.html")) p = p.slice(0, -"index.html".length);
  else if (p.endsWith(".html")) p = p.slice(0, -".html".length) + "/";
  if (p === "//") p = "/";
  return p;
}

const realPages = new Map(); // canonicalPath -> relFile
for (const f of files) {
  realPages.set(fileToCanonicalPath(f), f);
}

function sliceZones(html) {
  const headerEnd = html.indexOf("</header>");
  const footerStart = html.search(/<footer[\s>]/);
  const navEnd = headerEnd >= 0 ? headerEnd + "</header>".length : 0;
  const contentEnd = footerStart >= 0 ? footerStart : html.length;
  return {
    nav: html.slice(0, navEnd),
    content: html.slice(navEnd, Math.max(navEnd, contentEnd)),
    footer: footerStart >= 0 ? html.slice(footerStart) : "",
  };
}

function extractHrefs(zoneHtml) {
  const hrefs = [];
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(zoneHtml))) hrefs.push(m[1]);
  return hrefs;
}

function resolveInternal(href, fromRelFile) {
  if (!href) return null;
  if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return null;

  let pathname;
  if (href.startsWith("http://") || href.startsWith("https://")) {
    try {
      const u = new URL(href);
      if (!SITE_HOSTS.has(u.hostname)) return null;
      pathname = u.pathname;
    } catch {
      return null;
    }
  } else if (href.startsWith("/")) {
    pathname = href.split(/[?#]/)[0];
  } else {
    // relative link, resolve against the current file's directory
    const fromDir = path.posix.dirname("/" + fromRelFile.replace(/\\/g, "/"));
    pathname = path.posix.normalize(path.posix.join(fromDir, href.split(/[?#]/)[0]));
  }

  if (NON_PAGE_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  if (pathname.endsWith(".html")) {
    pathname = pathname === "/index.html" ? "/" : pathname.replace(/\.html$/, "/").replace(/index\/$/, "");
  } else if (!pathname.endsWith("/")) {
    const lastSegment = pathname.split("/").pop();
    if (lastSegment.includes(".")) return null; // a real file (image, font, manifest...), not a page
    pathname += "/";
  }
  return pathname;
}

function categorize(p) {
  if (p === "/") return "home";
  if (p.startsWith("/blog/articles/")) return "blog-article";
  if (p.startsWith("/blog/")) return "blog-index";
  if (p.startsWith("/realisations/")) return "case-study";
  if (p.startsWith("/terms/")) return "legal";
  if (/^\/(agence-web|creation-site-web|landing-page|refonte-site-web|audit-seo|seo-local|glossaire-web-seo)-?/.test(p)) return "city-page";
  return "page";
}

const nodesMap = new Map();
const edgeCounts = new Map(); // key `${src}__${dst}__${zone}` -> count
const deadLinks = new Set();

function ensureNode(p) {
  if (!nodesMap.has(p)) {
    nodesMap.set(p, {
      id: p,
      category: categorize(p),
      exists: realPages.has(p),
      inboundContent: 0,
      inboundNav: 0,
      inboundFooter: 0,
      outboundContent: 0,
    });
  }
  return nodesMap.get(p);
}

for (const relFile of files) {
  const src = fileToCanonicalPath(relFile);
  ensureNode(src).exists = true;
  const html = readFileSync(path.join(ROOT, relFile), "utf-8");
  const zones = sliceZones(html);

  for (const [zoneName, zoneHtml] of Object.entries(zones)) {
    for (const href of extractHrefs(zoneHtml)) {
      const dst = resolveInternal(href, relFile);
      if (!dst || dst === src) continue;
      const dstNode = ensureNode(dst);
      if (!realPages.has(dst)) deadLinks.add(JSON.stringify({ from: src, to: dst }));

      const key = `${src}__${dst}__${zoneName}`;
      edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);

      if (zoneName === "content") {
        dstNode.inboundContent++;
        ensureNode(src).outboundContent++;
      } else if (zoneName === "nav") {
        dstNode.inboundNav++;
      } else if (zoneName === "footer") {
        dstNode.inboundFooter++;
      }
    }
  }
}

const edges = [...edgeCounts.entries()].map(([key, weight]) => {
  const [source, target, zone] = key.split("__");
  return { source, target, zone, weight };
});

const nodes = [...nodesMap.values()];

const output = {
  generatedAt: new Date().toISOString(),
  stats: {
    pages: nodes.filter((n) => n.exists).length,
    edges: edges.length,
    orphans: nodes.filter((n) => n.exists && n.inboundContent === 0 && n.id !== "/").length,
    deadLinks: deadLinks.size,
  },
  nodes,
  edges,
  deadLinks: [...deadLinks].map((s) => JSON.parse(s)),
};

const outPath = path.join(ROOT, "scripts", ".link-graph-data.json");
writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`Link graph built: ${output.stats.pages} pages, ${output.stats.edges} edges, ${output.stats.orphans} orphans, ${output.stats.deadLinks} dead links.`);
console.log(`Written to ${outPath}`);
