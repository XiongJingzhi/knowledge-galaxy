use std::env;
use std::fs;
use std::io::{self, Read};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{SystemTime, UNIX_EPOCH};

const DEFAULT_REPO_DIR: &str = ".knowledge-galax";
const REPOSITORY_DIRECTORIES: &[&str] = &[
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
    "indexes",
];

fn builtin_template(name: &str) -> Option<&'static str> {
    match name {
        "daily" => Some(
            "---\n\
id: <id>\n\
type: daily\n\
title: <title>\n\
slug: <slug>\n\
created_at: <created_at>\n\
updated_at: <updated_at>\n\
status: inbox\n\
date: <date>\n\
tags: []\n\
summary: \"\"\n\
---\n\
\n\
## Notes\n\
\n\
## Decisions\n\
\n\
## Next\n",
        ),
        "decision" => Some(
            "---\n\
id: <id>\n\
type: decision\n\
title: <title>\n\
slug: <slug>\n\
created_at: <created_at>\n\
updated_at: <updated_at>\n\
status: inbox\n\
theme: []\n\
project: []\n\
tags: []\n\
summary: \"\"\n\
---\n\
\n\
## Context\n\
\n\
## Decision\n\
\n\
## Consequences\n",
        ),
        "note" => Some(
            "---\n\
id: <id>\n\
type: note\n\
title: <title>\n\
slug: <slug>\n\
created_at: <created_at>\n\
updated_at: <updated_at>\n\
status: inbox\n\
theme: []\n\
project: []\n\
tags: []\n\
summary: \"\"\n\
---\n\
\n\
## Summary\n\
\n\
## Details\n",
        ),
        "project" => Some(
            "---\n\
id: <id>\n\
type: project\n\
title: <title>\n\
slug: <slug>\n\
created_at: <created_at>\n\
updated_at: <updated_at>\n\
status: inbox\n\
git_worktree: <git_worktree>\n\
theme: []\n\
tags: []\n\
summary: \"\"\n\
---\n\
\n\
## Goal\n\
\n\
## Status\n\
\n\
## Notes\n",
        ),
        "reference" => Some(
            "---\n\
id: <id>\n\
type: reference\n\
title: <title>\n\
slug: <slug>\n\
created_at: <created_at>\n\
updated_at: <updated_at>\n\
status: inbox\n\
source: []\n\
theme: []\n\
project: []\n\
tags: []\n\
summary: \"\"\n\
---\n\
\n\
## Source\n\
\n\
## Notes\n",
        ),
        "review" => Some(
            "---\n\
id: <id>\n\
type: review\n\
title: <title>\n\
slug: <slug>\n\
created_at: <created_at>\n\
updated_at: <updated_at>\n\
status: inbox\n\
date: <date>\n\
theme: []\n\
project: []\n\
tags: []\n\
summary: \"\"\n\
---\n\
\n\
## What Happened\n\
\n\
## What Worked\n\
\n\
## What To Change\n",
        ),
        "theme" => Some(
            "---\n\
id: <id>\n\
type: theme\n\
title: <title>\n\
slug: <slug>\n\
created_at: <created_at>\n\
updated_at: <updated_at>\n\
status: inbox\n\
tags: []\n\
summary: \"\"\n\
---\n\
\n\
## Scope\n\
\n\
## Key Questions\n",
        ),
        _ => None,
    }
}

fn main() {
    std::process::exit(run(std::env::args().skip(1).collect()));
}

fn run(argv: Vec<String>) -> i32 {
    if argv.is_empty() {
        eprintln!("usage: kg [--repo <path>] <command> [args]");
        return 1;
    }

    // Extract --repo from anywhere and rebuild args placing it first
    let mut repo: Option<String> = None;
    let mut args = argv.clone();
    let mut i = 0;
    while i + 1 < args.len() {
        if args[i] == "--repo" {
            repo = Some(args[i + 1].clone());
            args.drain(i..i + 2);
            break;
        }
        i += 1;
    }
    if let Some(r) = repo.clone() {
        args.splice(0..0, vec!["--repo".into(), r].into_iter());
    }

    let (repo_arg, command_index) = if args.len() >= 2 && args[0] == "--repo" {
        (args[1].clone(), 2usize)
    } else {
        (String::new(), 0usize)
    };
    if args.len() <= command_index {
        eprintln!("missing command");
        return 1;
    }
    let cmd = &args[command_index];
    let create_if_missing = matches!(cmd.as_str(), "create" | "append" | "import" | "project");
    let repo_root = match resolve_repo_root(&repo_arg, create_if_missing) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("{}", e);
            return 1;
        }
    };
    match cmd.as_str() {
        "create" => cmd_create(&repo_root, &args[command_index + 1..]),
        "append" => cmd_append(&repo_root, &args[command_index + 1..]),
        "import" => cmd_import(&repo_root, &args[command_index + 1..]),
        "validate" => cmd_validate(&repo_root),
        "list" => cmd_list(&repo_root, &args[command_index + 1..]),
        "search" => cmd_search(&repo_root, &args[command_index + 1..]),
        "stats" => cmd_stats(&repo_root),
        "export" => cmd_export(&repo_root, &args[command_index + 1..]),
        "project" => cmd_project(&repo_root, &args[command_index + 1..]),
        "--help" | "-h" => {
            println!("usage:");
            0
        }
        _ => {
            eprintln!("unsupported command");
            1
        }
    }
}

// ---- repository helpers ----

fn resolve_repo_root(p: &str, create_if_missing: bool) -> Result<PathBuf, String> {
    let mut create_if_missing = create_if_missing;
    let p = if p.trim().is_empty() {
        create_if_missing = true;
        let home = dirs_home().ok_or_else(|| "HOME is not set".to_string())?;
        Path::new(&home)
            .join(DEFAULT_REPO_DIR)
            .display()
            .to_string()
    } else {
        p.to_string()
    };
    let expanded = expand_user(&p);
    let abs = std::fs::canonicalize(&expanded).unwrap_or_else(|_| PathBuf::from(&expanded));
    if !abs.exists() && create_if_missing {
        ensure_repo_layout(&abs)?;
    }
    if abs.is_dir() {
        Ok(abs)
    } else {
        Err(format!("Repository path does not exist: {}", abs.display()))
    }
}

