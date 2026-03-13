package main

import (
	"bufio"
	"crypto/rand"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"sort"
	"strings"
	"time"
)

const defaultRepoDir = ".knowledge-galax"

var repositoryDirectories = []string{
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
}

var builtinTemplates = map[string]string{
	"daily": `---
id: <id>
type: daily
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
date: <date>
tags: []
summary: ""
---

## Notes

## Decisions

## Next
`,
	"decision": `---
id: <id>
type: decision
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
theme: []
project: []
tags: []
summary: ""
---

## Context

## Decision

## Consequences
`,
	"note": `---
id: <id>
type: note
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
theme: []
project: []
tags: []
summary: ""
---

## Summary

## Details
`,
	"project": `---
id: <id>
type: project
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
git_worktree: <git_worktree>
theme: []
tags: []
summary: ""
---

## Goal

## Status

## Notes
`,
	"reference": `---
id: <id>
type: reference
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
source: []
theme: []
project: []
tags: []
summary: ""
---

## Source

## Notes
`,
	"review": `---
id: <id>
type: review
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
date: <date>
theme: []
project: []
tags: []
summary: ""
---

## What Happened

## What Worked

## What To Change
`,
	"theme": `---
id: <id>
type: theme
title: <title>
slug: <slug>
created_at: <created_at>
updated_at: <updated_at>
status: inbox
tags: []
summary: ""
---

## Scope

## Key Questions
`,
}

func main() {
	os.Exit(run(os.Args[1:]))
}

func run(argv []string) int {
	if len(argv) == 0 {
		fmt.Fprintln(os.Stderr, "usage: kg [--repo <path>] <command> [args]")
		return 1
	}

	repo := ""
	args := argv
	// Handle --repo early like Python normalize_argv
	for i := 0; i < len(argv); i++ {
		if argv[i] == "--repo" && i+1 < len(argv) {
			repo = argv[i+1]
			// remove the pair and rebuild args: place in front
			args = append([]string{"--repo", repo}, append(argv[:i], argv[i+2:]...)...)
			break
		}
	}

	fs := flag.NewFlagSet("kg", flag.ContinueOnError)
	fs.SetOutput(newDiscard())
	repoFlag := fs.String("repo", repo, "repository path")
	if err := fs.Parse(args); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	rest := fs.Args()
	if len(rest) == 0 {
		fmt.Fprintln(os.Stderr, "missing command")
		return 1
	}
	createIfMissing := rest[0] == "create" || rest[0] == "append" || rest[0] == "import" || rest[0] == "project"
	repoRoot, err := resolveRepoRoot(*repoFlag, createIfMissing)
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	switch rest[0] {
	case "create":
		return cmdCreate(repoRoot, rest[1:])
	case "append":
		return cmdAppend(repoRoot, rest[1:])
	case "import":
		return cmdImport(repoRoot, rest[1:])
	case "validate":
		return cmdValidate(repoRoot)
	case "list":
		return cmdList(repoRoot, rest[1:])
	case "search":
		return cmdSearch(repoRoot, rest[1:])
	case "stats":
		return cmdStats(repoRoot)
	case "export":
		return cmdExport(repoRoot, rest[1:])
	case "project":
		return cmdProject(repoRoot, rest[1:])
	case "--help", "-h":
		fmt.Println("usage:")
		return 0
	default:
		fmt.Fprintln(os.Stderr, "unsupported command")
		return 1
	}
}

// --- repository helpers ---

func resolveRepoRoot(p string, createIfMissing bool) (string, error) {
	if strings.TrimSpace(p) == "" {
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		p = filepath.Join(home, defaultRepoDir)
		createIfMissing = true
	}
	abs, err := filepath.Abs(os.ExpandEnv(expandUser(p)))
	if err != nil {
		return "", err
	}
	st, err := os.Stat(abs)
	if err != nil {
		if createIfMissing && os.IsNotExist(err) {
			return ensureRepoLayout(abs)
		}
		return "", fmt.Errorf("Repository path does not exist: %s", abs)
	}
	if !st.IsDir() {
		return "", fmt.Errorf("Repository path does not exist: %s", abs)
	}
	return abs, nil
}

func ensureRepoLayout(root string) (string, error) {
	if err := os.MkdirAll(root, 0o755); err != nil {
		return "", err
	}
	for _, dir := range repositoryDirectories {
		if err := os.MkdirAll(filepath.Join(root, dir), 0o755); err != nil {
			return "", err
		}
	}
	return root, nil
}

