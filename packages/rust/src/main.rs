use std::env;
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

fn main() {
    std::process::exit(run(std::env::args().skip(1).collect()));
}

fn run(argv: Vec<String>) -> i32 {
    if argv.is_empty() {
        eprintln!("usage: kg --repo <path> <command> [args]");
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

    // Minimal flag parse: expect --repo first now
    if args.len() < 3 || args[0] != "--repo" {
        eprintln!("--repo is required");
        return 1;
    }
    let repo_root = match resolve_repo_root(&args[1]) {
        Ok(p) => p,
        Err(e) => {
            eprintln!("{}", e);
            return 1;
        }
    };

    if args.len() < 3 {
        eprintln!("missing command");
        return 1;
    }
    let cmd = &args[2];
    match cmd.as_str() {
        "create" => cmd_create(&repo_root, &args[3..]),
        "validate" => cmd_validate(&repo_root),
        "list" => cmd_list(&repo_root, &args[3..]),
        "search" => cmd_search(&repo_root, &args[3..]),
        "stats" => cmd_stats(&repo_root),
        "project" => cmd_project(&repo_root, &args[3..]),
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

fn resolve_repo_root(p: &str) -> Result<PathBuf, String> {
    let expanded = expand_user(p);
    let abs = std::fs::canonicalize(&expanded).unwrap_or_else(|_| PathBuf::from(&expanded));
    if abs.is_dir() {
        Ok(abs)
    } else {
        Err(format!("Repository path does not exist: {}", abs.display()))
    }
}

fn expand_user(s: &str) -> String {
    if let Some(rest) = s.strip_prefix('~') {
        if let Some(home) = dirs_home() {
            return Path::new(&home).join(rest.trim_start_matches('/')).display().to_string();
        }
    }
    shellexpand_env(s)
}

fn dirs_home() -> Option<String> {
    if let Ok(h) = env::var("HOME") { if !h.is_empty() { return Some(h); } }
    if cfg!(windows) {
        if let Ok(h) = env::var("USERPROFILE") { if !h.is_empty() { return Some(h); } }
    }
    None
}

// A tiny env expander without external deps
fn shellexpand_env(s: &str) -> String {
    let mut out = String::new();
    let mut chars = s.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '$' {
            if let Some(&'{') = chars.peek() { chars.next(); /* consume '{' */ }
            let mut name = String::new();
            while let Some(&ch) = chars.peek() {
                if ch.is_alphanumeric() || ch == '_' { name.push(ch); chars.next(); } else { break; }
            }
            if let Some(&'}') = chars.peek() { chars.next(); }
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
        if is_alnum { slug.push(ch); last_dash = false; }
        else { if !last_dash { slug.push('-'); last_dash = true; } }
    }
    let slug = slug.trim_matches('-').to_string();
    if slug.is_empty() { return Err("Title must contain at least one alphanumeric character".into()); }
    Ok(slug)
}

fn timestamp_utc_rfc3339() -> String {
    // Avoid external crates: ask the OS date(1)
    match Command::new("date").args(["-u", "+%Y-%m-%dT%H:%M:%SZ"]).output() {
        Ok(o) if o.status.success() => String::from_utf8_lossy(&o.stdout).trim().to_string(),
        _ => "1970-01-01T00:00:00Z".to_string(),
    }
}

fn today_yyyy_mm_dd() -> String {
    match Command::new("date").args(["-u", "+%Y-%m-%d"]).output() {
        Ok(o) if o.status.success() => String::from_utf8_lossy(&o.stdout).trim().to_string(),
        _ => "1970-01-01".to_string(),
    }
}

fn rel_path(root: &Path, p: &Path) -> String {
    let rel = match p.strip_prefix(root) { Ok(r) => r.to_path_buf(), Err(_) => p.to_path_buf() };
    let mut s = String::new();
    for (i, comp) in rel.components().enumerate() {
        if i > 0 { s.push('/'); }
        s.push_str(&comp.as_os_str().to_string_lossy());
    }
    if s.is_empty() { p.to_string_lossy().replace('\\', "/") } else { s }
}

// ---- create ----

fn cmd_create(repo_root: &Path, args: &[String]) -> i32 {
    if args.is_empty() { eprintln!("missing create type"); return 1; }
    let create_type = args[0].as_str();
    let mut title: Option<String> = None;
    let mut date_text: Option<String> = None;
    let mut git_worktree: Option<String> = None;
    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--title" if i + 1 < args.len() => { title = Some(args[i+1].clone()); i += 2; }
            "--date" if i + 1 < args.len() => { date_text = Some(args[i+1].clone()); i += 2; }
            "--git-worktree" if i + 1 < args.len() => { git_worktree = Some(args[i+1].clone()); i += 2; }
            _ => { i += 1; }
        }
    }
    let now = timestamp_utc_rfc3339();
    let mut derived_date: Option<String> = None;
    let mut derived_git_worktree: Option<String> = None;
    let mut derived_slug: Option<String> = None;
    let (target, template) = match create_type {
        "note" => {
            let t = title.clone().unwrap_or_default();
            if t.is_empty() { eprintln!("--title is required"); return 1; }
            let slug = match slugify(&t) { Ok(s) => s, Err(e) => { eprintln!("{}", e); return 1;} };
            derived_slug = Some(slug.clone());
            (note_path(repo_root, &slug), "note")
        }
        "daily" => {
            let dt = date_text.clone().unwrap_or_else(|| today_yyyy_mm_dd());
            derived_date = Some(dt.clone());
            derived_slug = Some(dt.clone());
            (daily_path(repo_root, &dt), "daily")
        }
        "decision" => {
            let t = title.clone().unwrap_or_default();
            if t.is_empty() { eprintln!("--title is required"); return 1; }
            let slug = match slugify(&t) { Ok(s) => s, Err(e) => { eprintln!("{}", e); return 1;} };
            derived_slug = Some(slug.clone());
            (decision_path(repo_root, &slug), "decision")
        }
        "review" => {
            let t = title.clone().unwrap_or_default();
            if t.is_empty() { eprintln!("--title is required"); return 1; }
            let slug = match slugify(&t) { Ok(s) => s, Err(e) => { eprintln!("{}", e); return 1;} };
            let dt = date_text.clone().unwrap_or_else(|| today_yyyy_mm_dd());
            derived_date = Some(dt);
            derived_slug = Some(slug.clone());
            let path = review_path(repo_root, &slug);
            (path, "review")
        }
        "project" => {
            let t = title.clone().unwrap_or_default();
            if t.is_empty() || git_worktree.is_none() { eprintln!("--title and --git-worktree are required"); return 1; }
            let gw = match resolve_git_worktree(&git_worktree.clone().unwrap()) {
                Ok(p) => p,
                Err(e) => { eprintln!("{}", e); return 1; }
            };
            let slug = match slugify(&t) { Ok(s) => s, Err(e) => { eprintln!("{}", e); return 1;} };
            let path = project_path(repo_root, &slug);
            derived_git_worktree = Some(gw);
            derived_slug = Some(slug);
            (path, "project")
        }
        _ => { eprintln!("Unsupported create type"); return 1; }
    };

    // Build replacement map
    let mut map = std::collections::BTreeMap::new();
    map.insert("id".to_string(), new_uuid());
    map.insert("created_at".to_string(), now.clone());
    map.insert("updated_at".to_string(), now);
    if let Some(t) = title { map.insert("title".into(), t); }
    if let Some(d) = derived_date { map.insert("date".into(), d.clone()); if !map.contains_key("title") { map.insert("title".into(), d.clone()); } if create_type == "daily" { map.insert("slug".into(), d); } }
    if let Some(gw) = derived_git_worktree { map.insert("git_worktree".into(), must_abs(&gw)); }
    if let Some(s) = derived_slug { map.insert("slug".into(), s); }

    let code = create_from_template(repo_root, template, &map, &target);
    if code != 0 { return code; }
    println!("{}", rel_path(repo_root, &target));
    0
}

fn create_from_template(repo_root: &Path, name: &str, repl: &std::collections::BTreeMap<String,String>, target: &Path) -> i32 {
    if target.exists() { eprintln!("Target file already exists: {}", target.display()); return 1; }
    let tpl = repo_root.join("templates").join(format!("{}.md", name));
    let Ok(mut text) = fs::read_to_string(&tpl) else { eprintln!("{}", io_err(&tpl)); return 1; };
    for (k, v) in repl.iter() { text = text.replace(&format!("<{}>", k), v); }
    if let Some(dir) = target.parent() { if let Err(e) = fs::create_dir_all(dir) { eprintln!("{}", e); return 1; } }
    if let Err(e) = fs::write(target, text.as_bytes()) { eprintln!("{}", e); return 1; }
    0
}

fn io_err(p: &Path) -> String { format!("{}", io::Error::new(io::ErrorKind::Other, format!("failed to read {}", p.display()))) }

fn note_path(root: &Path, slug: &str) -> PathBuf { root.join("notes").join(format!("{}.md", slug)) }
fn daily_path(root: &Path, date: &str) -> PathBuf {
    let y = &date[0..4]; let m = &date[5..7]; let d = &date[8..10];
    root.join("dailies").join(y).join(m).join(format!("{}.md", d))
}
fn decision_path(root: &Path, slug: &str) -> PathBuf { root.join("decisions").join(format!("{}.md", slug)) }
fn review_path(root: &Path, slug: &str) -> PathBuf { root.join("reviews").join(format!("{}.md", slug)) }
fn project_path(root: &Path, slug: &str) -> PathBuf { root.join("projects").join(slug).join("README.md") }

// ---- validate/list/search/stats ----

#[derive(Clone, Debug, Default)]
struct Document { path: String, id: String, type_: String, title: String, slug: String, status: String, date: String, theme: Vec<String>, project: Vec<String>, tags: Vec<String>, source: Vec<String>, summary: String, body: String, created: String, updated: String }

fn cmd_validate(repo_root: &Path) -> i32 { let files = collect_documents(repo_root); let errs = validate_all(repo_root, &files); if !errs.is_empty() { for e in errs { println!("{}", e); } return 1; } println!("OK"); 0 }

fn cmd_list(repo_root: &Path, args: &[String]) -> i32 {
    let mut typ: Option<String> = None; let mut i = 0; while i < args.len() { if args[i] == "--type" && i+1 < args.len() { typ = Some(args[i+1].clone()); i+=2; } else { i+=1; } }
    let mut idx = build_index(repo_root);
    idx.sort_by(|a,b| a.path.cmp(&b.path));
    for d in idx { if typ.as_ref().map_or(true, |t| &d.type_ == t) { println!("{}\t{}\t{}", d.type_, d.title, d.path); } }
    0
}

fn cmd_search(repo_root: &Path, args: &[String]) -> i32 {
    if args.is_empty() { eprintln!("missing query"); return 1; }
    let q = args[0].to_lowercase();
    let mut idx = build_index(repo_root);
    idx.sort_by(|a,b| a.path.cmp(&b.path));
    for d in idx { let t = d.title.to_lowercase(); let s = d.summary.to_lowercase(); let b = d.body.to_lowercase(); if t.contains(&q) || s.contains(&q) || b.contains(&q) { println!("{}\t{}\t{}", d.type_, d.title, d.path); } }
    0
}

fn cmd_stats(repo_root: &Path) -> i32 {
    let idx = build_index(repo_root);
    println!("total\t{}", idx.len());
    let mut by_type: std::collections::BTreeMap<String, usize> = Default::default();
    let mut by_status: std::collections::BTreeMap<String, usize> = Default::default();
    for d in idx { *by_type.entry(d.type_).or_default() += 1; *by_status.entry(d.status).or_default() += 1; }
    for (k,v) in by_type { println!("type:{}\t{}", k, v); }
    for (k,v) in by_status { println!("status:{}\t{}", k, v); }
    0
}

fn collect_documents(repo_root: &Path) -> Vec<PathBuf> {
    let mut files = vec![];
    for r in ["notes","dailies","decisions","reviews","projects"] { let root = repo_root.join(r); let _ = visit(&root, &mut files); }
    files
}

fn visit(root: &Path, out: &mut Vec<PathBuf>) -> io::Result<()> {
    if !root.exists() { return Ok(()); }
    for e in fs::read_dir(root)? { let e = e?; let p = e.path(); if p.is_dir() { let _ = visit(&p, out); } else if p.extension().map(|s| s == "md").unwrap_or(false) { out.push(p); } }
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
            d.summary = meta.get("summary").cloned().unwrap_or_default();
            d.body = body.trim().to_string();
            d.created = meta.get("created_at").cloned().unwrap_or_default();
            d.updated = meta.get("updated_at").cloned().unwrap_or_default();
            out.push(d);
        }
    }
    out
}

