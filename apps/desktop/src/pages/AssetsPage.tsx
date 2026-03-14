import type { AssetRecord } from "../lib/types";
import { AssetTable } from "../components/AssetTable";

export function AssetsPage({
  assets,
  assetForm,
  assetProjectFilter,
  assetScope,
  onAssetFormChange,
  onAssetProjectFilterChange,
  onAssetScopeChange,
  onImportAsset,
}: {
  assets: AssetRecord[];
  assetForm: {
    filePath: string;
    targetName: string;
    project: string;
  };
  assetProjectFilter: string;
  assetScope: "all" | "repo" | "project";
  onAssetFormChange: (field: "filePath" | "targetName" | "project", value: string) => void;
  onAssetProjectFilterChange: (value: string) => void;
  onAssetScopeChange: (value: "all" | "repo" | "project") => void;
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
            <span>先收敛作用域和项目范围，再查看仓库级与项目级资源的库存状态。</span>
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
        <AssetTable assets={assets} scopeFilter={assetScope} projectFilter={assetProjectFilter} />
      </div>
      <section className="panel panel--form asset-import-panel">
        <div className="panel__header">
          <h3>导入面板</h3>
          <span>仓库级或项目级</span>
        </div>
        <div className="create-context">
          <strong>导入目标</strong>
          <span>填写本地文件路径、目标文件名和项目 slug，把新的资源接入当前知识库。</span>
        </div>
        <div className="form-grid">
          <label className="field">
            <span>本地文件路径</span>
            <input value={assetForm.filePath} onChange={(event) => onAssetFormChange("filePath", event.currentTarget.value)} />
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
    </div>
  );
}
