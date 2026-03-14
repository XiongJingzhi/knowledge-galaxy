import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function readWorkflow(name: string) {
  return readFileSync(resolve(import.meta.dirname, `../../../.github/workflows/${name}`), "utf8");
}

describe("workflow runtime versions", () => {
  const ciWorkflow = readWorkflow("ci.yml");
  const integrationWorkflow = readWorkflow("integration.yml");
  const releaseWorkflow = readWorkflow("release.yml");
  const allWorkflows = [ciWorkflow, integrationWorkflow, releaseWorkflow];

  it("uses current checkout and node setup action majors", () => {
    for (const workflow of allWorkflows) {
      expect(workflow).toContain("uses: actions/checkout@v5");
      expect(workflow).toContain("uses: actions/setup-node@v5");
      expect(workflow).not.toContain("uses: actions/checkout@v4");
      expect(workflow).not.toContain("uses: actions/setup-node@v4");
    }
  });

  it("uses current go/python setup action majors and disables go cache discovery", () => {
    expect(ciWorkflow).toContain("uses: actions/setup-python@v6");
    expect(ciWorkflow).toContain("uses: actions/setup-go@v6");
    expect(integrationWorkflow).toContain("uses: actions/setup-go@v6");
    expect(releaseWorkflow).toContain("uses: actions/setup-go@v6");

    for (const workflow of [ciWorkflow, integrationWorkflow, releaseWorkflow]) {
      expect(workflow).not.toContain("uses: actions/setup-go@v5");
    }

    const goSetupBlocks = [ciWorkflow, integrationWorkflow, releaseWorkflow]
      .flatMap((workflow) => workflow.split("- name: Set up Go").slice(1).map((block) => `- name: Set up Go${block}`))
      .map((block) => block.split("\n      - name:")[0]);

    expect(goSetupBlocks.length).toBeGreaterThan(0);
    for (const block of goSetupBlocks) {
      expect(block).toContain("cache: false");
    }
  });
});
