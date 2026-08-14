import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export const SITE_URL = "https://getopeninbox.com";
export const CONTENT_ROOT = path.resolve("content");
export const CATEGORIES = {
  guides: { label: "Guides", description: "Practical guides to temporary email, privacy and safer sign-ups." },
  comparisons: { label: "Comparisons", description: "Clear comparisons of disposable email and other privacy tools." },
  developers: { label: "Developers", description: "Technical guides for email routing, testing and Cloudflare Workers." },
  tools: { label: "Tools", description: "Free tools for email privacy, deliverability and development." },
  pages: { label: "Pages", description: "Information about GetOpenInbox." },
};

function filesIn(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(target) : entry.isFile() && entry.name.endsWith(".md") && entry.name.toLowerCase() !== "readme.md" ? [target] : [];
  });
}

function isoDate(value) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString().slice(0, 10);
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function pagePath(category, slug) {
  return category === "pages" ? `/${slug}/` : `/${category}/${slug}/`;
}

export function loadContent() {
  return filesIn(CONTENT_ROOT).map((file) => {
    const parsed = matter(fs.readFileSync(file, "utf8"));
    const category = String(parsed.data.category ?? path.basename(path.dirname(file)));
    const slug = String(parsed.data.slug ?? path.basename(file, ".md"));
    return {
      file,
      title: String(parsed.data.title ?? ""),
      description: String(parsed.data.description ?? ""),
      slug,
      category,
      publishedAt: isoDate(parsed.data.publishedAt),
      updatedAt: isoDate(parsed.data.updatedAt),
      author: String(parsed.data.author ?? "GetOpenInbox"),
      keywords: Array.isArray(parsed.data.keywords) ? parsed.data.keywords.map(String) : [],
      related: Array.isArray(parsed.data.related) ? parsed.data.related.map(String) : [],
      faq: Array.isArray(parsed.data.faq) ? parsed.data.faq : [],
      featured: parsed.data.featured === true,
      draft: parsed.data.draft !== false,
      body: parsed.content.trim(),
      pathname: pagePath(category, slug),
    };
  });
}

export function validateContent(pages) {
  const errors = [];
  const paths = new Map();
  for (const page of pages) {
    const label = path.relative(process.cwd(), page.file);
    if (!page.title) errors.push(`${label}: title is required`);
    if (!page.description) errors.push(`${label}: description is required`);
    if (page.description.length > 180) errors.push(`${label}: description must be 180 characters or fewer`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug)) errors.push(`${label}: slug must use lowercase kebab-case`);
    if (!CATEGORIES[page.category]) errors.push(`${label}: unsupported category '${page.category}'`);
    if (!page.publishedAt) errors.push(`${label}: publishedAt must be YYYY-MM-DD`);
    if (!page.updatedAt) errors.push(`${label}: updatedAt must be YYYY-MM-DD`);
    if (!page.draft && page.body.length < 200) errors.push(`${label}: published content must contain at least 200 characters`);
    for (const item of page.faq) {
      if (!item || typeof item.question !== "string" || typeof item.answer !== "string") errors.push(`${label}: each faq entry requires question and answer strings`);
    }
    if (paths.has(page.pathname)) errors.push(`${label}: duplicate URL also used by ${paths.get(page.pathname)}`);
    paths.set(page.pathname, label);
  }
  return errors;
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
}

export function renderMarkdown(markdown) {
  const rendered = marked.parse(markdown, { gfm: true });
  return sanitizeHtml(rendered, {
    allowedTags: ["h2", "h3", "h4", "p", "ul", "ol", "li", "a", "blockquote", "pre", "code", "strong", "em", "hr", "table", "thead", "tbody", "tr", "th", "td"],
    allowedAttributes: { a: ["href", "title"], code: ["class"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: (tagName, attributes) => {
        const external = attributes.href?.startsWith("http") && !attributes.href.startsWith(SITE_URL);
        return { tagName, attribs: external ? { ...attributes, rel: "noopener noreferrer" } : attributes };
      },
    },
  });
}

export function applyTemplate(template, values) {
  return template.replace(/{{([A-Z_]+)}}/g, (_match, key) => values[key] ?? "");
}
