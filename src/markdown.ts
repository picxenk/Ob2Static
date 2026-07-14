/**
 * Minimal Markdown-to-HTML converter.
 * Handles: headings, paragraphs, bold, italic, code blocks, inline code,
 * unordered/ordered lists, images, links, horizontal rules,
 * and Obsidian wiki-links  [[Page]]  /  [[Page|alias]].
 */

/** Convert `[[Page]]` and `[[Page|alias]]` to `<a>` tags. */
function convertWikiLinks(md: string): string {
  // [[Page|display]] → <a href="Page.html">display</a>
  // [[Page]]         → <a href="Page.html">Page</a>
  return md.replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_m, page, alias) => {
    const href = page.trim().replace(/ /g, "%20") + ".html";
    const text = (alias || page).trim();
    return `<a href="${href}">${text}</a>`;
  });
}

/** Convert Obsidian image embeds  ![[image.png]]  to <img> tags. */
function convertImageEmbeds(md: string): string {
  return md.replace(/!\[\[([^\]]+?)\]\]/g, (_m, file) => {
    const src = "assets/" + file.trim();
    return `<img src="${src}" alt="${file.trim()}">`;
  });
}

/** Very small Markdown → HTML converter (no external deps). */
export function markdownToHtml(md: string): string {
  // Pre-process wiki-links and image embeds
  let text = convertImageEmbeds(md);
  text = convertWikiLinks(text);

  const lines = text.split("\n");
  const out: string[] = [];
  let inCodeBlock = false;
  let inList: "ul" | "ol" | null = null;

  const flushList = () => {
    if (inList) {
      out.push(inList === "ul" ? "</ul>" : "</ol>");
      inList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // --- fenced code blocks ---
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        out.push("</code></pre>");
        inCodeBlock = false;
      } else {
        flushList();
        out.push("<pre><code>");
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      out.push(escapeHtml(line));
      continue;
    }

    // --- horizontal rule ---
    if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line.trim())) {
      flushList();
      out.push("<hr>");
      continue;
    }

    // --- headings ---
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      out.push(`<h${level}>${inline(headingMatch[2])}</h${level}>`);
      continue;
    }

    // --- unordered list ---
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.*)/);
    if (ulMatch) {
      if (inList !== "ul") {
        flushList();
        out.push("<ul>");
        inList = "ul";
      }
      out.push(`<li>${inline(ulMatch[2])}</li>`);
      continue;
    }

    // --- ordered list ---
    const olMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
    if (olMatch) {
      if (inList !== "ol") {
        flushList();
        out.push("<ol>");
        inList = "ol";
      }
      out.push(`<li>${inline(olMatch[2])}</li>`);
      continue;
    }

    // --- blank line ---
    if (line.trim() === "") {
      flushList();
      continue;
    }

    // --- paragraph ---
    flushList();
    out.push(`<p>${inline(line)}</p>`);
  }

  flushList();
  if (inCodeBlock) out.push("</code></pre>");

  return out.join("\n");
}

/** Process inline formatting: bold, italic, inline code, images, links. */
function inline(text: string): string {
  let s = text;
  // inline code
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  // images (standard markdown)
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  // links (standard markdown)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // bold
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__(.+?)__/g, "<strong>$1</strong>");
  // italic
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
  s = s.replace(/_(.+?)_/g, "<em>$1</em>");
  return s;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