var nonSlug = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(s string) (string, error) {
	slug := strings.Trim(nonSlug.ReplaceAllString(strings.ToLower(strings.TrimSpace(s)), "-"), "-")
	if slug == "" {
		return "", errors.New("Title must contain at least one alphanumeric character")
	}
	return slug, nil
}

// --- create ---

func cmdCreate(repoRoot string, args []string) int {
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "missing create type")
		return 1
	}
	createType := args[0]
	flags := flag.NewFlagSet("create", flag.ContinueOnError)
	flags.SetOutput(newDiscard())

	var title string
	var dateText string
	var gitWorktree string
	var readBodyFromStdin bool
	flags.StringVar(&title, "title", "", "title")
	flags.StringVar(&dateText, "date", "", "date")
	flags.StringVar(&gitWorktree, "git-worktree", "", "git worktree path")
	flags.BoolVar(&readBodyFromStdin, "stdin", false, "read body from stdin")
	if err := flags.Parse(args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	utcNow := time.Now().UTC().Truncate(time.Second)
	isoNow := utcNow.Format(time.RFC3339)
	isoNow = strings.ReplaceAll(isoNow, "+00:00", "Z")

	switch createType {
	case "note":
		if title == "" {
			fmt.Fprintln(os.Stderr, "--title is required")
			return 1
		}
		body := ""
		if readBodyFromStdin {
			var err error
			body, err = readStdinText()
			if err != nil {
				fmt.Fprintln(os.Stderr, err.Error())
				return 1
			}
		}
		slug, err := slugify(title)
		if err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
			return 1
		}
		target := filepath.Join(repoRoot, "notes", slug+".md")
		return createFromTemplate(repoRoot, "note", map[string]string{
			"id":         newUUID(),
			"title":      title,
			"slug":       slug,
			"created_at": isoNow,
			"updated_at": isoNow,
		}, body, target)
	case "daily":
		var d time.Time
		var err error
		if dateText == "" {
			d = utcNow
			dateText = d.Format("2006-01-02")
		} else {
			d, err = time.Parse("2006-01-02", dateText)
			if err != nil {
				fmt.Fprintln(os.Stderr, "Invalid date: "+dateText)
				return 1
			}
		}
		target := filepath.Join(repoRoot, "dailies", d.Format("2006"), d.Format("01"), d.Format("02")+".md")
		return createFromTemplate(repoRoot, "daily", map[string]string{
			"id":         newUUID(),
			"title":      dateText,
			"slug":       dateText,
			"date":       dateText,
			"created_at": isoNow,
			"updated_at": isoNow,
		}, "", target)
	case "decision":
		if title == "" {
			fmt.Fprintln(os.Stderr, "--title is required")
			return 1
		}
		slug, err := slugify(title)
		if err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
			return 1
		}
		target := filepath.Join(repoRoot, "decisions", slug+".md")
		return createFromTemplate(repoRoot, "decision", map[string]string{
			"id":         newUUID(),
			"title":      title,
			"slug":       slug,
			"created_at": isoNow,
			"updated_at": isoNow,
		}, "", target)
	case "review":
		if title == "" {
			fmt.Fprintln(os.Stderr, "--title is required")
			return 1
		}
		if dateText == "" {
			dateText = utcNow.Format("2006-01-02")
		}
		slug, err := slugify(title)
		if err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
			return 1
		}
		target := filepath.Join(repoRoot, "reviews", slug+".md")
		return createFromTemplate(repoRoot, "review", map[string]string{
			"id":         newUUID(),
			"title":      title,
			"slug":       slug,
			"date":       dateText,
			"created_at": isoNow,
			"updated_at": isoNow,
		}, "", target)
	case "project":
		if title == "" || gitWorktree == "" {
			fmt.Fprintln(os.Stderr, "--title and --git-worktree are required")
			return 1
		}
		if _, err := resolveGitWorktree(gitWorktree); err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
			return 1
		}
		slug, err := slugify(title)
		if err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
			return 1
		}
		target := filepath.Join(repoRoot, "projects", slug, "README.md")
		return createFromTemplate(repoRoot, "project", map[string]string{
			"id":           newUUID(),
			"title":        title,
			"slug":         slug,
			"git_worktree": mustAbs(gitWorktree),
			"created_at":   isoNow,
			"updated_at":   isoNow,
		}, "", target)
	default:
		fmt.Fprintln(os.Stderr, "Unsupported create type")
		return 1
	}
}

