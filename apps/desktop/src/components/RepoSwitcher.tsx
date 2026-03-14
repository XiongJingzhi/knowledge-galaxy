import type { RepoSummary } from "../lib/api";

export function RepoSwitcher({
  repoPathInput,
  recentRepos,
  onRepoPathInputChange,
  onOpenRepoDirectory,
  onRefreshOverview,
}: {
  repoPathInput: string;
  recentRepos: RepoSummary[];
  onRepoPathInputChange: (value: string) => void;
  onOpenRepoDirectory: () => void;
  onRefreshOverview: (repoPath?: string) => void;
}) {
  return (
    <header className="workspace__header">
      <div className="repo-switcher repo-switcher--command">
        <div className="repo-switcher__command-copy">
          <div className="repo-switcher__header">
            <span className="eyebrow">COMMAND DESK</span>
            <h2>命令台</h2>
            <p>切换仓库、调用常用动作，并让当前工作区始终对准正在维护的知识库。</p>
          </div>
          {recentRepos.length ? (
            <div className="repo-switcher__rail" aria-label="最近仓库">
              <div className="repo-switcher__rail-header">
                <span className="eyebrow">RECENTS</span>
                <strong>最近仓库</strong>
              </div>
              <div className="recent-repos">
                {recentRepos.map((recent) => (
                  <button
                    key={recent.path}
                    className="ghost-button"
                    type="button"
                    onClick={() => onRefreshOverview(recent.path)}
                  >
                    {recent.isDefault ? "默认仓库" : recent.path}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div className="repo-switcher__command-actions">
          <label className="repo-switcher__path-field">
            <span className="eyebrow">REPOSITORY PATH</span>
            <input
              value={repoPathInput}
              onChange={(event) => onRepoPathInputChange(event.currentTarget.value)}
              placeholder="输入仓库路径，留空使用默认路径"
            />
          </label>
          <div className="repo-switcher__main">
            <button className="ghost-button" type="button" onClick={onOpenRepoDirectory}>
              打开目录
            </button>
            <button type="button" onClick={() => onRefreshOverview(repoPathInput || undefined)}>
              切换仓库
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