fn ensure_repo_layout(root: &Path) -> Result<(), String> {
    fs::create_dir_all(root).map_err(|e| e.to_string())?;
    for dir in REPOSITORY_DIRECTORIES {
        fs::create_dir_all(root.join(dir)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn expand_user(s: &str) -> String {
    if let Some(rest) = s.strip_prefix('~') {
        if let Some(home) = dirs_home() {
            return Path::new(&home)
                .join(rest.trim_start_matches('/'))
                .display()
                .to_string();
        }
    }
    shellexpand_env(s)
}

fn dirs_home() -> Option<String> {
    if let Ok(h) = env::var("HOME") {
        if !h.is_empty() {
            return Some(h);
        }
    }
    if cfg!(windows) {
        if let Ok(h) = env::var("USERPROFILE") {
            if !h.is_empty() {
                return Some(h);
            }
        }
    }
    None
}

fn now_unix_seconds() -> i64 {
    match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(duration) => duration.as_secs() as i64,
        Err(_) => 0,
    }
}

fn civil_from_days(days: i64) -> (i32, u32, u32) {
    let z = days + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = mp + if mp < 10 { 3 } else { -9 };
    let year = y + if m <= 2 { 1 } else { 0 };
    (year as i32, m as u32, d as u32)
}

fn format_utc_timestamp(unix_seconds: i64) -> String {
    let days = unix_seconds.div_euclid(86_400);
    let seconds_of_day = unix_seconds.rem_euclid(86_400);
    let (year, month, day) = civil_from_days(days);
    let hour = seconds_of_day / 3_600;
    let minute = (seconds_of_day % 3_600) / 60;
    let second = seconds_of_day % 60;
    format!("{year:04}-{month:02}-{day:02}T{hour:02}:{minute:02}:{second:02}Z")
}

fn format_utc_date(unix_seconds: i64) -> String {
    let days = unix_seconds.div_euclid(86_400);
    let (year, month, day) = civil_from_days(days);
    format!("{year:04}-{month:02}-{day:02}")
}

// A tiny env expander without external deps
fn shellexpand_env(s: &str) -> String {
    let mut out = String::new();
    let mut chars = s.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '$' {
            if let Some(&'{') = chars.peek() {
                chars.next(); /* consume '{' */
            }
            let mut name = String::new();
            while let Some(&ch) = chars.peek() {
                if ch.is_alphanumeric() || ch == '_' {
                    name.push(ch);
                    chars.next();
                } else {
                    break;
                }
            }
            if let Some(&'}') = chars.peek() {
                chars.next();
            }
            out.push_str(&env::var(&name).unwrap_or_default());
        } else {
            out.push(c);
        }
    }
    out
}

fn slugify(s: &str) -> Result<String, String> {
    let mut slug = String::new();
    let mut last_dash = false;
    for ch in s.trim().to_lowercase().chars() {
        let is_alnum = ch.is_ascii_alphanumeric();
        if is_alnum {
            slug.push(ch);
            last_dash = false;
        } else {
            if !last_dash {
                slug.push('-');
                last_dash = true;
            }
        }
    }
    let slug = slug.trim_matches('-').to_string();
    if slug.is_empty() {
        return Err("Title must contain at least one alphanumeric character".into());
    }
    Ok(slug)
}

fn timestamp_utc_rfc3339() -> String {
    format_utc_timestamp(now_unix_seconds())
}

fn today_yyyy_mm_dd() -> String {
    format_utc_date(now_unix_seconds())
}

fn is_valid_iso_date(value: &str) -> bool {
    if value.len() != 10 {
        return false;
    }
    let bytes = value.as_bytes();
    bytes[4] == b'-'
        && bytes[7] == b'-'
        && bytes
            .iter()
            .enumerate()
            .all(|(index, byte)| matches!(index, 4 | 7) || byte.is_ascii_digit())
}

fn rel_path(root: &Path, p: &Path) -> String {
    let rel = match p.strip_prefix(root) {
        Ok(r) => r.to_path_buf(),
        Err(_) => p.to_path_buf(),
    };
    let mut s = String::new();
    for (i, comp) in rel.components().enumerate() {
        if i > 0 {
            s.push('/');
        }
        s.push_str(&comp.as_os_str().to_string_lossy());
    }
    if s.is_empty() {
        p.to_string_lossy().replace('\\', "/")
    } else {
        s
    }
}

// ---- create ----

fn cmd_create(repo_root: &Path, args: &[String]) -> i32 {
    if args.is_empty() {
        eprintln!("missing create type");
        return 1;
    }
    let create_type = args[0].as_str();
    let mut title: Option<String> = None;
    let mut date_text: Option<String> = None;
    let mut git_worktree: Option<String> = None;
    let mut read_body_from_stdin = false;
    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--title" if i + 1 < args.len() => {
                title = Some(args[i + 1].clone());
                i += 2;
            }
            "--date" if i + 1 < args.len() => {
                date_text = Some(args[i + 1].clone());
                i += 2;
            }
            "--git-worktree" if i + 1 < args.len() => {
                git_worktree = Some(args[i + 1].clone());
                i += 2;
            }
            "--stdin" => {
                read_body_from_stdin = true;
                i += 1;
            }
            _ => {
                i += 1;
            }
        }
    }
    let now = timestamp_utc_rfc3339();
    let body = if read_body_from_stdin {
        match read_stdin_text() {
            Ok(text) => Some(text),
            Err(e) => {
                eprintln!("{}", e);
                return 1;
            }
        }
    } else {
        None
    };
    let mut derived_date: Option<String> = None;
    let mut derived_git_worktree: Option<String> = None;
    let mut derived_slug: Option<String> = None;
    let (target, template) = match create_type {
        "note" => {
            let t = title.clone().unwrap_or_default();
            if t.is_empty() {
                eprintln!("--title is required");
                return 1;
            }
            let slug = match slugify(&t) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("{}", e);
                    return 1;
                }
            };
            derived_slug = Some(slug.clone());
            (note_path(repo_root, &slug), "note")
        }
        "daily" => {
            let dt = date_text.clone().unwrap_or_else(|| today_yyyy_mm_dd());
            if !is_valid_iso_date(&dt) {
                eprintln!("Invalid date: {}", dt);
                return 1;
            }
            derived_date = Some(dt.clone());
            derived_slug = Some(dt.clone());
            (daily_path(repo_root, &dt), "daily")
        }
        "decision" => {
            let t = title.clone().unwrap_or_default();
            if t.is_empty() {
                eprintln!("--title is required");
                return 1;
            }
            let slug = match slugify(&t) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("{}", e);
                    return 1;
                }
            };
            derived_slug = Some(slug.clone());
            (decision_path(repo_root, &slug), "decision")
        }
        "review" => {
            let t = title.clone().unwrap_or_default();
            if t.is_empty() {
                eprintln!("--title is required");
                return 1;
            }
            let slug = match slugify(&t) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("{}", e);
                    return 1;
                }
            };
            let dt = date_text.clone().unwrap_or_else(|| today_yyyy_mm_dd());
            if !is_valid_iso_date(&dt) {
                eprintln!("Invalid date: {}", dt);
                return 1;
            }
            derived_date = Some(dt);
            derived_slug = Some(slug.clone());
            let path = review_path(repo_root, &slug);
            (path, "review")
        }
        "project" => {
            let t = title.clone().unwrap_or_default();
            if t.is_empty() || git_worktree.is_none() {
                eprintln!("--title and --git-worktree are required");
                return 1;
            }
            let gw = match resolve_git_worktree(&git_worktree.clone().unwrap()) {
                Ok(p) => p,
                Err(e) => {
                    eprintln!("{}", e);
                    return 1;
                }
            };
            let slug = match slugify(&t) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("{}", e);
                    return 1;
                }
            };
            let path = project_path(repo_root, &slug);
            derived_git_worktree = Some(gw);
            derived_slug = Some(slug);
            (path, "project")
        }
        _ => {
            eprintln!("Unsupported create type");
            return 1;
        }
    };

    // Build replacement map
    let mut map = std::collections::BTreeMap::new();
    map.insert("id".to_string(), new_uuid());
    map.insert("created_at".to_string(), now.clone());
    map.insert("updated_at".to_string(), now);
    if let Some(t) = title {
        map.insert("title".into(), t);
    }
    if let Some(d) = derived_date {
        map.insert("date".into(), d.clone());
        if !map.contains_key("title") {
            map.insert("title".into(), d.clone());
        }
        if create_type == "daily" {
            map.insert("slug".into(), d);
        }
    }
    if let Some(gw) = derived_git_worktree {
        map.insert("git_worktree".into(), must_abs(&gw));
    }
    if let Some(s) = derived_slug {
        map.insert("slug".into(), s);
    }

    let code = create_from_template(repo_root, template, &map, body.as_deref(), &target);
    if code != 0 {
        return code;
    }
    println!("{}", rel_path(repo_root, &target));
    0
}

