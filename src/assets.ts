/**
 * Default stylesheet and asset helpers.
 */

export const DEFAULT_CSS = `/* Ob2Static — minimal stylesheet */
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --sidebar-width: 10rem;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #222;
  background: #fff;
}

/* ---- Sidebar (fixed left) ---- */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  overflow-y: auto;
  padding: 1.5rem 1rem;
  background: #fff;
  border-right: 1px solid #222;
}
.sidebar ul { list-style: none; }
.sidebar li { margin-bottom: 0.3em; }
.sidebar a { text-decoration: none; color: #0366d6; }
.sidebar a:hover { text-decoration: underline; }
/* ---- External links ---- */
/* "↗" after links to other sites ([text](https://…)); bare URLs and image links don't get it */
a.external::after {
  content: "\\2197";
  display: inline-block;       /* keeps the arrow out of the underline */
  margin-left: 0.15em;
  font-size: 0.8em;
  text-decoration: none;
}
/* Visually hidden, still read by screen readers (e.g. "(새 창)") */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Full-bleed divider: negative margins cancel the side padding (1rem) */
.sidebar hr {
  border: none;
  border-top: 1px solid #ddd;
  margin: 0.8em -1rem;
}

/* ---- Menu toggle (<details>) ---- */
.menu > summary {
  list-style: none;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
}
.menu > summary::-webkit-details-marker { display: none; }
.menu > summary::before { content: "\\2630"; margin-right: 0.5em; }
.menu[open] > summary::before { content: "\\2715"; }

/* Desktop: always show menu, hide the toggle (browsers supporting ::details-content) */
@supports selector(::details-content) {
  @media (min-width: 769px) {
    .menu > summary { display: none; }
    .menu::details-content { content-visibility: visible; }
  }
}

/* ---- Page area (right of sidebar) ---- */
.page {
  margin-left: var(--sidebar-width);
  max-width: 48rem;
  padding: 2rem 2rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main { flex: 1; font-size: 1.15rem; }
main h1, main h2, main h3 { margin-top: 1.4em; margin-bottom: 0.4em; }
main p { margin-bottom: 0.8em; }
main ul, main ol { margin-left: 1.5rem; margin-bottom: 0.8em; }
main pre { background: #f0f0f0; padding: 1rem; overflow-x: auto; margin-bottom: 0.8em; border-radius: 4px; }
main code { background: #f0f0f0; padding: 0.15em 0.3em; border-radius: 3px; font-size: 0.9em; }
main pre code { background: none; padding: 0; }
main img { max-width: 100%; height: auto; }

/* Floated images: ![[img.png|left|200]] / ![[img.png|right|200]]
   Text starts at the image's top edge and wraps around it. */
main img.left  { float: left;  margin: 0.3em 1.2rem 0.6rem 0; max-width: 50%; }
main img.right { float: right; margin: 0.3em 0 0.6rem 1.2rem; max-width: 50%; }
/* Headings and rules start below any floated image */
main h1, main h2, main h3, main h4, main h5, main h6, main hr { clear: both; }
/* Keep floats inside the content area (don't overlap the footer) */
main { display: flow-root; }
main a { color: #0366d6; }
main hr { border: none; border-top: 1px solid #ddd; margin: 1.5em 0; }

footer { margin-top: 2rem; border-top: 1px solid #ddd; padding-top: 1rem; font-size: 0.85em; color: #666; }

/* ---- Table of contents (frontmatter toc: true) ---- */
html { scroll-behavior: smooth; }
main [id] { scroll-margin-top: 1rem; }

.toc { font-size: 0.9rem; }
.toc-box {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 0.6rem 0.9rem;
  margin-bottom: 1rem;
}
.toc-box > summary {
  list-style: none;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
}
.toc-box > summary::-webkit-details-marker { display: none; }
.toc-box > summary::before { content: "\\25B8"; display: inline-block; width: 1.1em; }
.toc-box[open] > summary::before { content: "\\25BE"; }
.toc-box[open] > summary { margin-bottom: 0.4rem; }
.toc ul { list-style: none; }
.toc ul ul { padding-left: 0.9rem; }
.toc li { margin: 0.25em 0; line-height: 1.4; }
.toc a {
  display: block;
  padding-left: 0.5rem;
  border-left: 3px solid transparent;
  color: #555;
  text-decoration: none;
}
.toc a:hover { color: #0366d6; text-decoration: underline; }
/* Current section (set by assets/toc.js while scrolling) */
.toc a.active {
  font-weight: 700;
  color: #222;
  border-left-color: #0366d6;
}

/* Wide screens: TOC as a sticky column on the right */
@media (min-width: 1100px) {
  .page.has-toc {
    display: grid;
    grid-template-columns: minmax(0, 48rem) 13rem;
    grid-template-rows: 1fr auto;
    column-gap: 2.5rem;
    max-width: calc(48rem + 13rem + 2.5rem + 4rem);
  }
  .page.has-toc > main { grid-column: 1; grid-row: 1; }
  .page.has-toc > footer { grid-column: 1; grid-row: 2; }
  .page.has-toc > .toc {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: start;
    position: sticky;
    top: 2rem;
    max-height: calc(100vh - 4rem);
    overflow-y: auto;
  }
  .toc-box { border: none; border-left: 1px solid #ddd; border-radius: 0; padding: 0 0 0 1rem; }
}

/* Wide screens: always open, hide the toggle (browsers supporting ::details-content) */
@supports selector(::details-content) {
  @media (min-width: 1100px) {
    .toc-box > summary { pointer-events: none; }
    .toc-box > summary::before { content: none; }
    .toc-box::details-content { content-visibility: visible; }
    .toc-box > summary { margin-bottom: 0.4rem; }
  }
}

/* ---- Responsive: small screens ---- */
@media (max-width: 768px) {
  .sidebar {
    position: sticky;
    top: 0;
    z-index: 10;
    width: 100%;
    height: auto;
    padding: 0;
    border-right: none;
    border-bottom: 1px solid #ddd;
  }
  .menu > summary { padding: 0.75rem 1rem; }
  .menu-body {
    max-height: 70vh;
    overflow-y: auto;
    padding: 0 1rem 1rem;
  }
  .page {
    margin-left: 0;
  }
  /* Keep headings clear of the sticky menu bar when jumping to an anchor */
  main [id] { scroll-margin-top: 4rem; }
}

/* Very narrow screens: stack floated images above the text */
@media (max-width: 480px) {
  main img.left, main img.right {
    float: none;
    display: block;
    max-width: 100%;
    margin: 0 0 0.8em;
  }
}
`;

