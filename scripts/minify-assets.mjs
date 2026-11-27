import fs from "node:fs";
import { transform } from "esbuild";

const assets = [
  { input: "public/app-20260806.js", output: "public/app.min.js", loader: "js" },
  { input: "public/language-20260818.js", output: "public/language.min.js", loader: "js" },
  { input: "public/header-analyzer-20261127.js", output: "public/header-analyzer.min.js", loader: "js" },
  { input: "public/styles-20260806.css", output: "public/site.min.css", loader: "css" },
  { input: "assets/content.css", output: "public/content.min.css", loader: "css" },
];

for (const asset of assets) {
  const source = fs.readFileSync(asset.input, "utf8");
  const result = await transform(source, {
    loader: asset.loader,
    minify: true,
    legalComments: "none",
    target: asset.loader === "js" ? "es2022" : undefined,
  });
  fs.writeFileSync(asset.output, result.code);
}

console.log(`Minified ${assets.length} static asset(s).`);