fn create_from_template(
    repo_root: &Path,
    name: &str,
    repl: &std::collections::BTreeMap<String, String>,
    body: Option<&str>,
    target: &Path,
) -> i32 {
    if let Err(e) = write_from_template(repo_root, name, repl, body, target, false) {
        eprintln!("{}", e);
        return 1;
    }
    0
}

fn write_from_template(
    repo_root: &Path,
    name: &str,
    repl: &std::collections::BTreeMap<String, String>,
    body: Option<&str>,
    target: &Path,
    overwrite: bool,
) -> Result<(), String> {
    if target.exists() && !overwrite {
        return Err(format!("Target file already exists: {}", target.display()));
    }
    let tpl = repo_root.join("templates").join(format!("{}.md", name));
    let mut text = match fs::read_to_string(&tpl) {
        Ok(text) => text,
        Err(_) => match builtin_template(name) {
            Some(template) => template.to_string(),
            None => return Err(io_err(&tpl)),
        },
    };
    for (k, v) in repl.iter() {
        text = text.replace(&format!("<{}>", k), v);
    }
    if let Some(extra) = body {
        let trimmed = extra.trim();
        if !trimmed.is_empty() {
            text = format!("{}\n\n{}\n", text.trim_end(), trimmed);
        }
    }
    if let Some(dir) = target.parent() {
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    if target.exists() && !overwrite {
        return Err(format!("Target file already exists: {}", target.display()));
    }
    fs::write(target, text.as_bytes()).map_err(|e| e.to_string())?;
    Ok(())
}

fn cmd_append(repo_root: &Path, args: &[String]) -> i32 {
    if args.is_empty() {
        eprintln!("missing append type");
        return 1;
    }
    if args[0] != "daily" {
        eprintln!("Unsupported append type");
        return 1;
    }
    let mut date_text: Option<String> = None;
    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--date" if i + 1 < args.len() => {
                date_text = Some(args[i + 1].clone());
                i += 2;
            }
            _ => i += 1,
        }
    }
    let body = match read_stdin_text() {
        Ok(text) => text,
        Err(e) => {
            eprintln!("{}", e);
            return 1;
        }
    };
    let date_value = date_text.unwrap_or_else(today_yyyy_mm_dd);
    if !is_valid_iso_date(&date_value) {
        eprintln!("Invalid date: {}", date_value);
        return 1;
    }
    let target = daily_path(repo_root, &date_value);
    if !target.exists() {
        let mut map = std::collections::BTreeMap::new();
        let now = timestamp_utc_rfc3339();
        map.insert("id".to_string(), new_uuid());
        map.insert("title".to_string(), date_value.clone());
        map.insert("slug".to_string(), date_value.clone());
        map.insert("date".to_string(), date_value.clone());
        map.insert("created_at".to_string(), now.clone());
        map.insert("updated_at".to_string(), now);
        if let Err(e) = write_from_template(repo_root, "daily", &map, None, &target, false) {
            eprintln!("{}", e);
            return 1;
        }
    }
    let current = match fs::read_to_string(&target) {
        Ok(text) => text,
        Err(e) => {
            eprintln!("{}", e);
            return 1;
        }
    };
    let updated = format!(
        "{}\n\n## Capture {}\n\n{}\n",
        current.trim_end(),
        timestamp_utc_rfc3339(),
        body.trim()
    );
    if let Err(e) = fs::write(&target, updated.as_bytes()) {
        eprintln!("{}", e);
        return 1;
    }
    println!("{}", rel_path(repo_root, &target));
    0
}

