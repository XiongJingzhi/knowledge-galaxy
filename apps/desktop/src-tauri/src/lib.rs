use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;

const REPOSITORY_DIRECTORIES: [&str; 10] = [
    "templates",
    "notes",
    "dailies",
    "decisions",
    "reviews",
    "references",
    "themes",
    "projects",
    "assets",
    "inbox",
];

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RepoSummary {
    path: String,
    is_default: bool,
    exists: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DocumentListItem {
    path: String,
    title: String,
    #[serde(rename = "type")]
    document_type: String,
    status: String,
    updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DocumentDetail {
    path: String,
    id: String,
    #[serde(rename = "type")]
    document_type: String,
    slug: String,
    created_at: String,
    updated_at: String,
    title: String,
    status: String,
    date: String,
    theme: Vec<String>,
    project: Vec<String>,
    tags: Vec<String>,
    source: Vec<String>,
    summary: String,
    body: String,
    git_worktree: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AssetRecord {
    path: String,
    scope: String,
    project: Option<String>,
    size_bytes: u64,
    sha256: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
enum KnowledgeMigrationSourceKind {
    Markdown,
    Zip,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct KnowledgeMigrationDraft {
    title: String,
    #[serde(rename = "type")]
    document_type: String,
    summary: String,
    body: String,
    theme: Vec<String>,
    tags: Vec<String>,
    source: Vec<String>,
    status: String,
    path: String,
    origin_label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct KnowledgeMigrationPreview {
    source_label: String,
    drafts: Vec<KnowledgeMigrationDraft>,
    warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct KnowledgeMigrationImportResult {
    imported: usize,
    created_paths: Vec<String>,
    warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ExportSnapshot {
    kind: String,
    content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ProjectListItem {
    path: String,
    title: String,
    slug: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct GroupCount {
    key: String,
    count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct StatsSnapshot {
    total: usize,
    groups: HashMap<String, Vec<GroupCount>>,
    raw: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ValidationResult {
    ok: bool,
    errors: Vec<String>,
    raw: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CommandResult {
    ok: bool,
    stdout: String,
    stderr: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SaveResult {
    path: String,
    updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreatePayload {
    title: String,
    date: Option<String>,
    git_worktree: Option<String>,
    body: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportAssetPayload {
    file_path: String,
    target_name: Option<String>,
    project: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyzeKnowledgeMigrationPayload {
    file_path: String,
    model: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportKnowledgeMigrationPayload {
    file_path: String,
    model: String,
    drafts: Vec<KnowledgeMigrationDraft>,
}

#[derive(Debug, Clone, Deserialize, Default)]
pub struct DocumentFilters {
    #[serde(rename = "type")]
    document_type: Option<String>,
    status: Option<String>,
    project: Option<String>,
    date: Option<String>,
    theme: Option<String>,
    tag: Option<String>,
    source: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct RecentRepoStore {
    recent_repos: Vec<String>,
}

impl RecentRepoStore {
    fn load(path: &Path) -> Self {
        match fs::read_to_string(path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => Self::default(),
        }
    }

    fn save(&self, path: &Path) -> Result<(), String> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|err| err.to_string())?;
        }
        let payload = serde_json::to_string_pretty(self).map_err(|err| err.to_string())?;
        fs::write(path, payload).map_err(|err| err.to_string())
    }

    fn update_with_repo(&mut self, repo_path: &str) {
        self.recent_repos.retain(|item| item != repo_path);
        self.recent_repos.insert(0, repo_path.to_string());
        self.recent_repos.truncate(8);
    }
}

struct AppContext {
    workspace_root: PathBuf,
    current_repo: PathBuf,
    store_path: PathBuf,
    recent: RecentRepoStore,
}

pub struct AppState {
    context: Mutex<AppContext>,
}

#[derive(Debug)]
struct ProcessOutput {
    success: bool,
    stdout: String,
    stderr: String,
}

#[derive(Debug)]
enum FrontmatterValue {
    Scalar(String),
    List(Vec<String>),
}

#[derive(Debug, Clone)]
struct KnowledgeMigrationEntry {
    origin_label: String,
    body: String,
}

#[derive(Debug, Clone, Deserialize)]
struct RawKnowledgeMigrationDraft {
    title: String,
    #[serde(rename = "type")]
    document_type: String,
    summary: String,
    body: String,
    #[serde(default)]
    theme: Vec<String>,
    #[serde(default)]
    tags: Vec<String>,
    #[serde(default)]
    source: Vec<String>,
    #[serde(default = "default_migration_status")]
    status: String,
}

#[derive(Debug, Clone, Deserialize)]
struct RawKnowledgeMigrationResponse {
    drafts: Vec<RawKnowledgeMigrationDraft>,
    #[serde(default)]
    warnings: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
struct OllamaGenerateRequest {
    model: String,
    prompt: String,
    stream: bool,
    format: serde_json::Value,
}

#[derive(Debug, Clone, Deserialize)]
struct OllamaGenerateResponse {
    response: String,
}

fn workspace_root() -> PathBuf {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    manifest_dir
        .parent()
        .and_then(Path::parent)
        .and_then(Path::parent)
        .expect("workspace root should exist")
        .to_path_buf()
}

fn default_migration_status() -> String {
    "inbox".to_string()
}

fn detect_migration_source_kind(path: &Path) -> Result<KnowledgeMigrationSourceKind, String> {
    match path
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_ascii_lowercase())
        .as_deref()
    {
        Some("md" | "markdown" | "txt") => Ok(KnowledgeMigrationSourceKind::Markdown),
        Some("zip") => Ok(KnowledgeMigrationSourceKind::Zip),
        _ => Err("知识迁移仅支持 md、markdown、txt 或 zip".to_string()),
    }
}

fn migration_slugify(value: &str) -> String {
    let mut slug = String::new();
    let mut previous_dash = false;
    for ch in value.chars() {
        let lower = ch.to_ascii_lowercase();
        if lower.is_ascii_alphanumeric() {
            slug.push(lower);
            previous_dash = false;
        } else if !previous_dash {
            slug.push('-');
            previous_dash = true;
        }
    }
    slug.trim_matches('-').to_string()
}

fn extract_migration_entries_from_zip_bytes(bytes: &[u8]) -> Result<Vec<KnowledgeMigrationEntry>, String> {
    let reader = std::io::Cursor::new(bytes);
    let mut archive = zip::ZipArchive::new(reader).map_err(|err| err.to_string())?;
    let mut entries = Vec::new();
    for index in 0..archive.len() {
        let mut file = archive.by_index(index).map_err(|err| err.to_string())?;
        if !file.is_file() {
            continue;
        }
        let name = file.name().to_string();
        let extension = Path::new(&name)
            .extension()
            .and_then(|value| value.to_str())
            .map(|value| value.to_ascii_lowercase());
        if !matches!(extension.as_deref(), Some("md" | "markdown" | "txt")) {
            continue;
        }
        let mut body = String::new();
        std::io::Read::read_to_string(&mut file, &mut body).map_err(|err| err.to_string())?;
        if body.trim().is_empty() {
            continue;
        }
        entries.push(KnowledgeMigrationEntry {
            origin_label: name,
            body,
        });
    }
    Ok(entries)
}

fn migration_relative_path(document_type: &str, slug: &str) -> PathBuf {
    match document_type {
        "decision" => PathBuf::from("decisions").join(format!("{slug}.md")),
        "review" => PathBuf::from("reviews").join(format!("{slug}.md")),
        "reference" => PathBuf::from("references").join(format!("{slug}.md")),
        _ => PathBuf::from("notes").join(format!("{slug}.md")),
    }
}

fn unique_migration_target_path(repo_root: &Path, document_type: &str, slug: &str) -> PathBuf {
    let base_slug = if slug.trim().is_empty() {
        "migrated-note".to_string()
    } else {
        slug.to_string()
    };
    let mut attempt = 1usize;
    loop {
        let candidate_slug = if attempt == 1 {
            base_slug.clone()
        } else {
            format!("{base_slug}-{}", attempt)
        };
        let relative = migration_relative_path(document_type, &candidate_slug);
        if !repo_root.join(&relative).exists() {
            return relative;
        }
        attempt += 1;
    }
}

fn migration_document_id() -> String {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    format!("migrated-{nanos}")
}

fn parse_migration_model_response(content: &str, origin_label: &str) -> Result<KnowledgeMigrationPreview, String> {
    let parsed: RawKnowledgeMigrationResponse = serde_json::from_str(content).map_err(|err| err.to_string())?;
    let drafts = parsed
        .drafts
        .into_iter()
        .map(|draft| {
            let document_type = match draft.document_type.as_str() {
                "decision" | "review" | "reference" => draft.document_type,
                _ => "note".to_string(),
            };
            let slug = migration_slugify(&draft.title);
            let path = migration_relative_path(&document_type, &slug)
                .to_string_lossy()
                .into_owned();
            KnowledgeMigrationDraft {
                title: draft.title,
                document_type,
                summary: draft.summary,
                body: draft.body,
                theme: draft.theme,
                tags: draft.tags,
                source: if draft.source.is_empty() {
                    vec![origin_label.to_string()]
                } else {
                    draft.source
                },
                status: if draft.status.trim().is_empty() {
                    default_migration_status()
                } else {
                    draft.status
                },
                path,
                origin_label: origin_label.to_string(),
            }
        })
        .collect();

    Ok(KnowledgeMigrationPreview {
        source_label: origin_label.to_string(),
        drafts,
        warnings: parsed.warnings,
    })
}

fn ollama_response_schema() -> serde_json::Value {
    serde_json::json!({
        "type": "object",
        "properties": {
            "drafts": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": { "type": "string" },
                        "type": { "type": "string", "enum": ["note", "decision", "review", "reference"] },
                        "summary": { "type": "string" },
                        "body": { "type": "string" },
                        "theme": { "type": "array", "items": { "type": "string" } },
                        "tags": { "type": "array", "items": { "type": "string" } },
                        "source": { "type": "array", "items": { "type": "string" } },
                        "status": { "type": "string" }
                    },
                    "required": ["title", "type", "summary", "body"]
                }
            },
            "warnings": {
                "type": "array",
                "items": { "type": "string" }
            }
        },
        "required": ["drafts", "warnings"]
    })
}

fn build_migration_prompt(entry: &KnowledgeMigrationEntry) -> String {
    format!(
        "你是 Knowledge Galaxy 的本地分类助手。\
请把下面的外部知识源整理成 1 条适合知识星系的 Markdown 文档草稿。\
仅允许 type 使用 note、decision、review、reference 其中之一。\
summary 必须简短。body 必须是整理后的 Markdown 正文，不要包含 YAML frontmatter。\
theme、tags、source 使用短字符串数组；如果没有就返回空数组。\
status 默认 inbox。\
输入来源: {origin}\n\n内容如下:\n{body}",
        origin = entry.origin_label,
        body = entry.body
    )
}

fn call_ollama_for_migration(model: &str, entry: &KnowledgeMigrationEntry) -> Result<KnowledgeMigrationPreview, String> {
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(90))
        .build()
        .map_err(|err| err.to_string())?;
    let request = OllamaGenerateRequest {
        model: model.to_string(),
        prompt: build_migration_prompt(entry),
        stream: false,
        format: ollama_response_schema(),
    };
    let response = client
        .post("http://127.0.0.1:11434/api/generate")
        .json(&request)
        .send()
        .map_err(|err| format!("调用 Ollama 失败: {err}"))?;
    if !response.status().is_success() {
        return Err(format!("Ollama 返回错误状态: {}", response.status()));
    }
    let payload: OllamaGenerateResponse = response.json().map_err(|err| err.to_string())?;
    parse_migration_model_response(&payload.response, &entry.origin_label)
}

fn app_config_path(app: &tauri::AppHandle) -> PathBuf {
    match app.path().app_config_dir() {
        Ok(path) => path.join("knowledge-galaxy-desktop.json"),
        Err(_) => default_repo_root().join(".desktop-config.json"),
    }
}

fn default_repo_root() -> PathBuf {
    home_dir().unwrap_or_else(|| workspace_root()).join(".knowledge-galax")
}

fn home_dir() -> Option<PathBuf> {
    std::env::var_os("HOME")
        .map(PathBuf::from)
        .or_else(|| std::env::var_os("USERPROFILE").map(PathBuf::from))
}

fn expand_user_path(path: &str) -> PathBuf {
    if path == "~" {
        return home_dir().unwrap_or_else(|| PathBuf::from(path));
    }
    if let Some(stripped) = path.strip_prefix("~/") {
        return home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(stripped);
    }
    PathBuf::from(path)
}

fn normalize_repo_path(path: Option<&str>) -> Result<PathBuf, String> {
    let candidate = match path {
        Some(value) if !value.trim().is_empty() => expand_user_path(value.trim()),
        _ => default_repo_root(),
    };
    let absolute = if candidate.is_absolute() {
        candidate
    } else {
        std::env::current_dir()
            .map_err(|err| err.to_string())?
            .join(candidate)
    };
    Ok(absolute)
}

fn ensure_repository_layout(repo_root: &Path) -> Result<(), String> {
    fs::create_dir_all(repo_root).map_err(|err| err.to_string())?;
    for directory in REPOSITORY_DIRECTORIES {
        fs::create_dir_all(repo_root.join(directory)).map_err(|err| err.to_string())?;
    }
    Ok(())
}

fn build_repo_summary(repo_path: &Path) -> RepoSummary {
    let default_root = default_repo_root();
    RepoSummary {
        path: repo_path.to_string_lossy().into_owned(),
        is_default: repo_path == default_root,
        exists: repo_path.exists(),
    }
}

pub fn build_python_command_args(repo: &str, extra: &[String]) -> Vec<String> {
    let mut args = vec![
        "-m".to_string(),
        "implementations.python.kg".to_string(),
        "--repo".to_string(),
        repo.to_string(),
    ];
    args.extend(extra.iter().cloned());
    args
}

fn run_python_cli(
    workspace_root: &Path,
    repo: &Path,
    extra: &[String],
    stdin: Option<&str>,
) -> Result<ProcessOutput, String> {
    let repo_text = repo.to_string_lossy().into_owned();
    let args = build_python_command_args(&repo_text, extra);
    let executables = if cfg!(target_os = "windows") {
        vec!["python".to_string(), "python3".to_string()]
    } else {
        vec!["python3".to_string(), "python".to_string()]
    };
    let mut last_error = None;

    for executable in executables {
        let mut command = Command::new(&executable);
        command.current_dir(workspace_root).args(&args);
        if stdin.is_some() {
            command.stdin(Stdio::piped());
        }
        command.stdout(Stdio::piped()).stderr(Stdio::piped());
        match command.spawn() {
            Ok(mut child) => {
                if let Some(input) = stdin {
                    if let Some(mut handle) = child.stdin.take() {
                        handle
                            .write_all(input.as_bytes())
                            .map_err(|err| err.to_string())?;
                    }
                }
                let output = child.wait_with_output().map_err(|err| err.to_string())?;
                return Ok(ProcessOutput {
                    success: output.status.success(),
                    stdout: String::from_utf8_lossy(&output.stdout).trim().to_string(),
                    stderr: String::from_utf8_lossy(&output.stderr).trim().to_string(),
                });
            }
            Err(err) => {
                last_error = Some(err.to_string());
            }
        }
    }

    Err(last_error.unwrap_or_else(|| "无法启动 Python CLI".to_string()))
}

fn cli_error(output: ProcessOutput) -> String {
    if output.stderr.trim().is_empty() {
        output.stdout
    } else {
        output.stderr
    }
}

fn parse_tsv_lines(stdout: &str) -> Vec<DocumentListItem> {
    stdout
        .lines()
        .filter_map(|line| {
            let mut parts = line.splitn(3, '\t');
            let document_type = parts.next()?.trim();
            let title = parts.next()?.trim();
            let path = parts.next()?.trim();
            Some(DocumentListItem {
                path: path.to_string(),
                title: title.to_string(),
                document_type: document_type.to_string(),
                status: String::new(),
                updated_at: String::new(),
            })
        })
        .collect()
}

fn load_document_index_map(
    state: &tauri::State<'_, AppState>,
) -> Result<HashMap<String, (String, String)>, String> {
    let output = run_cli_with_state(
        state,
        &["export".to_string(), "document-list".to_string()],
        None,
    )?;
    if !output.success {
        return Err(cli_error(output));
    }
    let rows: Vec<serde_json::Value> =
        serde_json::from_str(&output.stdout).map_err(|err| err.to_string())?;
    Ok(rows
        .into_iter()
        .filter_map(|row| {
            Some((
                row.get("path")?.as_str()?.to_string(),
                (
                    row.get("status")?.as_str()?.to_string(),
                    row.get("updated_at")?.as_str()?.to_string(),
                ),
            ))
        })
        .collect())
}

fn with_document_status(
    state: &tauri::State<'_, AppState>,
    items: Vec<DocumentListItem>,
) -> Result<Vec<DocumentListItem>, String> {
    let index_map = load_document_index_map(state)?;
    Ok(items
        .into_iter()
        .map(|mut item| {
            if let Some((status, updated_at)) = index_map.get(&item.path) {
                item.status = status.clone();
                item.updated_at = updated_at.clone();
            }
            item
        })
        .collect())
}

fn parse_stats(stdout: &str) -> StatsSnapshot {
    let mut total = 0usize;
    let mut groups: HashMap<String, Vec<GroupCount>> = HashMap::new();
    for line in stdout.lines().filter(|line| !line.trim().is_empty()) {
        let mut parts = line.splitn(2, '\t');
        let key = parts.next().unwrap_or_default().trim();
        let value = parts.next().unwrap_or_default().trim();
        if key == "total" {
            total = value.parse::<usize>().unwrap_or(0);
            continue;
        }
        if let Some((group, group_key)) = key.split_once(':') {
            groups.entry(group.to_string()).or_default().push(GroupCount {
                key: group_key.to_string(),
                count: value.parse::<usize>().unwrap_or(0),
            });
        }
    }
    StatsSnapshot {
        total,
        groups,
        raw: stdout.to_string(),
    }
}

fn parse_frontmatter(text: &str) -> Result<(HashMap<String, FrontmatterValue>, String), String> {
    if !text.starts_with("---\n") {
        return Err("missing frontmatter".to_string());
    }
    let end = text
        .find("\n---\n")
        .ok_or_else(|| "unterminated frontmatter".to_string())?;
    let block = &text[4..end];
    let body = text[end + 5..].to_string();
    let mut data = HashMap::new();
    for line in block.lines().filter(|line| !line.trim().is_empty()) {
        let Some((key, raw_value)) = line.split_once(':') else {
            return Err(format!("invalid frontmatter line: {line}"));
        };
        data.insert(key.trim().to_string(), parse_frontmatter_value(raw_value.trim())?);
    }
    Ok((data, body))
}

fn parse_frontmatter_value(value: &str) -> Result<FrontmatterValue, String> {
    if value.starts_with('[') && value.ends_with(']') {
        let parsed = serde_json::from_str::<Vec<String>>(value).map_err(|err| err.to_string())?;
        return Ok(FrontmatterValue::List(parsed));
    }
    if value == "\"\"" {
        return Ok(FrontmatterValue::Scalar(String::new()));
    }
    Ok(FrontmatterValue::Scalar(value.to_string()))
}

fn scalar_field(map: &HashMap<String, FrontmatterValue>, key: &str) -> String {
    match map.get(key) {
        Some(FrontmatterValue::Scalar(value)) => value.clone(),
        Some(FrontmatterValue::List(values)) => values.join(", "),
        None => String::new(),
    }
}

fn list_field(map: &HashMap<String, FrontmatterValue>, key: &str) -> Vec<String> {
    match map.get(key) {
        Some(FrontmatterValue::List(values)) => values.clone(),
        Some(FrontmatterValue::Scalar(value)) if !value.is_empty() => vec![value.clone()],
        _ => Vec::new(),
    }
}

fn parse_document_detail(path: &str, text: &str) -> Result<DocumentDetail, String> {
    let (metadata, body) = parse_frontmatter(text)?;
    Ok(DocumentDetail {
        path: path.to_string(),
        id: scalar_field(&metadata, "id"),
        document_type: scalar_field(&metadata, "type"),
        slug: scalar_field(&metadata, "slug"),
        created_at: scalar_field(&metadata, "created_at"),
        updated_at: scalar_field(&metadata, "updated_at"),
        title: scalar_field(&metadata, "title"),
        status: scalar_field(&metadata, "status"),
        date: scalar_field(&metadata, "date"),
        theme: list_field(&metadata, "theme"),
        project: list_field(&metadata, "project"),
        tags: list_field(&metadata, "tags"),
        source: list_field(&metadata, "source"),
        summary: scalar_field(&metadata, "summary"),
        body: body.trim_start_matches('\n').to_string(),
        git_worktree: scalar_field(&metadata, "git_worktree"),
    })
}

fn encode_scalar(key: &str, value: &str, required: bool, lines: &mut Vec<String>) {
    if !required && value.is_empty() {
        return;
    }
    if value.is_empty() {
        lines.push(format!("{key}: \"\""));
    } else {
        lines.push(format!("{key}: {value}"));
    }
}

fn encode_list(key: &str, values: &[String], include_when_empty: bool, lines: &mut Vec<String>) {
    if values.is_empty() && !include_when_empty {
        return;
    }
    let encoded = serde_json::to_string(values).unwrap_or_else(|_| "[]".to_string());
    lines.push(format!("{key}: {encoded}"));
}

pub fn render_document(detail: &DocumentDetail) -> String {
    let mut lines = vec!["---".to_string()];
    encode_scalar("id", &detail.id, true, &mut lines);
    encode_scalar("type", &detail.document_type, true, &mut lines);
    encode_scalar("title", &detail.title, true, &mut lines);
    encode_scalar("slug", &detail.slug, true, &mut lines);
    encode_scalar("created_at", &detail.created_at, true, &mut lines);
    encode_scalar("updated_at", &detail.updated_at, true, &mut lines);
    encode_scalar("status", &detail.status, true, &mut lines);

    if !detail.date.is_empty() || matches!(detail.document_type.as_str(), "daily" | "review") {
        encode_scalar("date", &detail.date, true, &mut lines);
    }

    if detail.document_type == "project" || !detail.git_worktree.is_empty() {
        encode_scalar("git_worktree", &detail.git_worktree, true, &mut lines);
    }

    if detail.document_type != "daily" {
        encode_list("theme", &detail.theme, detail.document_type != "reference", &mut lines);
    }
    if matches!(detail.document_type.as_str(), "note" | "decision" | "review" | "reference") {
        encode_list("project", &detail.project, true, &mut lines);
    }

    encode_list("tags", &detail.tags, true, &mut lines);

    if !detail.source.is_empty() || detail.document_type == "reference" {
        encode_list("source", &detail.source, true, &mut lines);
    }

    encode_scalar("summary", &detail.summary, true, &mut lines);
    lines.push("---".to_string());
    lines.push(String::new());
    lines.push(detail.body.trim_end().to_string());
    lines.push(String::new());
    lines.join("\n")
}

fn current_timestamp() -> String {
    let now = chrono_like_timestamp(SystemTime::now());
    now
}

fn chrono_like_timestamp(time: SystemTime) -> String {
    let seconds = time
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    // `date -u` equivalent without an extra crate.
    let days = seconds.div_euclid(86_400);
    let secs_of_day = seconds.rem_euclid(86_400);
    let (year, month, day) = civil_from_days(days);
    let hour = secs_of_day / 3600;
    let minute = (secs_of_day % 3600) / 60;
    let second = secs_of_day % 60;
    format!(
        "{year:04}-{month:02}-{day:02}T{hour:02}:{minute:02}:{second:02}Z"
    )
}

fn civil_from_days(days: i64) -> (i64, i64, i64) {
    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = mp + if mp < 10 { 3 } else { -9 };
    let year = y + if m <= 2 { 1 } else { 0 };
    (year, m, d)
}

fn extract_slug_from_project_path(path: &str) -> String {
    Path::new(path)
        .parent()
        .and_then(Path::file_name)
        .map(|value| value.to_string_lossy().into_owned())
        .unwrap_or_default()
}

fn repo_from_state(state: &tauri::State<'_, AppState>) -> Result<PathBuf, String> {
    let context = state.context.lock().map_err(|_| "state lock poisoned".to_string())?;
    Ok(context.current_repo.clone())
}

fn open_directory_in_system(path: &Path) -> Result<(), String> {
    let mut command = if cfg!(target_os = "macos") {
        let mut cmd = Command::new("open");
        cmd.arg(path);
        cmd
    } else if cfg!(target_os = "windows") {
        let mut cmd = Command::new("explorer");
        cmd.arg(path);
        cmd
    } else {
        let mut cmd = Command::new("xdg-open");
        cmd.arg(path);
        cmd
    };

    let status = command.status().map_err(|err| err.to_string())?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("打开目录失败: {}", path.display()))
    }
}

fn workspace_from_state(state: &tauri::State<'_, AppState>) -> Result<PathBuf, String> {
    let context = state.context.lock().map_err(|_| "state lock poisoned".to_string())?;
    Ok(context.workspace_root.clone())
}

fn run_cli_with_state(
    state: &tauri::State<'_, AppState>,
    extra: &[String],
    stdin: Option<&str>,
) -> Result<ProcessOutput, String> {
    let repo = repo_from_state(state)?;
    let workspace = workspace_from_state(state)?;
    run_python_cli(&workspace, &repo, extra, stdin)
}

fn read_migration_entries(path: &Path) -> Result<(String, Vec<KnowledgeMigrationEntry>, Vec<String>), String> {
    let source_label = path
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("migration-source")
        .to_string();
    match detect_migration_source_kind(path)? {
        KnowledgeMigrationSourceKind::Markdown => {
            let body = fs::read_to_string(path).map_err(|err| err.to_string())?;
            if body.trim().is_empty() {
                return Err("知识源文件为空".to_string());
            }
            Ok((
                source_label.clone(),
                vec![KnowledgeMigrationEntry {
                    origin_label: source_label,
                    body,
                }],
                Vec::new(),
            ))
        }
        KnowledgeMigrationSourceKind::Zip => {
            let bytes = fs::read(path).map_err(|err| err.to_string())?;
            let entries = extract_migration_entries_from_zip_bytes(&bytes)?;
            if entries.is_empty() {
                return Err("zip 中没有可处理的 Markdown 或文本文件".to_string());
            }
            let archive = zip::ZipArchive::new(std::io::Cursor::new(bytes)).map_err(|err| err.to_string())?;
            let skipped = archive.len().saturating_sub(entries.len());
            let mut warnings = Vec::new();
            if skipped > 0 {
                warnings.push(format!("跳过 {skipped} 个非文本条目"));
            }
            Ok((source_label, entries, warnings))
        }
    }
}

fn render_migration_document(draft: &KnowledgeMigrationDraft, relative_path: &Path) -> String {
    let timestamp = current_timestamp();
    let date = timestamp.chars().take(10).collect::<String>();
    let slug = relative_path
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("migrated-note")
        .to_string();
    render_document(&DocumentDetail {
        path: relative_path.to_string_lossy().into_owned(),
        id: migration_document_id(),
        document_type: draft.document_type.clone(),
        slug,
        created_at: timestamp.clone(),
        updated_at: timestamp,
        title: draft.title.clone(),
        status: if draft.status.trim().is_empty() {
            default_migration_status()
        } else {
            draft.status.clone()
        },
        date: if draft.document_type == "review" {
            date
        } else {
            String::new()
        },
        theme: draft.theme.clone(),
        project: Vec::new(),
        tags: draft.tags.clone(),
        source: draft.source.clone(),
        summary: draft.summary.clone(),
        body: draft.body.clone(),
        git_worktree: String::new(),
    })
}

#[tauri::command]
fn select_repo(
    path: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<RepoSummary, String> {
    let repo_path = normalize_repo_path(path.as_deref())?;
    ensure_repository_layout(&repo_path)?;
    let summary = build_repo_summary(&repo_path);

    let mut context = state
        .context
        .lock()
        .map_err(|_| "state lock poisoned".to_string())?;
    context.current_repo = repo_path.clone();
    context.recent.update_with_repo(&summary.path);
    context.recent.save(&context.store_path)?;

    Ok(summary)
}

#[tauri::command]
fn open_repo_directory(
    path: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let target = match path.as_deref() {
        Some(value) if !value.trim().is_empty() => normalize_repo_path(Some(value))?,
        _ => repo_from_state(&state)?,
    };
    open_directory_in_system(&target)
}

#[tauri::command]
fn get_recent_repos(state: tauri::State<'_, AppState>) -> Result<Vec<RepoSummary>, String> {
    let context = state
        .context
        .lock()
        .map_err(|_| "state lock poisoned".to_string())?;
    Ok(context
        .recent
        .recent_repos
        .iter()
        .map(|item| build_repo_summary(Path::new(item)))
        .collect())
}

#[tauri::command]
fn list_documents(
    filters: DocumentFilters,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<DocumentListItem>, String> {
    let mut args = vec!["list".to_string()];
    if let Some(value) = filters.document_type {
        args.push("--type".to_string());
        args.push(value);
    }
    for (flag, value) in [
        ("--status", filters.status),
        ("--project", filters.project),
        ("--date", filters.date),
        ("--theme", filters.theme),
        ("--tag", filters.tag),
        ("--source", filters.source),
    ] {
        if let Some(text) = value {
            args.push(flag.to_string());
            args.push(text);
        }
    }
    let output = run_cli_with_state(&state, &args, None)?;
    if !output.success {
        return Err(cli_error(output));
    }
    with_document_status(&state, parse_tsv_lines(&output.stdout))
}

#[tauri::command]
fn search_documents(
    query: String,
    filters: DocumentFilters,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<DocumentListItem>, String> {
    let mut args = vec!["search".to_string(), query];
    for (flag, value) in [
        ("--status", filters.status),
        ("--project", filters.project),
        ("--date", filters.date),
        ("--theme", filters.theme),
        ("--tag", filters.tag),
        ("--source", filters.source),
    ] {
        if let Some(text) = value {
            args.push(flag.to_string());
            args.push(text);
        }
    }
    let output = run_cli_with_state(&state, &args, None)?;
    if !output.success {
        return Err(cli_error(output));
    }
    with_document_status(&state, parse_tsv_lines(&output.stdout))
}

#[tauri::command]
fn get_document(path: String, state: tauri::State<'_, AppState>) -> Result<DocumentDetail, String> {
    let repo = repo_from_state(&state)?;
    let absolute = repo.join(&path);
    let text = fs::read_to_string(&absolute).map_err(|err| err.to_string())?;
    parse_document_detail(&path, &text)
}

#[tauri::command]
fn save_document(
    path: String,
    payload: DocumentDetail,
    state: tauri::State<'_, AppState>,
) -> Result<SaveResult, String> {
    let repo = repo_from_state(&state)?;
    let absolute = repo.join(&path);
    if let Some(parent) = absolute.parent() {
        fs::create_dir_all(parent).map_err(|err| err.to_string())?;
    }
    let updated_at = current_timestamp();
    let detail = DocumentDetail {
        path: path.clone(),
        updated_at: updated_at.clone(),
        created_at: if payload.created_at.is_empty() {
            updated_at.clone()
        } else {
            payload.created_at.clone()
        },
        ..payload
    };
    fs::write(&absolute, render_document(&detail)).map_err(|err| err.to_string())?;
    Ok(SaveResult { path, updated_at })
}

#[tauri::command]
fn create_document(
    doc_type: String,
    payload: CreatePayload,
    state: tauri::State<'_, AppState>,
) -> Result<SaveResult, String> {
    let mut args = vec!["create".to_string(), doc_type.clone()];
    match doc_type.as_str() {
        "daily" => {
            if let Some(date) = payload.date {
                if !date.trim().is_empty() {
                    args.push("--date".to_string());
                    args.push(date);
                }
            }
        }
        "project" => {
            args.push("--title".to_string());
            args.push(payload.title);
            let git_worktree = payload
                .git_worktree
                .filter(|value| !value.trim().is_empty())
                .ok_or_else(|| "project 创建需要 gitWorktree".to_string())?;
            args.push("--git-worktree".to_string());
            args.push(git_worktree);
        }
        "review" => {
            args.push("--title".to_string());
            args.push(payload.title);
            if let Some(date) = payload.date {
                if !date.trim().is_empty() {
                    args.push("--date".to_string());
                    args.push(date);
                }
            }
        }
        "note" => {
            args.push("--title".to_string());
            args.push(payload.title);
            if payload.body.as_deref().is_some_and(|body| !body.trim().is_empty()) {
                args.push("--stdin".to_string());
            }
        }
        _ => {
            args.push("--title".to_string());
            args.push(payload.title);
        }
    }

    let stdin = if doc_type == "note" {
        payload.body.as_deref()
    } else {
        None
    };

    let output = run_cli_with_state(&state, &args, stdin)?;
    if !output.success {
        return Err(cli_error(output));
    }
    let created_path = output.stdout.lines().last().unwrap_or_default().to_string();
    Ok(SaveResult {
        path: created_path,
        updated_at: String::new(),
    })
}

#[tauri::command]
fn list_assets(state: tauri::State<'_, AppState>) -> Result<Vec<AssetRecord>, String> {
    let output = run_cli_with_state(
        &state,
        &[
            "export".to_string(),
            "asset-list".to_string(),
        ],
        None,
    )?;
    if !output.success {
        return Err(cli_error(output));
    }
    serde_json::from_str(&output.stdout).map_err(|err| err.to_string())
}

#[tauri::command]
fn import_asset(
    payload: ImportAssetPayload,
    state: tauri::State<'_, AppState>,
) -> Result<AssetRecord, String> {
    let mut args = vec![
        "import".to_string(),
        "asset".to_string(),
        "--file".to_string(),
        payload.file_path,
    ];
    if let Some(target_name) = payload.target_name {
        if !target_name.trim().is_empty() {
            args.push("--name".to_string());
            args.push(target_name);
        }
    }
    if let Some(project) = payload.project {
        if !project.trim().is_empty() {
            args.push("--project".to_string());
            args.push(project);
        }
    }
    let output = run_cli_with_state(&state, &args, None)?;
    if !output.success {
        return Err(cli_error(output));
    }
    let imported_path = output.stdout.lines().last().unwrap_or_default().to_string();
    let assets = list_assets(state)?;
    assets
        .into_iter()
        .find(|item| item.path == imported_path)
        .ok_or_else(|| "导入成功，但未能读取资源信息".to_string())
}

#[tauri::command]
fn analyze_knowledge_migration(
    payload: AnalyzeKnowledgeMigrationPayload,
    state: tauri::State<'_, AppState>,
) -> Result<KnowledgeMigrationPreview, String> {
    if payload.model.trim().is_empty() {
        return Err("迁移需要指定 Ollama 模型".to_string());
    }
    let source_path = PathBuf::from(&payload.file_path);
    let (source_label, entries, mut warnings) = read_migration_entries(&source_path)?;
    let mut drafts = Vec::new();
    for entry in &entries {
        let preview = call_ollama_for_migration(&payload.model, entry)?;
        drafts.extend(preview.drafts);
        warnings.extend(preview.warnings);
    }
    let repo = repo_from_state(&state)?;
    for draft in &mut drafts {
        let slug = migration_slugify(&draft.title);
        let relative = unique_migration_target_path(&repo, &draft.document_type, &slug);
        draft.path = relative.to_string_lossy().into_owned();
    }
    Ok(KnowledgeMigrationPreview {
        source_label,
        drafts,
        warnings,
    })
}

#[tauri::command]
fn import_knowledge_migration(
    payload: ImportKnowledgeMigrationPayload,
    state: tauri::State<'_, AppState>,
) -> Result<KnowledgeMigrationImportResult, String> {
    let repo = repo_from_state(&state)?;
    if payload.drafts.is_empty() {
        return Err("没有可导入的迁移草稿".to_string());
    }
    let mut created_paths = Vec::new();
    for draft in payload.drafts {
        let slug = migration_slugify(&draft.title);
        let relative = unique_migration_target_path(&repo, &draft.document_type, &slug);
        let absolute = repo.join(&relative);
        if let Some(parent) = absolute.parent() {
            fs::create_dir_all(parent).map_err(|err| err.to_string())?;
        }
        fs::write(&absolute, render_migration_document(&draft, &relative)).map_err(|err| err.to_string())?;
        created_paths.push(relative.to_string_lossy().into_owned());
    }
    Ok(KnowledgeMigrationImportResult {
        imported: created_paths.len(),
        created_paths,
        warnings: if payload.file_path.trim().is_empty() || payload.model.trim().is_empty() {
            Vec::new()
        } else {
            Vec::new()
        },
    })
}

#[tauri::command]
fn get_stats(state: tauri::State<'_, AppState>) -> Result<StatsSnapshot, String> {
    let output = run_cli_with_state(&state, &["stats".to_string()], None)?;
    if !output.success {
        return Err(cli_error(output));
    }
    Ok(parse_stats(&output.stdout))
}

#[tauri::command]
fn run_validate(state: tauri::State<'_, AppState>) -> Result<ValidationResult, String> {
    let output = run_cli_with_state(&state, &["validate".to_string()], None)?;
    let raw = if output.stdout.is_empty() {
        output.stderr.clone()
    } else {
        output.stdout.clone()
    };
    let errors = if output.success {
        Vec::new()
    } else {
        raw.lines()
            .map(str::trim)
            .filter(|line| !line.is_empty())
            .map(ToString::to_string)
            .collect()
    };
    Ok(ValidationResult {
        ok: output.success,
        errors,
        raw,
    })
}

#[tauri::command]
fn run_export(kind: String, state: tauri::State<'_, AppState>) -> Result<ExportSnapshot, String> {
    let output = run_cli_with_state(
        &state,
        &["export".to_string(), kind.clone()],
        None,
    )?;
    if !output.success {
        return Err(cli_error(output));
    }
    Ok(ExportSnapshot {
        kind,
        content: output.stdout,
    })
}

#[tauri::command]
fn list_projects(state: tauri::State<'_, AppState>) -> Result<Vec<ProjectListItem>, String> {
    let output = run_cli_with_state(
        &state,
        &["export".to_string(), "document-list".to_string()],
        None,
    )?;
    if !output.success {
        return Err(cli_error(output));
    }
    let rows: Vec<serde_json::Value> = serde_json::from_str(&output.stdout).map_err(|err| err.to_string())?;
    Ok(rows
        .into_iter()
        .filter(|row| row.get("type").and_then(|value| value.as_str()) == Some("project"))
        .map(|row| {
            let path = row
                .get("path")
                .and_then(|value| value.as_str())
                .unwrap_or_default()
                .to_string();
            ProjectListItem {
                slug: extract_slug_from_project_path(&path),
                title: row
                    .get("title")
                    .and_then(|value| value.as_str())
                    .unwrap_or_default()
                    .to_string(),
                path,
            }
        })
        .collect())
}

#[tauri::command]
fn run_project_command(
    project: String,
    action: String,
    payload: HashMap<String, String>,
    state: tauri::State<'_, AppState>,
) -> Result<CommandResult, String> {
    let mut args = vec!["project".to_string(), action.clone(), "--project".to_string(), project];
    match action.as_str() {
        "add-remote" => {
            let name = payload
                .get("name")
                .cloned()
                .filter(|value| !value.trim().is_empty())
                .ok_or_else(|| "add-remote 需要 name".to_string())?;
            let url = payload
                .get("url")
                .cloned()
                .filter(|value| !value.trim().is_empty())
                .ok_or_else(|| "add-remote 需要 url".to_string())?;
            args.extend(["--name".to_string(), name, "--url".to_string(), url]);
        }
        "fetch" | "push" | "sync" => {
            if let Some(remote) = payload.get("remote").filter(|value| !value.trim().is_empty()) {
                args.extend(["--remote".to_string(), remote.clone()]);
            }
            if let Some(branch) = payload.get("branch").filter(|value| !value.trim().is_empty()) {
                args.extend(["--branch".to_string(), branch.clone()]);
            }
        }
        _ => return Err("不支持的 project action".to_string()),
    }

    let output = run_cli_with_state(&state, &args, None)?;
    Ok(CommandResult {
        ok: output.success,
        stdout: output.stdout,
        stderr: output.stderr,
    })
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let store_path = app_config_path(&app.handle());
            let recent = RecentRepoStore::load(&store_path);
            let current_repo = default_repo_root();
            ensure_repository_layout(&current_repo).map_err(|err| err.to_string())?;
            app.manage(AppState {
                context: Mutex::new(AppContext {
                    workspace_root: workspace_root(),
                    current_repo,
                    store_path,
                    recent,
                }),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            select_repo,
            open_repo_directory,
            get_recent_repos,
            list_documents,
            search_documents,
            get_document,
            save_document,
            create_document,
            list_assets,
            import_asset,
            analyze_knowledge_migration,
            import_knowledge_migration,
            get_stats,
            run_validate,
            run_export,
            list_projects,
            run_project_command
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Knowledge Galaxy Desktop");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;
    use zip::write::SimpleFileOptions;

    fn sample_detail() -> DocumentDetail {
        DocumentDetail {
            path: "notes/idea.md".into(),
            id: "note-1".into(),
            document_type: "note".into(),
            slug: "idea".into(),
            created_at: "2026-03-13T00:00:00Z".into(),
            updated_at: "2026-03-13T00:00:00Z".into(),
            title: "Idea".into(),
            status: "active".into(),
            date: String::new(),
            theme: vec!["knowledge".into()],
            project: vec!["atlas".into()],
            tags: vec!["idea".into()],
            source: vec!["field-notes".into()],
            summary: "short".into(),
            body: "body".into(),
            git_worktree: String::new(),
        }
    }

    fn temp_path(name: &str) -> PathBuf {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos();
        std::env::temp_dir().join(format!("kg-desktop-{name}-{unique}.json"))
    }

    #[test]
    fn python_cli_args_include_repo_and_module() {
        let args = build_python_command_args(
            "/tmp/repo",
            &["export".into(), "asset-list".into()],
        );

        assert_eq!(
            args,
            vec![
                "-m",
                "implementations.python.kg",
                "--repo",
                "/tmp/repo",
                "export",
                "asset-list"
            ]
        );
    }

    #[test]
    fn document_round_trip_keeps_field_order() {
        let detail = sample_detail();

        let rendered = render_document(&detail);

        assert!(rendered.contains("title: Idea"));
        assert!(rendered.contains("status: active"));
        assert!(rendered.contains("theme: [\"knowledge\"]"));
        assert!(rendered.contains("\n---\n\nbody\n"));

        let reparsed = parse_document_detail("notes/idea.md", &rendered).unwrap();
        assert_eq!(reparsed.title, "Idea");
        assert_eq!(reparsed.theme, vec!["knowledge"]);
    }

    #[test]
    fn recent_repo_store_round_trips_and_keeps_latest_first() {
        let path = temp_path("recent");
        let mut store = RecentRepoStore::default();
        store.update_with_repo("/tmp/a");
        store.update_with_repo("/tmp/b");
        store.update_with_repo("/tmp/a");
        store.save(&path).unwrap();

        let loaded = RecentRepoStore::load(&path);
        assert_eq!(loaded.recent_repos, vec!["/tmp/a", "/tmp/b"]);

        let _ = fs::remove_file(path);
    }

    #[test]
    fn detects_migration_source_kind_from_extension() {
        assert_eq!(
            detect_migration_source_kind(Path::new("/tmp/knowledge.md")).unwrap(),
            KnowledgeMigrationSourceKind::Markdown
        );
        assert_eq!(
            detect_migration_source_kind(Path::new("/tmp/archive.zip")).unwrap(),
            KnowledgeMigrationSourceKind::Zip
        );
        assert!(detect_migration_source_kind(Path::new("/tmp/file.pdf")).is_err());
    }

    #[test]
    fn extracts_only_supported_text_entries_from_zip() {
        let mut buffer = Cursor::new(Vec::new());
        {
            let mut archive = zip::ZipWriter::new(&mut buffer);
            archive
                .start_file("notes/alpha.md", SimpleFileOptions::default())
                .unwrap();
            archive.write_all(b"# Alpha\n\nBody").unwrap();
            archive
                .start_file("notes/raw.txt", SimpleFileOptions::default())
                .unwrap();
            archive.write_all(b"plain text").unwrap();
            archive
                .start_file("images/logo.png", SimpleFileOptions::default())
                .unwrap();
            archive.write_all(&[137, 80, 78, 71]).unwrap();
            archive.finish().unwrap();
        }

        let entries = extract_migration_entries_from_zip_bytes(&buffer.into_inner()).unwrap();

        assert_eq!(entries.len(), 2);
        assert_eq!(entries[0].origin_label, "notes/alpha.md");
        assert_eq!(entries[1].origin_label, "notes/raw.txt");
    }

    #[test]
    fn generates_unique_migration_target_paths_on_collision() {
        let repo_root = temp_path("migration-repo");
        fs::create_dir_all(repo_root.join("notes")).unwrap();
        fs::write(repo_root.join("notes/idea.md"), "existing").unwrap();

        let unique = unique_migration_target_path(&repo_root, "note", "idea");

        assert_eq!(unique, PathBuf::from("notes/idea-2.md"));

        let _ = fs::remove_dir_all(repo_root);
    }

    #[test]
    fn parses_ollama_json_into_migration_drafts() {
        let payload = serde_json::json!({
            "drafts": [
                {
                    "title": "Imported Note",
                    "type": "note",
                    "summary": "Short summary",
                    "body": "## Summary\n\nBody",
                    "theme": ["knowledge"],
                    "tags": ["migration"],
                    "source": ["archive.zip"],
                    "status": "inbox"
                }
            ],
            "warnings": ["skipped binary"]
        });

        let parsed = parse_migration_model_response(&payload.to_string(), "archive.zip").unwrap();

        assert_eq!(parsed.drafts.len(), 1);
        assert_eq!(parsed.drafts[0].path, "notes/imported-note.md");
        assert_eq!(parsed.warnings, vec!["skipped binary"]);
    }
}
