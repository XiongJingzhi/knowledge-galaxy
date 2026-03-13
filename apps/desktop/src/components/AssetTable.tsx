import type { AssetRecord } from "../lib/types";

export function AssetTable({ assets }: { assets: AssetRecord[] }) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h3>资源清单</h3>
        <span>{assets.length} 项</span>
      </div>
      <div className="asset-table">
        {assets.map((asset) => (
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
