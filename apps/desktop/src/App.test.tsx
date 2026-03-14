import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "./App";
import * as api from "./lib/api";

vi.mock("./lib/api", async () => {
  const actual = await vi.importActual<typeof import("./lib/api")>("./lib/api");
  return {
    ...actual,
    analyzeKnowledgeMigration: vi.fn(),
    chooseAssetFile: vi.fn(),
    chooseKnowledgeSourceFile: vi.fn(),
    chooseRepoDirectory: vi.fn(),
    createDocument: vi.fn(),
    getDocument: vi.fn(),
    getRecentRepos: vi.fn(),
    getStats: vi.fn(),
    importKnowledgeMigration: vi.fn(),
    importAsset: vi.fn(),
    listAssets: vi.fn(),
    listDocuments: vi.fn(),
    openRepoDirectory: vi.fn(),
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
  mockedApi.chooseAssetFile.mockResolvedValue(null);
  mockedApi.chooseKnowledgeSourceFile.mockResolvedValue(null);
  mockedApi.chooseRepoDirectory.mockResolvedValue("/tmp/chosen-repo");
  mockedApi.openRepoDirectory.mockResolvedValue(undefined);
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
  mockedApi.analyzeKnowledgeMigration.mockResolvedValue({
    sourceLabel: "knowledge.zip",
    drafts: [],
    warnings: [],
  });
  mockedApi.importKnowledgeMigration.mockResolvedValue({
    imported: 0,
    createdPaths: [],
    warnings: [],
  });
  mockedApi.getDocument.mockImplementation(async (path) => ({
    path,
    id: path.includes("ship-note") ? "note-ship" : "note-1",
    type: "note",
    slug: path.split("/").pop()?.replace(/\.md$/, "") ?? "idea",
    createdAt: "2026-03-13T00:00:00Z",
    updatedAt: "2026-03-13T00:00:00Z",
    title: path.includes("ship-note") ? "Ship Note" : "Idea",
    status: "active",
    date: "",
    theme: [],
    project: [],
    tags: [],
    source: [],
    summary: "",
    body: path.includes("ship-note") ? "Captured from desktop." : "body",
    gitWorktree: "",
  }));
}

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    arrangeApi();
    window.history.pushState({}, "", "/");
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("switches repository from the sidebar directory picker", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "切换仓库目录" }));

    await waitFor(() => {
      expect(mockedApi.chooseRepoDirectory).toHaveBeenCalledTimes(1);
      expect(mockedApi.selectRepo).toHaveBeenCalledWith("/tmp/chosen-repo");
    });
  });

  it("opens the current repository directory from the sidebar repo card", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "打开目录" }));

    await waitFor(() => {
      expect(mockedApi.openRepoDirectory).toHaveBeenCalledWith("/tmp/default-repo");
    });
  });

  it("defaults to a one-screen home summary view", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");

    expect(screen.getByLabelText("全局搜索")).toBeInTheDocument();
    expect(screen.getByText("/tmp/default-repo")).toBeInTheDocument();
    expect(screen.queryByText("文档浏览")).not.toBeInTheDocument();
  });

  it("keeps design principles out of the product copy", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");

    expect(screen.queryByText("结构化首页负责概览、搜索与进入功能页，具体操作都收进二级工作区。")).not.toBeInTheDocument();
    expect(screen.queryByText("00 · 首页总览")).not.toBeInTheDocument();
    expect(screen.queryByText("用一屏完成仓库切换、全局搜索与功能页分发，先看全局，再进入操作区。")).not.toBeInTheDocument();
    expect(screen.queryByText("当前区段")).not.toBeInTheDocument();
  });

  it("renders the home screen as a dashboard workspace", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");

    expect(screen.getByText("搜索、概览与快捷操作")).toBeInTheDocument();
    expect(screen.getByText("最近动态")).toBeInTheDocument();
    expect(screen.getByText("总文档")).toBeInTheDocument();
  });

  it("renders repository controls inside the sidebar", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");

    expect(screen.getByText("/tmp/default-repo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "切换仓库目录" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "打开目录" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "创建" })).not.toBeInTheDocument();
  });

  it("navigates from home search to documents with the query applied", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");

    fireEvent.change(screen.getByLabelText("全局搜索"), {
      target: { value: "galaxy query" },
    });
    fireEvent.keyDown(screen.getByLabelText("全局搜索"), {
      key: "Enter",
      code: "Enter",
      charCode: 13,
    });

    await waitFor(() => {
      expect(screen.getByText("文档索引")).toBeInTheDocument();
      expect(screen.getByLabelText("搜索")).toHaveValue("galaxy query");
    });
  });

  it("opens a secondary page from the sidebar navigation", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "资源" }));

    expect(await screen.findByText("资源索引台")).toBeInTheDocument();
  });

  it("removes duplicated repository status copy from the shell", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");

    expect(screen.queryByText("ACTIVE REPOSITORY")).not.toBeInTheDocument();
    expect(screen.queryByText("当前仓库")).not.toBeInTheDocument();
    expect(screen.queryByText("已连接到当前知识库")).not.toBeInTheDocument();
  });

  it("renders overview cards from repository stats", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");

    expect(await screen.findByText("总文档")).toBeInTheDocument();
    expect(screen.getAllByText("12").length).toBeGreaterThan(0);
    expect(screen.getByText("type · note")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("status · active")).toBeInTheDocument();
    expect(screen.getByText("theme · knowledge")).toBeInTheDocument();
  });

  it("removes shell-heavy overview copy from the main workspace", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");

    expect(screen.queryByText("知识总览")).not.toBeInTheDocument();
    expect(screen.queryByText("当前页面")).not.toBeInTheDocument();
    expect(screen.queryByText("仓库状态")).not.toBeInTheDocument();
    expect(screen.queryByText("功能入口")).not.toBeInTheDocument();
  });

  it("shows an empty-state message when the current document view has no results", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "文档" }));

    expect(await screen.findByText("文档索引")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "筛选文档" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "标题" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新建文档" })).toBeInTheDocument();
    expect(
      await screen.findByText("当前视图没有文档结果"),
    ).toBeInTheDocument();
    expect(screen.getByText("试试清空筛选条件，或者从上方新建一篇文档。")).toBeInTheDocument();
  });

  it("navigates from documents to the routed document creation page", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "文档" }));

    fireEvent.click(screen.getByRole("button", { name: "新建文档" }));

    expect(await screen.findByRole("heading", { name: "新建文档" })).toBeInTheDocument();
    expect(screen.getAllByText("Markdown 编辑").length).toBeGreaterThan(0);
    expect(screen.getByText("实时预览")).toBeInTheDocument();
    expect(screen.getByDisplayValue("note")).toBeInTheDocument();
  });

  it("renders the assets page as an index and import desk", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "资源" }));

    expect(await screen.findByText("资源索引台")).toBeInTheDocument();
    expect(screen.getByText("导入面板")).toBeInTheDocument();
    expect(screen.getByText("知识迁移")).toBeInTheDocument();
  });

  it("chooses a knowledge source and renders migration preview drafts", async () => {
    mockedApi.chooseKnowledgeSourceFile.mockResolvedValue("/tmp/knowledge-bundle.zip");
    mockedApi.analyzeKnowledgeMigration.mockResolvedValue({
      sourceLabel: "knowledge-bundle.zip",
      drafts: [
        {
          title: "Architecture Notes",
          type: "note",
          summary: "Imported architecture note",
          body: "## Summary\n\nMigrated from zip.",
          theme: ["knowledge"],
          tags: ["migration"],
          source: ["knowledge-bundle.zip"],
          status: "inbox",
          path: "notes/architecture-notes.md",
          originLabel: "notes/architecture.md",
        },
      ],
      warnings: [],
    });

    render(<App />);

    await screen.findByText("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "资源" }));

    fireEvent.click(screen.getByRole("button", { name: "选择知识源" }));

    await waitFor(() => {
      expect(mockedApi.chooseKnowledgeSourceFile).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByDisplayValue("/tmp/knowledge-bundle.zip")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "生成迁移预览" }));

    await waitFor(() => {
      expect(mockedApi.analyzeKnowledgeMigration).toHaveBeenCalledWith({
        filePath: "/tmp/knowledge-bundle.zip",
        model: "llama3.2",
      });
    });

    expect(await screen.findByText("Architecture Notes")).toBeInTheDocument();
    expect(screen.getByText("notes/architecture-notes.md")).toBeInTheDocument();
    expect(screen.getByText("Imported architecture note")).toBeInTheDocument();
  });

  it("imports migration drafts and records imported knowledge activity", async () => {
    mockedApi.chooseKnowledgeSourceFile.mockResolvedValue("/tmp/import.md");
    mockedApi.analyzeKnowledgeMigration.mockResolvedValue({
      sourceLabel: "import.md",
      drafts: [
        {
          title: "Imported Review",
          type: "review",
          summary: "Weekly migration review",
          body: "## What Happened\n\nImported content.",
          theme: ["ops"],
          tags: ["weekly"],
          source: ["import.md"],
          status: "inbox",
          path: "reviews/imported-review.md",
          originLabel: "import.md",
        },
      ],
      warnings: ["zip skipped binary attachments"],
    });
    mockedApi.importKnowledgeMigration.mockResolvedValue({
      imported: 1,
      createdPaths: ["reviews/imported-review.md"],
      warnings: ["zip skipped binary attachments"],
    });
    mockedApi.listDocuments.mockResolvedValue([
      {
        path: "reviews/imported-review.md",
        title: "Imported Review",
        type: "review",
        status: "inbox",
      },
    ]);

    render(<App />);

    await screen.findByText("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "资源" }));
    fireEvent.click(screen.getByRole("button", { name: "选择知识源" }));
    await screen.findByDisplayValue("/tmp/import.md");
    fireEvent.click(screen.getByRole("button", { name: "生成迁移预览" }));
    await screen.findByText("Imported Review");

    fireEvent.click(screen.getByRole("button", { name: "导入知识" }));

    await waitFor(() => {
      expect(mockedApi.importKnowledgeMigration).toHaveBeenCalledWith({
        filePath: "/tmp/import.md",
        model: "llama3.2",
        drafts: [
          expect.objectContaining({
            title: "Imported Review",
            path: "reviews/imported-review.md",
            type: "review",
          }),
        ],
      });
    });

    expect(await screen.findByText("已导入知识")).toBeInTheDocument();
    expect(screen.getAllByText("reviews/imported-review.md").length).toBeGreaterThan(0);
  });

  it("chooses a local asset file and fills the import form", async () => {
    mockedApi.chooseAssetFile.mockResolvedValue("/tmp/hero-banner.png");

    render(<App />);

    await screen.findByText("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "资源" }));

    fireEvent.click(screen.getByRole("button", { name: "选择文件" }));

    await waitFor(() => {
      expect(mockedApi.chooseAssetFile).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByDisplayValue("/tmp/hero-banner.png")).toBeInTheDocument();
    expect(screen.getByDisplayValue("hero-banner.png")).toBeInTheDocument();
  });

  it("shows selected asset metadata in the details panel", async () => {
    mockedApi.listAssets.mockResolvedValue([
      {
        path: "assets/logo.png",
        scope: "repo",
        size_bytes: 2048,
        sha256: "b".repeat(64),
      },
      {
        path: "projects/atlas/assets/hero.png",
        scope: "project",
        project: "atlas",
        size_bytes: 4096,
        sha256: "c".repeat(64),
      },
    ]);

    render(<App />);

    await screen.findByText("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "资源" }));
    fireEvent.click(screen.getByRole("button", { name: "projects/atlas/assets/hero.png" }));

    expect(await screen.findByText("资源详情")).toBeInTheDocument();
    expect(screen.getAllByText("projects/atlas/assets/hero.png").length).toBeGreaterThan(0);
    expect(screen.getByText("project")).toBeInTheDocument();
    expect(screen.getByText("atlas")).toBeInTheDocument();
    expect(screen.getByText("4096 bytes")).toBeInTheDocument();
    expect(screen.getAllByText("c".repeat(64)).length).toBeGreaterThan(0);
  });

  it("clears the current search and filters from the documents index toolbar", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "文档" }));
    fireEvent.click(screen.getByRole("button", { name: "筛选文档" }));
    await screen.findByText("筛选条件");

    fireEvent.change(screen.getByLabelText("搜索"), {
      target: { value: "search phrase" },
    });
    fireEvent.change(screen.getByLabelText("状态"), {
      target: { value: "active" },
    });

    await screen.findByText("当前视图 · 搜索 “search phrase”");

    fireEvent.click(screen.getByRole("button", { name: "重置筛选" }));

    await waitFor(() => {
      expect(screen.getByLabelText("搜索")).toHaveValue("");
      expect(screen.getByLabelText("状态")).toHaveValue("");
    });
    expect(screen.getByText("当前视图 · 全部文档")).toBeInTheDocument();
  });

  it("renders document signal cards from the top stats groups", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "文档" }));

    expect(screen.getByRole("button", { name: "筛选文档" })).toBeInTheDocument();
    expect(screen.queryByText("从统计摘要一键聚焦常用分类。")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "聚焦状态 active" })).not.toBeInTheDocument();
  });

  it("opens filter controls from the filter trigger and applies a status filter", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "文档" }));

    fireEvent.click(screen.getByRole("button", { name: "筛选文档" }));
    expect(await screen.findByText("筛选条件")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("状态"), {
      target: { value: "active" },
    });

    await waitFor(() => {
      expect(screen.getByLabelText("状态")).toHaveValue("active");
    });
    expect(screen.getByText("当前视图 · status: active")).toBeInTheDocument();
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

    expect(await screen.findByText("ok")).toBeInTheDocument();
  });

  it("creates a note from the routed document creation page", async () => {
    mockedApi.createDocument.mockResolvedValue({ path: "notes/ship-note.md" });

    render(<App />);

    await screen.findByText("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "文档" }));
    fireEvent.click(screen.getByRole("button", { name: "新建文档" }));
    fireEvent.change(screen.getByLabelText("标题"), {
      target: { value: "Ship Note" },
    });
    fireEvent.change(screen.getByLabelText("Markdown 正文"), {
      target: { value: "Captured from desktop." },
    });

    fireEvent.click(screen.getByRole("button", { name: "创建文档" }));

    await waitFor(() => {
      expect(mockedApi.createDocument).toHaveBeenCalledWith("note", {
        title: "Ship Note",
        date: new Date().toISOString().slice(0, 10),
        gitWorktree: "",
        body: "Captured from desktop.",
      });
    });

    expect(await screen.findByRole("heading", { name: "编辑文档" })).toBeInTheDocument();
    expect((await screen.findAllByText("notes/ship-note.md")).length).toBeGreaterThan(0);
  });

  it("renders a two-column editor and preview layout on the routed creation page", async () => {
    render(<App />);

    await screen.findByText("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "文档" }));
    fireEvent.click(screen.getByRole("button", { name: "新建文档" }));

    expect(await screen.findByRole("heading", { name: "新建文档" })).toBeInTheDocument();
    expect(screen.getAllByText("Markdown 编辑").length).toBeGreaterThan(0);
    expect(screen.getByText("实时预览")).toBeInTheDocument();
    expect(screen.getByLabelText("Markdown 正文")).toBeInTheDocument();
    expect(screen.getByText("创建时间")).toBeInTheDocument();
    expect(screen.queryByLabelText("日期")).not.toBeInTheDocument();
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

  it("copies exported content to the clipboard", async () => {
    mockedApi.runExport.mockResolvedValue({
      kind: "manifest",
      content: '{\n  "total": 2\n}',
    });

    render(<App />);

    await screen.findByText("/tmp/default-repo");

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

    await screen.findByText("/tmp/default-repo");

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

    await screen.findByText("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "文档" }));
    await screen.findByText("Idea");

    fireEvent.click(screen.getByRole("button", { name: "Idea" }));
    await screen.findByRole("heading", { name: "编辑文档" });
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

    await screen.findByText("/tmp/default-repo");
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

    await screen.findByText("/tmp/default-repo");
    fireEvent.click(screen.getByRole("button", { name: "文档" }));
    fireEvent.click(screen.getByRole("button", { name: "筛选文档" }));
    await screen.findByText("筛选条件");

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
    mockedApi.chooseAssetFile.mockResolvedValue("/tmp/hero.png");
    mockedApi.listAssets
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          path: "projects/atlas/assets/hero.png",
          scope: "project",
          project: "atlas",
          size_bytes: 128,
          sha256: "a".repeat(64),
        },
      ]);
    mockedApi.importAsset.mockResolvedValue({
      path: "projects/atlas/assets/hero.png",
      scope: "project",
      project: "atlas",
      size_bytes: 128,
      sha256: "a".repeat(64),
    });

    render(<App />);

    await screen.findByText("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "资源" }));
    fireEvent.click(screen.getByRole("button", { name: "选择文件" }));
    await waitFor(() => {
      expect(screen.getByDisplayValue("/tmp/hero.png")).toBeInTheDocument();
      expect(screen.getByDisplayValue("hero.png")).toBeInTheDocument();
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

    expect(mockedApi.importAsset).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("资源详情")).toBeInTheDocument();
    expect(screen.getAllByText("projects/atlas/assets/hero.png").length).toBeGreaterThan(0);
  });

  it("renders validation errors after running validate", async () => {
    mockedApi.runValidate.mockResolvedValue({
      ok: false,
      errors: ["notes/idea.md: missing asset path: ../assets/missing.png"],
      raw: "notes/idea.md: missing asset path: ../assets/missing.png",
    });

    render(<App />);

    await screen.findByText("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "校验与导出" }));
    fireEvent.click(screen.getByRole("button", { name: "运行校验" }));

    expect(
      await screen.findByText("notes/idea.md: missing asset path: ../assets/missing.png"),
    ).toBeInTheDocument();
  });

  it("shows an error banner when validate fails to run", async () => {
    mockedApi.runValidate.mockRejectedValue(new Error("validate crashed"));

    render(<App />);

    await screen.findByText("/tmp/default-repo");

    fireEvent.click(screen.getByRole("button", { name: "校验与导出" }));
    fireEvent.click(screen.getByRole("button", { name: "运行校验" }));

    expect(await screen.findByText("validate crashed")).toBeInTheDocument();
  });
});