fn cmd_import(repo_root: &Path, args: &[String]) -> i32 {
    if !args.is_empty() && args[0] == "asset" {
        return cmd_import_asset(repo_root, &args[1..]);
    }
    if args.len() < 2 || args[0] != "clipboard" || args[1] != "note" {
        eprintln!("Unsupported import type");
        return 1;
    }
    let mut title: Option<String> = None;
    let mut i = 2;
    while i < args.len() {
        match args[i].as_str() {
            "--title" if i + 1 < args.len() => {
                title = Some(args[i + 1].clone());
                i += 2;
            }
            _ => i += 1,
        }
    }
    let title = match title {
        Some(value) if !value.trim().is_empty() => value,
        _ => {
            eprintln!("--title is required");
            return 1;
        }
    };
    let body = match read_clipboard_text() {
        Ok(text) => text,
        Err(e) => {
            eprintln!("{}", e);
            return 1;
        }
    };
    let slug = match slugify(&title) {
        Ok(value) => value,
        Err(e) => {
            eprintln!("{}", e);
            return 1;
        }
    };
    let mut map = std::collections::BTreeMap::new();
    let now = timestamp_utc_rfc3339();
    map.insert("id".to_string(), new_uuid());
    map.insert("title".to_string(), title);
    map.insert("slug".to_string(), slug.clone());
    map.insert("created_at".to_string(), now.clone());
    map.insert("updated_at".to_string(), now);
    let target = note_path(repo_root, &slug);
    let code = create_from_template(repo_root, "note", &map, Some(body.as_str()), &target);
    if code != 0 {
        return code;
    }
    println!("{}", rel_path(repo_root, &target));
    0
}

fn cmd_import_asset(repo_root: &Path, args: &[String]) -> i32 {
    let mut file: Option<String> = None;
    let mut name: Option<String> = None;
    let mut project: Option<String> = None;
    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--file" if i + 1 < args.len() => {
                file = Some(args[i + 1].clone());
                i += 2;
            }
            "--name" if i + 1 < args.len() => {
                name = Some(args[i + 1].clone());
                i += 2;
            }
            "--project" if i + 1 < args.len() => {
                project = Some(args[i + 1].clone());
                i += 2;
            }
            _ => i += 1,
        }
    }
    let source = match file {
        Some(path) => must_abs(&path),
        None => {
            eprintln!("--file is required");
            return 1;
        }
    };
    let source_path = PathBuf::from(&source);
    if !source_path.is_file() {
        eprintln!("Asset file does not exist: {}", source);
        return 1;
    }
    let filename = name.unwrap_or_else(|| {
        source_path
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default()
    });
    if filename.is_empty()
        || Path::new(&filename)
            .file_name()
            .map(|s| s.to_string_lossy().to_string())
            != Some(filename.clone())
    {
        eprintln!("Asset name must be a file name: {}", filename);
        return 1;
    }
    let target = match project {
        Some(slug) => repo_root
            .join("projects")
            .join(slug)
            .join("assets")
            .join(&filename),
        None => repo_root.join("assets").join(&filename),
    };
    if target.exists() {
        eprintln!("Target file already exists: {}", target.display());
        return 1;
    }
    if let Some(parent) = target.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            eprintln!("{}", e);
            return 1;
        }
    }
    let data = match fs::read(&source_path) {
        Ok(bytes) => bytes,
        Err(e) => {
            eprintln!("{}", e);
            return 1;
        }
    };
    if let Err(e) = fs::write(&target, data) {
        eprintln!("{}", e);
        return 1;
    }
    println!("{}", rel_path(repo_root, &target));
    0
}

fn read_stdin_text() -> Result<String, String> {
    let mut input = String::new();
    io::stdin()
        .read_to_string(&mut input)
        .map_err(|e| e.to_string())?;
    let trimmed = input.trim().to_string();
    if trimmed.is_empty() {
        return Err("stdin is empty".to_string());
    }
    Ok(trimmed)
}

fn read_clipboard_text() -> Result<String, String> {
    let commands: Vec<Vec<&str>> = match env::consts::OS {
        "macos" => vec![vec!["pbpaste"]],
        "windows" => vec![vec![
            "powershell",
            "-NoProfile",
            "-Command",
            "Get-Clipboard",
        ]],
        _ => vec![
            vec!["wl-paste", "-n"],
            vec!["xclip", "-selection", "clipboard", "-o"],
        ],
    };
    let mut last_error = "clipboard command is unavailable".to_string();
    for command in commands {
        let output = Command::new(command[0]).args(&command[1..]).output();
        match output {
            Ok(result) if result.status.success() => {
                let text = String::from_utf8_lossy(&result.stdout).trim().to_string();
                if text.is_empty() {
                    return Err("clipboard is empty".to_string());
                }
                return Ok(text);
            }
            Ok(result) => {
                let stderr = String::from_utf8_lossy(&result.stderr).trim().to_string();
                let stdout = String::from_utf8_lossy(&result.stdout).trim().to_string();
                if !stderr.is_empty() {
                    last_error = stderr;
                } else if !stdout.is_empty() {
                    last_error = stdout;
                }
            }
            Err(e) => {
                last_error = e.to_string();
            }
        }
    }
    Err(last_error)
}

fn io_err(p: &Path) -> String {
    format!(
        "{}",
        io::Error::new(
            io::ErrorKind::Other,
            format!("failed to read {}", p.display())
        )
    )
}

fn note_path(root: &Path, slug: &str) -> PathBuf {
    root.join("notes").join(format!("{}.md", slug))
}
fn daily_path(root: &Path, date: &str) -> PathBuf {
    let y = &date[0..4];
    let m = &date[5..7];
    let d = &date[8..10];
    root.join("dailies")
        .join(y)
        .join(m)
        .join(format!("{}.md", d))
}
fn decision_path(root: &Path, slug: &str) -> PathBuf {
    root.join("decisions").join(format!("{}.md", slug))
}
fn review_path(root: &Path, slug: &str) -> PathBuf {
    root.join("reviews").join(format!("{}.md", slug))
}
fn project_path(root: &Path, slug: &str) -> PathBuf {
    root.join("projects").join(slug).join("README.md")
}

// ---- validate/list/search/stats ----

#[derive(Clone, Debug, Default)]
struct Document {
    path: String,
    id: String,
    type_: String,
    title: String,
    slug: String,
    status: String,
    date: String,
    theme: Vec<String>,
    project: Vec<String>,
    tags: Vec<String>,
    source: Vec<String>,
    summary: String,
    body: String,
    created: String,
    updated: String,
}

#[derive(Default)]
struct QueryFilters {
    type_: Option<String>,
    status: Option<String>,
    project: Option<String>,
    date: Option<String>,
    theme: Option<String>,
    tag: Option<String>,
    source: Option<String>,
}

fn cmd_validate(repo_root: &Path) -> i32 {
    let files = collect_documents(repo_root);
    let errs = validate_all(repo_root, &files);
    if !errs.is_empty() {
        for e in errs {
            println!("{}", e);
        }
        return 1;
    }
    println!("OK");
    0
}

