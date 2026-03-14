import type { CommandResult, ProjectListItem } from "../lib/api";

export function ProjectsPage({
  activeProject,
  projectResult,
  projects,
  remoteForm,
  onProjectAction,
  onRemoteFormChange,
  onSelectProject,
}: {
  activeProject: string;
  projectResult: CommandResult | null;
  projects: ProjectListItem[];
  remoteForm: {
    name: string;
    url: string;
    remote: string;
    branch: string;
  };
  onProjectAction: (action: string) => void;
  onRemoteFormChange: (field: "name" | "url" | "remote" | "branch", value: string) => void;
  onSelectProject: (slug: string) => void;
}) {
  return (
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
              onClick={() => onSelectProject(project.slug)}
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
            <input value={remoteForm.name} onChange={(event) => onRemoteFormChange("name", event.currentTarget.value)} />
          </label>
          <label className="field">
            <span>Remote URL</span>
            <input value={remoteForm.url} onChange={(event) => onRemoteFormChange("url", event.currentTarget.value)} />
          </label>
          <label className="field">
            <span>远端别名</span>
            <input value={remoteForm.remote} onChange={(event) => onRemoteFormChange("remote", event.currentTarget.value)} />
          </label>
          <label className="field">
            <span>分支</span>
            <input value={remoteForm.branch} onChange={(event) => onRemoteFormChange("branch", event.currentTarget.value)} />
          </label>
        </div>
        <div className="button-grid">
          <button type="button" onClick={() => onProjectAction("add-remote")}>
            Add Remote
          </button>
          <button type="button" onClick={() => onProjectAction("fetch")}>
            Fetch
          </button>
          <button type="button" onClick={() => onProjectAction("push")}>
            Push
          </button>
          <button type="button" onClick={() => onProjectAction("sync")}>
            Sync
          </button>
        </div>
        <pre className="validation-panel">
          {projectResult ? [projectResult.stdout, projectResult.stderr].filter(Boolean).join("\n") : "尚未执行项目命令"}
        </pre>
      </section>
    </div>
  );
}
