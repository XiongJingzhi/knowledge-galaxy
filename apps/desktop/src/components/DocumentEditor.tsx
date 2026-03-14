import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { DocumentDetail } from "../lib/types";

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
  });
}

export function DocumentEditor({
  document,
  mode = "edit",
  actionLabel = "保存文档",
  onSave,
}: {
  document: DocumentDetail | null;
  mode?: "edit" | "create";
  actionLabel?: string;
  onSave: (value: DocumentDetail) => void;
}) {
  const [draft, setDraft] = useState<DocumentDetail | null>(document);
  const [dirty, setDirty] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  useEffect(() => {
    setDraft(document);
    setDirty(false);
    setCopiedPath(false);
  }, [document]);

  if (!draft) {
    return (
      <section className="panel detail-panel empty">
        <span className="eyebrow">DOCUMENT WORKSPACE</span>
        <h3>还没有可编辑的文档</h3>
        <p>请先从文档列表进入创建或编辑工作区。</p>
      </section>
    );
  }

  const patch = (next: Partial<DocumentDetail>) => {
    setDraft({ ...draft, ...next });
    setDirty(true);
  };
  const dossierGroups = [
    { label: "类型", values: [draft.type] },
    { label: "状态", values: [draft.status] },
    { label: "主题", values: draft.theme },
    { label: "项目", values: draft.project },
    { label: "标签", values: draft.tags },
    { label: "来源", values: draft.source },
  ];
  const handleCopyPath = async () => {
    if (!navigator.clipboard) {
      return;
    }
    await navigator.clipboard.writeText(draft.path);
    setCopiedPath(true);
  };

  return (
    <section className="panel detail-panel detail-panel--workspace">
      <div className="detail-panel__header">
        <div>
          <span className="eyebrow">{mode === "create" ? "Markdown 编辑" : draft.path}</span>
          <h2>{draft.title || (mode === "create" ? "未命名文档" : "文档编辑")}</h2>
        </div>
        <div className="detail-panel__status">
          {dirty ? <span className="status-pill is-dirty">未保存变更</span> : null}
          {mode === "edit" && draft.path ? (
            <button className="ghost-button" type="button" onClick={() => void handleCopyPath()}>
              {copiedPath ? "已复制路径" : "复制路径"}
            </button>
          ) : null}
          <button type="button" onClick={() => draft && onSave(draft)}>
            {actionLabel}
          </button>
        </div>
      </div>
      <div className="detail-panel__workspace">
        <div className="document-editor-grid">
          <section className="editor-column">
            <label className="field field--wide">
              <span>标题</span>
              <input
                aria-label="标题"
                value={draft.title}
                onChange={(event) => patch({ title: event.currentTarget.value })}
              />
            </label>
            <label className="field field--editor">
              <span>Markdown 编辑</span>
              <textarea
                aria-label="Markdown 正文"
                value={draft.body}
                onChange={(event) => patch({ body: event.currentTarget.value })}
              />
            </label>
          </section>
          <aside className="preview-panel">
            <div className="preview-panel__header">
              <span className="eyebrow">PREVIEW</span>
              <strong>实时预览</strong>
            </div>
            <article className="markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.body || "*没有正文内容*"}</ReactMarkdown>
              <section className="document-meta-panel">
                <div className="detail-panel__meta detail-panel__meta--dense document-meta-panel__timestamps">
                  <article className="meta-readout">
                    <span>创建时间</span>
                    <strong>{prettyTimestamp(draft.createdAt)}</strong>
                  </article>
                  <article className="meta-readout">
                    <span>更新时间</span>
                    <strong>{prettyTimestamp(draft.updatedAt)}</strong>
                  </article>
                  <article className="meta-readout">
                    <span>文档日期</span>
                    <strong>{draft.date || "自动生成"}</strong>
                  </article>
                  <article className="meta-readout">
                    <span>路径</span>
                    <strong>{draft.path || "创建后生成"}</strong>
                  </article>
                </div>
                <div className="detail-panel__meta detail-panel__meta--compact detail-panel__meta--dense">
                  <label className="field">
                    <span>类型</span>
                    <select
                      aria-label="类型"
                      value={draft.type}
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
                      value={draft.status}
                      onChange={(event) => patch({ status: event.currentTarget.value })}
                    />
                  </label>
                  <label className="field">
                    <span>主题</span>
                    <input
                      aria-label="主题"
                      value={joinList(draft.theme)}
                      onChange={(event) => patch({ theme: splitList(event.currentTarget.value) })}
                    />
                  </label>
                  <label className="field">
                    <span>项目</span>
                    <input
                      aria-label="项目"
                      value={joinList(draft.project)}
                      onChange={(event) => patch({ project: splitList(event.currentTarget.value) })}
                    />
                  </label>
                  <label className="field">
                    <span>标签</span>
                    <input
                      aria-label="标签"
                      value={joinList(draft.tags)}
                      onChange={(event) => patch({ tags: splitList(event.currentTarget.value) })}
                    />
                  </label>
                  <label className="field">
                    <span>来源</span>
                    <input
                      aria-label="来源"
                      value={joinList(draft.source)}
                      onChange={(event) => patch({ source: splitList(event.currentTarget.value) })}
                    />
                  </label>
                  <label className="field field--wide">
                    <span>摘要</span>
                    <input
                      aria-label="摘要"
                      value={draft.summary}
                      onChange={(event) => patch({ summary: event.currentTarget.value })}
                    />
                  </label>
                  {draft.type === "project" ? (
                    <label className="field field--wide">
                      <span>Git Worktree</span>
                      <input
                        aria-label="Git Worktree"
                        value={draft.gitWorktree ?? ""}
                        onChange={(event) => patch({ gitWorktree: event.currentTarget.value })}
                      />
                    </label>
                  ) : null}
                </div>
              </section>
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
            </article>
          </aside>
        </div>
      </div>
    </section>
  );
}