fn cmd_list(repo_root: &Path, args: &[String]) -> i32 {
    let mut filters = QueryFilters::default();
    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--type" if i + 1 < args.len() => {
                filters.type_ = Some(args[i + 1].clone());
                i += 2;
            }
            "--status" if i + 1 < args.len() => {
                filters.status = Some(args[i + 1].clone());
                i += 2;
            }
            "--project" if i + 1 < args.len() => {
                filters.project = Some(args[i + 1].clone());
                i += 2;
            }
            "--date" if i + 1 < args.len() => {
                filters.date = Some(args[i + 1].clone());
                i += 2;
            }
            "--theme" if i + 1 < args.len() => {
                filters.theme = Some(args[i + 1].clone());
                i += 2;
            }
            "--tag" if i + 1 < args.len() => {
                filters.tag = Some(args[i + 1].clone());
                i += 2;
            }
            "--source" if i + 1 < args.len() => {
                filters.source = Some(args[i + 1].clone());
                i += 2;
            }
            _ => {
                i += 1;
            }
        }
    }
    let mut idx = build_index(repo_root);
    idx.sort_by(|a, b| a.path.cmp(&b.path));
    for d in idx {
        if matches_query_filters(&d, &filters) {
            println!("{}\t{}\t{}", d.type_, d.title, d.path);
        }
    }
    0
}

fn cmd_search(repo_root: &Path, args: &[String]) -> i32 {
    if args.is_empty() {
        eprintln!("missing query");
        return 1;
    }
    let mut filters = QueryFilters::default();
    let mut query: Option<String> = None;
    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "--status" if i + 1 < args.len() => {
                filters.status = Some(args[i + 1].clone());
                i += 2;
            }
            "--project" if i + 1 < args.len() => {
                filters.project = Some(args[i + 1].clone());
                i += 2;
            }
            "--date" if i + 1 < args.len() => {
                filters.date = Some(args[i + 1].clone());
                i += 2;
            }
            "--type" if i + 1 < args.len() => {
                filters.type_ = Some(args[i + 1].clone());
                i += 2;
            }
            "--theme" if i + 1 < args.len() => {
                filters.theme = Some(args[i + 1].clone());
                i += 2;
            }
            "--tag" if i + 1 < args.len() => {
                filters.tag = Some(args[i + 1].clone());
                i += 2;
            }
            "--source" if i + 1 < args.len() => {
                filters.source = Some(args[i + 1].clone());
                i += 2;
            }
            value if !value.starts_with("--") && query.is_none() => {
                query = Some(value.to_string());
                i += 1;
            }
            _ => {
                i += 1;
            }
        }
    }
    let Some(query_text) = query else {
        eprintln!("missing query");
        return 1;
    };
    let q = query_text.to_lowercase();
    let mut idx = build_index(repo_root);
    idx.sort_by(|a, b| a.path.cmp(&b.path));
    for d in idx {
        if !matches_query_filters(&d, &filters) {
            continue;
        }
        let t = d.title.to_lowercase();
        let s = d.summary.to_lowercase();
        let b = d.body.to_lowercase();
        if t.contains(&q) || s.contains(&q) || b.contains(&q) {
            println!("{}\t{}\t{}", d.type_, d.title, d.path);
        }
    }
    0
}

fn cmd_stats(repo_root: &Path) -> i32 {
    let idx = build_index(repo_root);
    println!("total\t{}", idx.len());
    let mut by_type: std::collections::BTreeMap<String, usize> = Default::default();
    let mut by_status: std::collections::BTreeMap<String, usize> = Default::default();
    for d in idx {
        *by_type.entry(d.type_).or_default() += 1;
        *by_status.entry(d.status).or_default() += 1;
    }
    for (k, v) in by_type {
        println!("type:{}\t{}", k, v);
    }
    for (k, v) in by_status {
        println!("status:{}\t{}", k, v);
    }
    0
}

fn cmd_export(repo_root: &Path, args: &[String]) -> i32 {
    if args.is_empty() {
        eprintln!("missing export type");
        return 1;
    }
    let idx = build_index(repo_root);
    match args[0].as_str() {
        "document-list" => {
            println!("{}", export_document_list_json(&idx));
            0
        }
        "manifest" => {
            println!("{}", export_manifest_json(&idx));
            0
        }
        "change-list" => {
            println!("{}", export_change_list_json(&idx));
            0
        }
        _ => {
            eprintln!("Unsupported export type");
            1
        }
    }
}

fn export_document_list_json(idx: &[Document]) -> String {
    let mut docs = idx.to_vec();
    docs.sort_by(|a, b| a.path.cmp(&b.path));
    let items = docs
        .iter()
        .map(|d| {
            json_object(&[
                ("path", json_string(&d.path)),
                ("id", json_string(&d.id)),
                ("type", json_string(&d.type_)),
                ("title", json_string(&d.title)),
                ("status", json_string(&d.status)),
                ("created_at", json_string(&d.created)),
                ("updated_at", json_string(&d.updated)),
            ])
        })
        .collect::<Vec<_>>()
        .join(",\n");
    format!("[\n{}\n]", indent_lines(&items, 2))
}

fn export_manifest_json(idx: &[Document]) -> String {
    let documents = export_document_list_json(idx);
    json_object(&[
        ("generated_at", json_string(&timestamp_utc_rfc3339())),
        ("total", idx.len().to_string()),
        ("documents", documents),
    ])
}

fn export_change_list_json(idx: &[Document]) -> String {
    let mut docs = idx.to_vec();
    docs.sort_by(|a, b| b.updated.cmp(&a.updated).then_with(|| a.path.cmp(&b.path)));
    let items = docs
        .iter()
        .map(|d| {
            json_object(&[
                ("path", json_string(&d.path)),
                ("id", json_string(&d.id)),
                ("type", json_string(&d.type_)),
                ("title", json_string(&d.title)),
                ("status", json_string(&d.status)),
                ("updated_at", json_string(&d.updated)),
            ])
        })
        .collect::<Vec<_>>()
        .join(",\n");
    format!("[\n{}\n]", indent_lines(&items, 2))
}

fn json_object(fields: &[(&str, String)]) -> String {
    let body = fields
        .iter()
        .map(|(key, value)| format!("{}: {}", json_string(key), value))
        .collect::<Vec<_>>()
        .join(",\n");
    format!("{{\n{}\n}}", indent_lines(&body, 2))
}