fn parse_frontmatter_file(p: &Path) -> Result<(std::collections::BTreeMap<String,String>, String), String> {
    let text = fs::read_to_string(p).map_err(|e| e.to_string())?;
    parse_frontmatter(&text)
}

fn parse_frontmatter(text: &str) -> Result<(std::collections::BTreeMap<String,String>, String), String> {
    if !text.starts_with("---\n") { return Err("missing frontmatter".into()); }
    let rest = &text[4..];
    let Some(end) = rest.find("\n---\n") else { return Err("unterminated frontmatter".into()); };
    let block = &rest[..end];
    let body = &rest[end + 5..];
    let mut data: std::collections::BTreeMap<String,String> = Default::default();
    for line in block.lines() {
        if line.trim().is_empty() { continue; }
        if let Some((k,v)) = line.split_once(':') { data.insert(k.trim().to_string(), parse_front_value(v.trim())); }
        else { return Err(format!("invalid frontmatter line: {}", line)); }
    }
    Ok((data, body.to_string()))
}

fn parse_front_value(v: &str) -> String {
    if v.starts_with('[') && v.ends_with(']') { return v.to_string(); }
    if v == "\"\"" { return String::new(); }
    v.to_string()
}

fn validate_all(repo_root: &Path, files: &[PathBuf]) -> Vec<String> {
    let mut errs = vec![];
    let mut ids: std::collections::BTreeMap<String, Vec<String>> = Default::default();
    for f in files {
        let rel = rel_path(repo_root, f);
        match parse_frontmatter_file(f) {
            Ok((meta, _body)) => {
                for k in ["id","type","title","slug","created_at","updated_at","status"] { if meta.get(k).map(String::is_empty).unwrap_or(true) { errs.push(format!("{}: missing required field: {}", rel, k)); } }
                let dt = meta.get("type").cloned().unwrap_or_default();
                if !matches!(dt.as_str(), "daily"|"note"|"decision"|"review"|"project") { errs.push(format!("{}: unsupported type: {}", rel, dt)); continue; }
                let st = meta.get("status").cloned().unwrap_or_default();
                if !st.is_empty() && !matches!(st.as_str(), "inbox"|"active"|"evergreen"|"archived") { errs.push(format!("{}: unsupported status: {}", rel, st)); }
                let slug = meta.get("slug").cloned().unwrap_or_default();
                if !slug.is_empty() && !valid_slug(&slug) { errs.push(format!("{}: invalid slug: {}", rel, slug)); }
                if dt == "daily" {
                    let date_val = meta.get("date").cloned().unwrap_or_default();
                    if date_val.is_empty() { errs.push(format!("{}: missing required field: date", rel)); }
                    else {
                        let exp = format!("dailies/{}/{}/{}.md", &date_val[0..4], &date_val[5..7], &date_val[8..10]);
                        if rel != exp { errs.push(format!("{}: invalid daily path", rel)); }
                        if slug != date_val { errs.push(format!("{}: daily slug must match date", rel)); }
                    }
                } else if dt == "project" {
                    let exp = format!("projects/{}/README.md", slug);
                    if rel != exp { errs.push(format!("{}: invalid path for type: {}", rel, dt)); }
                    if let Some(gw) = meta.get("git_worktree").cloned() { if !gw.trim().is_empty() { let abs = must_abs(&gw); if !Path::new(&abs).is_dir() { errs.push(format!("{}: git_worktree path does not exist", rel)); } else if !is_git_worktree(&abs) { errs.push(format!("{}: git_worktree is not a git working tree", rel)); } } }
                } else {
                    let prefix = match dt.as_str() { "note" => "notes/", "decision" => "decisions/", "review" => "reviews/", _ => "" };
                    if !prefix.is_empty() {
                        if !rel.starts_with(prefix) { errs.push(format!("{}: invalid path for type: {}", rel, dt)); }
                        if Path::new(&rel).file_name().map(|n| n.to_string_lossy() != format!("{}.md", slug)).unwrap_or(true) { errs.push(format!("{}: slug does not match file name", rel)); }
                    }
                }
                if let Some(id) = meta.get("id").cloned() { ids.entry(id).or_default().push(rel); }
            }
            Err(e) => errs.push(format!("{}: {}", rel, e)),
        }
    }
    for (id, paths) in ids { if paths.len() > 1 { errs.push(format!("duplicate id: {} -> {}", id, paths.join(", "))); } }
    errs
}

