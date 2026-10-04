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
  return md.replace(/\[\[([^\]|]+?)(?:\|([^\]]+?))?\]\]/g, (_m, target, alias) => {
    // Split "Page#Heading" → page / heading  (heading-only: "#Heading")
    const hashIdx = target.indexOf("#");
    const name = (hashIdx >= 0 ? target.substring(0, hashIdx) : target).trim();
    const heading = hashIdx >= 0 ? target.substring(hashIdx + 1).trim() : "";
    const anchor = heading ? "#" + slugify(heading) : "";

    // Same-page heading link: [[#Heading]]
    if (!name) {
      const text = (alias || heading).trim();
      return `<a href="${anchor}">${text}</a>`;
    }

    // Strip any folder prefix — Obsidian resolves by basename
    const basename = name.includes("/")
      ? name.substring(name.lastIndexOf("/") + 1)
      : name;
    const targetPath = pageMap.get(basename);
    const href = targetPath
      ? relPath(currentDir, targetPath)
      : basename.replace(/ /g, "%20") + ".html";
    const text = (alias || (heading ? `${basename} &gt; ${heading}` : basename)).trim();
    return `<a href="${href}${anchor}">${text}</a>`;
  });
}

/**
 * Parse Obsidian image options after the first "|", in any order:
 *   left | right   → float alignment (class)
 *   200 | 200x100  → width / height
 *   anything else  → alt text
 * e.g. ![[photo.png|left|200]]  or  ![photo|right|300](url)
 */
function imageAttrs(options: string[], fallbackAlt: string): string {
  let cls = "";
  let width = "";
  let height = "";
  const altParts: string[] = [];

  for (const raw of options) {
    const opt = raw.trim();
    if (!opt) continue;
    const size = opt.match(/^(\d+)(?:x(\d+))?$/);
    if (opt === "left" || opt === "right") cls = opt;
    else if (size) {
      width = size[1];
      height = size[2] ?? "";
    } else altParts.push(opt);
  }

  const alt = (altParts.join(" ") || fallbackAlt).replace(/"/g, "&quot;");
  return (
    ` alt="${alt}"` +
    (cls ? ` class="${cls}"` : "") +
    (width ? ` width="${width}"` : "") +
    (height ? ` height="${height}"` : "")
  );
}

/**
 * Convert Obsidian image embeds  ![[image.png]]  to <img> tags.
 * Images are always in output `assets/` so we need a relative path from
 * the current page's directory.
 */
function convertImageEmbeds(md: string, currentDir: string): string {
  return md.replace(/!\[\[([^\]]+?)\]\]/g, (_m, raw) => {
    const parts = raw.trim().split("|");
    const filename = parts[0].trim();
    const assetPath = relPath(currentDir, "assets/" + filename);
    return `<img src="${assetPath}"${imageAttrs(parts.slice(1), filename)}>`;
  });
}

export interface Heading {
  level: number;
  /** Plain text (HTML tags stripped) */
  text: string;
  id: string;
}

export interface RenderResult {
  html: string;
  headings: Heading[];
}

/**
 * Remove a leading YAML frontmatter block (`---` … `---`).
 * Metadata is read via Obsidian's metadataCache, never rendered.
 */
export function stripFrontmatter(md: string): string {
  return md.replace(/^\uFEFF?---\r?\n(?:[\s\S]*?\r?\n)?---[ \t]*(?:\r?\n|$)/, "");
}

/**
 * Turn heading text into an anchor id.
 * Keeps letters (incl. Korean) and digits, spaces → "-".
 */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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
  return renderMarkdown(md, pageMap, currentDir).html;
}

/** Same as markdownToHtml, but also returns the collected headings. */
export function renderMarkdown(
  md: string,
  pageMap: Map<string, string> = new Map(),
  currentDir: string = ""
): RenderResult {
  // Frontmatter is metadata only — never rendered
  let text = stripFrontmatter(md);

  // Pre-process wiki-links and image embeds
  text = convertImageEmbeds(text, currentDir);
  text = convertWikiLinks(text, pageMap, currentDir);

  const lines = text.split("\n");
  const out: string[] = [];
  const headings: Heading[] = [];
  const usedIds = new Map<string, number>();
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
      const inner = inline(headingMatch[2].trim());
      const plain = stripTags(inner);

      // Unique id: "intro", "intro-1", "intro-2", ...
      const base = slugify(plain) || "section";
      const seen = usedIds.get(base) ?? 0;
      usedIds.set(base, seen + 1);
      const id = seen === 0 ? base : `${base}-${seen}`;

      headings.push({ level, text: plain, id });
      out.push(`<h${level} id="${id}">${inner}</h${level}>`);
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

    // --- blank line → visible spacing ---
    if (line.trim() === "") {
      flushList();
      out.push("<br>");
      continue;
    }

    // --- paragraph ---
    flushList();
    out.push(`<p>${inline(line)}</p>`);
  }

  flushList();
  if (inCodeBlock) out.push("</code></pre>");

  return { html: out.join("\n"), headings };
}

