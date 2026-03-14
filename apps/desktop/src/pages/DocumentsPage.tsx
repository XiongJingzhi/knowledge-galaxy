import type { DocumentFilters, DocumentListItem } from "../lib/types";
import type { DocumentSignal } from "../lib/desktop-ui";
import { DocumentFilters as FiltersPanel } from "../components/DocumentFilters";

export function DocumentsPage({
  documents,
  filters,
  query,
  viewLabel,
  documentSignals,
  onQueryChange,
  onFiltersChange,
  onApplySignal,
  onOpenCreate,
  onOpenDocument,
  onResetView,
}: {
  documents: DocumentListItem[];
  filters: DocumentFilters;
  query: string;
  viewLabel: string;
  documentSignals: DocumentSignal[];
  onQueryChange: (value: string) => void;
  onFiltersChange: (value: DocumentFilters) => void;
  onApplySignal: (filterKey: keyof DocumentFilters, value: string) => void;
  onOpenCreate: () => void;
  onOpenDocument: (path: string) => void;
  onResetView: () => void;
}) {
  return (
    <div className="content-grid document-shell">
      <section className="panel document-index">
        <div className="panel__header document-command__header">
          <div>
            <span className="eyebrow">DOCUMENT INDEX</span>
            <h3>文档索引</h3>
          </div>
          <span>{documents.length} 条</span>
        </div>
        <div className="view-context view-context--compact document-index__toolbar">
          <strong>{viewLabel}</strong>
          <div className="document-index__actions">
            <button className="ghost-button" type="button" onClick={onResetView}>
              重置筛选
            </button>
            <button className="primary-button" type="button" onClick={onOpenCreate}>
              新建文档
            </button>
          </div>
        </div>
        <label className="field field--wide document-index__search">
          <span>搜索</span>
          <input value={query} onChange={(event) => onQueryChange(event.currentTarget.value)} />
        </label>
        <section className="document-filters-panel" aria-label="逻辑分类">
          <div className="panel__header signal-rail__header">
            <h3>逻辑分类</h3>
            <span>按类型、状态、项目和主题收敛检索结果</span>
          </div>
          <FiltersPanel filters={filters} onChange={onFiltersChange} />
        </section>
        {documentSignals.length ? (
          <section className="signal-rail" aria-label="文档信号条">
            <div className="panel__header signal-rail__header">
              <h3>逻辑分类</h3>
              <span>从统计摘要一键聚焦常用分类</span>
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
        <section className="panel document-browser">
          <div className="panel__header">
            <h3>文档列表</h3>
            <span>{documents.length ? `${documents.length} 篇` : "等待结果"}</span>
          </div>
          <div className="document-table-wrap">
            <table className="document-table">
              <thead>
                <tr>
                  <th scope="col">标题</th>
                  <th scope="col">类型</th>
                  <th scope="col">状态</th>
                  <th scope="col">更新时间</th>
                  <th scope="col">路径</th>
                </tr>
              </thead>
              <tbody>
                {documents.length ? (
                  documents.map((document) => (
                    <tr key={document.path}>
                      <td>
                        <button
                          className="document-table__link"
                          onClick={() => onOpenDocument(document.path)}
                          type="button"
                        >
                          {document.title}
                        </button>
                      </td>
                      <td>{document.type}</td>
                      <td>{document.status}</td>
                      <td>最近更新</td>
                      <td>
                        <code>{document.path}</code>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <article className="empty-state">
                        <span className="eyebrow">EMPTY VIEW</span>
                        <h4>当前视图没有文档结果</h4>
                        <p>试试清空筛选条件，或者从上方新建一篇文档。</p>
                      </article>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </div>
  );
}
