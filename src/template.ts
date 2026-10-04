/**
 * Wrap page content with the shared HTML template.
 */

import { P5_CDN_URL } from "./assets";

export interface PageData {
  title: string;
  menu: string;
  content: string;
  /** Table of contents HTML (empty → no TOC) */
  toc?: string;
  footer: string;
  /** Relative path prefix to root (e.g. "" or "../") */
  rootPath: string;
}

export function renderPage(data: PageData): string {
  const { title, menu, content, toc, footer, rootPath } = data;
  const tocBlock = toc
    ? `<aside class="toc">
<details class="toc-box">
<summary>Contents</summary>
${toc}
</details>
</aside>
`
    : "";

  // p5.js only on pages that contain ```p5 / ```p5 bg blocks
  const hasP5 = /class="p5-sketch/.test(menu + content + footer);
  const p5Scripts = hasP5
    ? `<script src="${P5_CDN_URL}" defer></script>
<script src="${rootPath}assets/p5-sketch.js" defer></script>
`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="${rootPath}assets/style.css">
${toc ? `<script src="${rootPath}assets/toc.js" defer></script>\n` : ""}${p5Scripts}</head>
<body>
<nav class="sidebar">
<details class="menu">
<summary>Menu</summary>
<div class="menu-body">
${menu}
</div>
</details>
</nav>

<div class="page${toc ? " has-toc" : ""}">
${tocBlock}<main>
${content}
</main>

<footer>
${footer}
</footer>
</div>
</body>
</html>
`;
}