func createFromTemplate(repoRoot, name string, repl map[string]string, body, target string) int {
	if err := writeFromTemplate(repoRoot, name, repl, body, target, false); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	fmt.Println(relPath(repoRoot, target))
	return 0
}

func writeFromTemplate(repoRoot, name string, repl map[string]string, body, target string, overwrite bool) error {
	if _, err := os.Stat(target); err == nil {
		if !overwrite {
			return errors.New("Target file already exists: " + target)
		}
	}
	tpl := filepath.Join(repoRoot, "templates", name+".md")
	b, err := os.ReadFile(tpl)
	if err != nil {
		fallback, ok := builtinTemplates[name]
		if !ok {
			return err
		}
		b = []byte(fallback)
	}
	text := string(b)
	for k, v := range repl {
		text = strings.ReplaceAll(text, "<"+k+">", v)
	}
	if strings.TrimSpace(body) != "" {
		text = strings.TrimRight(text, "\n") + "\n\n" + strings.TrimSpace(body) + "\n"
	}
	if err := os.MkdirAll(filepath.Dir(target), 0o755); err != nil {
		return err
	}
	if err := os.WriteFile(target, []byte(text), 0o644); err != nil {
		return err
	}
	return nil
}

func relPath(root, p string) string {
	r, err := filepath.Rel(root, p)
	if err != nil {
		return p
	}
	return filepath.ToSlash(r)
}

func cmdAppend(repoRoot string, args []string) int {
	repoRoot, err := resolveRepoRoot(repoRoot, true)
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "missing append type")
		return 1
	}
	if args[0] != "daily" {
		fmt.Fprintln(os.Stderr, "Unsupported append type")
		return 1
	}
	flags := flag.NewFlagSet("append", flag.ContinueOnError)
	flags.SetOutput(newDiscard())
	dateText := flags.String("date", "", "date")
	if err := flags.Parse(args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	body, err := readStdinText()
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	utcNow := time.Now().UTC().Truncate(time.Second)
	targetDate := utcNow
	if *dateText != "" {
		targetDate, err = time.Parse("2006-01-02", *dateText)
		if err != nil {
			fmt.Fprintln(os.Stderr, "Invalid date: "+*dateText)
			return 1
		}
	}
	dateValue := targetDate.Format("2006-01-02")
	target := filepath.Join(repoRoot, "dailies", targetDate.Format("2006"), targetDate.Format("01"), targetDate.Format("02")+".md")
	if _, err := os.Stat(target); errors.Is(err, os.ErrNotExist) {
		isoNow := strings.ReplaceAll(utcNow.Format(time.RFC3339), "+00:00", "Z")
		if err := writeFromTemplate(repoRoot, "daily", map[string]string{
			"id":         newUUID(),
			"title":      dateValue,
			"slug":       dateValue,
			"date":       dateValue,
			"created_at": isoNow,
			"updated_at": isoNow,
		}, "", target, false); err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
			return 1
		}
	}
	previous, err := os.ReadFile(target)
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	entry := fmt.Sprintf("\n\n## Capture %s\n\n%s\n", strings.ReplaceAll(utcNow.Format(time.RFC3339), "+00:00", "Z"), strings.TrimSpace(body))
	if err := os.WriteFile(target, []byte(strings.TrimRight(string(previous), "\n")+entry), 0o644); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	fmt.Println(relPath(repoRoot, target))
	return 0
}

func cmdImport(repoRoot string, args []string) int {
	repoRoot, err := resolveRepoRoot(repoRoot, true)
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	if len(args) < 2 || args[0] != "clipboard" || args[1] != "note" {
		fmt.Fprintln(os.Stderr, "Unsupported import type")
		return 1
	}
	flags := flag.NewFlagSet("import", flag.ContinueOnError)
	flags.SetOutput(newDiscard())
	title := flags.String("title", "", "title")
	if err := flags.Parse(args[2:]); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	if *title == "" {
		fmt.Fprintln(os.Stderr, "--title is required")
		return 1
	}
	body, err := readClipboardText()
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	utcNow := time.Now().UTC().Truncate(time.Second)
	isoNow := strings.ReplaceAll(utcNow.Format(time.RFC3339), "+00:00", "Z")
	slug, err := slugify(*title)
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	target := filepath.Join(repoRoot, "notes", slug+".md")
	return createFromTemplate(repoRoot, "note", map[string]string{
		"id":         newUUID(),
		"title":      *title,
		"slug":       slug,
		"created_at": isoNow,
		"updated_at": isoNow,
	}, body, target)
}

