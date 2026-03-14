import type { DocumentDetail, DocumentFilters, DocumentListItem } from "../lib/types";
import type { DocumentSignal } from "../lib/desktop-ui";
import { DocumentEditor } from "../components/DocumentEditor";
import { DocumentFilters as FiltersPanel } from "../components/DocumentFilters";

export function DocumentsPage({
  documents,
  detail,
  filters,
  query,
  selectedPath,
  viewLabel,
  documentSignals,
  onQueryChange,
  onFiltersChange,
  onSelectDocument,
  onApplySignal,
  onSave,
}: {
  documents: DocumentListItem[];
  detail: DocumentDetail | null;
  filters: DocumentFilters;
  query: string;
  selectedPath: string | null;
  viewLabel: string;
  documentSignals: DocumentSignal[];
  onQueryChange: (value: string) => void;
  onFiltersChange: (value: DocumentFilters) => void;
  onSelectDocument: (path: string) => void;
  onApplySignal: (filterKey: keyof DocumentFilters, value: string) => void;
  onSave: (value: DocumentDetail) => Promise<void>;
}) {
  return (
    <div className="content-grid document-shell">
      <section className="panel document-command">
        <div className="panel__header document-command__header">
          <div>
            <span className="eyebrow">DOCUMENT DESK</span>
            <h3>文档指挥台</h3>
          </div>
          <span>{documents.length} 条</span>
        </div>
        <div className="view-context view-context--compact">
          <strong>{viewLabel}</strong>
          <span>在当前仓库里收敛焦点文档，再进入右侧编辑区继续修改内容和元数据。</span>
        </div>
        <label className="field field--wide">
          <span>搜索</span>
          <input value={query} onChange={(event) => onQueryChange(event.currentTarget.value)} />
        </label>
        <section className="document-filters-panel" aria-label="焦点筛选">
          <div className="panel__header signal-rail__header">
            <h3>焦点筛选</h3>
            <span>按类型、状态和标签快速收拢文档列表</span>
          </div>
          <FiltersPanel filters={filters} onChange={onFiltersChange} />
        </section>
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
                    onClick={() => onApplySignal(signal.filterKey, signal.key)}
                  >
                    {signal.actionLabel} {signal.key}
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>
      <section className="panel document-browser">
        <div className="panel__header">
          <h3>文档浏览</h3>
          <span>{selectedPath ? "已选中 1 篇" : "等待选择"}</span>
        </div>
        <div className="list-panel">
          {documents.length ? (
            documents.map((document) => (
              <button
                key={document.path}
                className={document.path === selectedPath ? "list-row is-active" : "list-row"}
                onClick={() => onSelectDocument(document.path)}
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
      <DocumentEditor document={detail} onSave={onSave} />
    </div>
  );
}