/**
 * Scroll-spy for the table of contents.
 * Highlights the TOC link of the last heading that has scrolled past the top.
 * Only included on pages with `toc: true`.
 */
export const TOC_JS = `/* Ob2Static — TOC scroll-spy */
(function () {
  var toc = document.querySelector(".toc");
  if (!toc) return;

  // Pair each TOC link with its heading
  var items = [];
  toc.querySelectorAll('a[href^="#"]').forEach(function (a) {
    var el = document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1)));
    if (el) items.push({ link: a, heading: el });
  });
  if (!items.length) return;

  // A heading counts as "passed" once its top is above this line (px from viewport top).
  // Must be larger than the CSS scroll-margin-top so clicked headings become active.
  var OFFSET = 80;
  var current = null;

  function update() {
    var active = null;
    for (var i = 0; i < items.length; i++) {
      if (items[i].heading.getBoundingClientRect().top <= OFFSET) active = items[i];
      else break;
    }
    // At the very bottom, short last sections can never reach the top: activate the last one
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      active = items[items.length - 1];
    }
    if (active === current) return;
    if (current) current.link.classList.remove("active");
    current = active;
    if (current) {
      current.link.classList.add("active");
      keepVisible(current.link);
    }
  }

  // If the TOC itself scrolls (long lists), keep the active link in view — without scrolling the page
  function keepVisible(link) {
    if (toc.scrollHeight <= toc.clientHeight) return;
    var t = link.getBoundingClientRect().top - toc.getBoundingClientRect().top + toc.scrollTop;
    if (t < toc.scrollTop || t + link.offsetHeight > toc.scrollTop + toc.clientHeight) {
      toc.scrollTop = t - toc.clientHeight / 3;
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
`;
