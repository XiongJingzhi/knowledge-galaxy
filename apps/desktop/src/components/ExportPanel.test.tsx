import { render, screen } from "@testing-library/react";
import { ExportPanel } from "./ExportPanel";

describe("ExportPanel", () => {
  it("renders export payload text", () => {
    render(
      <ExportPanel
        snapshot={{
          kind: "manifest",
          content: '{\n  "total": 1\n}',
        }}
      />,
    );

    expect(screen.getByText(/"total": 1/)).toBeInTheDocument();
  });
});
