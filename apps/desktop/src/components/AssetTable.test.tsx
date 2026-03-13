import { render, screen } from "@testing-library/react";
import type { AssetRecord } from "../lib/types";
import { AssetTable } from "./AssetTable";

describe("AssetTable", () => {
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
});