func readStdinText() (string, error) {
	body, err := io.ReadAll(os.Stdin)
	if err != nil {
		return "", err
	}
	trimmed := strings.TrimSpace(string(body))
	if trimmed == "" {
		return "", errors.New("stdin is empty")
	}
	return trimmed, nil
}

func readClipboardText() (string, error) {
	var commands [][]string
	switch runtime.GOOS {
	case "darwin":
		commands = [][]string{{"pbpaste"}}
	case "windows":
		commands = [][]string{{"powershell", "-NoProfile", "-Command", "Get-Clipboard"}}
	default:
		commands = [][]string{
			{"wl-paste", "-n"},
			{"xclip", "-selection", "clipboard", "-o"},
		}
	}
	lastError := "clipboard command is unavailable"
	for _, parts := range commands {
		cmd := exec.Command(parts[0], parts[1:]...)
		output, err := cmd.CombinedOutput()
		if err == nil {
			text := strings.TrimSpace(string(output))
			if text == "" {
				return "", errors.New("clipboard is empty")
			}
			return text, nil
		}
		if len(output) > 0 {
			lastError = strings.TrimSpace(string(output))
		} else {
			lastError = err.Error()
		}
	}
	return "", errors.New(lastError)
}

// --- validate/list/search/stats: re-index on the fly (no sqlite dep) ---

func cmdValidate(repoRoot string) int {
	files := collectDocuments(repoRoot)
	errs := validateAll(repoRoot, files)
	if len(errs) > 0 {
		for _, e := range errs {
			fmt.Println(e)
		}
		return 1
	}
	fmt.Println("OK")
	return 0
}

func cmdList(repoRoot string, args []string) int {
	fs := flag.NewFlagSet("list", flag.ContinueOnError)
	fs.SetOutput(newDiscard())
	typ := fs.String("type", "", "type filter")
	if err := fs.Parse(args); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	idx := buildIndex(repoRoot)
	for _, d := range idx {
		if *typ != "" && d.Type != *typ {
			continue
		}
		fmt.Printf("%s\t%s\t%s\n", d.Type, d.Title, d.Path)
	}
	return 0
}

func cmdSearch(repoRoot string, args []string) int {
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "missing query")
		return 1
	}
	q := strings.ToLower(args[0])
	idx := buildIndex(repoRoot)
	for _, d := range idx {
		if strings.Contains(strings.ToLower(d.Title), q) || strings.Contains(strings.ToLower(d.Summary), q) || strings.Contains(strings.ToLower(d.Body), q) {
			fmt.Printf("%s\t%s\t%s\n", d.Type, d.Title, d.Path)
		}
	}
	return 0
}

func cmdStats(repoRoot string) int {
	idx := buildIndex(repoRoot)
	total := len(idx)
	fmt.Printf("total\t%d\n", total)
	byType := map[string]int{}
	byStatus := map[string]int{}
	for _, d := range idx {
		byType[d.Type]++
		byStatus[d.Status]++
	}
	keys := sortedKeys(byType)
	for _, k := range keys {
		fmt.Printf("type:%s\t%d\n", k, byType[k])
	}
	keys = sortedKeys(byStatus)
	for _, k := range keys {
		fmt.Printf("status:%s\t%d\n", k, byStatus[k])
	}
	return 0
}

func cmdExport(repoRoot string, args []string) int {
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "missing export type")
		return 1
	}
	switch args[0] {
	case "document-list":
		payload, err := json.MarshalIndent(exportDocumentList(buildIndex(repoRoot)), "", "  ")
		if err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
			return 1
		}
		fmt.Println(string(payload))
		return 0
	case "manifest":
		docs := exportDocumentList(buildIndex(repoRoot))
		payload, err := json.MarshalIndent(map[string]any{
			"generated_at": strings.ReplaceAll(time.Now().UTC().Format(time.RFC3339), "+00:00", "Z"),
			"total":        len(docs),
			"documents":    docs,
		}, "", "  ")
		if err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
			return 1
		}
		fmt.Println(string(payload))
		return 0
	case "change-list":
		payload, err := json.MarshalIndent(exportChangeList(buildIndex(repoRoot)), "", "  ")
		if err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
			return 1
		}
		fmt.Println(string(payload))
		return 0
	default:
		fmt.Fprintln(os.Stderr, "Unsupported export type")
		return 1
	}
}

