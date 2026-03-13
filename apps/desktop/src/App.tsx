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
      await saveDocument(value.path, value);
      await refreshOverview(repo?.path);
      const next = await getDocument(value.path);
      setDetail(next);
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleImportAsset = async () => {
    try {
      await importAsset(assetForm);
      await refreshOverview(repo?.path);
      setSection("assets");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleExport = async (kind: string) => {
    try {
      const next = await runExport(kind);
      setSnapshot(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

  const handleValidate = async () => {
    try {
      const next = await runValidate();
      setValidation(next);
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  };

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
        <div className="workspace__content">
          {section === "documents" ? (
            <div className="content-grid">
              <section className="panel">
                <div className="panel__header">
                  <h3>文档浏览</h3>
                  <span>{documents.length} 条</span>
                </div>
                <label className="field field--wide">
                  <span>搜索</span>
                  <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} />
                </label>
                <FiltersPanel filters={filters} onChange={setFilters} />
                <div className="list-panel">
                  {documents.map((document) => (
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
                  ))}
                </div>
              </section>
              <DocumentEditor document={detail} onSave={handleSave} />
            </div>
          ) : null}

          {section === "create" ? (
            <section className="panel panel--form">
              <div className="panel__header">
                <h3>创建文档</h3>
                <span>调用现有 Python CLI</span>
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
