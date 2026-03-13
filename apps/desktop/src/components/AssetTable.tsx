import type { AssetRecord } from "../lib/types";

export function AssetTable({
  assets,
  scopeFilter = "all",
  projectFilter = "",
}: {
  assets: AssetRecord[];
  scopeFilter?: "all" | "repo" | "project";
  projectFilter?: string;
}) {
  const visibleAssets = assets.filter((asset) => {
    if (scopeFilter !== "all" && asset.scope !== scopeFilter) {
      return false;
    }
    if (scopeFilter === "project" && projectFilter && asset.project !== projectFilter) {
      return false;
    }
    return true;
  });

  return (
    <section className="panel">
      <div className="panel__header">
        <h3>资源清单</h3>
        <span>{visibleAssets.length} 项</span>
      </div>
      <div className="asset-table">
        {visibleAssets.length ? (
          visibleAssets.map((asset) => (
            <article key={asset.path} className="asset-row">
              <div>
                <strong>{asset.path}</strong>
                <p>
                  {asset.scope === "project" ? `项目级 · ${asset.project}` : "仓库级"} ·{" "}
                  {asset.size_bytes} bytes
                </p>
              </div>
              <code>{asset.sha256}</code>
            </article>
          ))
        ) : (
          <article className="empty-state empty-state--compact">
            <span className="eyebrow">ASSET VIEW</span>
            <h4>当前筛选下没有资源</h4>
            <p>可以切换作用域，或者去右侧导入新的仓库资源与项目资源。</p>
          </article>
        )}
      </div>
    </section>
  );
}
