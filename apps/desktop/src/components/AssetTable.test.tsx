import { render, screen } from "@testing-library/react";
import type { AssetRecord } from "../lib/types";
import { AssetTable } from "./AssetTable";

describe("AssetTable", () => {
  it("renders an empty state when no assets are visible", () => {
    render(<AssetTable assets={[]} />);

    expect(screen.getByText("当前筛选下没有资源")).toBeInTheDocument();
    expect(screen.getByText("可以切换作用域，或者去右侧导入新的仓库资源与项目资源。")).toBeInTheDocument();
  });

  it("renders sha256 for assets", () => {
    const assets: AssetRecord[] = [
      {
        path: "assets/diagram.png",
        scope: "repo",
        size_bytes: 128,
        sha256: "a".repeat(64),
      },
    ];

    render(<AssetTable assets={assets} />);

    expect(screen.getByText("assets/diagram.png")).toBeInTheDocument();
    expect(screen.getByText("a".repeat(64))).toBeInTheDocument();
  });

  it("filters assets by scope and project", () => {
    const assets: AssetRecord[] = [
      {
        path: "assets/diagram.png",
        scope: "repo",
        size_bytes: 128,
        sha256: "a".repeat(64),
      },
      {
        path: "projects/atlas/assets/cover.png",
        scope: "project",
        project: "atlas",
        size_bytes: 256,
        sha256: "b".repeat(64),
      },
      {
        path: "projects/orion/assets/spec.png",
        scope: "project",
        project: "orion",
        size_bytes: 512,
        sha256: "c".repeat(64),
      },
    ];

    const { rerender } = render(
      <AssetTable assets={assets} scopeFilter="repo" projectFilter="" />,
    );

    expect(screen.getByText("assets/diagram.png")).toBeInTheDocument();
    expect(screen.queryByText("projects/atlas/assets/cover.png")).not.toBeInTheDocument();

    rerender(<AssetTable assets={assets} scopeFilter="project" projectFilter="atlas" />);

    expect(screen.getByText("projects/atlas/assets/cover.png")).toBeInTheDocument();
    expect(screen.queryByText("assets/diagram.png")).not.toBeInTheDocument();
    expect(screen.queryByText("projects/orion/assets/spec.png")).not.toBeInTheDocument();
  });
});
