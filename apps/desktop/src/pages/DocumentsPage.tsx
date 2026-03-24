import { useEffect, useMemo, useState } from "react";
import { DocumentFilters as FiltersPanel } from "../components/DocumentFilters";
import { DocumentEditor } from "../components/DocumentEditor";
import type {
  DocumentDetail,
  DocumentFilters,
  DocumentListItem,
  DocumentTreeNode,
  OpenDocumentTab,
} from "../lib/types";

function formatDocumentTimestamp(value: string) {
  if (!value) {
    return "待同步";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function createTree(documents: DocumentListItem[]): DocumentTreeNode[] {
  const root = new Map<string, DocumentTreeNode>();

  const insert = (nodes: Map<string, DocumentTreeNode>, parts: string[], document: DocumentListItem, prefix = "") => {
    const [head, ...tail] = parts;
    if (!head) {
      return;
    }

    const id = prefix ? `${prefix}/${head}` : head;
    if (!tail.length) {
      nodes.set(id, {
        id: document.path,
        name: document.title,
        path: document.path,
        updatedAt: document.updatedAt,
        kind: "document",
      });
      return;
    }

    const existing = nodes.get(id) ?? {
      id,
      name: head,
      kind: "folder" as const,
      children: [],
    };
    const childMap = new Map(
      (existing.children ?? []).map((child) => [child.id, child] as const),
    );
    insert(childMap, tail, document, id);
    existing.children = Array.from(childMap.values()).sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === "folder" ? -1 : 1;
      }
      return left.name.localeCompare(right.name, "zh-CN");
    });
    nodes.set(id, existing);
  };

  for (const document of documents) {
    insert(root, document.path.split("/"), document);
  }

  return Array.from(root.values()).sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === "folder" ? -1 : 1;
    }
    return left.name.localeCompare(right.name, "zh-CN");
  });
}

function TreeBranch({
  activePath,
  documentMap,
  nodes,
  onOpenDocument,
  openPaths,
}: {
  activePath: string | null;
  documentMap: Map<string, DocumentListItem>;
  nodes: DocumentTreeNode[];
  onOpenDocument: (path: string) => void;
  openPaths: Set<string>;
}) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpandedFolders((current) => {
      const next = { ...current };
      for (const node of nodes) {
        if (node.kind === "folder" && next[node.id] === undefined) {
          next[node.id] = true;
        }
      }
      return next;
    });
  }, [nodes]);

  return (
    <div className="document-tree" role="tree" aria-label="文件树">
      {nodes.map((node) =>
        node.kind === "folder" ? (
          <div key={node.id} className="document-tree__branch">
            <button
              aria-expanded={expandedFolders[node.id] ?? true}
              aria-label={`切换目录 ${node.name}`}
              className="document-tree__folder"
              type="button"
              onClick={() =>
                setExpandedFolders((current) => ({
                  ...current,
                  [node.id]: !(current[node.id] ?? true),
                }))
              }
            >
              <span aria-hidden="true">{expandedFolders[node.id] ?? true ? "▾" : "▸"}</span>
              <span>{node.name}</span>
            </button>
            {expandedFolders[node.id] ?? true ? (
              <div className="document-tree__children">
                <TreeBranch
                  activePath={activePath}
                  documentMap={documentMap}
                  nodes={node.children ?? []}
                  onOpenDocument={onOpenDocument}
                  openPaths={openPaths}
                />
              </div>
            ) : null}
          </div>
        ) : (
          (() => {
            const summary = node.path ? documentMap.get(node.path) : null;
            return (
          <button
            key={node.id}
            aria-label={`打开文档 ${node.name}`}
            className={
              node.path === activePath
                ? "document-tree__document is-active"
                : "document-tree__document"
            }
            type="button"
            onClick={() => node.path && onOpenDocument(node.path)}
          >
            <div className="document-tree__content">
              <span>{node.name}</span>
              {summary?.updatedAt ? (
                <span className="document-tree__timestamp">{formatDocumentTimestamp(summary.updatedAt)}</span>
              ) : null}
            </div>
            <div className="document-tree__meta">
              {node.path && openPaths.has(node.path) ? (
                <span className="document-tree__status">已打开</span>
              ) : null}
            </div>
          </button>
            );
          })()
        ),
      )}
    </div>
  );
}

