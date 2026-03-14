import type { DocumentFilters, DocumentListItem } from "../lib/types";
import { DocumentFilters as FiltersPanel } from "../components/DocumentFilters";
import { useState } from "react";

export function DocumentsPage({
  documents,
  filters,
  query,
  viewLabel,
  onQueryChange,
  onFiltersChange,
  onOpenCreate,
  onOpenDocument,
  onResetView,
}: {
  documents: DocumentListItem[];
  filters: DocumentFilters;
  query: string;
  viewLabel: string;
  onQueryChange: (value: string) => void;
  onFiltersChange: (value: DocumentFilters) => void;
  onOpenCreate: () => void;
  onOpenDocument: (path: string) => void;
  onResetView: () => void;
}) {
  const [showFilters, setShowFilters] = useState(false);

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
          <div className="document-index__summary">
            <strong>{viewLabel}</strong>
          </div>
          <div className="document-index__searchbar">
            <label className="field document-index__search">
              <span>搜索</span>
              <input value={query} onChange={(event) => onQueryChange(event.currentTarget.value)} />
            </label>
            <div className="document-index__actions">
              <button
                aria-expanded={showFilters}
                aria-label="筛选文档"
                className="ghost-button icon-button"
                type="button"
                onClick={() => setShowFilters((current) => !current)}
              >
                <span aria-hidden="true">⌕</span>
              </button>
              <button className="ghost-button" type="button" onClick={onResetView}>
                重置筛选
              </button>
              <button className="primary-button" type="button" onClick={onOpenCreate}>
                新建文档
              </button>
            </div>
          </div>
        </div>
        {showFilters ? (
          <section className="document-filter-popover panel" aria-label="筛选条件">
            <div className="panel__header">
              <h3>筛选条件</h3>
              <button className="ghost-button" type="button" onClick={() => setShowFilters(false)}>
                关闭
              </button>
            </div>
            <FiltersPanel filters={filters} onChange={onFiltersChange} />
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
