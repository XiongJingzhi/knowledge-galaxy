import type { NavSection } from "../lib/types";

const labels: Record<NavSection, string> = {
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
        <span className="sidebar__kicker">TAURI WORKBENCH</span>
        <h1>Knowledge Galaxy</h1>
        <p>面向当前知识库的桌面工作台。</p>
      </div>
      <nav className="sidebar__nav">
        {(Object.keys(labels) as NavSection[]).map((item) => (
          <button
            key={item}
            className={item === section ? "sidebar__nav-item is-active" : "sidebar__nav-item"}
            onClick={() => onChange(item)}
            type="button"
          >
            {labels[item]}
          </button>
        ))}
      </nav>
    </aside>
  );
}
