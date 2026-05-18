import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const css = await readFile(resolve(root, "dist/index.css"), "utf8");

const marker = "__REACT_MATCHINGS_AUTO_CSS__";
const cssLiteral = JSON.stringify(css);

const shared = [
  `const ${marker} = ${cssLiteral};`,
  `function __injectReactMatchingsCss() {`,
  `  if (typeof document === "undefined" || document.getElementById("${marker}")) return;`,
  `  const style = document.createElement("style");`,
  `  style.id = "${marker}";`,
  `  style.textContent = ${marker};`,
  `  document.head.appendChild(style);`,
  `}`,
  `__injectReactMatchingsCss();`,
  ``,
].join("\n");

for (const file of ["dist/index.js", "dist/index.mjs"]) {
  const path = resolve(root, file);
  const contents = await readFile(path, "utf8");
  if (contents.includes(marker)) continue;
  await writeFile(path, shared + contents);
}
