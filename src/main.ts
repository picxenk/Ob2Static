import { Plugin } from "obsidian";
import { SiteExporter } from "./exporter";

export default class Ob2StaticPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: "export-website",
      name: "Export Website",
      callback: async () => {
        const exporter = new SiteExporter(this.app);
        await exporter.export();
      },
    });
  }
}
