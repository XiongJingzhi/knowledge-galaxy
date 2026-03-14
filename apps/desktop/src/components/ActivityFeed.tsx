import type { ActivityItem } from "../lib/desktop-ui";

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section className="activity-feed panel">
      <div className="panel__header">
        <h3>最近操作</h3>
        <span>{items.length ? `${items.length} 条` : "等待操作"}</span>
      </div>
      <div className="activity-feed__list">
        {items.length ? (
          items.map((item, index) => (
            <article key={`${item.title}-${item.detail}-${index}`} className="activity-item">
              <span className="activity-item__index">{(index + 1).toString().padStart(2, "0")}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
                {item.note ? <span>{item.note}</span> : null}
              </div>
            </article>
          ))
        ) : (
          <article className="empty-state empty-state--compact">
            <span className="eyebrow">ACTIVITY FEED</span>
            <h4>最近还没有新的操作</h4>
            <p>创建、保存、导入、校验、导出和项目命令完成后，结果会在这里汇总展示。</p>
          </article>
        )}
      </div>
    </section>
  );
}