/**
 * Build a nested <ul> table of contents from headings.
 * Levels are normalized to the shallowest heading present; skipped levels
 * (e.g. h2 → h4) are clamped to one step deeper.
 */
export function buildTocHtml(headings: Heading[]): string {
  if (headings.length === 0) return "";

  const minLevel = Math.min(...headings.map((h) => h.level));
  const out: string[] = [];
  let depth = 0;

  for (const h of headings) {
    const lvl = Math.min(h.level - minLevel + 1, depth + 1);
    if (lvl > depth) {
      out.push("<ul>");
      depth = lvl;
    } else {
      out.push("</li>");
      while (depth > lvl) {
        out.push("</ul></li>");
        depth--;
      }
    }
    out.push(`<li><a href="#${h.id}">${escapeHtml(h.text)}</a>`);
  }

  out.push("</li>");
  while (depth > 1) {
    out.push("</ul></li>");
    depth--;
  }
  out.push("</ul>");

  return out.join("");
}

/** Strip HTML tags and decode the few entities we produce. */
function stripTags(html: string): string {
  return html
    // Screen-reader-only hints (e.g. "(새 창)") are not part of the visible text
    .replace(/<span class="sr-only">[^<]*<\/span>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

/** Links to other sites (as opposed to wiki-links, relative paths and #anchors). */
function isExternal(href: string): boolean {
  return /^(https?:)?\/\//i.test(href.trim());
}

/** Attributes that open a link in a new tab safely. */
const NEW_TAB_ATTRS = ' target="_blank" rel="noopener noreferrer"';
/** Announced by screen readers only (visually hidden via CSS). */
const NEW_TAB_HINT = '<span class="sr-only"> (새 창)</span>';

function hostname(href: string): string {
  try {
    return new URL(href.startsWith("//") ? "https:" + href : href).hostname;
  } catch {
    return "";
  }
}

/** Process inline formatting: bold, italic, inline code, images, links. */
function inline(text: string): string {
  let s = text;

  // Protected fragments, restored at the end. Keeps HTML (and code spans)
  // safe from the bold/italic/autolink regexes below — e.g. filenames like
  // "my_photo_2024.png" in <img> attributes, or `my_var` inside code.
  const preserved: string[] = [];
  const stash = (html: string) => {
    preserved.push(html);
    return `\x00HTAG${preserved.length - 1}\x00`;
  };

  // inline code — stashed whole so nothing inside gets formatted or linked
  s = s.replace(/`([^`]+)`/g, (_m, code: string) => stash(`<code>${code}</code>`));

  // images (standard markdown)
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt: string, src: string) => {
    const parts = alt.split("|");
    return `<img src="${src}"${imageAttrs(parts.slice(1), parts[0].trim())}>`;
  });

  // links (standard markdown)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, href: string) => {
    if (!isExternal(href)) return `<a href="${href}">${label}</a>`;
    // External: new tab + "↗" marker (class), except for image links
    // and links whose visible text is already a URL
    const noMarker = /<img\b/i.test(label) || /^https?:\/\//i.test(label.trim());
    const host = hostname(href);
    const cls = noMarker ? "" : ' class="external"';
    const title = host ? ` title="${host}"` : "";
    return `<a href="${href}"${cls}${title}${NEW_TAB_ATTRS}>${label}${NEW_TAB_HINT}</a>`;
  });

  // Protect remaining HTML tags from underscore-based formatting
  s = s.replace(/<[^>]+>/g, (tag) => stash(tag));

  // Auto-link bare URLs: new tab only (the URL itself shows it's external, so no "↗").
  // Runs before bold/italic so underscores in URLs stay intact, and skips
  // URLs that are already the text of a link, e.g. [https://x](https://x).
  let anchorDepth = 0;
  s = s.replace(/\x00HTAG(\d+)\x00|(https?:\/\/[^\s<>\x00]+)/g, (m, idx, url) => {
    if (idx !== undefined) {
      const tag = preserved[Number(idx)];
      if (/^<a[\s>]/i.test(tag)) anchorDepth++;
      else if (/^<\/a>/i.test(tag)) anchorDepth--;
      return m;
    }
    if (anchorDepth > 0) return stash(url);
    return stash(`<a href="${url}"${NEW_TAB_ATTRS}>${url}${NEW_TAB_HINT}</a>`);
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
