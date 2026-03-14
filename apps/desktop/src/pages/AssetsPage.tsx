import type { AssetRecord, KnowledgeMigrationImportResult, KnowledgeMigrationPreview } from "../lib/types";
import { AssetTable } from "../components/AssetTable";

export function AssetsPage({
  assets,
  selectedAsset,
  assetForm,
  assetProjectFilter,
  assetScope,
  migrationForm,
  migrationImportResult,
  migrationPreview,
  onAssetFormChange,
  onChooseAssetFile,
  onChooseKnowledgeSource,
  onAnalyzeKnowledgeMigration,
  onImportKnowledgeMigration,
  onAssetProjectFilterChange,
  onAssetScopeChange,
  onMigrationFormChange,
  onSelectAsset,
  onImportAsset,
}: {
  assets: AssetRecord[];
  selectedAsset: AssetRecord | null;
  assetForm: {
    filePath: string;
    targetName: string;
    project: string;
  };
  assetProjectFilter: string;
  assetScope: "all" | "repo" | "project";
  migrationForm: {
    filePath: string;
    model: string;
  };
  migrationImportResult: KnowledgeMigrationImportResult | null;
  migrationPreview: KnowledgeMigrationPreview | null;
  onAssetFormChange: (field: "filePath" | "targetName" | "project", value: string) => void;
  onChooseAssetFile: () => void;
  onChooseKnowledgeSource: () => void;
  onAnalyzeKnowledgeMigration: () => void;
  onImportKnowledgeMigration: () => void;
  onAssetProjectFilterChange: (value: string) => void;
  onAssetScopeChange: (value: "all" | "repo" | "project") => void;
  onMigrationFormChange: (field: "filePath" | "model", value: string) => void;
  onSelectAsset: (path: string) => void;
  onImportAsset: () => void;
}) {
  return (
    <div className="content-grid asset-workbench">
      <div className="panel-stack asset-index-panel">
        <section className="panel">
          <div className="panel__header">
            <h3>资源索引台</h3>
            <span>作用域与检索</span>
          </div>
          <div className="view-context view-context--compact">
            <strong>当前资产库存</strong>
            <span>先聚焦作用域，再从清单里选中资源查看详情和导入结果。</span>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>作用域</span>
              <select value={assetScope} onChange={(event) => onAssetScopeChange(event.currentTarget.value as "all" | "repo" | "project")}>
                <option value="all">全部</option>
                <option value="repo">仓库级</option>
                <option value="project">项目级</option>
              </select>
            </label>
            <label className="field">
              <span>过滤项目 slug</span>
              <input
                value={assetProjectFilter}
                onChange={(event) => onAssetProjectFilterChange(event.currentTarget.value)}
                placeholder="仅项目级过滤时生效"
                disabled={assetScope !== "project"}
              />
            </label>
          </div>
        </section>
        <AssetTable
          assets={assets}
          projectFilter={assetProjectFilter}
          scopeFilter={assetScope}
          selectedPath={selectedAsset?.path ?? null}
          onSelectAsset={onSelectAsset}
        />
      </div>
      <div className="panel-stack asset-import-panel">
        <section className="detail-panel panel">
          <div className="detail-panel__header">
            <h3>资源详情</h3>
            <span>{selectedAsset ? "当前选中" : "等待选择"}</span>
          </div>
          {selectedAsset ? (
            <div className="detail-panel__meta asset-detail-grid">
              <div className="field">
                <span>路径</span>
                <code>{selectedAsset.path}</code>
              </div>
              <div className="field">
                <span>作用域</span>
                <strong>{selectedAsset.scope}</strong>
              </div>
              <div className="field">
                <span>项目</span>
                <strong>{selectedAsset.project ?? "repo"}</strong>
              </div>
              <div className="field">
                <span>大小</span>
                <strong>{selectedAsset.size_bytes} bytes</strong>
              </div>
              <div className="field field--wide">
                <span>SHA256</span>
                <code>{selectedAsset.sha256}</code>
              </div>
            </div>
          ) : (
            <article className="empty-state empty-state--compact">
              <span className="eyebrow">ASSET DETAILS</span>
              <h4>还没有选中资源</h4>
              <p>从左侧清单选择一项资源，或者导入一个新文件后直接查看它的元数据。</p>
            </article>
          )}
        </section>
        <section className="panel panel--form">
          <div className="panel__header">
            <h3>导入面板</h3>
            <span>仓库级或项目级</span>
          </div>
          <div className="create-context">
            <strong>导入目标</strong>
            <span>通过桌面文件选择器接入本地资源，再补充目标文件名和项目 slug。</span>
          </div>
          <div className="form-grid">
            <label className="field field--wide">
              <span>本地文件路径</span>
              <div className="asset-file-picker">
                <input readOnly value={assetForm.filePath} />
                <button className="secondary-button" type="button" onClick={onChooseAssetFile}>
                  选择文件
                </button>
              </div>
            </label>
            <label className="field">
              <span>目标文件名</span>
              <input value={assetForm.targetName} onChange={(event) => onAssetFormChange("targetName", event.currentTarget.value)} />
            </label>
            <label className="field">
              <span>导入到项目 slug</span>
              <input value={assetForm.project} onChange={(event) => onAssetFormChange("project", event.currentTarget.value)} />
            </label>
          </div>
          <button className="primary-button" type="button" onClick={onImportAsset}>
            导入资源
          </button>
        </section>
        <section className="panel panel--form">
          <div className="panel__header">
            <h3>知识迁移</h3>
            <span>md / zip + Ollama</span>
          </div>
          <div className="create-context">
            <strong>迁移工作台</strong>
            <span>导入外部 Markdown 或压缩包，先生成分类预览，再确认写入知识星系。</span>
          </div>
          <div className="form-grid">
            <label className="field field--wide">
              <span>知识源文件</span>
              <div className="asset-file-picker">
                <input
                  readOnly
                  value={migrationForm.filePath}
                  onChange={(event) => onMigrationFormChange("filePath", event.currentTarget.value)}
                />
                <button className="secondary-button" type="button" onClick={onChooseKnowledgeSource}>
                  选择知识源
                </button>
              </div>
            </label>
            <label className="field">
              <span>Ollama 模型</span>
              <input
                value={migrationForm.model}
                onChange={(event) => onMigrationFormChange("model", event.currentTarget.value)}
              />
            </label>
          </div>
          <div className="button-row">
            <button className="secondary-button" type="button" onClick={onAnalyzeKnowledgeMigration}>
              生成迁移预览
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={onImportKnowledgeMigration}
              disabled={!migrationPreview?.drafts.length}
            >
              导入知识
            </button>
          </div>
          {migrationPreview ? (
            <div className="migration-preview">
              <div className="detail-panel__header">
                <h3>迁移预览</h3>
                <span>{migrationPreview.drafts.length} 条候选知识</span>
              </div>
              {migrationPreview.warnings.length ? (
                <ul className="migration-preview__warnings">
                  {migrationPreview.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}
              <div className="migration-preview__list">
                {migrationPreview.drafts.map((draft) => (
                  <article className="migration-preview__item" key={`${draft.path}-${draft.originLabel}`}>
                    <div className="migration-preview__heading">
                      <strong>{draft.title}</strong>
                      <span>{draft.type}</span>
                    </div>
                    <p>{draft.summary}</p>
                    <div className="migration-preview__meta">
                      <code>{draft.path}</code>
                      <span>{draft.originLabel}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
          {migrationImportResult ? (
            <div className="migration-preview migration-preview--result">
              <div className="detail-panel__header">
                <h3>已导入知识</h3>
                <span>{migrationImportResult.imported} 篇文档</span>
              </div>
              {migrationImportResult.warnings.length ? (
                <ul className="migration-preview__warnings">
                  {migrationImportResult.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}
              <div className="migration-preview__list">
                {migrationImportResult.createdPaths.map((path) => (
                  <article className="migration-preview__item" key={path}>
                    <div className="migration-preview__meta">
                      <code>{path}</code>
                      <span>已写入知识星系</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
