export type NavSection = "home" | "documents" | "assets" | "ops" | "projects";

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
  updatedAt: string;
};

export type DocumentViewMode = "preview" | "edit";

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

export type OpenDocumentTab = {
  id: string;
  path: string;
  title: string;
  dirty: boolean;
  mode: DocumentViewMode;
  isNew?: boolean;
};

export type DocumentTreeNode = {
  id: string;
  name: string;
  path?: string;
  updatedAt?: string;
  kind: "folder" | "document";
  children?: DocumentTreeNode[];
};

export type AssetRecord = {
  path: string;
  scope: "repo" | "project";
  project?: string;
  size_bytes: number;
  sha256: string;
};

export type KnowledgeMigrationDraft = {
  title: string;
  type: "note" | "decision" | "review" | "reference";
  summary: string;
  body: string;
  theme: string[];
  tags: string[];
  source: string[];
  status: string;
  path: string;
  originLabel: string;
};

export type KnowledgeMigrationPreview = {
  sourceLabel: string;
  drafts: KnowledgeMigrationDraft[];
  warnings: string[];
};

export type KnowledgeMigrationImportResult = {
  imported: number;
  createdPaths: string[];
  warnings: string[];
};

export type ExportSnapshot = {
  kind: string;
  content: string;
};
