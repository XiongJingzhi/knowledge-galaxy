import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("release workflow", () => {
  const workflowPath = resolve(import.meta.dirname, "../../../.github/workflows/release.yml");
  const workflow = readFileSync(workflowPath, "utf8");

  it("uploads only installer-level desktop artifacts", () => {
    expect(workflow).toContain("name: Collect desktop installer artifacts");
    expect(workflow).toContain("apps/desktop/src-tauri/target/release/installer-artifacts");
    expect(workflow).not.toContain("path: apps/desktop/src-tauri/target/release/bundle");
  });

  it("does not flatten nested desktop bundle files into nightly assets", () => {
    expect(workflow).not.toContain("find release-artifacts -type f");
    expect(workflow).toContain("find release-artifacts -mindepth 2 -maxdepth 2 -type f");
  });
});
