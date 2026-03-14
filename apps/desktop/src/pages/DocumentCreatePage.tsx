import { DocumentEditor } from "../components/DocumentEditor";
import type { DocumentDetail } from "../lib/types";

export function DocumentCreatePage({
  mode,
  document,
  onBack,
  onSave,
}: {
  mode: "create" | "edit";
  document: DocumentDetail | null;
  onBack: () => void;
  onSave: (value: DocumentDetail) => Promise<void>;
}) {
  const title = mode === "create" ? "新建文档" : "编辑文档";
  const description = mode === "create" ? "左侧写 Markdown，右侧实时查看预览。" : "在独立工作区里继续修改 Markdown 和结构字段。";
  const actionLabel = mode === "create" ? "创建文档" : "保存文档";

  return (
    <section className="document-workspace-page">
      <div className="document-workspace-page__header">
        <div>
          <span className="eyebrow">DOCUMENT WORKSPACE</span>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <button className="ghost-button" type="button" onClick={onBack}>
          返回文档
        </button>
      </div>
      <DocumentEditor document={document} mode={mode} actionLabel={actionLabel} onSave={onSave} />
    </section>
  );
}
