import type { CreateRecipe } from "../lib/desktop-ui";

export function CreatePage({
  createRecipes,
  activeRecipe,
  createForm,
  onCreateFormChange,
  onSelectRecipe,
  onCreate,
}: {
  createRecipes: readonly CreateRecipe[];
  activeRecipe: CreateRecipe;
  createForm: {
    type: string;
    title: string;
    date: string;
    gitWorktree: string;
    body: string;
  };
  onCreateFormChange: (field: "type" | "title" | "date" | "gitWorktree" | "body", value: string) => void;
  onSelectRecipe: (type: string) => void;
  onCreate: () => void;
}) {
  return (
    <section className="panel panel--form">
      <div className="panel__header">
        <h3>创建中心</h3>
        <span>调用现有 Python CLI</span>
      </div>
      <section className="recipe-rail" aria-label="模板配方台">
        <div className="panel__header recipe-rail__header">
          <h3>模板配方台</h3>
          <span>先选模板，再补当前类型最关键的字段</span>
        </div>
        <div className="recipe-rail__grid">
          {createRecipes.map((recipe) => (
            <button
              key={recipe.type}
              className={recipe.type === createForm.type ? "recipe-card is-active" : "recipe-card"}
              type="button"
              aria-label={`切换到 ${recipe.type} 配方`}
              onClick={() => onSelectRecipe(recipe.type)}
            >
              <span className="recipe-card__title">{recipe.title}</span>
              <span className="recipe-card__description">{recipe.description}</span>
            </button>
          ))}
        </div>
      </section>
      <div className="create-context">
        <strong>{activeRecipe.title} 配方</strong>
        <span>{activeRecipe.hint}</span>
      </div>
      <div className="form-grid">
        <label className="field">
          <span>类型</span>
          <select value={createForm.type} onChange={(event) => onCreateFormChange("type", event.currentTarget.value)}>
            <option value="note">note</option>
            <option value="daily">daily</option>
            <option value="decision">decision</option>
            <option value="review">review</option>
            <option value="project">project</option>
          </select>
        </label>
        <label className="field">
          <span>标题</span>
          <input value={createForm.title} onChange={(event) => onCreateFormChange("title", event.currentTarget.value)} />
        </label>
        <label className="field">
          <span>日期</span>
          <input
            value={createForm.date}
            onChange={(event) => onCreateFormChange("date", event.currentTarget.value)}
            placeholder="review / daily 使用"
          />
        </label>
        <label className="field">
          <span>Git Worktree</span>
          <input
            value={createForm.gitWorktree}
            onChange={(event) => onCreateFormChange("gitWorktree", event.currentTarget.value)}
            placeholder="project 使用"
          />
        </label>
      </div>
      <label className="field field--editor">
        <span>正文</span>
        <textarea
          value={createForm.body}
          onChange={(event) => onCreateFormChange("body", event.currentTarget.value)}
          placeholder="note 创建时可直接写入正文"
        />
      </label>
      <button className="primary-button" type="button" onClick={onCreate}>
        创建文档
      </button>
    </section>
  );
}
