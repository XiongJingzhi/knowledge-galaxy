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
    <div className="content-grid create-workbench">
      <section className="panel create-recipe-panel">
        <div className="panel__header">
          <h3>配方台</h3>
          <span>模板切换</span>
        </div>
        <section className="recipe-rail" aria-label="模板配方台">
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
      </section>
      <section className="panel panel--form create-form-panel">
        <div className="panel__header">
          <h3>创建中心</h3>
          <span>结构字段</span>
        </div>
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
        <button className="primary-button" type="button" onClick={onCreate}>
          创建文档
        </button>
      </section>
      <section className="panel draft-panel">
        <div className="panel__header">
          <h3>正文起草</h3>
          <span>Markdown 初稿</span>
        </div>
        <label className="field field--editor">
          <span>正文</span>
          <textarea
            value={createForm.body}
            onChange={(event) => onCreateFormChange("body", event.currentTarget.value)}
            placeholder="note 创建时可直接写入正文"
          />
        </label>
      </section>
    </div>
  );
}
