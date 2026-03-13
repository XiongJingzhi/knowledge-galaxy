export type NavSection = "documents" | "create" | "assets" | "ops" | "projects";

export type DocumentFilters = {
  type?: string;
  status?: string;
  project?: string;
  date?: string;
  theme?: string;
  tag?: string;
  source?: string;
};

export type DocumentListItem = {
  path: string;
  title: string;
  type: string;
  status: string;
};

export type DocumentDetail = {
  path: string;
  id: string;
  type: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  status: string;
  date: string;
  theme: string[];
  project: string[];
  tags: string[];
  source: string[];
  summary: string;
  body: string;
  gitWorktree: string;
};

export type AssetRecord = {
  path: string;
  scope: "repo" | "project";
  project?: string;
  size_bytes: number;
  sha256: string;
};

export type ExportSnapshot = {
  kind: string;
  content: string;
};
