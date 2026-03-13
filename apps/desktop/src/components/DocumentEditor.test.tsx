import { fireEvent, render, screen } from "@testing-library/react";
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
  body: "body",
  gitWorktree: "",
};

describe("DocumentEditor", () => {
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
});
