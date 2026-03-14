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
      <div className="repo-switcher">
        <div className="repo-switcher__header">
          <span className="eyebrow">REPOSITORY</span>
          <p>切换知识库目录，桌面端会刷新当前概况和工作区数据。</p>
        </div>
        <div className="repo-switcher__main">
          <input
            value={repoPathInput}
            onChange={(event) => onRepoPathInputChange(event.currentTarget.value)}
            placeholder="输入仓库路径，留空使用默认路径"
          />
          <button className="ghost-button" type="button" onClick={onOpenRepoDirectory}>
            打开目录
          </button>
          <button type="button" onClick={() => onRefreshOverview(repoPathInput || undefined)}>
            切换仓库
          </button>
        </div>
        {recentRepos.length ? (
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
        ) : null}
      </div>
    </header>
  );
}
