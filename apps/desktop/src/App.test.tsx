import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";
import * as api from "./lib/api";

vi.mock("./lib/api", async () => {
  const actual = await vi.importActual<typeof import("./lib/api")>("./lib/api");
  return {
    ...actual,
    createDocument: vi.fn(),
    chooseRepoDirectory: vi.fn(),
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
  mockedApi.chooseRepoDirectory.mockResolvedValue("/tmp/chosen-repo");
  mockedApi.searchDocuments.mockResolvedValue([]);
  mockedApi.listAssets.mockResolvedValue([]);
  mockedApi.getStats.mockResolvedValue({
    total: 12,
    groups: {
      type: [
        { key: "note", count: 6 },
        { key: "project", count: 2 },
      ],
      status: [
        { key: "active", count: 8 },
        { key: "inbox", count: 4 },
      ],
      theme: [{ key: "knowledge", count: 3 }],
      source: [{ key: "field-notes", count: 2 }],
    },
    raw: "total\t12",
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
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("switches repository when clicking a recent repo entry", async () => {
    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "/tmp/alt-repo" }));

    await waitFor(() => {
      expect(mockedApi.selectRepo).toHaveBeenCalledWith("/tmp/alt-repo");
    });
  });

  it("opens a native directory picker and switches to the selected repository", async () => {
    render(<App />);

    await screen.findAllByText("结构总控台");

    fireEvent.click(screen.getByRole("button", { name: "打开目录" }));

    await waitFor(() => {
      expect(mockedApi.chooseRepoDirectory).toHaveBeenCalledTimes(1);
      expect(mockedApi.selectRepo).toHaveBeenCalledWith("/tmp/chosen-repo");
    });
  });

  it("defaults to a one-screen home summary view", async () => {
    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");

    expect(screen.getByText("结构总控台")).toBeInTheDocument();
    expect(screen.getByLabelText("全局搜索")).toBeInTheDocument();
    expect(screen.getAllByText("进入文档页").length).toBeGreaterThan(0);
    expect(screen.queryByText("文档浏览")).not.toBeInTheDocument();
  });

  it("navigates from home search to documents with the query applied", async () => {
    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");

    fireEvent.change(screen.getByLabelText("全局搜索"), {
      target: { value: "galaxy query" },
    });
    fireEvent.keyDown(screen.getByLabelText("全局搜索"), {
      key: "Enter",
      code: "Enter",
      charCode: 13,
    });

    await waitFor(() => {
      expect(screen.getByText("文档浏览")).toBeInTheDocument();
      expect(screen.getByLabelText("搜索")).toHaveValue("galaxy query");
    });
  });

  it("opens a secondary page from the home entry cards", async () => {
    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "进入资源页" }));

    expect(await screen.findByText("资源过滤")).toBeInTheDocument();
  });

  it("removes duplicated repository status copy from the shell", async () => {
    render(<App />);

    await screen.findAllByText("结构总控台");

    expect(screen.queryByText("ACTIVE REPOSITORY")).not.toBeInTheDocument();
    expect(screen.queryByText("当前仓库")).not.toBeInTheDocument();
    expect(screen.queryByText("已连接到当前知识库")).not.toBeInTheDocument();
  });

  it("renders overview cards from repository stats", async () => {
    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");

    expect(await screen.findByText("总文档")).toBeInTheDocument();
    expect(screen.getAllByText("12").length).toBeGreaterThan(0);
    expect(screen.getByText("type · note")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("status · active")).toBeInTheDocument();
    expect(screen.getByText("theme · knowledge")).toBeInTheDocument();
  });

  it("renders the structural desktop masthead with current section context", async () => {
    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");

    expect(screen.getByText("结构总控台")).toBeInTheDocument();
    expect(screen.getByText("当前区段")).toBeInTheDocument();
    expect(screen.getAllByText(/首页总览/).length).toBeGreaterThan(0);
    expect(screen.getByText("知识结构总量")).toBeInTheDocument();
  });

  it("shows an empty-state message when the current document view has no results", async () => {
    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "文档" }));

    expect(
      await screen.findByText("当前视图没有文档结果"),
    ).toBeInTheDocument();
    expect(screen.getByText("试试清空筛选条件，或者直接去创建一篇新文档。")).toBeInTheDocument();
  });

  it("switches to the create workbench with note preset from the documents hero", async () => {
    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "文档" }));

    fireEvent.click(screen.getByRole("button", { name: "新建 Note" }));

    expect(await screen.findByText("创建中心")).toBeInTheDocument();
    expect(screen.getByDisplayValue("note")).toBeInTheDocument();
  });

  it("clears the current search and filters from the documents hero", async () => {
    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "文档" }));

    fireEvent.change(screen.getByLabelText("搜索"), {
      target: { value: "search phrase" },
    });
    fireEvent.change(screen.getByLabelText("状态"), {
      target: { value: "active" },
    });

    await screen.findByText("当前视图 · 搜索 “search phrase”");

    fireEvent.click(screen.getByRole("button", { name: "重置视图" }));

    await waitFor(() => {
      expect(screen.getByLabelText("搜索")).toHaveValue("");
      expect(screen.getByLabelText("状态")).toHaveValue("");
    });
    expect(screen.getByText("当前视图 · 全部文档")).toBeInTheDocument();
  });

  it("renders document signal cards from the top stats groups", async () => {
    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "文档" }));

    expect(screen.getByText("文档信号条")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("8 篇")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "聚焦状态 active" })).toBeInTheDocument();
  });

  it("applies a status focus from the document signal rail and clears the current query", async () => {
    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "文档" }));

    fireEvent.change(screen.getByLabelText("搜索"), {
      target: { value: "search phrase" },
    });

    await screen.findByText("当前视图 · 搜索 “search phrase”");

    fireEvent.click(screen.getByRole("button", { name: "聚焦状态 active" }));

    await waitFor(() => {
      expect(screen.getByLabelText("搜索")).toHaveValue("");
      expect(screen.getByLabelText("状态")).toHaveValue("active");
    });
    expect(screen.getByText("当前视图 · status: active")).toBeInTheDocument();
  });

  it("runs project add-remote with the selected project and remote form values", async () => {
    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");

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

    expect(await screen.findByText("已执行项目命令")).toBeInTheDocument();
    expect(screen.getByText("orion · add-remote")).toBeInTheDocument();
  });

  it("creates a note with inline body from the create workbench", async () => {
    mockedApi.createDocument.mockResolvedValue({ path: "notes/ship-note.md" });

    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");

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

    expect(await screen.findByText("已创建文档")).toBeInTheDocument();
    expect(screen.getByText("notes/ship-note.md")).toBeInTheDocument();
  });

  it("renders recipe cards in the create center", async () => {
    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "创建" }));

    expect(screen.getByText("模板配方台")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "切换到 note 配方" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "切换到 project 配方" })).toBeInTheDocument();
  });

  it("switches create context when choosing the project recipe", async () => {
    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "创建" }));
    fireEvent.click(screen.getByRole("button", { name: "切换到 project 配方" }));

    expect(screen.getByDisplayValue("project")).toBeInTheDocument();
    expect(screen.getByText("当前配方需要标题与 Git Worktree，用于把知识库项目条目接到真实代码目录。")).toBeInTheDocument();
    expect(screen.getByLabelText("Git Worktree")).toBeInTheDocument();
  });

  it("renders export content after running an export action", async () => {
    mockedApi.runExport.mockResolvedValue({
      kind: "manifest",
      content: '{\n  "total": 2\n}',
    });

    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "校验与导出" }));
    fireEvent.click(screen.getByRole("button", { name: "导出 manifest" }));

    expect(await screen.findByText(/"total": 2/)).toBeInTheDocument();
  });

  it("copies exported content to the clipboard", async () => {
    mockedApi.runExport.mockResolvedValue({
      kind: "manifest",
      content: '{\n  "total": 2\n}',
    });

    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "校验与导出" }));
    fireEvent.click(screen.getByRole("button", { name: "导出 manifest" }));
    await screen.findByText(/"total": 2/);

    fireEvent.click(screen.getByRole("button", { name: "复制导出内容" }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('{\n  "total": 2\n}');
    });
  });

  it("saves exported content to a local file", async () => {
    mockedApi.runExport.mockResolvedValue({
      kind: "asset-list",
      content: '[\n  {\n    "path": "assets/logo.png"\n  }\n]',
    });

    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "校验与导出" }));
    fireEvent.click(screen.getByRole("button", { name: "导出 asset-list" }));
    await screen.findByText(/assets\/logo\.png/);

    fireEvent.click(screen.getByRole("button", { name: "另存为文件" }));

    await waitFor(() => {
      expect(mockedApi.saveExportToFile).toHaveBeenCalledWith(
        "asset-list.json",
        '[\n  {\n    "path": "assets/logo.png"\n  }\n]',
      );
    });
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

    await screen.findByDisplayValue("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "文档" }));
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

  it("runs document search when typing a query", async () => {
    mockedApi.searchDocuments.mockResolvedValue([
      {
        path: "notes/search-hit.md",
        title: "Search Hit",
        type: "note",
        status: "active",
      },
    ]);

    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "文档" }));

    fireEvent.change(screen.getByLabelText("搜索"), {
      target: { value: "search phrase" },
    });

    await waitFor(() => {
      expect(mockedApi.searchDocuments).toHaveBeenCalledWith("search phrase", {});
    });
    expect(await screen.findByText("Search Hit")).toBeInTheDocument();
    expect(screen.getByText("当前视图 · 搜索 “search phrase”")).toBeInTheDocument();
  });

  it("re-queries document list when a status filter changes", async () => {
    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "文档" }));

    fireEvent.change(screen.getByLabelText("状态"), {
      target: { value: "active" },
    });

    await waitFor(() => {
      expect(mockedApi.listDocuments).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: "active" }),
      );
    });
    expect(screen.getByText("当前视图 · status: active")).toBeInTheDocument();
  });

  it("imports an asset with project and target name from the asset workbench", async () => {
    mockedApi.importAsset.mockResolvedValue({
      path: "projects/atlas/assets/hero.png",
      scope: "project",
      project: "atlas",
      size_bytes: 128,
      sha256: "a".repeat(64),
    });

    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "资源" }));
    fireEvent.change(screen.getByLabelText("本地文件路径"), {
      target: { value: "/tmp/hero.png" },
    });
    fireEvent.change(screen.getByLabelText("目标文件名"), {
      target: { value: "hero.png" },
    });
    fireEvent.change(screen.getByLabelText("导入到项目 slug"), {
      target: { value: "atlas" },
    });

    fireEvent.click(screen.getByRole("button", { name: "导入资源" }));

    await waitFor(() => {
      expect(mockedApi.importAsset).toHaveBeenCalledWith({
        filePath: "/tmp/hero.png",
        targetName: "hero.png",
        project: "atlas",
      });
    });

    expect(await screen.findByText("已导入资源")).toBeInTheDocument();
    expect(screen.getByText("projects/atlas/assets/hero.png")).toBeInTheDocument();
  });

  it("renders validation errors after running validate", async () => {
    mockedApi.runValidate.mockResolvedValue({
      ok: false,
      errors: ["notes/idea.md: missing asset path: ../assets/missing.png"],
      raw: "notes/idea.md: missing asset path: ../assets/missing.png",
    });

    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "校验与导出" }));
    fireEvent.click(screen.getByRole("button", { name: "运行校验" }));

    expect(
      await screen.findByText("notes/idea.md: missing asset path: ../assets/missing.png"),
    ).toBeInTheDocument();
  });

  it("shows an error banner when validate fails to run", async () => {
    mockedApi.runValidate.mockRejectedValue(new Error("validate crashed"));

    render(<App />);

    await screen.findByDisplayValue("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "校验与导出" }));
    fireEvent.click(screen.getByRole("button", { name: "运行校验" }));

    expect(await screen.findByText("validate crashed")).toBeInTheDocument();
  });
});
