import type { ExportSnapshot, ValidationResult } from "../lib/api";
import { ExportPanel } from "../components/ExportPanel";

export function OpsPage({
  snapshot,
  validation,
  onExport,
  onSaveExportToFile,
  onValidate,
}: {
  snapshot: ExportSnapshot | null;
  validation: ValidationResult | null;
  onExport: (kind: string) => void;
  onSaveExportToFile: () => void;
  onValidate: () => void;
}) {
  return (
    <div className="content-grid">
      <section className="panel">
        <div className="panel__header">
          <h3>校验与导出</h3>
          <span>使用现有 CLI 输出</span>
        </div>
        <div className="button-grid">
          <button type="button" onClick={onValidate}>
            运行校验
          </button>
          {["document-list", "manifest", "change-list", "asset-list"].map((kind) => (
            <button key={kind} type="button" onClick={() => onExport(kind)}>
              导出 {kind}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              snapshot ? navigator.clipboard.writeText(snapshot.content).catch(() => undefined) : undefined
            }
          >
            复制导出内容
          </button>
          <button type="button" onClick={onSaveExportToFile}>
            另存为文件
          </button>
        </div>
        <pre className="validation-panel">
          {validation ? (validation.ok ? "OK" : validation.errors.join("\n")) : "尚未运行校验"}
        </pre>
      </section>
      <ExportPanel snapshot={snapshot} />
    </div>
  );
}
