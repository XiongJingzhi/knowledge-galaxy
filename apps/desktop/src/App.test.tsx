import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";
import * as api from "./lib/api";

vi.mock("./lib/api", async () => {
  const actual = await vi.importActual<typeof import("./lib/api")>("./lib/api");
  return {
    ...actual,
    createDocument: vi.fn(),
    getDocument: vi.fn(),
    getRecentRepos: vi.fn(),
    getStats: vi.fn(),
    importAsset: vi.fn(),
    listAssets: vi.fn(),
    listDocuments: vi.fn(),
    listProjects: vi.fn(),
    runExport: vi.fn(),
    runProjectCommand: vi.fn(),
    runValidate: vi.fn(),
    saveDocument: vi.fn(),
    saveExportToFile: vi.fn(),
    searchDocuments: vi.fn(),
    selectRepo: vi.fn(),
  };
});

const mockedApi = vi.mocked(api);

function arrangeApi() {
  mockedApi.selectRepo.mockResolvedValue({
    path: "/tmp/default-repo",
    isDefault: true,
    exists: true,
  });
  mockedApi.getRecentRepos.mockResolvedValue([
    { path: "/tmp/default-repo", isDefault: true, exists: true },
    { path: "/tmp/alt-repo", isDefault: false, exists: true },
  ]);
  mockedApi.listDocuments.mockResolvedValue([]);
  mockedApi.searchDocuments.mockResolvedValue([]);
  mockedApi.listAssets.mockResolvedValue([]);
  mockedApi.getStats.mockResolvedValue({
    total: 0,
    groups: {},
    raw: "total\t0",
  });
  mockedApi.listProjects.mockResolvedValue([
    { path: "projects/atlas/README.md", title: "Atlas", slug: "atlas" },
    { path: "projects/orion/README.md", title: "Orion", slug: "orion" },
  ]);
  mockedApi.runProjectCommand.mockResolvedValue({
    ok: true,
    stdout: "ok",
    stderr: "",
  });
  mockedApi.runValidate.mockResolvedValue({ ok: true, errors: [], raw: "OK" });
  mockedApi.runExport.mockResolvedValue({ kind: "manifest", content: "{}" });
  mockedApi.getDocument.mockResolvedValue({
    path: "notes/idea.md",
    id: "note-1",
    type: "note",
    slug: "idea",
    createdAt: "2026-03-13T00:00:00Z",
    updatedAt: "2026-03-13T00:00:00Z",
    title: "Idea",
    status: "active",
    date: "",
    theme: [],
    project: [],
    tags: [],
    source: [],
    summary: "",
    body: "body",
    gitWorktree: "",
  });
}

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    arrangeApi();
  });

  it("switches repository when clicking a recent repo entry", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "/tmp/alt-repo" }));

    await waitFor(() => {
      expect(mockedApi.selectRepo).toHaveBeenCalledWith("/tmp/alt-repo");
    });
  });

  it("runs project add-remote with the selected project and remote form values", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "项目" }));
    fireEvent.click(screen.getByRole("button", { name: "Orion orion" }));

    fireEvent.change(screen.getByLabelText("Remote 名称"), {
      target: { value: "upstream" },
    });
    fireEvent.change(screen.getByLabelText("Remote URL"), {
      target: { value: "git@github.com:org/orion.git" },
    });
    fireEvent.change(screen.getByLabelText("远端别名"), {
      target: { value: "upstream" },
    });
    fireEvent.change(screen.getByLabelText("分支"), {
      target: { value: "main" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Add Remote" }));

    await waitFor(() => {
      expect(mockedApi.runProjectCommand).toHaveBeenCalledWith("orion", "add-remote", {
        name: "upstream",
        remote: "upstream",
        branch: "main",
        url: "git@github.com:org/orion.git",
      });
    });
  });

  it("creates a note with inline body from the create workbench", async () => {
    mockedApi.createDocument.mockResolvedValue({ path: "notes/ship-note.md" });

    render(<App />);

    await screen.findByText("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "创建" }));
    fireEvent.change(screen.getByLabelText("标题"), {
      target: { value: "Ship Note" },
    });
    fireEvent.change(screen.getByLabelText("正文"), {
      target: { value: "Captured from desktop." },
    });

    fireEvent.click(screen.getByRole("button", { name: "创建文档" }));

    await waitFor(() => {
      expect(mockedApi.createDocument).toHaveBeenCalledWith("note", {
        type: "note",
        title: "Ship Note",
        date: "",
        gitWorktree: "",
        body: "Captured from desktop.",
      });
    });
  });

  it("renders export content after running an export action", async () => {
    mockedApi.runExport.mockResolvedValue({
      kind: "manifest",
      content: '{\n  "total": 2\n}',
    });

    render(<App />);

    await screen.findByText("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "校验与导出" }));
    fireEvent.click(screen.getByRole("button", { name: "导出 manifest" }));

    expect(await screen.findByText(/"total": 2/)).toBeInTheDocument();
  });

  it("saves edited document details from the document workbench", async () => {
    mockedApi.listDocuments.mockResolvedValue([
      {
        path: "notes/idea.md",
        title: "Idea",
        type: "note",
        status: "active",
      },
    ]);
    mockedApi.saveDocument.mockResolvedValue({
      path: "notes/idea.md",
      updatedAt: "2026-03-13T01:00:00Z",
    });

    render(<App />);

    await screen.findByText("Idea");

    fireEvent.click(screen.getByRole("button", { name: "Idea note · active notes/idea.md" }));
    await screen.findByDisplayValue("Idea");

    fireEvent.change(screen.getByLabelText("标题"), {
      target: { value: "Idea Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存文档" }));

    await waitFor(() => {
      expect(mockedApi.saveDocument).toHaveBeenCalledWith(
        "notes/idea.md",
        expect.objectContaining({
          path: "notes/idea.md",
          title: "Idea Updated",
        }),
      );
    });
  });
});
