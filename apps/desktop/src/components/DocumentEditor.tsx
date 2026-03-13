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

  useEffect(() => {
    setDraft(document);
    setDirty(false);
  }, [document]);

  if (!draft) {
    return <section className="panel detail-panel empty">选择一篇文档开始编辑。</section>;
  }

  const patch = (next: Partial<DocumentDetail>) => {
    setDraft({ ...draft, ...next });
    setDirty(true);
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
          <button type="button" onClick={() => draft && onSave(draft)}>
            保存文档
          </button>
        </div>
      </div>
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
