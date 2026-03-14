import type { NavSection } from "../lib/types";
import { GalaxyLogo } from "./GalaxyLogo";

const labels: Record<NavSection, string> = {
  home: "首页",
  documents: "文档",
  create: "创建",
  assets: "资源",
  ops: "校验与导出",
  projects: "项目",
};

export function Sidebar({
  section,
  repoPath,
  onChooseRepoDirectory,
  onOpenRepoDirectory,
  onChange,
}: {
  section: NavSection;
  repoPath: string;
  onChooseRepoDirectory: () => void;
  onOpenRepoDirectory: () => void;
  onChange: (value: NavSection) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-mark">
          <GalaxyLogo />
        </div>
        <h1>知识星系</h1>
        <p>浏览文档、创建条目、整理资源，并把知识库和项目仓库保持同步。</p>
      </div>
      <section className="sidebar__repo-card" aria-label="仓库目录">
        <div className="sidebar__repo-header">
          <span className="sidebar__kicker">REPOSITORY</span>
          <div className="sidebar__repo-actions">
            <button
              className="sidebar__icon-button"
              type="button"
              aria-label="切换仓库目录"
              onClick={onChooseRepoDirectory}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path
                  d="M4 17.25V20h2.75L17.8 8.95l-2.75-2.75L4 17.25Zm14.7-9.04a1 1 0 0 0 0-1.41l-1.49-1.5a1 1 0 0 0-1.41 0l-1.17 1.17 2.75 2.75 1.32-1.31Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <button
              className="sidebar__icon-button"
              type="button"
              aria-label="打开目录"
              onClick={onOpenRepoDirectory}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path
                  d="M3 6.75A1.75 1.75 0 0 1 4.75 5h4.19c.46 0 .9.18 1.24.51l1.06 1.05c.14.14.33.22.53.22h7.49A1.75 1.75 0 0 1 21 8.53V17.25A1.75 1.75 0 0 1 19.25 19H4.75A1.75 1.75 0 0 1 3 17.25V6.75Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
        <code className="sidebar__repo-path">{repoPath}</code>
      </section>
      <nav className="sidebar__nav">
        {(Object.keys(labels) as NavSection[]).map((item, index) => (
          <button
            key={item}
            className={item === section ? "sidebar__nav-item is-active" : "sidebar__nav-item"}
            onClick={() => onChange(item)}
            type="button"
            aria-label={labels[item]}
          >
            <span className="sidebar__nav-index" aria-hidden="true">
              {(index + 1).toString().padStart(2, "0")}
            </span>
            <span>{labels[item]}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
