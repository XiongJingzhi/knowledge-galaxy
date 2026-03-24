import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DocumentDetail, DocumentViewMode } from "../lib/types";

function joinList(values: string[]) {
  return values.join(", ");
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function prettyTimestamp(value: string) {
  if (!value) {
    return "自动生成";
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

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <article className="meta-readout">
      <span>{label}</span>
      <strong>{value || "未设置"}</strong>
    </article>
  );
}

export function DocumentEditor({
  document,
  viewMode = "preview",
  dirty = false,
  saveLabel,
  showDelete = false,
  onChange,
  onDelete,
  onModeChange,
  onSave,
}: {
  document: DocumentDetail | null;
  viewMode?: DocumentViewMode;
  dirty?: boolean;
  saveLabel?: string;
  showDelete?: boolean;
  onChange: (value: DocumentDetail) => void;
  onDelete?: () => void;
  onModeChange?: (value: DocumentViewMode) => void;
  onSave: (value: DocumentDetail) => void;
}) {
  const [copiedPath, setCopiedPath] = useState(false);

  useEffect(() => {
    setCopiedPath(false);
  }, [document?.path]);

  if (!document) {
    return (
      <section className="panel detail-panel empty">
        <span className="eyebrow">DOCUMENT WORKSPACE</span>
        <h3>还没有打开的文档</h3>
        <p>从左侧浏览器选择文档，或者新建一篇文档开始整理。</p>
      </section>
    );
  }

  const patch = (next: Partial<DocumentDetail>) => {
    onChange({ ...document, ...next });
  };

  const handleCopyPath = async () => {
    if (!document.path || !navigator.clipboard) {
      return;
    }
    await navigator.clipboard.writeText(document.path);
    setCopiedPath(true);
  };

  const saveActionLabel = saveLabel ?? (document.path ? "保存文档" : "创建文档");
  const dossierGroups = [
    { label: "类型", values: [document.type] },
    { label: "状态", values: [document.status] },
    { label: "主题", values: document.theme },
    { label: "项目", values: document.project },
    { label: "标签", values: document.tags },
    { label: "来源", values: document.source },
  ];

  return (
    <section className="panel detail-panel detail-panel--workspace">
      <div className="detail-panel__header detail-panel__header--workspace">
        <div className="document-editor__headline">
          <span className="eyebrow">{document.path || "新建 Markdown 文档"}</span>
          {viewMode === "edit" ? (
            <input
              aria-label="标题"
              className="document-editor__title-input"
              data-testid="document-editor-title"
              placeholder="未命名文档"
              value={document.title}
              onChange={(event) => patch({ title: event.currentTarget.value })}
            />
          ) : (
            <h2>{document.title || "未命名文档"}</h2>
          )}
        </div>
        <div className="detail-panel__status">
          {dirty ? <span className="status-pill is-dirty">未保存变更</span> : null}
          <div className="segmented-control" aria-label="文档模式">
            <button
              className={viewMode === "preview" ? "segmented-control__button is-active" : "segmented-control__button"}
              type="button"
              onClick={() => onModeChange?.("preview")}
            >
              预览
            </button>
            <button
              className={viewMode === "edit" ? "segmented-control__button is-active" : "segmented-control__button"}
              type="button"
              onClick={() => onModeChange?.("edit")}
            >
              编辑文档
            </button>
          </div>
          {document.path ? (
            <button className="ghost-button" type="button" onClick={() => void handleCopyPath()}>
              {copiedPath ? "已复制路径" : "复制路径"}
            </button>
          ) : null}
          {showDelete ? (
            <button className="ghost-button danger-button" type="button" onClick={onDelete}>
              删除文档
            </button>
          ) : null}
          <button type="button" onClick={() => onSave(document)}>
            {saveActionLabel}
          </button>
        </div>
      </div>
      <div className="detail-panel__workspace" data-testid="document-workspace-content">
        {viewMode === "preview" ? (
          <div className="document-preview-layout">
            <aside className="preview-panel">
              <div className="preview-panel__header">
                <span className="eyebrow">PREVIEW</span>
                <strong>文档预览</strong>
              </div>
              <article className="markdown-preview">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {document.body || `# ${document.title || "未命名文档"}\n\n*没有正文内容*`}
                </ReactMarkdown>
              </article>
            </aside>
            <aside className="document-inspector">
              <div className="preview-panel__header">
                <span className="eyebrow">DOCUMENT DOSSIER</span>
                <strong>元信息</strong>
              </div>
              <div className="document-meta-panel">
                <div className="detail-panel__meta detail-panel__meta--dense document-meta-panel__timestamps">
                  <ReadOnlyField label="创建时间" value={prettyTimestamp(document.createdAt)} />
                  <ReadOnlyField label="更新时间" value={prettyTimestamp(document.updatedAt)} />
                  <ReadOnlyField label="文档日期" value={document.date || "自动生成"} />
                  <ReadOnlyField label="路径" value={document.path || "创建后生成"} />
                </div>
                <div className="detail-panel__meta detail-panel__meta--dense document-meta-panel__readonly">
                  <ReadOnlyField label="类型" value={document.type} />
                  <ReadOnlyField label="状态" value={document.status} />
                  <ReadOnlyField label="主题" value={joinList(document.theme)} />
                  <ReadOnlyField label="项目" value={joinList(document.project)} />
                  <ReadOnlyField label="标签" value={joinList(document.tags)} />
                  <ReadOnlyField label="来源" value={joinList(document.source)} />
                  <ReadOnlyField label="摘要" value={document.summary} />
                  {document.type === "project" ? (
                    <ReadOnlyField label="Git Worktree" value={document.gitWorktree} />
                  ) : null}
                </div>
                <div className="markdown-preview__meta">
                  {dossierGroups.map((group) => (
                    <article key={group.label} className="taxonomy-strip__group">
                      <span className="taxonomy-strip__label">{group.label}</span>
                      <div className="taxonomy-strip__chips">
                        {group.values.length ? (
                          group.values.map((value) => (
                            <span key={`${group.label}-${value}`} className="taxonomy-chip">
                              {value}
                            </span>
                          ))
                        ) : (
                          <span className="taxonomy-chip taxonomy-chip--empty">未设置</span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="document-editor-grid">
            <section className="editor-column">
              <section className="document-writer" data-testid="document-writer">
                <section className="document-writer__body">
                  <textarea
                    aria-label="Markdown 正文"
                    placeholder="从这里开始整理你的 Markdown 文档..."
                    value={document.body}
                    onChange={(event) => patch({ body: event.currentTarget.value })}
                  />
                </section>
              </section>
            </section>
            <aside className="document-inspector document-inspector--edit">
              <div className="preview-panel__header">
                <span className="eyebrow">DOCUMENT FIELDS</span>
                <strong>编辑属性</strong>
              </div>
              <div className="detail-panel__meta detail-panel__meta--compact detail-panel__meta--dense">
                <label className="field">
                  <span>类型</span>
                  <select
                    aria-label="类型"
                    value={document.type}
                    onChange={(event) => patch({ type: event.currentTarget.value })}
                  >
                    <option value="note">note</option>
                    <option value="daily">daily</option>
                    <option value="decision">decision</option>
                    <option value="review">review</option>
                    <option value="project">project</option>
                  </select>
                </label>
                <label className="field">
                  <span>状态</span>
                  <input
                    aria-label="状态"
                    value={document.status}
                    onChange={(event) => patch({ status: event.currentTarget.value })}
                  />
                </label>
                <label className="field">
                  <span>主题</span>
                  <input
                    aria-label="主题"
                    value={joinList(document.theme)}
                    onChange={(event) => patch({ theme: splitList(event.currentTarget.value) })}
                  />
                </label>
                <label className="field">
                  <span>项目</span>
                  <input
                    aria-label="项目"
                    value={joinList(document.project)}
                    onChange={(event) => patch({ project: splitList(event.currentTarget.value) })}
                  />
                </label>
                <label className="field">
                  <span>标签</span>
                  <input
                    aria-label="标签"
                    value={joinList(document.tags)}
                    onChange={(event) => patch({ tags: splitList(event.currentTarget.value) })}
                  />
                </label>
                <label className="field">
                  <span>来源</span>
                  <input
                    aria-label="来源"
                    value={joinList(document.source)}
                    onChange={(event) => patch({ source: splitList(event.currentTarget.value) })}
                  />
                </label>
                <label className="field field--wide">
                  <span>摘要</span>
                  <input
                    aria-label="摘要"
                    value={document.summary}
                    onChange={(event) => patch({ summary: event.currentTarget.value })}
                  />
                </label>
                {document.type === "project" ? (
                  <label className="field field--wide">
                    <span>Git Worktree</span>
                    <input
                      aria-label="Git Worktree"
                      value={document.gitWorktree ?? ""}
                      onChange={(event) => patch({ gitWorktree: event.currentTarget.value })}
                    />
                  </label>
                ) : null}
              </div>
              <div className="detail-panel__meta detail-panel__meta--dense document-meta-panel__timestamps">
                <ReadOnlyField label="创建时间" value={prettyTimestamp(document.createdAt)} />
                <ReadOnlyField label="更新时间" value={prettyTimestamp(document.updatedAt)} />
                <ReadOnlyField label="文档日期" value={document.date || "自动生成"} />
                <ReadOnlyField label="路径" value={document.path || "创建后生成"} />
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
