import type { HomeEntryCard, OverviewCard } from "../lib/desktop-ui";
import type { NavSection } from "../lib/types";
import { ActivityFeed } from "../components/ActivityFeed";
import { OverviewStrip } from "../components/DesktopMasthead";
import type { ActivityItem } from "../lib/desktop-ui";

export function HomePage({
  globalSearch,
  overviewCards,
  entryCards,
  activityItems,
  onGlobalSearchChange,
  onGlobalSearchSubmit,
  onOpenSection,
}: {
  globalSearch: string;
  overviewCards: OverviewCard[];
  entryCards: HomeEntryCard[];
  activityItems: ActivityItem[];
  onGlobalSearchChange: (value: string) => void;
  onGlobalSearchSubmit: () => void;
  onOpenSection: (section: Exclude<NavSection, "home">) => void;
}) {
  return (
    <section className="home-dashboard">
      <section className="home-toolbar panel">
        <div className="home-toolbar__search">
          <div className="home-toolbar__copy">
            <span className="eyebrow">DESK FLOW</span>
            <h3>搜索、概览与快捷操作</h3>
            <p>在一屏里完成检索、查看仓库摘要，并继续进入具体工作区。</p>
          </div>
          <label className="field field--wide">
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
            进入文档页
          </button>
          <button className="ghost-button" type="button" onClick={() => onOpenSection("create")}>
            新建条目
          </button>
        </div>
      </section>
      <section className="home-grid">
        <section className="home-column home-column--wide">
          <section className="home-summary panel">
            <div className="panel__header">
              <h3>工作台摘要</h3>
              <span>当前知识库</span>
            </div>
            <OverviewStrip cards={overviewCards} />
          </section>
          <section className="home-entry-panel panel">
            <div className="panel__header">
              <h3>功能入口</h3>
              <span>继续操作</span>
            </div>
            <section className="home-entry-grid">
              {entryCards.map((card) => (
                <article key={card.section} className="home-entry-card">
                  <span className="eyebrow">{card.eyebrow}</span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  <button className="ghost-button" type="button" onClick={() => onOpenSection(card.section)}>
                    {card.actionLabel}
                  </button>
                </article>
              ))}
            </section>
          </section>
        </section>
        <section className="home-column">
          <section className="home-status panel">
            <div className="panel__header">
              <h3>仓库状态</h3>
              <span>实时摘要</span>
            </div>
            <div className="home-status__stack">
              <article className="home-status__card">
                <span className="eyebrow">READY</span>
                <strong>已连接当前知识库</strong>
                <p>搜索、创建、资源整理与项目命令都可直接从桌面端继续执行。</p>
              </article>
              <article className="home-status__card">
                <span className="eyebrow">INDEX</span>
                <strong>概览卡已同步</strong>
                <p>总文档、资源、最近仓库和核心分布会跟随仓库切换自动刷新。</p>
              </article>
            </div>
          </section>
          <ActivityFeed
            items={activityItems}
            title="最近动态"
            subtitle="会话回流"
            className="home-activity"
          />
        </section>
      </section>
    </section>
  );
}
