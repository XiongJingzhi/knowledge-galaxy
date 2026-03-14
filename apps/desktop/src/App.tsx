import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  chooseAssetFile,
  chooseRepoDirectory,
  createDocument,
  getDocument,
  getRecentRepos,
  getStats,
  importAsset,
  listAssets,
  listDocuments,
  listProjects,
  openRepoDirectory,
  runExport,
  runProjectCommand,
  runValidate,
  saveDocument,
  saveExportToFile,
  searchDocuments,
  selectRepo,
  type CommandResult,
  type ExportSnapshot,
  type ProjectListItem,
  type RepoSummary,
  type StatsSnapshot,
  type ValidationResult,
} from "./lib/api";
import { Sidebar } from "./components/Sidebar";
import { AssetsPage } from "./pages/AssetsPage";
import { DocumentCreatePage } from "./pages/DocumentCreatePage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { HomePage } from "./pages/HomePage";
import { OpsPage } from "./pages/OpsPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import type { ActivityItem, OverviewCard } from "./lib/desktop-ui";
import type { AssetRecord, DocumentDetail, DocumentFilters, DocumentListItem, NavSection } from "./lib/types";

const defaultDetail: DocumentDetail = {
  path: "",
  id: "",
  type: "note",
  slug: "",
  createdAt: "",
  updatedAt: "",
  title: "",
  status: "inbox",
  date: "",
  theme: [],
  project: [],
  tags: [],
  source: [],
  summary: "",
  body: "",
  gitWorktree: "",
};

function createDocumentDraft(seed: Partial<DocumentDetail> = {}): DocumentDetail {
  return { ...defaultDetail, ...seed };
}

function currentIsoTimestamp() {
  return new Date().toISOString();
}

function currentDateStamp() {
  return currentIsoTimestamp().slice(0, 10);
}

function buildCreateDraft() {
  const now = currentIsoTimestamp();
  return createDocumentDraft({
    createdAt: now,
    updatedAt: now,
    date: currentDateStamp(),
  });
}

function desktopSectionFromPath(pathname: string): NavSection {
  if (pathname.startsWith("/documents")) {
    return "documents";
  }
  if (pathname.startsWith("/assets")) {
    return "assets";
  }
  if (pathname.startsWith("/ops")) {
    return "ops";
  }
  if (pathname.startsWith("/projects")) {
    return "projects";
  }
  return "home";
}

function fileNameFromPath(path: string): string {
  const segments = path.split(/[/\\]/);
  return segments[segments.length - 1] ?? "";
}

function DesktopAppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const section = desktopSectionFromPath(location.pathname);

  const [globalSearch, setGlobalSearch] = useState("");
  const [repoPathInput, setRepoPathInput] = useState("");
  const [repo, setRepo] = useState<RepoSummary | null>(null);
  const [recentRepos, setRecentRepos] = useState<RepoSummary[]>([]);
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [createDraft, setCreateDraft] = useState<DocumentDetail>(() => buildCreateDraft());
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [selectedAssetPath, setSelectedAssetPath] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsSnapshot | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [snapshot, setSnapshot] = useState<ExportSnapshot | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [projectResult, setProjectResult] = useState<CommandResult | null>(null);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [assetForm, setAssetForm] = useState({
    filePath: "",
    targetName: "",
    project: "",
  });
  const [assetScope, setAssetScope] = useState<"all" | "repo" | "project">("all");
  const [assetProjectFilter, setAssetProjectFilter] = useState("");
  const [remoteForm, setRemoteForm] = useState({
    name: "origin",
    url: "",
    remote: "origin",
    branch: "",
  });

  const recordActivity = (title: string, detailText: string, note?: string) => {
    setActivityItems((current) => [{ title, detail: detailText, note }, ...current].slice(0, 5));
  };

  const activeFilterEntries = useMemo(
    () =>
      Object.entries(filters).filter((entry): entry is [string, string] => {
        const value = entry[1];
        return typeof value === "string" && value.trim().length > 0;
      }),
    [filters],
  );

  const viewLabel = useMemo(() => {
    if (query.trim()) {
      return `当前视图 · 搜索 “${query.trim()}”`;
    }
    if (activeFilterEntries.length) {
      return `当前视图 · ${activeFilterEntries.map(([key, value]) => `${key}: ${value}`).join(" · ")}`;
    }
    return "当前视图 · 全部文档";
  }, [activeFilterEntries, query]);

  const overviewCards = useMemo(() => {
    const cards: OverviewCard[] = [
      { label: "总文档", value: String(stats?.total ?? 0), accent: "signal" },
      { label: "资源数", value: String(assets.length), accent: "ink" },
      { label: "仓库历史", value: String(recentRepos.length), accent: "muted" },
    ];
    if (!stats) {
      return cards;
    }
    const firstGroup = (groupName: string) => stats.groups[groupName]?.[0];
    const highlights = [
      ["type", firstGroup("type")],
      ["status", firstGroup("status")],
      ["theme", firstGroup("theme") ?? firstGroup("source")],
    ] as const;
    for (const [groupName, group] of highlights) {
      if (group) {
        cards.push({
          label: `${groupName} · ${group.key}`,
          value: String(group.count),
          accent: "soft",
        });
      }
    }
    return cards;
  }, [assets.length, recentRepos.length, stats]);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.path === selectedAssetPath) ?? null,
    [assets, selectedAssetPath],
  );

  const refreshOverview = async (repoPath?: string) => {
    try {
      const summary = await selectRepo(repoPath);
      setRepo(summary);
      setRepoPathInput(summary.path);
      const [recent, listed, assetList, statsSnapshot, projectList] = await Promise.all([
        getRecentRepos(),
        listDocuments(filters),
        listAssets(),
        getStats(),
        listProjects(),
      ]);
      setRecentRepos(recent);
      setDocuments(listed);
      setAssets(assetList);
      setSelectedAssetPath((current) => {
        if (!assetList.length) {
          return null;
        }
        if (current && assetList.some((asset) => asset.path === current)) {
          return current;
        }
        return assetList[0]?.path ?? null;
      });
      setStats(statsSnapshot);
      setProjects(projectList);
      setSelectedProject((current) => {
        if (projectList.some((item) => item.slug === current)) {
          return current;
        }
        return projectList[0]?.slug ?? "";
      });
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  useEffect(() => {
    void refreshOverview();
  }, []);

  useEffect(() => {
    const task = async () => {
      try {
        const next = query.trim() ? await searchDocuments(query.trim(), filters) : await listDocuments(filters);
        setDocuments(next);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      }
    };
    void task();
  }, [filters, query]);

  useEffect(() => {
    if (location.pathname !== "/documents/edit") {
      return;
    }
    const documentPath = new URLSearchParams(location.search).get("path");
    if (documentPath) {
      setSelectedPath((current) => (current === documentPath ? current : documentPath));
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!selectedPath) {
      setDetail(null);
      return;
    }
    void getDocument(selectedPath)
      .then(setDetail)
      .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)));
  }, [selectedPath]);

  const handleOpenRepoDirectory = async () => {
    try {
      const targetRepo = repoPathInput.trim() || repo?.path;
      await openRepoDirectory(targetRepo);
      if (targetRepo) {
        recordActivity("已打开仓库目录", targetRepo, "通过系统文件管理器");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleChooseRepoDirectory = async () => {
    try {
      const selected = await chooseRepoDirectory();
      if (!selected) {
        return;
      }
      await refreshOverview(selected);
      recordActivity("已切换仓库", selected, "通过系统目录选择器");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleSave = async (value: DocumentDetail) => {
    try {
      const result = await saveDocument(value.path, value);
      await refreshOverview(repo?.path);
      const next = await getDocument(value.path);
      setDetail(next);
      recordActivity("已保存文档", result.path, result.updatedAt);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleCreate = async (value: DocumentDetail) => {
    try {
      const created = await createDocument(value.type, {
        title: value.title,
        date: value.date,
        gitWorktree: value.gitWorktree,
        body: value.body,
      });
      setSelectedPath(created.path);
      await refreshOverview(repo?.path);
      navigate(`/documents/edit?path=${encodeURIComponent(created.path)}`);
      recordActivity("已创建文档", created.path, value.type);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleImportAsset = async () => {
    try {
      const imported = await importAsset(assetForm);
      setSelectedAssetPath(imported.path);
      await refreshOverview(repo?.path);
      navigate("/assets");
      recordActivity("已导入资源", imported.path, imported.scope === "project" ? imported.project : "repo");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleChooseAssetFile = async () => {
    try {
      const selected = await chooseAssetFile();
      if (!selected) {
        return;
      }
      const defaultName = fileNameFromPath(selected);
      setAssetForm((current) => ({
        ...current,
        filePath: selected,
        targetName: current.targetName.trim() ? current.targetName : defaultName,
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleExport = async (kind: string) => {
    try {
      const next = await runExport(kind);
      setSnapshot(next);
      recordActivity("已导出", kind, `${next.content.length} chars`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleValidate = async () => {
    try {
      const next = await runValidate();
      setValidation(next);
      recordActivity("校验完成", next.ok ? "OK" : `发现 ${next.errors.length} 个问题`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleProjectAction = async (action: string) => {
    if (!selectedProject) {
      return;
    }
    try {
      const result = await runProjectCommand(selectedProject, action, {
        name: remoteForm.name,
        remote: remoteForm.remote,
        branch: remoteForm.branch,
        url: remoteForm.url,
      });
      setProjectResult(result);
      recordActivity("已执行项目命令", `${selectedProject} · ${action}`, result.stdout || result.stderr);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const submitHomeSearch = () => {
    setFilters({});
    setQuery(globalSearch.trim());
    navigate("/documents");
  };

  const updateAssetForm = (field: "filePath" | "targetName" | "project", value: string) => {
    setAssetForm((current) => ({ ...current, [field]: value }));
  };

  const updateRemoteForm = (field: "name" | "url" | "remote" | "branch", value: string) => {
    setRemoteForm((current) => ({ ...current, [field]: value }));
  };

  const goToSection = (value: NavSection) => {
    const pathMap: Record<NavSection, string> = {
      home: "/",
      documents: "/documents",
      assets: "/assets",
      ops: "/ops",
      projects: "/projects",
    };
    navigate(pathMap[value]);
  };

  return (
    <div className="app-shell">
      <Sidebar
        section={section}
        repoPath={repo?.path ?? repoPathInput}
        onChooseRepoDirectory={() => void handleChooseRepoDirectory()}
        onOpenRepoDirectory={() => void handleOpenRepoDirectory()}
        onChange={goToSection}
      />
      <main className="workspace">
        {error ? <div className="error-banner">{error}</div> : null}
        <div className={section === "home" ? "workspace__content workspace__content--home" : "workspace__content"}>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  globalSearch={globalSearch}
                  overviewCards={overviewCards}
                  activityItems={activityItems}
                  onGlobalSearchChange={setGlobalSearch}
                  onGlobalSearchSubmit={submitHomeSearch}
                />
              }
            />
            <Route
              path="/documents"
              element={
                <DocumentsPage
                  documents={documents}
                  filters={filters}
                  query={query}
                  viewLabel={viewLabel}
                  onQueryChange={setQuery}
                  onFiltersChange={setFilters}
                  onOpenCreate={() => {
                    setCreateDraft(buildCreateDraft());
                    navigate("/documents/new");
                  }}
                  onOpenDocument={(path) => navigate(`/documents/edit?path=${encodeURIComponent(path)}`)}
                  onResetView={() => {
                    setQuery("");
                    setFilters({});
                  }}
                />
              }
            />
            <Route
              path="/documents/new"
              element={
                <DocumentCreatePage
                  mode="create"
                  document={createDraft}
                  onBack={() => navigate("/documents")}
                  onSave={handleCreate}
                />
              }
            />
            <Route
              path="/documents/edit"
              element={
                <DocumentCreatePage
                  mode="edit"
                  document={detail}
                  onBack={() => navigate("/documents")}
                  onSave={handleSave}
                />
              }
            />
            <Route
              path="/assets"
              element={
                <AssetsPage
                  assets={assets}
                  selectedAsset={selectedAsset}
                  assetForm={assetForm}
                  assetProjectFilter={assetProjectFilter}
                  assetScope={assetScope}
                  onAssetFormChange={updateAssetForm}
                  onChooseAssetFile={() => void handleChooseAssetFile()}
                  onAssetProjectFilterChange={setAssetProjectFilter}
                  onAssetScopeChange={setAssetScope}
                  onSelectAsset={setSelectedAssetPath}
                  onImportAsset={() => void handleImportAsset()}
                />
              }
            />
            <Route
              path="/ops"
              element={
                <OpsPage
                  snapshot={snapshot}
                  validation={validation}
                  onExport={(kind) => void handleExport(kind)}
                  onSaveExportToFile={() => {
                    if (snapshot) {
                      void saveExportToFile(`${snapshot.kind}.json`, snapshot.content);
                    }
                  }}
                  onValidate={() => void handleValidate()}
                />
              }
            />
            <Route
              path="/projects"
              element={
                <ProjectsPage
                  activeProject={selectedProject}
                  projectResult={projectResult}
                  projects={projects}
                  remoteForm={remoteForm}
                  onProjectAction={(action) => void handleProjectAction(action)}
                  onRemoteFormChange={updateRemoteForm}
                  onSelectProject={setSelectedProject}
                />
              }
            />
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        </div>
        {stats ? (
          <footer className="workspace__footer">
            <span>总文档数 {stats.total}</span>
            <span>最近仓库 {recentRepos.length}</span>
            <span>资源数 {assets.length}</span>
          </footer>
        ) : null}
      </main>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <DesktopAppShell />
    </BrowserRouter>
  );
}
