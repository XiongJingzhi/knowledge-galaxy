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
    <div className="content-grid">
      <div className="panel-stack">
        <section className="panel">
          <div className="panel__header">
            <h3>资源过滤</h3>
            <span>按作用域查看</span>
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
      <section className="panel panel--form">
        <div className="panel__header">
          <h3>导入资源</h3>
          <span>仓库级或项目级</span>
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
