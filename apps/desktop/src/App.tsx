import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  analyzeKnowledgeMigration,
  chooseAssetFile,
  chooseKnowledgeSourceFile,
  chooseRepoDirectory,
  createDocument,
  deleteDocument,
  getDocument,
  getRecentRepos,
  getStats,
  importKnowledgeMigration,
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
import { DocumentsPage } from "./pages/DocumentsPage";
import { HomePage } from "./pages/HomePage";
import { OpsPage } from "./pages/OpsPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import type { ActivityItem, OverviewCard } from "./lib/desktop-ui";
import type {
  AssetRecord,
  DocumentDetail,
  DocumentFilters,
  DocumentListItem,
  KnowledgeMigrationDraft,
  KnowledgeMigrationImportResult,
  KnowledgeMigrationPreview,
  NavSection,
  OpenDocumentTab,
} from "./lib/types";

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

function fileNameFromPath(path: string) {
  const segments = path.split(/[/\\]/);
  return segments[segments.length - 1] ?? "";
}

function tabLabelFromDocument(document: DocumentDetail) {
  return document.title.trim() || fileNameFromPath(document.path) || "未命名文档";
}

function currentTabFromTabs(tabs: OpenDocumentTab[], activeTabId: string | null) {
  return tabs.find((tab) => tab.id === activeTabId) ?? null;
}

function DesktopAppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const section = desktopSectionFromPath(location.pathname);
  const draftCounterRef = useRef(1);

  const [globalSearch, setGlobalSearch] = useState("");
  const [repoPathInput, setRepoPathInput] = useState("");
  const [repo, setRepo] = useState<RepoSummary | null>(null);
  const [recentRepos, setRecentRepos] = useState<RepoSummary[]>([]);
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [openDocumentTabs, setOpenDocumentTabs] = useState<OpenDocumentTab[]>([]);
  const [activeDocumentTabId, setActiveDocumentTabId] = useState<string | null>(null);
  const [documentDrafts, setDocumentDrafts] = useState<Record<string, DocumentDetail>>({});
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [selectedAssetPath, setSelectedAssetPath] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsSnapshot | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [snapshot, setSnapshot] = useState<ExportSnapshot | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [projectResult, setProjectResult] = useState<CommandResult | null>(null);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<NavSection, string>>>({});
  const [assetForm, setAssetForm] = useState({
    filePath: "",
    targetName: "",
    project: "",
  });
  const [migrationForm, setMigrationForm] = useState({
    filePath: "",
    model: "llama3.2",
  });
  const [migrationPreview, setMigrationPreview] = useState<KnowledgeMigrationPreview | null>(null);
  const [migrationImportResult, setMigrationImportResult] = useState<KnowledgeMigrationImportResult | null>(null);
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

  const setSectionError = (targetSection: NavSection, message: string | null) => {
    setSectionErrors((current) => {
      if (!message) {
        if (!(targetSection in current)) {
          return current;
        }
        const next = { ...current };
        delete next[targetSection];
        return next;
      }
      return { ...current, [targetSection]: message };
    });
  };

  const currentSectionError = sectionErrors[section] ?? null;
  const activeDocumentTab = currentTabFromTabs(openDocumentTabs, activeDocumentTabId);
  const activeDocument = activeDocumentTab ? documentDrafts[activeDocumentTab.id] ?? null : null;

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
  };

  const openDocumentTab = async (path: string) => {
    const existing = openDocumentTabs.find((tab) => tab.path === path);
    if (existing) {
      setActiveDocumentTabId(existing.id);
      navigate("/documents");
      setSectionError("documents", null);
      return;
    }

    try {
      const detail = await getDocument(path);
      const tab: OpenDocumentTab = {
        id: path,
        path,
        title: tabLabelFromDocument(detail),
        dirty: false,
        mode: "preview",
      };
      setDocumentDrafts((current) => ({ ...current, [tab.id]: detail }));
      setOpenDocumentTabs((current) => [...current, tab]);
      setActiveDocumentTabId(tab.id);
      setSectionError("documents", null);
      navigate("/documents");
    } catch (cause) {
      setSectionError("documents", cause instanceof Error ? cause.message : String(cause));
    }
  };

  const openCreateTab = () => {
    const tabId = `draft:${draftCounterRef.current++}`;
    const draft = buildCreateDraft();
    setDocumentDrafts((current) => ({ ...current, [tabId]: draft }));
    setOpenDocumentTabs((current) => [
      ...current,
      {
        id: tabId,
        path: "",
        title: "未命名文档",
        dirty: false,
        mode: "preview",
        isNew: true,
      },
    ]);
    setActiveDocumentTabId(tabId);
    setSectionError("documents", null);
    navigate("/documents");
  };

  const closeDocumentTab = (tabId: string) => {
    setOpenDocumentTabs((current) => {
      const index = current.findIndex((tab) => tab.id === tabId);
      if (index < 0) {
        return current;
      }
      const nextTabs = current.filter((tab) => tab.id !== tabId);
      if (activeDocumentTabId === tabId) {
        const fallback = nextTabs[index] ?? nextTabs[index - 1] ?? null;
        setActiveDocumentTabId(fallback?.id ?? null);
      }
      return nextTabs;
    });
    setDocumentDrafts((current) => {
      const next = { ...current };
      delete next[tabId];
      return next;
    });
  };

  useEffect(() => {
    void (async () => {
      try {
        await refreshOverview();
        setSectionError("home", null);
      } catch (cause) {
        setSectionError("home", cause instanceof Error ? cause.message : String(cause));
      }
    })();
  }, []);

  useEffect(() => {
    const task = async () => {
      try {
        const next = query.trim() ? await searchDocuments(query.trim(), filters) : await listDocuments(filters);
        setDocuments(next);
        setSectionError("documents", null);
      } catch (cause) {
        setSectionError("documents", cause instanceof Error ? cause.message : String(cause));
      }
    };
    void task();
  }, [filters, query]);

  useEffect(() => {
    const handleWindowFocus = () => {
      void refreshOverview(repo?.path).catch(() => undefined);
    };

    window.addEventListener("focus", handleWindowFocus);
    return () => {
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [repo?.path, filters]);

  const handleOpenRepoDirectory = async () => {
    try {
      const targetRepo = repoPathInput.trim() || repo?.path;
      await openRepoDirectory(targetRepo);
      if (targetRepo) {
        recordActivity("已打开仓库目录", targetRepo, "通过系统文件管理器");
      }
      setSectionError("home", null);
    } catch (cause) {
      setSectionError("home", cause instanceof Error ? cause.message : String(cause));
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
      setSectionError("home", null);
    } catch (cause) {
      setSectionError("home", cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleDraftChange = (value: DocumentDetail) => {
    if (!activeDocumentTab) {
      return;
    }
    setDocumentDrafts((current) => ({ ...current, [activeDocumentTab.id]: value }));
    setOpenDocumentTabs((current) =>
      current.map((tab) =>
        tab.id === activeDocumentTab.id
          ? {
              ...tab,
              title: tabLabelFromDocument(value),
              dirty: true,
            }
          : tab,
      ),
    );
  };

  const handleChangeTabMode = (tabId: string, mode: "preview" | "edit") => {
    setOpenDocumentTabs((current) =>
      current.map((tab) => (tab.id === tabId ? { ...tab, mode } : tab)),
    );
  };

  const handleSaveDocument = async (value: DocumentDetail) => {
    if (!activeDocumentTab) {
      return;
    }
    try {
      if (activeDocumentTab.isNew) {
        const created = await createDocument(value.type, {
          title: value.title,
          date: value.date,
          gitWorktree: value.gitWorktree,
          body: value.body,
        });
        const next = await getDocument(created.path);
        setDocumentDrafts((current) => ({ ...current, [activeDocumentTab.id]: next }));
        setOpenDocumentTabs((current) =>
          current.map((tab) =>
            tab.id === activeDocumentTab.id
              ? {
                  ...tab,
                  path: created.path,
                  title: tabLabelFromDocument(next),
                  dirty: false,
                  isNew: false,
                  mode: "preview",
                }
              : tab,
          ),
        );
        await refreshOverview(repo?.path);
        recordActivity("已创建文档", created.path, value.type);
      } else {
        const result = await saveDocument(value.path, value);
        const next = await getDocument(value.path);
        setDocumentDrafts((current) => ({ ...current, [activeDocumentTab.id]: next }));
        setOpenDocumentTabs((current) =>
          current.map((tab) =>
            tab.id === activeDocumentTab.id
              ? {
                  ...tab,
                  title: tabLabelFromDocument(next),
                  dirty: false,
                  mode: "preview",
                }
              : tab,
          ),
        );
        await refreshOverview(repo?.path);
        recordActivity("已保存文档", result.path, result.updatedAt);
      }
      setSectionError("documents", null);
    } catch (cause) {
      setSectionError("documents", cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleDeleteActiveDocument = async () => {
    if (!activeDocumentTab) {
      return;
    }
    if (!activeDocumentTab.path) {
      closeDocumentTab(activeDocumentTab.id);
      return;
    }
    try {
      await deleteDocument(activeDocumentTab.path);
      closeDocumentTab(activeDocumentTab.id);
      await refreshOverview(repo?.path);
      recordActivity("已删除文档", activeDocumentTab.path);
      setSectionError("documents", null);
    } catch (cause) {
      setSectionError("documents", cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleImportAsset = async () => {
    try {
      const imported = await importAsset(assetForm);
      setSelectedAssetPath(imported.path);
      await refreshOverview(repo?.path);
      navigate("/assets");
      recordActivity("已导入资源", imported.path, imported.scope === "project" ? imported.project : "repo");
      setSectionError("assets", null);
    } catch (cause) {
      setSectionError("assets", cause instanceof Error ? cause.message : String(cause));
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
      setSectionError("assets", null);
    } catch (cause) {
      setSectionError("assets", cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleChooseKnowledgeSource = async () => {
    try {
      const selected = await chooseKnowledgeSourceFile();
      if (!selected) {
        return;
      }
      setMigrationForm((current) => ({ ...current, filePath: selected }));
      setMigrationPreview(null);
      setMigrationImportResult(null);
      setSectionError("assets", null);
    } catch (cause) {
      setSectionError("assets", cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleAnalyzeKnowledgeMigration = async () => {
    try {
      const preview = await analyzeKnowledgeMigration(migrationForm);
      setMigrationPreview(preview);
      setMigrationImportResult(null);
      recordActivity("已生成迁移预览", preview.sourceLabel, `${preview.drafts.length} 条候选知识`);
      setSectionError("assets", null);
    } catch (cause) {
      setSectionError("assets", cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleImportKnowledgeMigration = async () => {
    try {
      const result = await importKnowledgeMigration({
        ...migrationForm,
        drafts: migrationPreview?.drafts ?? [],
      });
      setMigrationImportResult(result);
      await refreshOverview(repo?.path);
      recordActivity(
        "已导入知识",
        result.createdPaths[0] ?? migrationForm.filePath,
        `新增 ${result.imported} 篇文档`,
      );
      setSectionError("assets", null);
    } catch (cause) {
      setSectionError("assets", cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleExport = async (kind: string) => {
    try {
      const next = await runExport(kind);
      setSnapshot(next);
      recordActivity("已导出", kind, `${next.content.length} chars`);
      setSectionError("ops", null);
    } catch (cause) {
      setSectionError("ops", cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleValidate = async () => {
    try {
      const next = await runValidate();
      setValidation(next);
      recordActivity("校验完成", next.ok ? "OK" : `发现 ${next.errors.length} 个问题`);
      setSectionError("ops", null);
    } catch (cause) {
      setSectionError("ops", cause instanceof Error ? cause.message : String(cause));
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
      setSectionError("projects", null);
    } catch (cause) {
      setSectionError("projects", cause instanceof Error ? cause.message : String(cause));
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

  const updateMigrationForm = (field: "filePath" | "model", value: string) => {
    setMigrationForm((current) => ({ ...current, [field]: value }));
  };

  const updateMigrationDraft = (
    index: number,
    field: "title" | "type" | "summary",
    value: string,
  ) => {
    setMigrationPreview((current) => {
      if (!current) {
        return current;
      }
      const drafts = current.drafts.map((draft, draftIndex) =>
        draftIndex === index ? ({ ...draft, [field]: value } as KnowledgeMigrationDraft) : draft,
      );
      return { ...current, drafts };
    });
  };

  const removeMigrationDraft = (index: number) => {
    setMigrationPreview((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        drafts: current.drafts.filter((_, draftIndex) => draftIndex !== index),
      };
    });
  };

  const openImportedMigrationDocument = (path: string) => {
    void openDocumentTab(path);
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
        {section !== "documents" && currentSectionError ? <div className="error-banner">{currentSectionError}</div> : null}
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
                  activeDocument={activeDocument}
                  activeTabId={activeDocumentTabId}
                  documents={documents}
                  error={sectionErrors.documents ?? null}
                  filters={filters}
                  openTabs={openDocumentTabs}
                  query={query}
                  viewLabel={viewLabel}
                  onActivateTab={setActiveDocumentTabId}
                  onChangeDocument={handleDraftChange}
                  onChangeTabMode={handleChangeTabMode}
                  onCloseTab={closeDocumentTab}
                  onDeleteDocument={() => void handleDeleteActiveDocument()}
                  onFiltersChange={setFilters}
                  onOpenCreate={openCreateTab}
                  onOpenDocument={(path) => void openDocumentTab(path)}
                  onQueryChange={setQuery}
                  onResetView={() => {
                    setQuery("");
                    setFilters({});
                  }}
                  onSaveDocument={(value) => void handleSaveDocument(value)}
                />
              }
            />
            <Route path="/documents/new" element={<Navigate replace to="/documents" />} />
            <Route path="/documents/edit" element={<Navigate replace to="/documents" />} />
            <Route
              path="/assets"
              element={
                <AssetsPage
                  assets={assets}
                  selectedAsset={selectedAsset}
                  assetForm={assetForm}
                  assetProjectFilter={assetProjectFilter}
                  assetScope={assetScope}
                  migrationForm={migrationForm}
                  migrationImportResult={migrationImportResult}
                  migrationPreview={migrationPreview}
                  onAssetFormChange={updateAssetForm}
                  onChooseAssetFile={() => void handleChooseAssetFile()}
                  onChooseKnowledgeSource={() => void handleChooseKnowledgeSource()}
                  onAnalyzeKnowledgeMigration={() => void handleAnalyzeKnowledgeMigration()}
                  onImportKnowledgeMigration={() => void handleImportKnowledgeMigration()}
                  onAssetProjectFilterChange={setAssetProjectFilter}
                  onAssetScopeChange={setAssetScope}
                  onOpenImportedDocument={openImportedMigrationDocument}
                  onMigrationDraftChange={updateMigrationDraft}
                  onMigrationFormChange={updateMigrationForm}
                  onRemoveMigrationDraft={removeMigrationDraft}
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
