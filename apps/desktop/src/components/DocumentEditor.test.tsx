import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    render(<DocumentEditor document={null} onSave={() => undefined} />);

    expect(screen.getByText("还没有可编辑的文档")).toBeInTheDocument();
    expect(screen.getByText("请先从文档列表进入创建或编辑工作区。")).toBeInTheDocument();
  });

  it("marks editor dirty after changes and emits save payload", () => {
    const saves: DocumentDetail[] = [];
    render(<DocumentEditor document={detail} onSave={(value) => saves.push(value)} />);

    fireEvent.change(screen.getByLabelText("标题"), {
      target: { value: "Idea Updated" },
    });

    expect(screen.getByText("未保存变更")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "保存文档" }));

    expect(saves[0].title).toBe("Idea Updated");
  });

  it("renders editing fields and preview metadata", () => {
    render(<DocumentEditor document={detail} onSave={() => undefined} />);

    expect(screen.getByText("Markdown 编辑")).toBeInTheDocument();
    expect(screen.getByText("实时预览")).toBeInTheDocument();
    expect(screen.getByText("note")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Idea")).toBeInTheDocument();
    expect(screen.getByText("knowledge")).toBeInTheDocument();
    expect(screen.getByText("atlas")).toBeInTheDocument();
  });

  it("copies the document path from the dossier strip", async () => {
    render(<DocumentEditor document={detail} onSave={() => undefined} />);

    fireEvent.click(screen.getByRole("button", { name: "复制路径" }));

    await waitFor(() => {
      expect(globalThis.navigator.clipboard.writeText).toHaveBeenCalledWith("notes/idea.md");
    });
    expect(screen.getByRole("button", { name: "已复制路径" })).toBeInTheDocument();
  });

  it("renders structured markdown in the preview panel", () => {
    render(<DocumentEditor document={detail} onSave={() => undefined} />);

    expect(screen.getByRole("heading", { name: "Idea", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
    expect(screen.queryByText("# Idea")).not.toBeInTheDocument();
  });
});