export function DocumentsPage({
  documents,
  error,
  filters,
  query,
  viewLabel,
  activeTabId,
  activeDocument,
  openTabs,
  onActivateTab,
  onChangeDocument,
  onChangeTabMode,
  onCloseTab,
  onDeleteDocument,
  onFiltersChange,
  onOpenCreate,
  onOpenDocument,
  onQueryChange,
  onResetView,
  onSaveDocument,
}: {
  documents: DocumentListItem[];
  error: string | null;
  filters: DocumentFilters;
  query: string;
  viewLabel: string;
  activeTabId: string | null;
  activeDocument: DocumentDetail | null;
  openTabs: OpenDocumentTab[];
  onActivateTab: (tabId: string) => void;
  onChangeDocument: (value: DocumentDetail) => void;
  onChangeTabMode: (tabId: string, mode: "preview" | "edit") => void;
  onCloseTab: (tabId: string) => void;
  onDeleteDocument: () => void;
  onFiltersChange: (value: DocumentFilters) => void;
  onOpenCreate: () => void;
  onOpenDocument: (path: string) => void;
  onQueryChange: (value: string) => void;
  onResetView: () => void;
  onSaveDocument: (value: DocumentDetail) => void;
}) {
  const [showFilters, setShowFilters] = useState(false);
  const tree = useMemo(() => createTree(documents), [documents]);
  const documentMap = useMemo(
    () => new Map(documents.map((document) => [document.path, document] as const)),
    [documents],
  );
  const openPaths = useMemo(
    () => new Set(openTabs.map((tab) => tab.path).filter(Boolean)),
    [openTabs],
  );
  const hasSearchView = query.trim().length > 0 || Object.values(filters).some((value) => value?.trim());
  const activeTab = openTabs.find((tab) => tab.id === activeTabId) ?? null;

  return (
    <div className="document-workbench">
      <section className="panel document-browser-panel">
        <div className="panel__header document-command__header">
          <div>
            <span className="eyebrow">DOCUMENT WORKBENCH</span>
            <h3>文档工作台</h3>
          </div>
          <span>{documents.length} 条</span>
        </div>
        {error ? <div className="error-banner">{error}</div> : null}
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
        <section className="document-browser document-browser--dense panel">
          <div className="panel__header">
            <h3>{hasSearchView ? "搜索结果" : "文件树"}</h3>
            <span>{documents.length ? `${documents.length} 篇` : "等待结果"}</span>
          </div>
          {documents.length ? (
            hasSearchView ? (
              <div className="document-results-list">
                {documents.map((document) => (
                  <button
                    key={document.path}
                    aria-label={`打开文档 ${document.title}`}
                    className={
                      activeDocument?.path === document.path
                        ? "document-result-card is-active"
                        : "document-result-card"
                    }
                    type="button"
                    onClick={() => onOpenDocument(document.path)}
                  >
                    <div className="document-result-card__title-row">
                      <strong>{document.title}</strong>
                      <span>{document.type}</span>
                    </div>
                    <span>{formatDocumentTimestamp(document.updatedAt)}</span>
                    <code>{document.path}</code>
                  </button>
                ))}
              </div>
            ) : (
              <TreeBranch
                activePath={activeDocument?.path ?? null}
                documentMap={documentMap}
                nodes={tree}
                onOpenDocument={onOpenDocument}
                openPaths={openPaths}
              />
            )
          ) : (
            <article className="empty-state">
              <span className="eyebrow">EMPTY VIEW</span>
              <h4>还没有匹配当前视图的文档</h4>
              <p>试试清空筛选条件，或者新建一篇文档。</p>
            </article>
          )}
        </section>
      </section>

      <section className="panel document-workspace-panel">
        <div className="panel__header">
          <div>
            <span className="eyebrow">OPEN TABS</span>
            <h3>打开中的文档</h3>
          </div>
          <span>{openTabs.length} 个标签</span>
        </div>
        <div className="document-tabs" role="tablist" aria-label="打开中的文档标签">
          {openTabs.length ? (
            openTabs.map((tab) => (
              <div
                key={tab.id}
                className={tab.id === activeTabId ? "document-tab is-active" : "document-tab"}
              >
                <button
                  aria-label={`切换到标签 ${tab.title || "未命名文档"}`}
                  className="document-tab__button"
                  type="button"
                  onClick={() => onActivateTab(tab.id)}
                >
                  <span>{tab.title || "未命名文档"}</span>
                  {tab.dirty ? <span className="document-tab__dirty">●</span> : null}
                </button>
                <button
                  aria-label={`关闭标签 ${tab.title || "未命名文档"}`}
                  className="document-tab__close"
                  type="button"
                  onClick={() => onCloseTab(tab.id)}
                >
                  ×
                </button>
              </div>
            ))
          ) : (
            <div className="document-tabs__empty">还没有打开的标签</div>
          )}
        </div>
        <DocumentEditor
          dirty={activeTab?.dirty ?? false}
          document={activeDocument}
          saveLabel={activeTab?.isNew ? "创建文档" : "保存文档"}
          showDelete={Boolean(activeDocument?.path)}
          viewMode={activeTab?.mode ?? "preview"}
          onChange={onChangeDocument}
          onDelete={onDeleteDocument}
          onModeChange={(mode) => activeTab && onChangeTabMode(activeTab.id, mode)}
          onSave={onSaveDocument}
        />
      </section>
    </div>
  );
}
