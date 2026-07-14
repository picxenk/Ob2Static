# PLAN.md

# Obsidian Website Export Plugin --- MVP

## Goal

Export an Obsidian vault as a minimal static website for personal use.

## Site Structure

-   `Index.md` → `/index.html`
-   `Menu.md` → shared navigation
-   `Footer.md` → shared footer
-   Every other Markdown file → corresponding HTML page

## MVP Scope

### 1. Export command

-   Add command: **Export Website**
-   Generate `output/` directory.

### 2. Scan vault

-   Read all Markdown files.
-   Ignore `.obsidian/`.

### 3. Reserved pages

  File        Purpose
  ----------- -------------------
  Index.md    Homepage
  Menu.md     Global navigation
  Footer.md   Global footer

These three pages are treated specially.

### 4. HTML conversion

For each page:

1.  Parse Markdown
2.  Convert to HTML
3.  Wrap with template

Template:

``` html
<html>
<head>
<meta charset="utf-8">
<title>{{title}}</title>
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<header>
{{menu}}
</header>

<main>
{{content}}
</main>

<footer>
{{footer}}
</footer>
</body>
</html>
```

### 5. Links

-   `[[Page]]` → `Page.html`
-   Preserve relative folder structure where practical.

### 6. Images

-   Copy attachments into `output/assets/`
-   Rewrite image references.

### 7. Assets

    output/
        index.html
        assets/
            style.css

Provide one minimal stylesheet.

## Folder Layout

    src/
        main.ts
        exporter.ts
        markdown.ts
        template.ts
        assets.ts

## Definition of Done

-   Plugin appears in Obsidian.
-   "Export Website" command works.
-   Output folder is generated.
-   Index becomes homepage.
-   Menu and Footer appear on every page.
-   Wiki links work.
-   Images are copied.
-   Pages are viewable locally.
