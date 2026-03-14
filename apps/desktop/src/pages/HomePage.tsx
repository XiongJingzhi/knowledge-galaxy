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
    <section className="home-grid">
      <section className="home-command panel">
        <div className="panel__header">
          <h3>快速入口</h3>
          <span>搜索与导航</span>
        </div>
        <div className="home-command__body">
          <div className="home-command__copy">
            <span className="eyebrow">GLOBAL SEARCH</span>
            <strong>全局搜索</strong>
            <p>搜索标题、正文或路径中的关键词，直接进入文档页继续处理。</p>
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
          <div className="home-command__actions">
            <button className="primary-button" type="button" onClick={onGlobalSearchSubmit}>
              进入文档页
            </button>
            <button className="ghost-button" type="button" onClick={() => onOpenSection("create")}>
              进入创建页
            </button>
          </div>
        </div>
      </section>
      <section className="home-summary">
        <OverviewStrip cards={overviewCards} />
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
      <ActivityFeed items={activityItems} />
    </section>
  );
}
