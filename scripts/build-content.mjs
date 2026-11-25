import fs from "node:fs";
import path from "node:path";
import { applyTemplate, escapeHtml, loadContent, renderMarkdown, SITE_URL, validateContent } from "./content-lib.mjs";
import { TRANSLATIONS, UI } from "./content-locales.mjs";

const pages = loadContent();
const errors = validateContent(pages);
if (errors.length) throw new Error(`Content validation failed:\n${errors.join("\n")}`);
const englishPages = pages.filter((page) => !page.draft).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
for (const language of ["ja", "zh"]) {
  for (const page of englishPages) if (!TRANSLATIONS[language]?.[page.slug]) errors.push(`${language}: missing translation for ${page.slug}`);
}
if (errors.length) throw new Error(`Content validation failed:\n${errors.join("\n")}`);

const baseTemplate = fs.readFileSync("templates/base.html", "utf8");
const articleTemplate = fs.readFileSync("templates/article.html", "utf8");
const categoryTemplate = fs.readFileSync("templates/category.html", "utf8");
const manifestPath = ".generated/content-pages.json";
if (fs.existsSync(manifestPath)) {
  const previous = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const item of previous) if (item.outputFile && fs.existsSync(item.outputFile)) fs.rmSync(item.outputFile);
}

const activeCategories = [...new Set(englishPages.filter((page) => page.category !== "pages").map((page) => page.category))];
const manifest = [];
const localizedPath = (pathname, language) => language === "en" ? pathname : `/${language}${pathname}`;

function pageFor(page, language) {
  const translation = TRANSLATIONS[language]?.[page.slug];
  return {
    ...page,
    locale: language,
    title: translation?.title ?? page.title,
    description: translation?.description ?? page.description,
    body: translation?.body ?? page.body,
    faq: language === "en" ? page.faq : [],
    pathname: localizedPath(page.pathname, language),
  };
}

const localizedPages = Object.keys(UI).flatMap((language) => englishPages.map((page) => pageFor(page, language)));

function writePage(outputFile, html, metadata) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, html);
  manifest.push({ ...metadata, outputFile });
}

function alternates(basePathname) {
  return [
    `<link rel="alternate" hreflang="en" href="${SITE_URL}${basePathname}">`,
    `<link rel="alternate" hreflang="ja" href="${SITE_URL}/ja${basePathname}">`,
    `<link rel="alternate" hreflang="zh-CN" href="${SITE_URL}/zh${basePathname}">`,
    `<link rel="alternate" hreflang="x-default" href="${SITE_URL}${basePathname}">`,
  ].join("\n  ");
}

function navFor(language) {
  const ui = UI[language];
  return [`<a href="${ui.prefix}/">${escapeHtml(ui.inbox)}</a>`, ...activeCategories.map((category) => `<a href="${ui.prefix}/${category}/">${escapeHtml(ui.categories[category][0])}</a>`)].join("");
}

function shell({ title, description, pathname, basePathname, body, language, structuredData = "" }) {
  const ui = UI[language];
  const canonical = `${SITE_URL}${pathname}`;
  return applyTemplate(baseTemplate, {
    LANG: ui.lang, TITLE: escapeHtml(title), DESCRIPTION: escapeHtml(description), CANONICAL: canonical,
    ALTERNATES: alternates(basePathname), OG_LOCALE: ui.og, HOME_PATH: `${ui.prefix}/`, NAV: navFor(language),
    BODY: body, FOOTER: escapeHtml(ui.footer), CREATE_INBOX: escapeHtml(ui.create), STRUCTURED_DATA: structuredData,
  });
}

for (const page of localizedPages) {
  const ui = UI[page.locale];
  const categoryLabel = ui.categories[page.category]?.[0] ?? page.category;
  const faqHtml = page.faq.length ? `<section class="article-faq"><h2>${escapeHtml(ui.faq)}</h2>${page.faq.map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join("")}</section>` : "";
  const relatedPages = page.related.map((slug) => localizedPages.find((candidate) => candidate.slug === slug && candidate.locale === page.locale)).filter(Boolean);
  const relatedHtml = relatedPages.length ? `<aside class="related"><h2>${escapeHtml(ui.related)}</h2><ul>${relatedPages.map((item) => `<li><a href="${item.pathname}">${escapeHtml(item.title)}</a></li>`).join("")}</ul></aside>` : "";
  const categoryPath = `${ui.prefix}/${page.category}/`;
  const articleBody = applyTemplate(articleTemplate, {
    HOME_PATH: `${ui.prefix}/`, HOME_LABEL: escapeHtml(ui.home), CATEGORY_LABEL: escapeHtml(categoryLabel), CATEGORY_PATH: categoryPath,
    TITLE: escapeHtml(page.title), DESCRIPTION: escapeHtml(page.description), UPDATED_LABEL: escapeHtml(ui.updated), UPDATED_AT: page.updatedAt,
    CONTENT: renderMarkdown(page.body), FAQ: faqHtml, RELATED: relatedHtml,
  });
  const article = { "@context": "https://schema.org", "@type": "Article", inLanguage: ui.lang, headline: page.title, description: page.description, datePublished: page.publishedAt, dateModified: page.updatedAt, author: { "@type": "Organization", name: page.author }, publisher: { "@type": "Organization", name: "GetOpenInbox", url: `${SITE_URL}/` }, mainEntityOfPage: `${SITE_URL}${page.pathname}` };
  const graph = { "@context": "https://schema.org", "@graph": [article, { "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: ui.home, item: `${SITE_URL}${ui.prefix}/` },
    { "@type": "ListItem", position: 2, name: categoryLabel, item: `${SITE_URL}${categoryPath}` },
    { "@type": "ListItem", position: 3, name: page.title, item: `${SITE_URL}${page.pathname}` },
  ] }] };
  if (page.faq.length) graph["@graph"].push({ "@type": "FAQPage", mainEntity: page.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) });
  const basePathname = englishPages.find((item) => item.slug === page.slug).pathname;
  const html = shell({ title: `${page.title} — GetOpenInbox`, description: page.description, pathname: page.pathname, basePathname, body: articleBody, language: page.locale, structuredData: `<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, "\\u003c")}</script>` });
  writePage(path.join("public", page.pathname, "index.html"), html, { title: page.title, description: page.description, pathname: page.pathname, basePathname, locale: page.locale, updatedAt: page.updatedAt, category: page.category });
}

for (const [language, ui] of Object.entries(UI)) {
  for (const category of activeCategories) {
    const categoryPages = localizedPages.filter((page) => page.category === category && page.locale === language);
    const [label, description] = ui.categories[category];
    const cards = categoryPages.map((page) => `<article><h2><a href="${page.pathname}">${escapeHtml(page.title)}</a></h2><p>${escapeHtml(page.description)}</p><time datetime="${page.updatedAt}">${escapeHtml(ui.updated)} ${page.updatedAt}</time></article>`).join("");
    const body = applyTemplate(categoryTemplate, { CATEGORY_LABEL: escapeHtml(label), CATEGORY_DESCRIPTION: escapeHtml(description), ARTICLES_LABEL: escapeHtml(ui.articles), CARDS: cards });
    const basePathname = `/${category}/`;
    const pathname = localizedPath(basePathname, language);
    writePage(path.join("public", pathname, "index.html"), shell({ title: `${label} — GetOpenInbox`, description, pathname, basePathname, body, language }), { title: label, description, pathname, basePathname, locale: language, updatedAt: categoryPages[0].updatedAt, category });
  }
}

fs.mkdirSync(".generated", { recursive: true });
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${manifest.length} localized HTML page(s) from ${englishPages.length} published content file(s).`);
