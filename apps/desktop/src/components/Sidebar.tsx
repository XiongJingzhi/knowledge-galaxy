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
  onChange,
}: {
  section: NavSection;
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