fn valid_slug(s: &str) -> bool {
    let b = s.as_bytes();
    if b.is_empty() { return false; }
    if b[0] == b'-' || *b.last().unwrap() == b'-' { return false; }
    let mut prev_dash = false;
    for &ch in b {
        match ch {
            b'0'..=b'9' | b'a'..=b'z' => prev_dash = false,
            b'-' => { if prev_dash { return false; } prev_dash = true; }
            _ => return false,
        }
    }
    true
}

// ---- project (git) ----

fn cmd_project(repo_root: &Path, args: &[String]) -> i32 {
    if args.is_empty() { eprintln!("missing project subcommand"); return 1; }
    let sub = &args[0];
    let mut project = String::new();
    let mut name = String::new();
    let mut url = String::new();
    let mut remote = String::from("origin");
    let mut branch = String::new();
    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--project" if i+1 < args.len() => { project = args[i+1].clone(); i+=2; }
            "--name" if i+1 < args.len() => { name = args[i+1].clone(); i+=2; }
            "--url" if i+1 < args.len() => { url = args[i+1].clone(); i+=2; }
            "--remote" if i+1 < args.len() => { remote = args[i+1].clone(); i+=2; }
            "--branch" if i+1 < args.len() => { branch = args[i+1].clone(); i+=2; }
            _ => { i+=1; }
        }
    }
    if project.is_empty() { eprintln!("--project is required"); return 1; }
    let worktree = match resolve_project_git_worktree(repo_root, &project) { Ok(p) => p, Err(e) => { eprintln!("{}", e); return 1; } };
    match sub.as_str() {
        "add-remote" => {
            if name.is_empty() || url.is_empty() { eprintln!("--name and --url are required"); return 1; }
            if let Err(e) = git(&worktree, &["remote","add",&name,&url]) { eprintln!("{}", e); return 1; }
            println!("{}\tremote-added\t{}\t{}", project, name, url); 0
        }
        "fetch" => {
            if let Err(e) = git(&worktree, &["fetch",&remote,"--prune"]) { eprintln!("{}", e); return 1; }
            println!("{}\tfetched\t{}", project, remote); 0
        }
        "push" => {
            let br = if branch.is_empty() { match current_branch(&worktree) { Ok(b) => b, Err(e) => { eprintln!("{}", e); return 1; } } } else { branch.clone() };
            if let Err(e) = git(&worktree, &["push","-u",&remote,&br]) { eprintln!("{}", e); return 1; }
            println!("{}\tpushed\t{}\t{}", project, remote, br); 0
        }
        "sync" => {
            if let Err(e) = git(&worktree, &["fetch",&remote,"--prune"]) { eprintln!("{}", e); return 1; }
            let br = if branch.is_empty() { match current_branch(&worktree) { Ok(b) => b, Err(e) => { eprintln!("{}", e); return 1; } } } else { branch.clone() };
            if let Err(e) = git(&worktree, &["push","-u",&remote,&br]) { eprintln!("{}", e); return 1; }
            println!("{}\tfetched\t{}", project, remote);
            println!("{}\tpushed\t{}\t{}", project, remote, br); 0
        }
        _ => { eprintln!("Unsupported project command"); 1 }
    }
}