fn indent_lines(text: &str, spaces: usize) -> String {
    let indent = " ".repeat(spaces);
    text.lines()
        .map(|line| format!("{}{}", indent, line))
        .collect::<Vec<_>>()
        .join("\n")
}

fn json_string(value: &str) -> String {
    let mut out = String::from("\"");
    for ch in value.chars() {
        match ch {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if c.is_control() => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out.push('"');
    out
}

fn collect_documents(repo_root: &Path) -> Vec<PathBuf> {
    let mut files = vec![];
    for r in ["notes", "dailies", "decisions", "reviews", "projects"] {
        let root = repo_root.join(r);
        let _ = visit(&root, &mut files);
    }
    files
}

fn visit(root: &Path, out: &mut Vec<PathBuf>) -> io::Result<()> {
    if !root.exists() {
        return Ok(());
    }
    for e in fs::read_dir(root)? {
        let e = e?;
        let p = e.path();
        if p.is_dir() {
            let _ = visit(&p, out);
        } else if p.extension().map(|s| s == "md").unwrap_or(false) {
            out.push(p);
        }
    }
    Ok(())
}

fn build_index(repo_root: &Path) -> Vec<Document> {
    let mut out = vec![];
    for f in collect_documents(repo_root) {
        if let Ok((meta, body)) = parse_frontmatter_file(&f) {
            let mut d = Document::default();
            d.path = rel_path(repo_root, &f);
            d.id = meta.get("id").cloned().unwrap_or_default();
            d.type_ = meta.get("type").cloned().unwrap_or_default();
            d.title = meta.get("title").cloned().unwrap_or_default();
            d.slug = meta.get("slug").cloned().unwrap_or_default();
            d.status = meta.get("status").cloned().unwrap_or_default();
            d.date = meta.get("date").cloned().unwrap_or_default();
            d.theme = parse_front_list(meta.get("theme").map(String::as_str).unwrap_or(""));
            d.project = parse_front_list(meta.get("project").map(String::as_str).unwrap_or(""));
            d.tags = parse_front_list(meta.get("tags").map(String::as_str).unwrap_or(""));
            d.source = parse_front_list(meta.get("source").map(String::as_str).unwrap_or(""));
            d.summary = meta.get("summary").cloned().unwrap_or_default();
            d.body = body.trim().to_string();
            d.created = meta.get("created_at").cloned().unwrap_or_default();
            d.updated = meta.get("updated_at").cloned().unwrap_or_default();
            out.push(d);
        }
    }
    out
}

fn parse_frontmatter_file(
    p: &Path,
) -> Result<(std::collections::BTreeMap<String, String>, String), String> {
    let text = fs::read_to_string(p).map_err(|e| e.to_string())?;
    parse_frontmatter(&text)
}

fn parse_frontmatter(
    text: &str,
) -> Result<(std::collections::BTreeMap<String, String>, String), String> {
    if !text.starts_with("---\n") {
        return Err("missing frontmatter".into());
    }
    let rest = &text[4..];
    let Some(end) = rest.find("\n---\n") else {
        return Err("unterminated frontmatter".into());
    };
    let block = &rest[..end];
    let body = &rest[end + 5..];
    let mut data: std::collections::BTreeMap<String, String> = Default::default();
    for line in block.lines() {
        if line.trim().is_empty() {
            continue;
        }
        if let Some((k, v)) = line.split_once(':') {
            data.insert(k.trim().to_string(), parse_front_value(v.trim()));
        } else {
            return Err(format!("invalid frontmatter line: {}", line));
        }
    }
    Ok((data, body.to_string()))
}

fn parse_front_value(v: &str) -> String {
    if v.starts_with('[') && v.ends_with(']') {
        return v.to_string();
    }
    if v == "\"\"" {
        return String::new();
    }
    v.to_string()
}

fn parse_front_list(value: &str) -> Vec<String> {
    let trimmed = value.trim();
    if !(trimmed.starts_with('[') && trimmed.ends_with(']')) {
        return if trimmed.is_empty() {
            vec![]
        } else {
            vec![trimmed.to_string()]
        };
    }
    let inner = &trimmed[1..trimmed.len() - 1];
    if inner.trim().is_empty() {
        return vec![];
    }
    inner
        .split(',')
        .map(|item| item.trim().trim_matches('"').trim_matches('\''))
        .filter(|item| !item.is_empty())
        .map(|item| item.to_string())
        .collect()
}

fn matches_query_filters(doc: &Document, filters: &QueryFilters) -> bool {
    if filters.type_.as_ref().is_some_and(|value| doc.type_ != *value) {
        return false;
    }
    if filters.status.as_ref().is_some_and(|value| doc.status != *value) {
        return false;
    }
    if filters
        .project
        .as_ref()
        .is_some_and(|value| !doc.project.iter().any(|entry| entry == value))
    {
        return false;
    }
    if filters.date.as_ref().is_some_and(|value| doc.date != *value) {
        return false;
    }
    if filters
        .theme
        .as_ref()
        .is_some_and(|value| !doc.theme.iter().any(|entry| entry == value))
    {
        return false;
    }
    if filters
        .tag
        .as_ref()
        .is_some_and(|value| !doc.tags.iter().any(|entry| entry == value))
    {
        return false;
    }
    if filters
        .source
        .as_ref()
        .is_some_and(|value| !doc.source.iter().any(|entry| entry == value))
    {
        return false;
    }
    true
}

fn validate_all(repo_root: &Path, files: &[PathBuf]) -> Vec<String> {
    let mut errs = vec![];
    let mut ids: std::collections::BTreeMap<String, Vec<String>> = Default::default();
    for f in files {
        let rel = rel_path(repo_root, f);
        match parse_frontmatter_file(f) {
            Ok((meta, body)) => {
                for k in [
                    "id",
                    "type",
                    "title",
                    "slug",
                    "created_at",
                    "updated_at",
                    "status",
                ] {
                    if meta.get(k).map(String::is_empty).unwrap_or(true) {
                        errs.push(format!("{}: missing required field: {}", rel, k));
                    }
                }
                let dt = meta.get("type").cloned().unwrap_or_default();
                if !matches!(
                    dt.as_str(),
                    "daily" | "note" | "decision" | "review" | "project"
                ) {
                    errs.push(format!("{}: unsupported type: {}", rel, dt));
                    continue;
                }
                let st = meta.get("status").cloned().unwrap_or_default();
                if !st.is_empty()
                    && !matches!(st.as_str(), "inbox" | "active" | "evergreen" | "archived")
                {
                    errs.push(format!("{}: unsupported status: {}", rel, st));
                }
                let slug = meta.get("slug").cloned().unwrap_or_default();
                if !slug.is_empty() && !valid_slug(&slug) {
                    errs.push(format!("{}: invalid slug: {}", rel, slug));
                }
                if dt == "daily" {
                    let date_val = meta.get("date").cloned().unwrap_or_default();
                    if date_val.is_empty() {
                        errs.push(format!("{}: missing required field: date", rel));
                    } else {
                        let exp = format!(
                            "dailies/{}/{}/{}.md",
                            &date_val[0..4],
                            &date_val[5..7],
                            &date_val[8..10]
                        );
                        if rel != exp {
                            errs.push(format!("{}: invalid daily path", rel));
                        }
                        if slug != date_val {
                            errs.push(format!("{}: daily slug must match date", rel));
                        }
                    }
                } else if dt == "project" {
                    let exp = format!("projects/{}/README.md", slug);
                    if rel != exp {
                        errs.push(format!("{}: invalid path for type: {}", rel, dt));
                    }
                    if let Some(gw) = meta.get("git_worktree").cloned() {
                        if !gw.trim().is_empty() {
                            let abs = must_abs(&gw);
                            if !Path::new(&abs).is_dir() {
                                errs.push(format!("{}: git_worktree path does not exist", rel));
                            } else if !is_git_worktree(&abs) {
                                errs.push(format!(
                                    "{}: git_worktree is not a git working tree",
                                    rel
                                ));
                            }
                        }
                    }
                } else {
                    let prefix = match dt.as_str() {
                        "note" => "notes/",
                        "decision" => "decisions/",
                        "review" => "reviews/",
                        _ => "",
                    };
                    if !prefix.is_empty() {
                        if !rel.starts_with(prefix) {
                            errs.push(format!("{}: invalid path for type: {}", rel, dt));
                        }
                        if Path::new(&rel)
                            .file_name()
                            .map(|n| n.to_string_lossy() != format!("{}.md", slug))
                            .unwrap_or(true)
                        {
                            errs.push(format!("{}: slug does not match file name", rel));
                        }
                    }
                }
                if let Some(id) = meta.get("id").cloned() {
                    ids.entry(id).or_default().push(rel);
                }
                errs.extend(validate_markdown_links(repo_root, f, &body));
            }
            Err(e) => errs.push(format!("{}: {}", rel, e)),
        }
    }
    for (id, paths) in ids {
        if paths.len() > 1 {
            errs.push(format!("duplicate id: {} -> {}", id, paths.join(", ")));
        }
    }
    errs
}

fn valid_slug(s: &str) -> bool {
    let b = s.as_bytes();
    if b.is_empty() {
        return false;
    }
    if b[0] == b'-' || *b.last().unwrap() == b'-' {
        return false;
    }
    let mut prev_dash = false;
    for &ch in b {
        match ch {
            b'0'..=b'9' | b'a'..=b'z' => prev_dash = false,
            b'-' => {
                if prev_dash {
                    return false;
                }
                prev_dash = true;
            }
            _ => return false,
        }
    }
    true
}

fn validate_markdown_links(repo_root: &Path, document_path: &Path, body: &str) -> Vec<String> {
    let mut errs = vec![];
    let rel = rel_path(repo_root, document_path);
    let assets_root = repo_root.join("assets");
    let references_root = repo_root.join("references");
    for target in markdown_targets(body) {
        let cleaned = clean_markdown_target(&target);
        if cleaned.is_empty() || is_external_target(&cleaned) {
            continue;
        }
        let resolved = normalize_path(&document_path.parent().unwrap_or(repo_root).join(&cleaned));
        if is_under_root(&resolved, &assets_root) && !resolved.exists() {
            errs.push(format!("{}: missing asset path: {}", rel, cleaned));
        } else if is_under_root(&resolved, &references_root) && !resolved.exists() {
            errs.push(format!("{}: missing reference path: {}", rel, cleaned));
        }
    }
    errs
}

fn markdown_targets(body: &str) -> Vec<String> {
    let bytes = body.as_bytes();
    let mut out = vec![];
    let mut i = 0usize;
    while i < bytes.len() {
        if bytes[i] == b'[' || (bytes[i] == b'!' && i + 1 < bytes.len() && bytes[i + 1] == b'[') {
            let mut j = i;
            while j < bytes.len() && bytes[j] != b']' {
                j += 1;
            }
            if j + 1 < bytes.len() && bytes[j + 1] == b'(' {
                let start = j + 2;
                let mut end = start;
                while end < bytes.len() && bytes[end] != b')' {
                    end += 1;
                }
                if end <= bytes.len() {
                    out.push(body[start..end].to_string());
                    i = end;
                }
            }
        }
        i += 1;
    }
    out
}

fn clean_markdown_target(target: &str) -> String {
    let trimmed = target.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    let no_title = trimmed.split_once(' ').map(|(a, _)| a).unwrap_or(trimmed);
    no_title.trim_matches(|c| c == '<' || c == '>').to_string()
}

fn is_external_target(target: &str) -> bool {
    let lower = target.to_lowercase();
    target.starts_with('#')
        || target.starts_with('/')
        || target.contains("://")
        || lower.starts_with("mailto:")
        || lower.starts_with("data:")
}

fn is_under_root(path: &Path, root: &Path) -> bool {
    path.strip_prefix(root).is_ok()
}

fn normalize_path(path: &Path) -> PathBuf {
    let mut normalized = PathBuf::new();
    for component in path.components() {
        match component {
            std::path::Component::CurDir => {}
            std::path::Component::ParentDir => {
                normalized.pop();
            }
            other => normalized.push(other.as_os_str()),
        }
    }
    normalized
}

// ---- project (git) ----

fn cmd_project(repo_root: &Path, args: &[String]) -> i32 {
    if args.is_empty() {
        eprintln!("missing project subcommand");
        return 1;
    }
    let sub = &args[0];
    let mut project = String::new();
    let mut name = String::new();
    let mut url = String::new();
    let mut remote = String::from("origin");
    let mut branch = String::new();
    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--project" if i + 1 < args.len() => {
                project = args[i + 1].clone();
                i += 2;
            }
            "--name" if i + 1 < args.len() => {
                name = args[i + 1].clone();
                i += 2;
            }
            "--url" if i + 1 < args.len() => {
                url = args[i + 1].clone();
                i += 2;
            }
            "--remote" if i + 1 < args.len() => {
                remote = args[i + 1].clone();
                i += 2;
            }
            "--branch" if i + 1 < args.len() => {
                branch = args[i + 1].clone();
                i += 2;
            }
            _ => {
                i += 1;
            }
        }
    }
    if project.is_empty() {
        eprintln!("--project is required");
        return 1;
    }
    let worktree = match resolve_project_git_worktree(repo_root, &project) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("{}", e);
            return 1;
        }
    };
    match sub.as_str() {
        "add-remote" => {
            if name.is_empty() || url.is_empty() {
                eprintln!("--name and --url are required");
                return 1;
            }
            if let Err(e) = git(&worktree, &["remote", "add", &name, &url]) {
                eprintln!("{}", e);
                return 1;
            }
            println!("{}\tremote-added\t{}\t{}", project, name, url);
            0
        }
        "fetch" => {
            if let Err(e) = git(&worktree, &["fetch", &remote, "--prune"]) {
                eprintln!("{}", e);
                return 1;
            }
            println!("{}\tfetched\t{}", project, remote);
            0
        }
        "push" => {
            let br = if branch.is_empty() {
                match current_branch(&worktree) {
                    Ok(b) => b,
                    Err(e) => {
                        eprintln!("{}", e);
                        return 1;
                    }
                }
            } else {
                branch.clone()
            };
            if let Err(e) = git(&worktree, &["push", "-u", &remote, &br]) {
                eprintln!("{}", e);
                return 1;
            }
            println!("{}\tpushed\t{}\t{}", project, remote, br);
            0
        }
        "sync" => {
            if let Err(e) = git(&worktree, &["fetch", &remote, "--prune"]) {
                eprintln!("{}", e);
                return 1;
            }
            let br = if branch.is_empty() {
                match current_branch(&worktree) {
                    Ok(b) => b,
                    Err(e) => {
                        eprintln!("{}", e);
                        return 1;
                    }
                }
            } else {
                branch.clone()
            };
            if let Err(e) = git(&worktree, &["push", "-u", &remote, &br]) {
                eprintln!("{}", e);
                return 1;
            }
            println!("{}\tfetched\t{}", project, remote);
            println!("{}\tpushed\t{}\t{}", project, remote, br);
            0
        }
        _ => {
            eprintln!("Unsupported project command");
            1
        }
    }
}

