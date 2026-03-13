import type { DocumentFilters as Filters } from "../lib/types";

const fields: Array<{ key: keyof Filters; label: string; placeholder: string }> = [
  { key: "type", label: "类型", placeholder: "note / review / project" },
  { key: "status", label: "状态", placeholder: "active / inbox" },
  { key: "project", label: "项目", placeholder: "atlas" },
  { key: "date", label: "日期", placeholder: "2026-03-13" },
  { key: "theme", label: "主题", placeholder: "knowledge" },
  { key: "tag", label: "标签", placeholder: "mvp" },
  { key: "source", label: "来源", placeholder: "field-notes" },
];

export function DocumentFilters({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
}) {
  return (
    <div className="filter-grid">
      {fields.map((field) => (
        <label key={field.key} className="field">
          <span>{field.label}</span>
          <input
            aria-label={field.label}
            value={filters[field.key] ?? ""}
            onChange={(event) =>
              onChange({
                ...filters,
                [field.key]: event.currentTarget.value,
              })
            }
            placeholder={field.placeholder}
          />
        </label>
      ))}
    </div>
  );
}
