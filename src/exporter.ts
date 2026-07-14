import { App, TFile, TFolder, Vault, Notice } from "obsidian";
import { markdownToHtml } from "./markdown";
import { renderPage } from "./template";
import { DEFAULT_CSS } from "./assets";

const RESERVED = ["Index.md", "Menu.md", "Footer.md"];
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

    // 4. Read reserved pages
    const menuHtml = await this.readReserved("Menu.md");
    const footerHtml = await this.readReserved("Footer.md");

    // 5. Copy image attachments
    await this.copyImages(outDir);

    // 6. Convert each page
    let count = 0;
    for (const file of mdFiles) {
      if (this.isIgnored(file.path)) continue;

      const md = await vault.cachedRead(file);
      const contentHtml = markdownToHtml(md);

      const title = file.basename;
      const isIndex = file.name === "Index.md";
      const isReservedOnly =
        file.name === "Menu.md" || file.name === "Footer.md";

      if (isReservedOnly) continue; // don't generate standalone pages

      // Determine output path
      const relativePath = isIndex
        ? "index.html"
        : file.path.replace(/\.md$/, ".html");

      // Calculate root-relative prefix
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
      const dir = relativePath.includes("/")
        ? outDir + "/" + relativePath.substring(0, relativePath.lastIndexOf("/"))
        : null;
      if (dir) {
        await this.ensureDir(dir);
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

  private async readReserved(name: string): Promise<string> {
    const file = this.app.vault.getAbstractFileByPath(name);
    if (file && file instanceof TFile) {
      const md = await this.app.vault.cachedRead(file);
      return markdownToHtml(md);
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
