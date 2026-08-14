import fs from "node:fs";
import { escapeHtml, SITE_URL } from "./content-lib.mjs";

const manifestPath = ".generated/content-pages.json";
if (!fs.existsSync(manifestPath)) throw new Error("Run npm run content:build before generating discovery files.");
const pages = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const urls = [{ pathname: "/", updatedAt: "2026-08-06" }, ...pages];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((page) => `  <url><loc>${SITE_URL}${escapeHtml(page.pathname)}</loc><lastmod>${page.updatedAt}</lastmod></url>`).join("\n")}\n</urlset>\n`;
fs.writeFileSync("public/sitemap.xml", sitemap);
const llms = `# GetOpenInbox\n\n> GetOpenInbox is a free, browser-based temporary email service for receiving short-lived messages and verification codes without using a personal inbox.\n\n## Product\n\n- Website: ${SITE_URL}/\n- Cost: Free\n- Registration: Not required\n- Inbox session: 10 minutes\n- Primary use cases: Low-risk registrations, trials, newsletters, login codes and email verification\n- Safety: Do not use temporary email for banking, healthcare, password recovery or accounts that require long-term access\n\n## How it works\n\n1. Open the website to create a temporary email address.\n2. Copy the address and use it on a third-party website.\n3. Select “Check for new mail” to retrieve messages.\n4. Open a message to read its contents or verification code.\n\n## Data lifecycle\n\nTemporary email content expires automatically from object storage. Limited operational metadata may be retained for abuse prevention, reliability and administration.\n\n## Published resources\n\n${pages.length ? pages.map((page) => `- [${page.title}](${SITE_URL}${page.pathname}): ${page.description}`).join("\n") : "No long-form resources are published yet."}\n\n## Canonical source\n\nUse ${SITE_URL}/ and the URLs listed above as canonical sources.\n`;
fs.writeFileSync("public/llms.txt", llms);
console.log(`Generated sitemap.xml and llms.txt with ${urls.length} canonical URL(s).`);