fn resolve_project_git_worktree(repo_root: &Path, slug: &str) -> Result<String, String> {
    let p = repo_root.join("projects").join(slug).join("README.md");
    let text = fs::read_to_string(&p).map_err(|_| format!("Project document does not exist: {}", p.display()))?;
    let (meta, _body) = parse_frontmatter(&text).map_err(|e| e.to_string())?;
    let gw = meta.get("git_worktree").cloned().unwrap_or_default();
    if gw.trim().is_empty() { return Err(format!("Project document is missing git_worktree: {}", p.display())); }
    resolve_git_worktree(&gw)
}

fn resolve_git_worktree(p: &str) -> Result<String, String> {
    let abs = must_abs(p);
    let md = Path::new(&abs).metadata().map_err(|_| format!("Git worktree path does not exist: {}", abs))?;
    if !md.is_dir() { return Err(format!("Git worktree path does not exist: {}", abs)); }
    if !is_git_worktree(&abs) { return Err(format!("Git worktree path is not a git working tree: {}", abs)); }
    Ok(abs)
}

fn is_git_worktree(path: &str) -> bool {
    let out = run_cmd(Some(path), "git", &["rev-parse","--is-inside-work-tree"]);
    out.code == 0 && out.stdout.trim() == "true"
}

fn must_abs(p: &str) -> String {
    let p = expand_user(p);
    let abs = if Path::new(&p).is_absolute() { PathBuf::from(&p) } else { env::current_dir().unwrap_or_else(|_| PathBuf::from(".")).join(&p) };
    fs::canonicalize(&abs).unwrap_or(abs).display().to_string()
}

