import type { OverviewCard } from "../lib/desktop-ui";
import { ActivityFeed } from "../components/ActivityFeed";
import { OverviewStrip } from "../components/DesktopMasthead";
import type { ActivityItem } from "../lib/desktop-ui";

export function HomePage({
  globalSearch,
  overviewCards,
  activityItems,
  onGlobalSearchChange,
  onGlobalSearchSubmit,
}: {
  globalSearch: string;
  overviewCards: OverviewCard[];
  activityItems: ActivityItem[];
  onGlobalSearchChange: (value: string) => void;
  onGlobalSearchSubmit: () => void;
}) {
  return (
    <section className="home-dashboard">
      <section className="home-toolbar panel">
        <div className="home-toolbar__search">
          <div className="home-toolbar__copy">
            <span className="eyebrow">DESK FLOW</span>
            <h3>搜索、概览与快捷操作</h3>
          </div>
          <label className="field field--wide home-toolbar__field">
            <span>全局搜索</span>
            <input
              aria-label="全局搜索"
              value={globalSearch}
              onChange={(event) => onGlobalSearchChange(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onGlobalSearchSubmit();
                }
              }}
              placeholder="搜索标题、正文或路径中的关键词"
            />
          </label>
        </div>
        <div className="home-toolbar__actions">
          <button className="primary-button" type="button" onClick={onGlobalSearchSubmit}>
            搜索文档
          </button>
        </div>
      </section>
      <section className="home-grid">
        <section className="home-summary panel">
          <OverviewStrip cards={overviewCards} />
        </section>
        <ActivityFeed
          items={activityItems}
          title="最近动态"
          subtitle="会话回流"
          className="home-activity"
        />
      </section>
    </section>
  );
}
