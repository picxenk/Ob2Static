/**
 * Default stylesheet and asset helpers.
 */

export const DEFAULT_CSS = `/* Ob2Static — minimal stylesheet */
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  max-width: 48rem;
  margin: 0 auto;
  padding: 2rem 1rem;
  color: #222;
  background: #fafafa;
}

header { margin-bottom: 2rem; border-bottom: 1px solid #ddd; padding-bottom: 1rem; }
header nav ul { list-style: none; display: flex; gap: 1rem; }
header nav a { text-decoration: none; color: #0366d6; }

main { min-height: 60vh; }
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
`;
