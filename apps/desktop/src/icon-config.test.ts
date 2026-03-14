import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("tauri icon config", () => {
  it("references platform icon assets that exist on disk", () => {
    const root = process.cwd();
    const configPath = join(root, "src-tauri", "tauri.conf.json");
    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      bundle?: { icon?: string[] };
    };

    expect(config.bundle?.icon).toEqual(
      expect.arrayContaining([
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/icon.png",
        "icons/icon.ico",
        "icons/icon.icns",
      ]),
    );

    for (const relativePath of config.bundle?.icon ?? []) {
      expect(existsSync(join(root, "src-tauri", relativePath))).toBe(true);
    }
  });
});
