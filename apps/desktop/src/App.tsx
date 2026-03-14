import { useEffect, useMemo, useState } from "react";
import {
  createDocument,
  getDocument,
  getRecentRepos,
  getStats,
  importAsset,
  openRepoDirectory,
  listAssets,
  listDocuments,
  listProjects,
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
import type { AssetRecord, DocumentDetail, DocumentFilters, DocumentListItem, NavSection } from "./lib/types";
import { Sidebar } from "./components/Sidebar";
import { ActivityFeed } from "./components/ActivityFeed";
import { DesktopMasthead, OverviewStrip } from "./components/DesktopMasthead";
import { RepoSwitcher } from "./components/RepoSwitcher";
import { SectionHero } from "./components/SectionHero";
import { AssetsPage } from "./pages/AssetsPage";
import { CreatePage } from "./pages/CreatePage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { HomePage } from "./pages/HomePage";
import { OpsPage } from "./pages/OpsPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import type { ActivityItem, CreateRecipe, HomeEntryCard, OverviewCard, SectionHeroData } from "./lib/desktop-ui";
import { sectionDeskCopy } from "./lib/desktop-ui";

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

const createRecipes = [
  {
    type: "note",
    title: "note",
    description: "快速记录想法、摘录和临时知识片段。",
    hint: "当前配方强调标题与正文，适合把即时内容直接写进知识库。",
  },
  {
    type: "daily",
    title: "daily",
    description: "围绕某一天收集节奏、进展和捕获记录。",
    hint: "当前配方强调日期，用于把一天的工作线索落到 daily 文档里。",
  },
  {
    type: "decision",
    title: "decision",
    description: "记录一个明确的判断、选型或取舍。",
    hint: "当前配方强调标题与摘要，适合保留可复盘的决策上下文。",
  },
  {
    type: "review",
    title: "review",
    description: "沉淀阶段性复盘、周报或迭代总结。",
    hint: "当前配方需要标题与日期，适合形成时间明确的复盘条目。",
  },
  {
    type: "project",
    title: "project",
    description: "把知识库项目条目联接到实际代码或工作目录。",
    hint: "当前配方需要标题与 Git Worktree，用于把知识库项目条目接到真实代码目录。",
  },
] as const satisfies readonly CreateRecipe[];

const homeEntryCards: HomeEntryCard[] = [
  {
    section: "documents",
    eyebrow: "DOCS",
    title: "文档总览",
    description: "进入检索、筛选、阅读和编辑工作台。",
    actionLabel: "进入文档页",
  },
  {
    section: "create",
    eyebrow: "CREATE",
    title: "快速创建",
    description: "按配方生成 note、daily、decision、review、project。",
    actionLabel: "进入创建页",
  },
  {
    section: "assets",
    eyebrow: "ASSET",
    title: "资源台账",
    description: "按作用域查看资产，并继续导入文件。",
    actionLabel: "进入资源页",
  },
  {
    section: "ops",
    eyebrow: "OPS",
    title: "校验与导出",
    description: "集中校验仓库并生成导出快照。",
    actionLabel: "进入校验页",
  },
  {
    section: "projects",
    eyebrow: "PROJECT",
    title: "项目桥",
    description: "把知识项目和真实代码仓库重新对齐。",
    actionLabel: "进入项目页",
  },
];

export function App() {
  const [section, setSection] = useState<NavSection>("home");
  const [globalSearch, setGlobalSearch] = useState("");
  const [repoPathInput, setRepoPathInput] = useState("");
  const [repo, setRepo] = useState<RepoSummary | null>(null);
  const [recentRepos, setRecentRepos] = useState<RepoSummary[]>([]);
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [stats, setStats] = useState<StatsSnapshot | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [snapshot, setSnapshot] = useState<ExportSnapshot | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [projectResult, setProjectResult] = useState<CommandResult | null>(null);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    type: "note",
    title: "",
    date: "",
    gitWorktree: "",
    body: "",
  });
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

  const recordActivity = (title: string, detail: string, note?: string) => {
    setActivityItems((current) => [{ title, detail, note }, ...current].slice(0, 5));
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
      { label: "总文档", value: String(stats?.total ?? 0), accent: "signal" as const },
      { label: "资源数", value: String(assets.length), accent: "ink" as const },
      { label: "仓库历史", value: String(recentRepos.length), accent: "muted" as const },
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
          accent: "soft" as const,
        });
      }
    }
    return cards;
  }, [assets.length, recentRepos.length, stats]);

  const documentSignals = useMemo(() => {
    if (!stats) {
      return [];
    }
    const candidates = [
      { group: "type", title: "类型", actionLabel: "按类型浏览", filterKey: "type" as const },
      { group: "status", title: "状态", actionLabel: "聚焦状态", filterKey: "status" as const },
      { group: "theme", title: "主题", actionLabel: "查看主题", filterKey: "theme" as const },
    ];
    return candidates
      .map((candidate) => {
        const item = stats.groups[candidate.group]?.[0];
        if (!item) {
          return null;
        }
        return { ...candidate, key: item.key, count: item.count };
      })
      .filter((value): value is NonNullable<typeof value> => value !== null);
  }, [stats]);

  const activeCreateRecipe =
    createRecipes.find((recipe) => recipe.type === createForm.type) ?? createRecipes[0];
  const deskSection = sectionDeskCopy[section];

  const desktopMetrics = useMemo(
    () => [
      { label: "文档总数", value: String(stats?.total ?? 0) },
      { label: "资源总数", value: String(assets.length) },
      { label: "项目数", value: String(projects.length) },
      { label: "最近操作", value: String(activityItems.length) },
    ],
    [activityItems.length, assets.length, projects.length, stats?.total],
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
    if (!selectedPath) {
      setDetail(null);
      return;
    }
    void getDocument(selectedPath)
      .then(setDetail)
      .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)));
  }, [selectedPath]);

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

  const handleCreate = async () => {
    try {
      const created = await createDocument(createForm.type, createForm);
      setSelectedPath(created.path);
      await refreshOverview(repo?.path);
      setSection("documents");
      recordActivity("已创建文档", created.path, createForm.type);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleImportAsset = async () => {
    try {
      const imported = await importAsset(assetForm);
      await refreshOverview(repo?.path);
      setSection("assets");
      recordActivity("已导入资源", imported.path, imported.scope === "project" ? imported.project : "repo");
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

  const resetDocumentView = () => {
    setQuery("");
    setFilters({});
  };

  const applyDocumentSignal = (filterKey: keyof DocumentFilters, value: string) => {
    setQuery("");
    setFilters((current) => ({ ...current, [filterKey]: value }));
  };

  const openSection = (nextSection: Exclude<NavSection, "home">) => {
    setSection(nextSection);
  };

  const submitHomeSearch = () => {
    setFilters({});
    setQuery(globalSearch.trim());
    setSection("documents");
  };

  const updateCreateForm = (field: "type" | "title" | "date" | "gitWorktree" | "body", value: string) => {
    setCreateForm((current) => ({ ...current, [field]: value }));
  };

  const updateAssetForm = (field: "filePath" | "targetName" | "project", value: string) => {
    setAssetForm((current) => ({ ...current, [field]: value }));
  };

  const updateRemoteForm = (field: "name" | "url" | "remote" | "branch", value: string) => {
    setRemoteForm((current) => ({ ...current, [field]: value }));
  };

  const sectionHero = (() => {
    switch (section) {
      case "documents":
        return {
          eyebrow: "DOCUMENTS",
          title: "文档工作区",
          description: "围绕当前仓库文档继续筛选、聚焦和编辑。",
          actions: [
            {
              label: "新建 Note",
              kind: "primary" as const,
              onClick: () => {
                setCreateForm((current) => ({ ...current, type: "note" }));
                setSection("create");
              },
            },
            {
              label: "重置视图",
              kind: "ghost" as const,
              onClick: resetDocumentView,
            },
          ],
        };
      case "create":
        return {
          eyebrow: "CREATE",
          title: "创建工作区",
          description: "先选配方，再补关键字段和正文初稿。",
          actions: [],
        };
      case "assets":
        return {
          eyebrow: "ASSETS",
          title: "资源工作区",
          description: "按作用域查看资源库存，并把新文件导入到仓库或项目中。",
          actions: [],
        };
      case "ops":
        return {
          eyebrow: "OPS",
          title: "校验与导出",
          description: "运行校验并生成当前仓库的导出快照。",
          actions: [],
        };
      case "projects":
        return {
          eyebrow: "PROJECTS",
          title: "项目工作区",
          description: "把知识项目和代码仓库命令重新接上。",
          actions: [],
        };
      case "home":
        return null;
    }
  })();

  const pageContent = (() => {
    switch (section) {
      case "home":
        return (
          <HomePage
            globalSearch={globalSearch}
            overviewCards={overviewCards}
            entryCards={homeEntryCards}
            activityItems={activityItems}
            onGlobalSearchChange={setGlobalSearch}
            onGlobalSearchSubmit={submitHomeSearch}
            onOpenSection={openSection}
          />
        );
      case "documents":
        return (
          <DocumentsPage
            documents={documents}
            detail={detail}
            filters={filters}
            query={query}
            selectedPath={selectedPath}
            viewLabel={viewLabel}
            documentSignals={documentSignals}
            onQueryChange={setQuery}
            onFiltersChange={setFilters}
            onSelectDocument={setSelectedPath}
            onApplySignal={applyDocumentSignal}
            onSave={handleSave}
          />
        );
      case "create":
        return (
          <CreatePage
            createRecipes={createRecipes}
            activeRecipe={activeCreateRecipe}
            createForm={createForm}
            onCreateFormChange={updateCreateForm}
            onSelectRecipe={(type) => updateCreateForm("type", type)}
            onCreate={() => void handleCreate()}
          />
        );
      case "assets":
        return (
          <AssetsPage
            assets={assets}
            assetForm={assetForm}
            assetProjectFilter={assetProjectFilter}
            assetScope={assetScope}
            onAssetFormChange={updateAssetForm}
            onAssetProjectFilterChange={setAssetProjectFilter}
            onAssetScopeChange={setAssetScope}
            onImportAsset={() => void handleImportAsset()}
          />
        );
      case "ops":
        return (
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
        );
      case "projects":
        return (
          <ProjectsPage
            activeProject={selectedProject}
            projectResult={projectResult}
            projects={projects}
            remoteForm={remoteForm}
            onProjectAction={(action) => void handleProjectAction(action)}
            onRemoteFormChange={updateRemoteForm}
            onSelectProject={setSelectedProject}
          />
        );
    }
  })();

  return (
    <div className="app-shell">
      <Sidebar section={section} onChange={setSection} />
      <main className="workspace">
        <RepoSwitcher
          repoPathInput={repoPathInput}
          recentRepos={recentRepos}
          onRepoPathInputChange={setRepoPathInput}
          onOpenRepoDirectory={() => void handleOpenRepoDirectory()}
          onRefreshOverview={(repoPath) => void refreshOverview(repoPath)}
        />
        {error ? <div className="error-banner">{error}</div> : null}
        <DesktopMasthead
          section={section}
          sectionTitle={deskSection.title}
          sectionDescription={deskSection.description}
          metrics={desktopMetrics}
        />
        <div className={section === "home" ? "workspace__content workspace__content--home" : "workspace__content"}>
          {section === "home" ? (
            pageContent
          ) : (
            <>
              {sectionHero ? <SectionHero hero={sectionHero} /> : null}
              <OverviewStrip cards={overviewCards} />
              <ActivityFeed items={activityItems} />
              {pageContent}
            </>
          )}
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
