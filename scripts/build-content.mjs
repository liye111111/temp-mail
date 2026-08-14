import fs from "node:fs";
import path from "node:path";
import { applyTemplate, CATEGORIES, escapeHtml, loadContent, renderMarkdown, SITE_URL, validateContent } from "./content-lib.mjs";

const pages = loadContent();
const errors = validateContent(pages);
if (errors.length) throw new Error(`Content validation failed:\n${errors.join("\n")}`);
const published = pages.filter((page) => !page.draft).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
const baseTemplate = fs.readFileSync("templates/base.html", "utf8");
const articleTemplate = fs.readFileSync("templates/article.html", "utf8");
const categoryTemplate = fs.readFileSync("templates/category.html", "utf8");
const oldManifestPath = ".generated/content-pages.json";
if (fs.existsSync(oldManifestPath)) {
  const previous = JSON.parse(fs.readFileSync(oldManifestPath, "utf8"));
  for (const item of previous) if (item.outputFile && fs.existsSync(item.outputFile)) fs.rmSync(item.outputFile);
}

const activeCategories = [...new Set(published.filter((page) => page.category !== "pages").map((page) => page.category))];
const nav = [`<a href="/">Temporary inbox</a>`, ...activeCategories.map((category) => `<a href="/${category}/">${escapeHtml(CATEGORIES[category].label)}</a>`)].join("");
const manifest = [];

function writePage(outputFile, html, metadata) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, html);
  manifest.push({ ...metadata, outputFile });
}

function shell({ title, description, pathname, body, structuredData = "" }) {
  const canonical = `${SITE_URL}${pathname}`;
  return applyTemplate(baseTemplate, {
    TITLE: escapeHtml(title), DESCRIPTION: escapeHtml(description), CANONICAL: canonical,
    NAV: nav, BODY: body, STRUCTURED_DATA: structuredData,
  });
}

for (const page of published) {
  const faqHtml = page.faq.length ? `<section class="article-faq"><h2>Frequently asked questions</h2>${page.faq.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join("")}</section>` : "";
  const relatedPages = page.related.map((slug) => published.find((candidate) => candidate.slug === slug)).filter(Boolean);
  const relatedHtml = relatedPages.length ? `<aside class="related"><h2>Related reading</h2><ul>${relatedPages.map((item) => `<li><a href="${item.pathname}">${escapeHtml(item.title)}</a></li>`).join("")}</ul></aside>` : "";
  const articleBody = applyTemplate(articleTemplate, {
    CATEGORY_LABEL: escapeHtml(CATEGORIES[page.category].label), CATEGORY_PATH: page.category === "pages" ? "/" : `/${page.category}/`,
    TITLE: escapeHtml(page.title), DESCRIPTION: escapeHtml(page.description), UPDATED_AT: page.updatedAt,
    CONTENT: renderMarkdown(page.body), FAQ: faqHtml, RELATED: relatedHtml,
  });
  const graph = {
    "@context": "https://schema.org", "@type": "Article", headline: page.title, description: page.description,
    datePublished: page.publishedAt, dateModified: page.updatedAt,
    author: { "@type": "Organization", name: page.author },
    publisher: { "@type": "Organization", name: "GetOpenInbox", url: `${SITE_URL}/` },
    mainEntityOfPage: `${SITE_URL}${page.pathname}`,
  };
  if (page.faq.length) graph.hasPart = { "@type": "FAQPage", mainEntity: page.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };
  const html = shell({ title: `${page.title} — GetOpenInbox`, description: page.description, pathname: page.pathname, body: articleBody, structuredData: `<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, "\\u003c")}</script>` });
  writePage(path.join("public", page.pathname, "index.html"), html, { title: page.title, description: page.description, pathname: page.pathname, updatedAt: page.updatedAt, category: page.category });
}

for (const category of activeCategories) {
  const categoryPages = published.filter((page) => page.category === category);
  const cards = categoryPages.map((page) => `<article><h2><a href="${page.pathname}">${escapeHtml(page.title)}</a></h2><p>${escapeHtml(page.description)}</p><time datetime="${page.updatedAt}">Updated ${page.updatedAt}</time></article>`).join("");
  const body = applyTemplate(categoryTemplate, { CATEGORY_LABEL: escapeHtml(CATEGORIES[category].label), CATEGORY_DESCRIPTION: escapeHtml(CATEGORIES[category].description), CARDS: cards });
  const pathname = `/${category}/`;
  writePage(path.join("public", pathname, "index.html"), shell({ title: `${CATEGORIES[category].label} — GetOpenInbox`, description: CATEGORIES[category].description, pathname, body }), { title: CATEGORIES[category].label, description: CATEGORIES[category].description, pathname, updatedAt: categoryPages[0].updatedAt, category });
}

fs.mkdirSync(".generated", { recursive: true });
fs.writeFileSync(oldManifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${manifest.length} HTML page(s) from ${published.length} published content file(s).`);