fn resolve_project_git_worktree(repo_root: &Path, slug: &str) -> Result<String, String> {
    let p = repo_root.join("projects").join(slug).join("README.md");
    let text = fs::read_to_string(&p)
        .map_err(|_| format!("Project document does not exist: {}", p.display()))?;
    let (meta, _body) = parse_frontmatter(&text).map_err(|e| e.to_string())?;
    let gw = meta.get("git_worktree").cloned().unwrap_or_default();
    if gw.trim().is_empty() {
        return Err(format!(
            "Project document is missing git_worktree: {}",
            p.display()
        ));
    }
    resolve_git_worktree(&gw)
}

fn resolve_git_worktree(p: &str) -> Result<String, String> {
    let abs = must_abs(p);
    let md = Path::new(&abs)
        .metadata()
        .map_err(|_| format!("Git worktree path does not exist: {}", abs))?;
    if !md.is_dir() {
        return Err(format!("Git worktree path does not exist: {}", abs));
    }
    if !is_git_worktree(&abs) {
        return Err(format!(
            "Git worktree path is not a git working tree: {}",
            abs
        ));
    }
    Ok(abs)
}

fn is_git_worktree(path: &str) -> bool {
    let out = run_cmd(Some(path), "git", &["rev-parse", "--is-inside-work-tree"]);
    out.code == 0 && out.stdout.trim() == "true"
}

