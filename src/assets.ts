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
  background: #fafafa;
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
  background: #f0f0f0;
  border-right: 1px solid #ddd;
}
.sidebar ul { list-style: none; }
.sidebar li { margin-bottom: 0.3em; }
.sidebar a { text-decoration: none; color: #0366d6; }
.sidebar a:hover { text-decoration: underline; }

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
main a { color: #0366d6; }
main hr { border: none; border-top: 1px solid #ddd; margin: 1.5em 0; }

footer { margin-top: 2rem; border-top: 1px solid #ddd; padding-top: 1rem; font-size: 0.85em; color: #666; }

/* ---- Responsive: small screens ---- */
@media (max-width: 768px) {
  .sidebar {
    position: static;
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid #ddd;
  }
  .page {
    margin-left: 0;
  }
}
`;
