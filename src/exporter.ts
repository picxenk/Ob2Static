import { App, TFile, TFolder, Notice } from "obsidian";
import { markdownToHtml } from "./markdown";
import { renderPage } from "./template";
import { DEFAULT_CSS } from "./assets";

const IGNORE_DIRS = [".obsidian", "output"];
const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico"];

export class SiteExporter {
  constructor(private app: App) {}

  async export(): Promise<void> {
    const vault = this.app.vault;
    const adapter = vault.adapter;

    // 1. Prepare output directory
    const outDir = "output";
    if (await adapter.exists(outDir)) {
      await this.removeDir(outDir);
    }
    await adapter.mkdir(outDir);
    await adapter.mkdir(outDir + "/assets");

    // 2. Write default stylesheet
    await adapter.write(outDir + "/assets/style.css", DEFAULT_CSS);

    // 3. Gather all markdown files (skip ignored dirs)
    const mdFiles = this.getMdFiles();

    // 4. Filter convertible pages and build page map.
    //    pageMap: basename → output path relative to output root (folder preserved).
    //    Obsidian resolves wiki-links by basename, so the map enables cross-folder lookups.
    const pages = mdFiles.filter(
      (f) => f.name !== "MENU.md" && f.name !== "FOOTER.md"
    );

    const pageMap = new Map<string, string>();
    for (const file of pages) {
      const htmlPath =
        file.name === "Index.md"
          ? "index.html"
          : file.path.replace(/\.md$/, ".html");
      pageMap.set(file.basename, htmlPath);
    }

    // 5. Read raw markdown for reserved pages (rendered per-page with correct paths)
    const menuMd = await this.readReservedMd("MENU.md");
    const footerMd = await this.readReservedMd("FOOTER.md");

    // 6. Copy image attachments
    await this.copyImages(outDir);

    // 7. Convert each page (preserving vault folder structure)
    let count = 0;
    for (const file of pages) {
      const md = await vault.cachedRead(file);

      const relativePath =
        file.name === "Index.md"
          ? "index.html"
          : file.path.replace(/\.md$/, ".html");

      // Directory of this page relative to output root
      const pageDir = relativePath.includes("/")
        ? relativePath.substring(0, relativePath.lastIndexOf("/"))
        : "";

      const contentHtml = markdownToHtml(md, pageMap, pageDir);

      // Menu and footer are rendered per-page so their links/images
      // use the correct relative paths for each page's depth.
      const menuHtml = menuMd ? markdownToHtml(menuMd, pageMap, pageDir) : "";
      const footerHtml = footerMd ? markdownToHtml(footerMd, pageMap, pageDir) : "";

      const title = file.basename;
      const depth = relativePath.split("/").length - 1;
      const rootPath = depth > 0 ? "../".repeat(depth) : "";

      const html = renderPage({
        title,
        menu: menuHtml,
        content: contentHtml,
        footer: footerHtml,
        rootPath,
      });

      // Ensure subdirectories exist
      if (pageDir) {
        await this.ensureDir(outDir + "/" + pageDir);
      }

      await adapter.write(outDir + "/" + relativePath, html);
      count++;
    }

    new Notice(`Website exported! ${count} pages → output/`);
  }

  // --- helpers ---

  private getMdFiles(): TFile[] {
    return this.app.vault
      .getFiles()
      .filter((f) => f.extension === "md" && !this.isIgnored(f.path));
  }

  private isIgnored(path: string): boolean {
    return IGNORE_DIRS.some(
      (d) => path === d || path.startsWith(d + "/")
    );
  }

  /** Read a reserved page and return raw markdown (not converted). */
  private async readReservedMd(name: string): Promise<string> {
    const file = this.app.vault.getAbstractFileByPath(name);
    if (file && file instanceof TFile) {
      return await this.app.vault.cachedRead(file);
    }
    return "";
  }

  private async copyImages(outDir: string): Promise<void> {
    const adapter = this.app.vault.adapter;
    const files = this.app.vault.getFiles();

    for (const file of files) {
      if (this.isIgnored(file.path)) continue;
      if (!IMAGE_EXTS.includes(file.extension.toLowerCase())) continue;

      const data = await this.app.vault.readBinary(file);
      await adapter.writeBinary(outDir + "/assets/" + file.name, data);
    }
  }

  private async ensureDir(path: string): Promise<void> {
    const adapter = this.app.vault.adapter;
    if (!(await adapter.exists(path))) {
      await adapter.mkdir(path);
    }
  }

  private async removeDir(path: string): Promise<void> {
    const adapter = this.app.vault.adapter;
    const abstractFile = this.app.vault.getAbstractFileByPath(path);
    if (abstractFile && abstractFile instanceof TFolder) {
      await this.app.vault.delete(abstractFile, true);
    }
  }
}
