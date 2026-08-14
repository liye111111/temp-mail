import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "a", "abbr", "address", "article", "aside", "b", "blockquote", "br", "caption", "center",
  "cite", "code", "col", "colgroup", "dd", "del", "details", "div", "dl", "dt", "em",
  "figcaption", "figure", "footer", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr",
  "i", "img", "ins", "kbd", "li", "main", "mark", "nav", "ol", "p", "pre", "q", "s",
  "section", "small", "span", "strong", "sub", "summary", "sup", "table", "tbody", "td",
  "tfoot", "th", "thead", "tr", "u", "ul",
];

export function sanitizeEmailHtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags,
    allowedAttributes: {
      "*": ["class", "dir", "style", "title"],
      a: ["title"],
      img: ["alt", "height", "src", "title", "width"],
      td: ["align", "colspan", "rowspan", "valign", "width"],
      th: ["align", "colspan", "rowspan", "valign", "width"],
      table: ["align", "border", "cellpadding", "cellspacing", "width"],
    },
    allowedSchemesByTag: { img: ["data"] },
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    parseStyleAttributes: false,
  });
}
