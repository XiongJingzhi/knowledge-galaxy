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
        <span className="sidebar__kicker">STRUCTURAL DESK</span>
        <h1>Knowledge Galaxy</h1>
        <p>用结构组织当前知识库，而不是把内容堆成后台列表。</p>
        <div className="sidebar__seal">
          <strong>KG</strong>
          <span>Core Console</span>
        </div>
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