func exportDocumentList(idx []Document) []map[string]string {
	sort.Slice(idx, func(i, j int) bool { return idx[i].Path < idx[j].Path })
	out := make([]map[string]string, 0, len(idx))
	for _, d := range idx {
		out = append(out, map[string]string{
			"path":       d.Path,
			"id":         d.ID,
			"type":       d.Type,
			"title":      d.Title,
			"status":     d.Status,
			"created_at": d.Created,
			"updated_at": d.Updated,
		})
	}
	return out
}

func exportChangeList(idx []Document) []map[string]string {
	sort.Slice(idx, func(i, j int) bool {
		if idx[i].Updated == idx[j].Updated {
			return idx[i].Path < idx[j].Path
		}
		return idx[i].Updated > idx[j].Updated
	})
	out := make([]map[string]string, 0, len(idx))
	for _, d := range idx {
		out = append(out, map[string]string{
			"path":       d.Path,
			"id":         d.ID,
			"type":       d.Type,
			"title":      d.Title,
			"status":     d.Status,
			"updated_at": d.Updated,
		})
	}
	return out
}

// --- project git operations ---

func cmdProject(repoRoot string, args []string) int {
	if len(args) == 0 {
		fmt.Fprintln(os.Stderr, "missing project subcommand")
		return 1
	}
	sub := args[0]
	fs := flag.NewFlagSet("project", flag.ContinueOnError)
	fs.SetOutput(newDiscard())
	var project, name, url, remote, branch string
	fs.StringVar(&project, "project", "", "project slug")
	fs.StringVar(&name, "name", "", "remote name")
	fs.StringVar(&url, "url", "", "remote url")
	fs.StringVar(&remote, "remote", "origin", "remote")
	fs.StringVar(&branch, "branch", "", "branch")
	if err := fs.Parse(args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	if project == "" {
		fmt.Fprintln(os.Stderr, "--project is required")
		return 1
	}
	worktree, err := resolveProjectGitWorktree(repoRoot, project)
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		return 1
	}
	switch sub {
	case "add-remote":
		if name == "" || url == "" {
			fmt.Fprintln(os.Stderr, "--name and --url are required")
			return 1
		}
		if err := git(worktree, "remote", "add", name, url); err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
			return 1
		}
		fmt.Printf("%s\tremote-added\t%s\t%s\n", project, name, url)
		return 0
	case "fetch":
		if err := git(worktree, "fetch", remote, "--prune"); err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
			return 1
		}
		fmt.Printf("%s\tfetched\t%s\n", project, remote)
		return 0
	case "push":
		br := branch
		if br == "" {
			var e error
			br, e = currentBranch(worktree)
			if e != nil {
				fmt.Fprintln(os.Stderr, e.Error())
				return 1
			}
		}
		if err := git(worktree, "push", "-u", remote, br); err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
			return 1
		}
		fmt.Printf("%s\tpushed\t%s\t%s\n", project, remote, br)
		return 0
	case "sync":
		if err := git(worktree, "fetch", remote, "--prune"); err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
			return 1
		}
		br := branch
		if br == "" {
			var e error
			br, e = currentBranch(worktree)
			if e != nil {
				fmt.Fprintln(os.Stderr, e.Error())
				return 1
			}
		}
		if err := git(worktree, "push", "-u", remote, br); err != nil {
			fmt.Fprintln(os.Stderr, err.Error())
			return 1
		}
		fmt.Printf("%s\tfetched\t%s\n", project, remote)
		fmt.Printf("%s\tpushed\t%s\t%s\n", project, remote, br)
		return 0
	default:
		fmt.Fprintln(os.Stderr, "Unsupported project command")
		return 1
	}
}

// --- support code (index, git, frontmatter) ---

type Document struct {
	Path    string
	ID      string
	Type    string
	Title   string
	Slug    string
	Status  string
	Date    string
	Theme   []string
	Project []string
	Tags    []string
	Source  []string
	Summary string
	Body    string
	Created string
	Updated string
}

