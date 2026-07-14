/**
 * Minimal Markdown-to-HTML converter.
 * Handles: headings, paragraphs, bold, italic, code blocks, inline code,
 * unordered/ordered lists, images, links, horizontal rules,
 * and Obsidian wiki-links  [[Page]]  /  [[Page|alias]].
 */

/**
 * Compute a relative path from `fromDir` to `toPath`.
 * Both are forward-slash separated, relative to the output root.
 * e.g. relPath("notes/sub", "assets/img.png") → "../../assets/img.png"
 *      relPath("", "notes/Page.html")         → "notes/Page.html"
 */
function relPath(fromDir: string, toPath: string): string {
  if (!fromDir) return toPath;
  const ups = fromDir.split("/").length;
  return "../".repeat(ups) + toPath;
}

/**
 * Convert `[[Page]]` and `[[Page|alias]]` to `<a>` tags.
 * Uses a lookup map (basename → output path relative to output root)
 * and the current page's directory to produce correct relative hrefs.
 */
function convertWikiLinks(
  md: string,
  pageMap: Map<string, string>,
  currentDir: string
): string {
  return md.replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_m, page, alias) => {
    const name = page.trim();
    // Strip any folder prefix — Obsidian resolves by basename
    const basename = name.includes("/")
      ? name.substring(name.lastIndexOf("/") + 1)
      : name;
    const targetPath = pageMap.get(basename);
    const href = targetPath
      ? relPath(currentDir, targetPath)
      : basename.replace(/ /g, "%20") + ".html";
    const text = (alias || basename).trim();
    return `<a href="${href}">${text}</a>`;
  });
}

/**
 * Convert Obsidian image embeds  ![[image.png]]  to <img> tags.
 * Images are always in output `assets/` so we need a relative path from
 * the current page's directory.
 */
function convertImageEmbeds(md: string, currentDir: string): string {
  return md.replace(/!\[\[([^\]]+?)\]\]/g, (_m, file) => {
    const assetPath = relPath(currentDir, "assets/" + file.trim());
    return `<img src="${assetPath}" alt="${file.trim()}">`;
  });
}

/**
 * Very small Markdown → HTML converter (no external deps).
 * @param pageMap     basename (without .md) → output path from root
 * @param currentDir  directory of the current page relative to output root
 *                    (e.g. "" for root, "notes/sub" for nested)
 */
export function markdownToHtml(
  md: string,
  pageMap: Map<string, string> = new Map(),
  currentDir: string = ""
): string {
  // Pre-process wiki-links and image embeds
  let text = convertImageEmbeds(md, currentDir);
  text = convertWikiLinks(text, pageMap, currentDir);

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

  // Protect existing HTML tags from underscore-based formatting.
  // Without this, filenames like "my_photo_2024.png" inside <img> src/alt
  // attributes would be corrupted by the italic/bold regex below.
  const preserved: string[] = [];
  s = s.replace(/<[^>]+>/g, (tag) => {
    preserved.push(tag);
    return `\x00HTAG${preserved.length - 1}\x00`;
  });

  // bold
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__(.+?)__/g, "<strong>$1</strong>");
  // italic
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
  s = s.replace(/_(.+?)_/g, "<em>$1</em>");

  // Restore preserved HTML tags
  s = s.replace(/\x00HTAG(\d+)\x00/g, (_m, idx) => preserved[Number(idx)]);

  return s;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
