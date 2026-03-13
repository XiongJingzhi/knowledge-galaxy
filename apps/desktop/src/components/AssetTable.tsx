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
        {visibleAssets.map((asset) => (
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
        ))}
      </div>
    </section>
  );
}
