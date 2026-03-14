import type { SectionHeroData } from "../lib/desktop-ui";

export function SectionHero({ hero }: { hero: SectionHeroData }) {
  return (
    <section className="section-hero">
      <div className="section-hero__body">
        <span className="eyebrow">{hero.eyebrow}</span>
        <h3>{hero.title}</h3>
        <p>{hero.description}</p>
      </div>
      <div className="section-hero__actions">
        {hero.actions.map((action) => (
          <button
            key={action.label}
            className={action.kind === "primary" ? "primary-button" : "ghost-button"}
            type="button"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}