fn git(cwd: &str, args: &[&str]) -> Result<(), String> {
    let out = run_cmd(Some(cwd), "git", args);
    if out.code != 0 { return Err(out.stderr.trim().to_string()); }
    Ok(())
}

fn current_branch(cwd: &str) -> Result<String, String> {
    let out = run_cmd(Some(cwd), "git", &["branch","--show-current"]);
    if out.code != 0 { return Err(out.stderr); }
    let s = out.stdout.trim().to_string();
    if s.is_empty() { return Err(format!("Git worktree is not on a branch: {}", cwd)); }
    Ok(s)
}

struct CmdOut { stdout: String, stderr: String, code: i32 }
fn run_cmd(cwd: Option<&str>, name: &str, args: &[&str]) -> CmdOut {
    let mut cmd = Command::new(name);
    cmd.args(args);
    if let Some(dir) = cwd { cmd.current_dir(dir); }
    match cmd.stdout(Stdio::piped()).stderr(Stdio::piped()).output() {
        Ok(o) => CmdOut { stdout: String::from_utf8_lossy(&o.stdout).to_string(), stderr: String::from_utf8_lossy(&o.stderr).to_string(), code: o.status.code().unwrap_or(1) },
        Err(e) => CmdOut { stdout: String::new(), stderr: e.to_string(), code: 1 },
    }
}

fn new_uuid() -> String {
    // Not a real UUID v4, but good enough for tests without external crates
    let t = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_nanos();
    format!("{:08x}-{:04x}-{:04x}-{:04x}-{:012x}", (t & 0xffffffff) as u64, ((t>>32)&0xffff) as u64, ((t>>48)&0xffff) as u64, ((t>>16)&0xffff) as u64, (t & 0xffffffffffff) as u128)
}

// --- small deps (tiny crates, build-time only) ---
// We inline minimal helpers via tiny crates included as build-time dependencies using vendored sources if available.
