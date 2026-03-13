import type { ExportSnapshot } from "../lib/api";

export function ExportPanel({ snapshot }: { snapshot: ExportSnapshot | null }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h3>导出结果</h3>
        <span>{snapshot?.kind ?? "尚未导出"}</span>
      </div>
      <pre className="export-panel__body">{snapshot?.content ?? "暂无内容"}</pre>
    </section>
  );
}
