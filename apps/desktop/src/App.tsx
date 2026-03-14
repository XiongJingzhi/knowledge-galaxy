import { useEffect, useMemo, useState } from "react";
import {
  createDocument,
  getDocument,
  getRecentRepos,
  getStats,
  importAsset,
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
import { AssetTable } from "./components/AssetTable";
import { DocumentEditor } from "./components/DocumentEditor";
import { DocumentFilters as FiltersPanel } from "./components/DocumentFilters";
import { ExportPanel } from "./components/ExportPanel";
import { Sidebar } from "./components/Sidebar";

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

const sectionDeskCopy: Record<
  NavSection,
  {
    title: string;
    description: string;
    index: string;
  }
> = {
  documents: {
    title: "文档工作台",
    description: "围绕当前知识切片组织检索、筛选、阅读与编辑。",
    index: "01",
  },
  create: {
    title: "创建中心",
    description: "把新知识快速落到正确模板和路径，保持结构先于表达。",
    index: "02",
  },
  assets: {
    title: "资源台账",
    description: "统一查看仓库级与项目级资源，控制作用域而不是堆叠文件。",
    index: "03",
  },
  ops: {
    title: "校验与导出",
    description: "在发布前集中检查知识库状态，保留可回看的验证与导出轨迹。",
    index: "04",
  },
  projects: {
    title: "项目桥",
    description: "把知识库中的项目文档与真实代码仓库联接成可操作的桥面。",
    index: "05",
  },
};

export function App() {
  const [section, setSection] = useState<NavSection>("documents");
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
  const [activityItems, setActivityItems] = useState<
    Array<{ title: string; detail: string; note?: string }>
  >([]);
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

  const activeProject = useMemo(() => selectedProject, [selectedProject]);
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
      return `当前视图 · ${activeFilterEntries
        .map(([key, value]) => `${key}: ${value}`)
        .join(" · ")}`;
    }
    return "当前视图 · 全部文档";
  }, [activeFilterEntries, query]);
  const overviewCards = useMemo(() => {
    const cards = [
      { label: "总文档", value: String(stats?.total ?? 0), accent: "signal" },
      { label: "资源数", value: String(assets.length), accent: "ink" },
      { label: "最近仓库", value: String(recentRepos.length), accent: "muted" },
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
  const documentSignals = useMemo(() => {
    if (!stats) {
      return [];
    }
    const candidates = [
      {
        group: "type",
        title: "类型",
        actionLabel: "按类型浏览",
        filterKey: "type" as const,
      },
      {
        group: "status",
        title: "状态",
        actionLabel: "聚焦状态",
        filterKey: "status" as const,
      },
      {
        group: "theme",
        title: "主题",
        actionLabel: "查看主题",
        filterKey: "theme" as const,
      },
    ];
    return candidates
      .map((candidate) => {
        const item = stats.groups[candidate.group]?.[0];
        if (!item) {
          return null;
        }
        return {
          ...candidate,
          key: item.key,
          count: item.count,
        };
      })
      .filter((value): value is NonNullable<typeof value> => value !== null);
  }, [stats]);
  const resetDocumentView = () => {
    setQuery("");
    setFilters({});
  };
  const applyDocumentSignal = (filterKey: keyof DocumentFilters, value: string) => {
    setQuery("");
    setFilters((current) => ({
      ...current,
      [filterKey]: value,
    }));
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
  ] as const;
  const activeCreateRecipe =
    createRecipes.find((recipe) => recipe.type === createForm.type) ?? createRecipes[0];
  const deskSection = sectionDeskCopy[section];
  const desktopMetrics = useMemo(
    () => [
      { label: "知识结构总量", value: String(stats?.total ?? 0) },
      { label: "资产库存", value: String(assets.length) },
      { label: "项目桥接数", value: String(projects.length) },
      { label: "操作回流", value: String(activityItems.length) },
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

  useEffect(() => {
    void refreshOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const task = async () => {
      try {
        const next = query.trim()
          ? await searchDocuments(query.trim(), filters)
          : await listDocuments(filters);
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
    if (!activeProject) {
      return;
    }
    try {
      const result = await runProjectCommand(activeProject, action, {
        name: remoteForm.name,
        remote: remoteForm.remote,
        branch: remoteForm.branch,
        url: remoteForm.url,
      });
      setProjectResult(result);
      recordActivity("已执行项目命令", `${activeProject} · ${action}`, result.stdout || result.stderr);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const sectionHero = useMemo(() => {
    if (section === "documents") {
      return {
        eyebrow: "DOCUMENT WORKBENCH",
        title: "围绕当前知识切片组织你的阅读与编辑",
        description:
          "先用搜索和过滤缩小范围，再从这里进入创建或回到全量视图，保持工作台聚焦而不是散乱地翻找。",
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
    }
    if (section === "create") {
      return {
        eyebrow: "CREATE CENTER",
        title: "把新知识快速落到正确的模板与路径里",
        description:
          "创建中心沿用现有 Python CLI 规则，适合集中补写 daily、note、review 与 project，而不需要切回终端。",
        actions: [
          {
            label: "返回文档",
            kind: "ghost" as const,
            onClick: () => setSection("documents"),
          },
        ],
      };
    }
    if (section === "assets") {
      return {
        eyebrow: "ASSET CENTER",
        title: "把仓库级与项目级资源放到同一张资产台账里",
        description:
          "这里适合核对资源作用域、项目归属与摘要指纹，再决定是否继续导入新的文件。",
        actions: [
          {
            label: "查看全部资源",
            kind: "ghost" as const,
            onClick: () => {
              setAssetScope("all");
              setAssetProjectFilter("");
            },
          },
        ],
      };
    }
    if (section === "ops") {
      return {
        eyebrow: "OPS CENTER",
        title: "把校验、导出和快照整理成一套可回看的操作流",
        description:
          "校验结果和导出快照都会回流到同一工作台，适合在发布前快速检查知识库的当前状态。",
        actions: [
          {
            label: "快速校验",
            kind: "primary" as const,
            onClick: () => void handleValidate(),
          },
        ],
      };
    }
    return {
      eyebrow: "PROJECT BRIDGE",
      title: "把知识库中的项目条目与真实代码仓库联动起来",
      description:
        "项目工作台负责远端联接、同步和推送，保留原始命令输出，适合作为知识与代码之间的桥面。",
      actions: [
        {
          label: "返回文档",
          kind: "ghost" as const,
          onClick: () => setSection("documents"),
        },
      ],
    };
  }, [section, handleValidate]);

  return (
    <div className="app-shell">
      <Sidebar section={section} onChange={setSection} />
      <main className="workspace">
        <header className="workspace__header">
          <div>
            <span className="eyebrow">ACTIVE REPOSITORY</span>
            <h2>{repo?.path ?? "~/.knowledge-galax"}</h2>
            <p>{repo?.exists ? "已连接到当前知识库" : "将使用默认知识库路径"}</p>
          </div>
          <div className="repo-switcher">
            <div className="repo-switcher__main">
              <input
                value={repoPathInput}
                onChange={(event) => setRepoPathInput(event.currentTarget.value)}
                placeholder="输入仓库路径，留空使用默认路径"
              />
              <button type="button" onClick={() => void refreshOverview(repoPathInput || undefined)}>
                切换仓库
              </button>
            </div>
            {recentRepos.length ? (
              <div className="recent-repos">
                {recentRepos.map((recent) => (
                  <button
                    key={recent.path}
                    className="ghost-button"
                    type="button"
                    onClick={() => void refreshOverview(recent.path)}
                  >
                    {recent.isDefault ? "默认仓库" : recent.path}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </header>
        {error ? <div className="error-banner">{error}</div> : null}
        <section className="desktop-masthead" aria-label="结构总控台">
          <div className="desktop-masthead__core">
            <div className="desktop-masthead__headline">
              <span className="eyebrow">STRUCTURAL DESK</span>
              <h3>结构总控台</h3>
              <p>用结构线、轨道和稳定的工作区，把知识库组织成可长期维护的个人系统。</p>
            </div>
            <div className="desktop-masthead__repo">
              <span className="eyebrow">当前仓库</span>
              <strong>{repo?.path ?? "~/.knowledge-galaxy"}</strong>
              <span>{repo?.exists ? "已连接到当前知识库" : "当前使用默认知识库路径"}</span>
            </div>
          </div>
          <div className="desktop-masthead__orbit">
            <article className="desktop-masthead__context">
              <span className="eyebrow">当前区段</span>
              <strong>
                {deskSection.index} · {deskSection.title}
              </strong>
              <p>{deskSection.description}</p>
            </article>
            <div className="desktop-masthead__metrics">
              {desktopMetrics.map((metric) => (
                <article key={metric.label} className="desktop-metric">
                  <span className="desktop-metric__label">{metric.label}</span>
                  <strong className="desktop-metric__value">{metric.value}</strong>
                </article>
              ))}
            </div>
          </div>
        </section>
        <div className="workspace__content">
          <section className="overview-strip">
            {overviewCards.map((card) => (
              <article
                key={card.label}
                className={`overview-card overview-card--${card.accent}`}
              >
                <span className="overview-card__label">{card.label}</span>
                <strong className="overview-card__value">{card.value}</strong>
              </article>
            ))}
          </section>
          <section className="activity-feed panel">
            <div className="panel__header">
              <h3>最近操作</h3>
              <span>{activityItems.length ? `${activityItems.length} 条` : "等待操作"}</span>
            </div>
            <div className="activity-feed__list">
              {activityItems.length ? (
                activityItems.map((item, index) => (
                  <article key={`${item.title}-${item.detail}-${index}`} className="activity-item">
                    <span className="activity-item__index">{(index + 1).toString().padStart(2, "0")}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.detail}</p>
                      {item.note ? <span>{item.note}</span> : null}
                    </div>
                  </article>
                ))
              ) : (
                <article className="empty-state empty-state--compact">
                  <span className="eyebrow">ACTIVITY FEED</span>
                  <h4>最近还没有新的操作</h4>
                  <p>创建、保存、导入、校验、导出和项目命令完成后，结果会在这里汇总展示。</p>
                </article>
              )}
            </div>
          </section>
          <section className="section-hero">
            <div className="section-hero__body">
              <span className="eyebrow">{sectionHero.eyebrow}</span>
              <h3>{sectionHero.title}</h3>
              <p>{sectionHero.description}</p>
            </div>
            <div className="section-hero__actions">
              {sectionHero.actions.map((action) => (
                <button
                  key={action.label}
                  className={action.kind === "primary" ? "primary-button" : "ghost-button"}
                  type="button"
                  onClick={action.onClick}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </section>
          {section === "documents" ? (
            <div className="content-grid">
              <section className="panel">
                <div className="panel__header">
                  <h3>文档浏览</h3>
                  <span>{documents.length} 条</span>
                </div>
                <div className="view-context">
                  <strong>{viewLabel}</strong>
                  <span>用搜索与筛选收敛你当前正在处理的知识切片。</span>
                </div>
                <label className="field field--wide">
                  <span>搜索</span>
                  <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
                </label>
                {documentSignals.length ? (
                  <section className="signal-rail" aria-label="文档信号条">
                    <div className="panel__header signal-rail__header">
                      <h3>文档信号条</h3>
                      <span>从统计摘要一键进入焦点视图</span>
                    </div>
                    <div className="signal-rail__grid">
                      {documentSignals.map((signal) => (
                        <article key={`${signal.group}-${signal.key}`} className="signal-card">
                          <span className="signal-card__group">{signal.title}</span>
                          <strong className="signal-card__key">{signal.key}</strong>
                          <span className="signal-card__count">{signal.count} 篇</span>
                          <button
                            className="ghost-button signal-card__action"
                            type="button"
                            onClick={() => applyDocumentSignal(signal.filterKey, signal.key)}
                          >
                            {signal.actionLabel} {signal.key}
                          </button>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}
                <FiltersPanel filters={filters} onChange={setFilters} />
                <div className="list-panel">
                  {documents.length ? (
                    documents.map((document) => (
                      <button
                        key={document.path}
                        className={
                          document.path === selectedPath ? "list-row is-active" : "list-row"
                        }
                        onClick={() => setSelectedPath(document.path)}
                        type="button"
                      >
                        <strong>{document.title}</strong>
                        <span>
                          {document.type} · {document.status}
                        </span>
                        <code>{document.path}</code>
                      </button>
                    ))
                  ) : (
                    <article className="empty-state">
                      <span className="eyebrow">EMPTY VIEW</span>
                      <h4>当前视图没有文档结果</h4>
                      <p>试试清空筛选条件，或者直接去创建一篇新文档。</p>
                    </article>
                  )}
                </div>
              </section>
              <DocumentEditor document={detail} onSave={handleSave} />
            </div>
          ) : null}

          {section === "create" ? (
            <section className="panel panel--form">
              <div className="panel__header">
                <h3>创建中心</h3>
                <span>调用现有 Python CLI</span>
              </div>
              <section className="recipe-rail" aria-label="模板配方台">
                <div className="panel__header recipe-rail__header">
                  <h3>模板配方台</h3>
                  <span>先选模板，再补当前类型最关键的字段</span>
                </div>
                <div className="recipe-rail__grid">
                  {createRecipes.map((recipe) => (
                    <button
                      key={recipe.type}
                      className={
                        recipe.type === createForm.type ? "recipe-card is-active" : "recipe-card"
                      }
                      type="button"
                      aria-label={`切换到 ${recipe.type} 配方`}
                      onClick={() =>
                        setCreateForm((current) => ({ ...current, type: recipe.type }))
                      }
                    >
                      <span className="recipe-card__title">{recipe.title}</span>
                      <span className="recipe-card__description">{recipe.description}</span>
                    </button>
                  ))}
                </div>
              </section>
              <div className="create-context">
                <strong>{activeCreateRecipe.title} 配方</strong>
                <span>{activeCreateRecipe.hint}</span>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span>类型</span>
                  <select
                    value={createForm.type}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setCreateForm((current) => ({ ...current, type: value }));
                    }}
                  >
                    <option value="note">note</option>
                    <option value="daily">daily</option>
                    <option value="decision">decision</option>
                    <option value="review">review</option>
                    <option value="project">project</option>
                  </select>
                </label>
                <label className="field">
                  <span>标题</span>
                  <input
                    value={createForm.title}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setCreateForm((current) => ({ ...current, title: value }));
                    }}
                  />
                </label>
                <label className="field">
                  <span>日期</span>
                  <input
                    value={createForm.date}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setCreateForm((current) => ({ ...current, date: value }));
                    }}
                    placeholder="review / daily 使用"
                  />
                </label>
                <label className="field">
                  <span>Git Worktree</span>
                  <input
                    value={createForm.gitWorktree}
                    onChange={(event) => {
                      const value = event.currentTarget.value;
                      setCreateForm((current) => ({
                        ...current,
                        gitWorktree: value,
                      }));
                    }}
                    placeholder="project 使用"
                  />
                </label>
              </div>
              <label className="field field--editor">
                <span>正文</span>
                <textarea
                  value={createForm.body}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setCreateForm((current) => ({ ...current, body: value }));
                  }}
                  placeholder="note 创建时可直接写入正文"
                />
              </label>
              <button className="primary-button" type="button" onClick={() => void handleCreate()}>
                创建文档
              </button>
            </section>
          ) : null}

          {section === "assets" ? (
            <div className="content-grid">
              <div className="panel-stack">
                <section className="panel">
                  <div className="panel__header">
                    <h3>资源过滤</h3>
                    <span>按作用域查看</span>
                  </div>
                  <div className="form-grid">
                    <label className="field">
                      <span>作用域</span>
                      <select
                        value={assetScope}
                        onChange={(event) =>
                          setAssetScope(event.currentTarget.value as "all" | "repo" | "project")
                        }
                      >
                        <option value="all">全部</option>
                        <option value="repo">仓库级</option>
                        <option value="project">项目级</option>
                      </select>
                    </label>
                    <label className="field">
                      <span>过滤项目 slug</span>
                    <input
                      value={assetProjectFilter}
                      onChange={(event) => setAssetProjectFilter(event.currentTarget.value)}
                      placeholder="仅项目级过滤时生效"
                      disabled={assetScope !== "project"}
                    />
                    </label>
                  </div>
                </section>
                <AssetTable
                  assets={assets}
                  scopeFilter={assetScope}
                  projectFilter={assetProjectFilter}
                />
              </div>
              <section className="panel panel--form">
                <div className="panel__header">
                  <h3>导入资源</h3>
                  <span>仓库级或项目级</span>
                </div>
                <div className="form-grid">
                  <label className="field">
                    <span>本地文件路径</span>
                    <input
                      value={assetForm.filePath}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setAssetForm((current) => ({ ...current, filePath: value }));
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>目标文件名</span>
                    <input
                      value={assetForm.targetName}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setAssetForm((current) => ({ ...current, targetName: value }));
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>导入到项目 slug</span>
                    <input
                      value={assetForm.project}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setAssetForm((current) => ({ ...current, project: value }));
                      }}
                    />
                  </label>
                </div>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => void handleImportAsset()}
                >
                  导入资源
                </button>
              </section>
            </div>
          ) : null}

          {section === "ops" ? (
            <div className="content-grid">
              <section className="panel">
                <div className="panel__header">
                  <h3>校验与导出</h3>
                  <span>使用现有 CLI 输出</span>
                </div>
                <div className="button-grid">
                  <button type="button" onClick={() => void handleValidate()}>
                    运行校验
                  </button>
                  {["document-list", "manifest", "change-list", "asset-list"].map((kind) => (
                    <button key={kind} type="button" onClick={() => void handleExport(kind)}>
                      导出 {kind}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      snapshot
                        ? navigator.clipboard.writeText(snapshot.content).catch(() => undefined)
                        : undefined
                    }
                  >
                    复制导出内容
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      snapshot ? saveExportToFile(`${snapshot.kind}.json`, snapshot.content) : undefined
                    }
                  >
                    另存为文件
                  </button>
                </div>
                <pre className="validation-panel">
                  {validation
                    ? validation.ok
                      ? "OK"
                      : validation.errors.join("\n")
                    : "尚未运行校验"}
                </pre>
              </section>
              <ExportPanel snapshot={snapshot} />
            </div>
          ) : null}

          {section === "projects" ? (
            <div className="content-grid">
              <section className="panel">
                <div className="panel__header">
                  <h3>项目列表</h3>
                  <span>{projects.length} 个</span>
                </div>
                <div className="list-panel">
                  {projects.map((project) => (
                    <button
                      key={project.path}
                      className={project.slug === activeProject ? "list-row is-active" : "list-row"}
                      type="button"
                      onClick={() => setSelectedProject(project.slug)}
                    >
                      <strong>{project.title}</strong>
                      <code>{project.slug}</code>
                    </button>
                  ))}
                </div>
              </section>
              <section className="panel">
                <div className="panel__header">
                  <h3>项目远端操作</h3>
                  <span>{activeProject || "暂无项目"}</span>
                </div>
                <div className="form-grid">
                  <label className="field">
                    <span>Remote 名称</span>
                    <input
                      value={remoteForm.name}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setRemoteForm((current) => ({ ...current, name: value }));
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>Remote URL</span>
                    <input
                      value={remoteForm.url}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setRemoteForm((current) => ({ ...current, url: value }));
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>远端别名</span>
                    <input
                      value={remoteForm.remote}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setRemoteForm((current) => ({ ...current, remote: value }));
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>分支</span>
                    <input
                      value={remoteForm.branch}
                      onChange={(event) => {
                        const value = event.currentTarget.value;
                        setRemoteForm((current) => ({ ...current, branch: value }));
                      }}
                    />
                  </label>
                </div>
                <div className="button-grid">
                  <button type="button" onClick={() => void handleProjectAction("add-remote")}>
                    Add Remote
                  </button>
                  <button type="button" onClick={() => void handleProjectAction("fetch")}>
                    Fetch
                  </button>
                  <button type="button" onClick={() => void handleProjectAction("push")}>
                    Push
                  </button>
                  <button type="button" onClick={() => void handleProjectAction("sync")}>
                    Sync
                  </button>
                </div>
                <pre className="validation-panel">
                  {projectResult
                    ? [projectResult.stdout, projectResult.stderr].filter(Boolean).join("\n")
                    : "尚未执行项目命令"}
                </pre>
              </section>
            </div>
          ) : null}
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
