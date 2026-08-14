import { loadContent, validateContent } from "./content-lib.mjs";

const pages = loadContent();
const errors = validateContent(pages);
if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}
console.log(`Validated ${pages.length} content file(s); ${pages.filter((page) => !page.draft).length} ready to publish.`);
