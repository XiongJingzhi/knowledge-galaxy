import { invoke } from "@tauri-apps/api/core";
import type {
  AssetRecord,
  DocumentDetail,
  DocumentFilters,
  DocumentListItem,
  ExportSnapshot,
  NavSection,
} from "./types";

type RepoSummary = {
  path: string;
  isDefault: boolean;
  exists: boolean;
};

type StatsSnapshot = {
  total: number;
  groups: Record<string, Array<{ key: string; count: number }>>;
  raw: string;
};

type ValidationResult = {
  ok: boolean;
  errors: string[];
  raw: string;
};

type ProjectListItem = {
  path: string;
  title: string;
  slug: string;
};

type CommandResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
};

type CreatePayload = {
  title: string;
  date?: string;
  gitWorktree?: string;
  body?: string;
};

type ImportAssetPayload = {
  filePath: string;
  targetName?: string;
  project?: string;
};

const isTauriRuntime = () =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

async function call<T>(command: string, payload?: Record<string, unknown>): Promise<T> {
  if (!isTauriRuntime()) {
    throw new Error("桌面命令只在 Tauri 运行时可用");
  }
  return invoke<T>(command, payload);
}

export async function selectRepo(path?: string): Promise<RepoSummary> {
  return call("select_repo", { path });
}

export async function getRecentRepos(): Promise<RepoSummary[]> {
  return call("get_recent_repos");
}

export async function listDocuments(filters: DocumentFilters): Promise<DocumentListItem[]> {
  return call("list_documents", { filters });
}

export async function searchDocuments(
  query: string,
  filters: DocumentFilters,
): Promise<DocumentListItem[]> {
  return call("search_documents", { query, filters });
}

export async function getDocument(path: string): Promise<DocumentDetail> {
  return call("get_document", { path });
}

export async function saveDocument(
  path: string,
  payload: DocumentDetail,
): Promise<{ path: string; updatedAt: string }> {
  return call("save_document", { path, payload });
}

export async function createDocument(
  docType: string,
  payload: CreatePayload,
): Promise<{ path: string }> {
  return call("create_document", { docType, payload });
}

export async function listAssets(): Promise<AssetRecord[]> {
  return call("list_assets");
}

export async function importAsset(payload: ImportAssetPayload): Promise<AssetRecord> {
  return call("import_asset", { payload });
}

export async function getStats(): Promise<StatsSnapshot> {
  return call("get_stats");
}

export async function runValidate(): Promise<ValidationResult> {
  return call("run_validate");
}

export async function runExport(kind: string): Promise<ExportSnapshot> {
  return call("run_export", { kind });
}

export async function listProjects(): Promise<ProjectListItem[]> {
  return call("list_projects");
}

export async function runProjectCommand(
  project: string,
  action: string,
  payload: Record<string, string>,
): Promise<CommandResult> {
  return call("run_project_command", { project, action, payload });
}

export async function saveExportToFile(filename: string, content: string): Promise<void> {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export type {
  CommandResult,
  ExportSnapshot,
  NavSection,
  ProjectListItem,
  RepoSummary,
  StatsSnapshot,
  ValidationResult,
};
