/**
 * Wrap page content with the shared HTML template.
 */

export interface PageData {
  title: string;
  menu: string;
  content: string;
  footer: string;
  /** Relative path prefix to root (e.g. "" or "../") */
  rootPath: string;
}

export function renderPage(data: PageData): string {
  const { title, menu, content, footer, rootPath } = data;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="${rootPath}assets/style.css">
</head>
<body>
<nav class="sidebar">
${menu}
</nav>

<div class="page">
<main>
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