fn must_abs(p: &str) -> String {
    let p = expand_user(p);
    let abs = if Path::new(&p).is_absolute() {
        PathBuf::from(&p)
    } else {
        env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join(&p)
    };
    fs::canonicalize(&abs).unwrap_or(abs).display().to_string()
}

fn git(cwd: &str, args: &[&str]) -> Result<(), String> {
    let out = run_cmd(Some(cwd), "git", args);
    if out.code != 0 {
        return Err(out.stderr.trim().to_string());
    }
    Ok(())
}

fn current_branch(cwd: &str) -> Result<String, String> {
    let out = run_cmd(Some(cwd), "git", &["branch", "--show-current"]);
    if out.code != 0 {
        return Err(out.stderr);
    }
    let s = out.stdout.trim().to_string();
    if s.is_empty() {
        return Err(format!("Git worktree is not on a branch: {}", cwd));
    }
    Ok(s)
}

struct CmdOut {
    stdout: String,
    stderr: String,
    code: i32,
}
fn run_cmd(cwd: Option<&str>, name: &str, args: &[&str]) -> CmdOut {
    let mut cmd = Command::new(name);
    cmd.args(args);
    if let Some(dir) = cwd {
        cmd.current_dir(dir);
    }
    match cmd.stdout(Stdio::piped()).stderr(Stdio::piped()).output() {
        Ok(o) => CmdOut {
            stdout: String::from_utf8_lossy(&o.stdout).to_string(),
            stderr: String::from_utf8_lossy(&o.stderr).to_string(),
            code: o.status.code().unwrap_or(1),
        },
        Err(e) => CmdOut {
            stdout: String::new(),
            stderr: e.to_string(),
            code: 1,
        },
    }
}

fn new_uuid() -> String {
    // Not a real UUID v4, but good enough for tests without external crates
    let t = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    format!(
        "{:08x}-{:04x}-{:04x}-{:04x}-{:012x}",
        (t & 0xffffffff) as u64,
        ((t >> 32) & 0xffff) as u64,
        ((t >> 48) & 0xffff) as u64,
        ((t >> 16) & 0xffff) as u64,
        (t & 0xffffffffffff) as u128
    )
}

#[cfg(test)]
mod tests {
    use super::{format_utc_date, format_utc_timestamp};

    #[test]
    fn formats_unix_epoch_timestamp() {
        assert_eq!(format_utc_timestamp(0), "1970-01-01T00:00:00Z");
    }

    #[test]
    fn formats_known_calendar_day() {
        assert_eq!(format_utc_date(1_741_651_200), "2025-03-11");
    }

    #[test]
    fn formats_known_timestamp() {
        assert_eq!(format_utc_timestamp(1_741_651_261), "2025-03-11T00:01:01Z");
    }
}
