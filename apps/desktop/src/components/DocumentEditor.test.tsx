import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import type { DocumentDetail } from "../lib/types";
import { DocumentEditor } from "./DocumentEditor";

const detail: DocumentDetail = {
  path: "notes/idea.md",
  id: "note-1",
  type: "note",
  slug: "idea",
  createdAt: "2026-03-13T00:00:00Z",
  updatedAt: "2026-03-13T00:00:00Z",
  title: "Idea",
  status: "active",
  date: "",
  theme: ["knowledge"],
  project: ["atlas"],
  tags: ["idea"],
  source: ["field-notes"],
  summary: "short",
  body: "# Idea\n\n- alpha\n- beta\n\n**bold** body",
  gitWorktree: "",
};

function renderEditor({
  document = detail,
  onSave = () => undefined,
  viewMode = "preview",
}: {
  document?: DocumentDetail | null;
  onSave?: (value: DocumentDetail) => void;
  viewMode?: "preview" | "edit";
} = {}) {
  function Harness() {
    const [draft, setDraft] = useState<DocumentDetail | null>(document);
    return (
      <DocumentEditor
        dirty={draft !== document}
        document={draft}
        viewMode={viewMode}
        onChange={(value) => setDraft(value)}
        onSave={onSave}
      />
    );
  }

  return render(<Harness />);
}

describe("DocumentEditor", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders a guided empty state when no document is selected", () => {
    renderEditor({ document: null });

    expect(screen.getByText("还没有打开的文档")).toBeInTheDocument();
    expect(screen.getByText("从左侧浏览器选择文档，或者新建一篇文档开始整理。")).toBeInTheDocument();
  });

  it("marks editor dirty after changes and emits save payload", () => {
    const saves: DocumentDetail[] = [];
    renderEditor({ viewMode: "edit", onSave: (value) => saves.push(value) });

    fireEvent.change(screen.getByLabelText("标题"), {
      target: { value: "Idea Updated" },
    });

    expect(screen.getByText("未保存变更")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "保存文档" }));

    expect(saves[0].title).toBe("Idea Updated");
  });

  it("defaults to preview mode and hides editing controls", () => {
    renderEditor();

    expect(screen.getByText("文档预览")).toBeInTheDocument();
    expect(screen.getAllByText("Idea").length).toBeGreaterThan(0);
    expect(screen.queryByLabelText("标题")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Markdown 正文")).not.toBeInTheDocument();
    expect(screen.getByTestId("document-workspace-content")).toBeInTheDocument();
    expect(screen.getByText("创建时间")).toBeInTheDocument();
    expect(screen.getByText("更新时间")).toBeInTheDocument();
    expect(screen.getByText("文档日期")).toBeInTheDocument();
    expect(screen.getAllByText("knowledge").length).toBeGreaterThan(0);
    expect(screen.getAllByText("atlas").length).toBeGreaterThan(0);
    expect(screen.queryByLabelText("日期")).not.toBeInTheDocument();
  });

  it("renders only the markdown body editor inside the writer surface in edit mode", () => {
    renderEditor({ viewMode: "edit" });

    const writer = screen.getByTestId("document-writer");
    expect(writer).toContainElement(screen.getByLabelText("Markdown 正文"));
    expect(screen.queryByTestId("document-writer-badge")).not.toBeInTheDocument();
    expect(writer.querySelector('input[aria-label="标题"]')).not.toBeInTheDocument();
  });

  it("edits the title directly from the header title field", () => {
    renderEditor({ viewMode: "edit" });

    const headerTitle = screen.getByTestId("document-editor-title");
    fireEvent.change(headerTitle, { target: { value: "Inline Title" } });

    expect(screen.getByDisplayValue("Inline Title")).toBeInTheDocument();
    expect(screen.getByText("未保存变更")).toBeInTheDocument();
  });

  it("copies the document path from the dossier strip", async () => {
    renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "复制路径" }));

    await waitFor(() => {
      expect(globalThis.navigator.clipboard.writeText).toHaveBeenCalledWith("notes/idea.md");
    });
    expect(screen.getByRole("button", { name: "已复制路径" })).toBeInTheDocument();
  });

  it("renders structured markdown in the preview panel", () => {
    renderEditor();

    expect(screen.getByRole("heading", { name: "Idea", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
    expect(screen.queryByText("# Idea")).not.toBeInTheDocument();
  });
});
