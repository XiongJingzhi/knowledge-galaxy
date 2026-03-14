import type { NavSection } from "../lib/types";
import type { OverviewCard } from "../lib/desktop-ui";

export function DesktopMasthead({
  section,
  sectionTitle,
  sectionDescription,
  metrics,
}: {
  section: NavSection;
  sectionTitle: string;
  sectionDescription: string;
  metrics: Array<{ label: string; value: string }>;
}) {
  return (
    <section className="desktop-masthead" aria-label="知识总览">
      <div className="desktop-masthead__core">
        <div className="desktop-masthead__headline">
          <span className="eyebrow">KNOWLEDGE GALAXY</span>
          <h3>知识总览</h3>
          <p>查看仓库状态、近期变化和当前页面的关键数据。</p>
        </div>
      </div>
      <div className="desktop-masthead__orbit">
        <article className="desktop-masthead__context">
          <span className="eyebrow">当前页面</span>
          <strong>{sectionTitle}</strong>
          <p>{sectionDescription}</p>
        </article>
        <div className="desktop-masthead__metrics">
          {metrics.map((metric) => (
            <article key={`${section}-${metric.label}`} className="desktop-metric">
              <span className="desktop-metric__label">{metric.label}</span>
              <strong className="desktop-metric__value">{metric.value}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function OverviewStrip({ cards }: { cards: OverviewCard[] }) {
  return (
    <section className="overview-strip">
      {cards.map((card) => (
        <article key={card.label} className={`overview-card overview-card--${card.accent}`}>
          <span className="overview-card__label">{card.label}</span>
          <strong className="overview-card__value">{card.value}</strong>
        </article>
      ))}
    </section>
  );
}