func buildIndex(repoRoot string) []Document {
	files := collectDocuments(repoRoot)
	var out []Document
	for _, f := range files {
		meta, body, err := parseFrontmatterFile(f)
		if err != nil {
			continue
		}
		d := Document{}
		d.Path = relPath(repoRoot, f)
		d.ID = asString(meta["id"])
		d.Type = asString(meta["type"])
		d.Title = asString(meta["title"])
		d.Slug = asString(meta["slug"])
		d.Status = asString(meta["status"])
		d.Date = asString(meta["date"])
		d.Theme = asStringList(meta["theme"])
		d.Project = asStringList(meta["project"])
		d.Tags = asStringList(meta["tags"])
		d.Source = asStringList(meta["source"])
		d.Summary = asString(meta["summary"])
		d.Body = strings.TrimSpace(body)
		d.Created = asString(meta["created_at"])
		d.Updated = asString(meta["updated_at"])
		out = append(out, d)
	}
	// stable order by path
	keys := make([]string, 0, len(out))
	m := map[string]Document{}
	for _, d := range out {
		keys = append(keys, d.Path)
		m[d.Path] = d
	}
	keys = sortStrings(keys)
	res := make([]Document, 0, len(out))
	for _, k := range keys {
		res = append(res, m[k])
	}
	return res
}

func collectDocuments(repoRoot string) []string {
	roots := []string{"notes", "dailies", "decisions", "reviews", "projects"}
	var files []string
	for _, r := range roots {
		root := filepath.Join(repoRoot, r)
		_ = filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
			if err != nil {
				return nil
			}
			if d.IsDir() {
				return nil
			}
			if strings.HasSuffix(d.Name(), ".md") {
				files = append(files, path)
			}
			return nil
		})
	}
	return files
}

func validateAll(repoRoot string, files []string) []string {
	var errs []string
	ids := map[string][]string{}
	for _, f := range files {
		rel := relPath(repoRoot, f)
		meta, body, err := parseFrontmatterFile(f)
		if err != nil {
			errs = append(errs, fmt.Sprintf("%s: %v", rel, err))
			continue
		}
		for _, k := range []string{"id", "type", "title", "slug", "created_at", "updated_at", "status"} {
			if s := asString(meta[k]); s == "" {
				errs = append(errs, fmt.Sprintf("%s: missing required field: %s", rel, k))
			}
		}
		dt := asString(meta["type"])
		if dt == "" || !inSet(dt, []string{"daily", "note", "decision", "review", "project"}) {
			errs = append(errs, fmt.Sprintf("%s: unsupported type: %s", rel, dt))
			continue
		}
		st := asString(meta["status"])
		if st != "" && !inSet(st, []string{"inbox", "active", "evergreen", "archived"}) {
			errs = append(errs, fmt.Sprintf("%s: unsupported status: %s", rel, st))
		}
		slug := asString(meta["slug"])
		if slug != "" && !validSlug(slug) {
			errs = append(errs, fmt.Sprintf("%s: invalid slug: %s", rel, slug))
		}
		if dt == "daily" {
			dateVal := asString(meta["date"])
			if dateVal == "" {
				errs = append(errs, fmt.Sprintf("%s: missing required field: date", rel))
			} else {
				exp := filepath.ToSlash(filepath.Join("dailies", dateVal[:4], dateVal[5:7], dateVal[8:10]+".md"))
				if rel != exp {
					errs = append(errs, fmt.Sprintf("%s: invalid daily path", rel))
				}
				if slug != dateVal {
					errs = append(errs, fmt.Sprintf("%s: daily slug must match date", rel))
				}
			}
		} else {
			if dt == "project" {
				exp := filepath.ToSlash(filepath.Join("projects", slug, "README.md"))
				if rel != exp {
					errs = append(errs, fmt.Sprintf("%s: invalid path for type: %s", rel, dt))
				}
				gw := asString(meta["git_worktree"])
				if gw != "" {
					abs := mustAbs(gw)
					st, e := os.Stat(abs)
					if e != nil || !st.IsDir() {
						errs = append(errs, fmt.Sprintf("%s: git_worktree path does not exist", rel))
					} else if ok, _ := isGitWorktree(abs); !ok {
						errs = append(errs, fmt.Sprintf("%s: git_worktree is not a git working tree", rel))
					}
				}
			} else {
				// note/decision/review
				var prefix string
				if dt == "note" {
					prefix = "notes/"
				} else if dt == "decision" {
					prefix = "decisions/"
				} else if dt == "review" {
					prefix = "reviews/"
				}
				if prefix != "" {
					if !strings.HasPrefix(rel, prefix) {
						errs = append(errs, fmt.Sprintf("%s: invalid path for type: %s", rel, dt))
					}
					if filepath.Base(rel) != slug+".md" {
						errs = append(errs, fmt.Sprintf("%s: slug does not match file name", rel))
					}
				}
			}
		}
		if id := asString(meta["id"]); id != "" {
			ids[id] = append(ids[id], rel)
		}
		errs = append(errs, validateMarkdownLinks(repoRoot, f, body)...)
	}
	// duplicates
	for id, paths := range ids {
		if len(paths) > 1 {
			errs = append(errs, fmt.Sprintf("duplicate id: %s -> %s", id, strings.Join(paths, ", ")))
		}
	}
	return errs
}

