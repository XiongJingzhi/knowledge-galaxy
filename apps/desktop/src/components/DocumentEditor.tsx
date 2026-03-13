import { useEffect, useState } from "react";
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

export function DocumentEditor({
  document,
  onSave,
}: {
  document: DocumentDetail | null;
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
        <span className="eyebrow">DOCUMENT DETAIL</span>
        <h3>还没有选中文档</h3>
        <p>从左侧列表选择一篇文档，右侧就会切换到可编辑的档案视图。</p>
      </section>
    );
  }

  const patch = (next: Partial<DocumentDetail>) => {
    setDraft({ ...draft, ...next });
    setDirty(true);
  };
  const dossierGroups = [
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
    <section className="panel detail-panel">
      <div className="detail-panel__header">
        <div>
          <span className="eyebrow">{draft.path}</span>
          <h2>{draft.title}</h2>
        </div>
        <div className="detail-panel__status">
          {dirty ? <span className="status-pill is-dirty">未保存变更</span> : null}
          <button className="ghost-button" type="button" onClick={() => void handleCopyPath()}>
            {copiedPath ? "已复制路径" : "复制路径"}
          </button>
          <button type="button" onClick={() => draft && onSave(draft)}>
            保存文档
          </button>
        </div>
      </div>
      <section className="dossier-strip">
        <div className="dossier-strip__header">
          <span className="eyebrow">文档档案</span>
          <p>先确认文档身份、更新时间和关系标签，再进入 frontmatter 与正文编辑。</p>
        </div>
        <div className="dossier-strip__grid">
          <article className="dossier-card">
            <span className="dossier-card__label">类型</span>
            <strong className="dossier-card__value">{draft.type}</strong>
          </article>
          <article className="dossier-card">
            <span className="dossier-card__label">Slug</span>
            <strong className="dossier-card__value">{draft.slug}</strong>
          </article>
          <article className="dossier-card">
            <span className="dossier-card__label">创建时间</span>
            <strong className="dossier-card__value dossier-card__value--small">{draft.createdAt}</strong>
          </article>
          <article className="dossier-card">
            <span className="dossier-card__label">更新时间</span>
            <strong className="dossier-card__value dossier-card__value--small">{draft.updatedAt}</strong>
          </article>
        </div>
        <div className="taxonomy-strip">
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
      </section>
      <div className="detail-panel__meta">
        <label className="field">
          <span>标题</span>
          <input
            aria-label="标题"
            value={draft.title}
            onChange={(event) => patch({ title: event.currentTarget.value })}
          />
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
          <span>日期</span>
          <input
            aria-label="日期"
            value={draft.date}
            onChange={(event) => patch({ date: event.currentTarget.value })}
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
      <div className="editor-grid">
        <label className="field field--editor">
          <span>Markdown 正文</span>
          <textarea
            aria-label="Markdown 正文"
            value={draft.body}
            onChange={(event) => patch({ body: event.currentTarget.value })}
          />
        </label>
        <section className="preview-panel">
          <span className="eyebrow">预览</span>
          <pre>{draft.body}</pre>
        </section>
      </div>
    </section>
  );
}