func validSlug(s string) bool { return regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`).MatchString(s) }

var markdownLinkPattern = regexp.MustCompile(`!?\[[^\]]*\]\(([^)]+)\)`)

func validateMarkdownLinks(repoRoot, docPath, body string) []string {
	var errs []string
	rel := relPath(repoRoot, docPath)
	assetsRoot := filepath.Clean(filepath.Join(repoRoot, "assets"))
	referencesRoot := filepath.Clean(filepath.Join(repoRoot, "references"))
	for _, match := range markdownLinkPattern.FindAllStringSubmatch(body, -1) {
		if len(match) < 2 {
			continue
		}
		target := cleanMarkdownTarget(match[1])
		if target == "" || isExternalTarget(target) {
			continue
		}
		resolved := filepath.Clean(filepath.Join(filepath.Dir(docPath), filepath.FromSlash(target)))
		if isUnderRoot(resolved, assetsRoot) {
			if _, err := os.Stat(resolved); err != nil {
				errs = append(errs, fmt.Sprintf("%s: missing asset path: %s", rel, target))
			}
		} else if isUnderRoot(resolved, referencesRoot) {
			if _, err := os.Stat(resolved); err != nil {
				errs = append(errs, fmt.Sprintf("%s: missing reference path: %s", rel, target))
			}
		}
	}
	return errs
}

func cleanMarkdownTarget(target string) string {
	target = strings.TrimSpace(target)
	if target == "" {
		return ""
	}
	if idx := strings.IndexRune(target, ' '); idx >= 0 {
		target = target[:idx]
	}
	return strings.Trim(target, "<>")
}

func isExternalTarget(target string) bool {
	lower := strings.ToLower(target)
	return strings.HasPrefix(target, "#") ||
		strings.HasPrefix(target, "/") ||
		strings.Contains(target, "://") ||
		strings.HasPrefix(lower, "mailto:") ||
		strings.HasPrefix(lower, "data:")
}

func isUnderRoot(path, root string) bool {
	rel, err := filepath.Rel(root, path)
	if err != nil {
		return false
	}
	return rel != ".." && !strings.HasPrefix(rel, ".."+string(os.PathSeparator))
}

// --- frontmatter ---

func parseFrontmatterFile(p string) (map[string]any, string, error) {
	b, err := os.ReadFile(p)
	if err != nil {
		return nil, "", err
	}
	return parseFrontmatter(string(b))
}

func parseFrontmatter(text string) (map[string]any, string, error) {
	if !strings.HasPrefix(text, "---\n") {
		return nil, "", errors.New("missing frontmatter")
	}
	end := strings.Index(text[4:], "\n---\n")
	if end == -1 {
		return nil, "", errors.New("unterminated frontmatter")
	}
	end += 4
	block := text[4:end]
	body := text[end+5:]
	data := map[string]any{}
	scanner := bufio.NewScanner(strings.NewReader(block))
	for scanner.Scan() {
		line := scanner.Text()
		if strings.TrimSpace(line) == "" {
			continue
		}
		parts := strings.SplitN(line, ":", 2)
		if len(parts) != 2 {
			return nil, "", fmt.Errorf("invalid frontmatter line: %s", line)
		}
		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])
		data[key] = parseFrontValue(val)
	}
	return data, body, nil
}

func parseFrontValue(v string) any {
	if strings.HasPrefix(v, "[") && strings.HasSuffix(v, "]") {
		var arr []any
		_ = jsonUnmarshal([]byte(v), &arr)
		return arr
	}
	if v == "\"\"" {
		return ""
	}
	return v
}

// --- git ---

func isGitWorktree(path string) (bool, error) {
	out, code, _ := runCmd(path, "git", "rev-parse", "--is-inside-work-tree")
	return code == 0 && strings.TrimSpace(out) == "true", nil
}

func resolveGitWorktree(p string) (string, error) {
	abs := mustAbs(p)
	st, err := os.Stat(abs)
	if err != nil || !st.IsDir() {
		return "", fmt.Errorf("Git worktree path does not exist: %s", abs)
	}
	ok, _ := isGitWorktree(abs)
	if !ok {
		return "", fmt.Errorf("Git worktree path is not a git working tree: %s", abs)
	}
	return abs, nil
}

func resolveProjectGitWorktree(repoRoot, slug string) (string, error) {
	p := filepath.Join(repoRoot, "projects", slug, "README.md")
	b, err := os.ReadFile(p)
	if err != nil {
		return "", fmt.Errorf("Project document does not exist: %s", p)
	}
	meta, _, err := parseFrontmatter(string(b))
	if err != nil {
		return "", err
	}
	gw := asString(meta["git_worktree"])
	if strings.TrimSpace(gw) == "" {
		return "", fmt.Errorf("Project document is missing git_worktree: %s", p)
	}
	return resolveGitWorktree(gw)
}

func git(cwd string, args ...string) error {
	_, code, err := runCmd(cwd, "git", args...)
	if code != 0 {
		return err
	}
	return nil
}

func currentBranch(cwd string) (string, error) {
	out, code, err := runCmd(cwd, "git", "branch", "--show-current")
	if code != 0 {
		return "", err
	}
	br := strings.TrimSpace(out)
	if br == "" {
		return "", fmt.Errorf("Git worktree is not on a branch: %s", cwd)
	}
	return br, nil
}

func runCmd(cwd, name string, args ...string) (string, int, error) {
	cmd := execCommand(name, args...)
	cmd.Dir = cwd
	b, err := cmd.CombinedOutput()
	if err == nil {
		return string(b), 0, nil
	}
	// exit code
	if ee, ok := err.(*exec.ExitError); ok {
		return string(b), ee.ExitCode(), fmt.Errorf(strings.TrimSpace(string(b)))
	}
	return string(b), 1, err
}

// --- small utils ---

func newDiscard() *discard { return &discard{} }

type discard struct{}

func (*discard) Write(p []byte) (int, error) { return len(p), nil }

func asString(v any) string {
	if v == nil {
		return ""
	}
	switch t := v.(type) {
	case string:
		return t
	default:
		return fmt.Sprint(t)
	}
}

func asStringList(v any) []string {
	switch t := v.(type) {
	case nil:
		return []string{}
	case []any:
		res := make([]string, 0, len(t))
		for _, e := range t {
			res = append(res, asString(e))
		}
		return res
	case string:
		if t == "" {
			return []string{}
		}
		return []string{t}
	default:
		return []string{asString(t)}
	}
}

func sortedKeys(m map[string]int) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return sortStrings(keys)
}

func sortStrings(in []string) []string { s := append([]string(nil), in...); sort.Strings(s); return s }

func inSet(s string, set []string) bool {
	for _, v := range set {
		if v == s {
			return true
		}
	}
	return false
}

func mustAbs(p string) string { a, _ := filepath.Abs(os.ExpandEnv(expandUser(p))); return a }

func expandUser(s string) string {
	if strings.HasPrefix(s, "~") {
		if home, err := os.UserHomeDir(); err == nil {
			return filepath.Join(home, strings.TrimPrefix(s, "~"))
		}
	}
	return s
}

// indirections for testability
var (
	jsonUnmarshal = func(b []byte, v any) error { return json.Unmarshal(b, v) }
	execCommand   = func(name string, args ...string) *exec.Cmd { return exec.Command(name, args...) }
)

// simple uuid v4 (stdlib only): format based on random bytes
func newUUID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	b[6] = (b[6] & 0x0f) | 0x40
	b[8] = (b[8] & 0x3f) | 0x80
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}
