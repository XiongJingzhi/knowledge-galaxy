# Knowledge Galaxy Rust CLI Port Implementation Plan

> Historical note: this plan reflects the repository layout before 2026-03-11. The current Rust implementation root is `implementations/rust/kg`, and the Python entrypoint lives under `implementations/python/kg`.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a standalone Rust `kg` CLI under `packages/rust` with behavior matching the current Go CLI, wire build output to `bin/kg-rs`, and let the Python entrypoint prefer the Rust binary when `KG_USE_RUST=1`.

**Architecture:** Keep the existing Python and Go implementations in place. Introduce a Rust crate rooted at `packages/rust` with a single `main.rs` entrypoint and small internal modules for repository operations, template rendering, indexing, validation, and git integration. `Makefile` gains a `build-rust` target that compiles the Rust crate and copies `target/release/kg` to `bin/kg-rs`; `all` runs both build targets plus tests. Python remains the stable interface and delegates to Rust first when explicitly requested.

**Tech Stack:** Rust std, Cargo, Python 3 unittest, Go toolchain, Make

---

### Task 1: Add a failing delegation test for Rust preference

**Files:**
- Modify: `tests/test_cli_smoke.py`
- Modify: `scripts/kg/app.py`

**Step 1: Write the failing test**

Add a test that sets `KG_USE_RUST=1`, drops an executable stub at `bin/kg-rs`, invokes `scripts.kg.app.main([...])`, and asserts the stub is called instead of the Python implementation.

**Step 2: Run test to verify it fails**

Run: `python3 -m unittest tests.test_cli_smoke.KGSmokeTests.test_prefers_rust_binary_when_enabled -v`
Expected: FAIL because the Python wrapper only knows about `KG_USE_GO`.

**Step 3: Write minimal implementation**

Update the delegation path to prefer `bin/kg-rs` when `KG_USE_RUST=1`, then fall back to Go and finally Python.

**Step 4: Run test to verify it passes**

Run: `python3 -m unittest tests.test_cli_smoke.KGSmokeTests.test_prefers_rust_binary_when_enabled -v`
Expected: PASS

### Task 2: Add Rust crate skeleton and first parity test target

**Files:**
- Create: `packages/rust/Cargo.toml`
- Create: `packages/rust/src/main.rs`
- Modify: `Makefile`

**Step 1: Write the failing build expectation**

Add a `build-rust` target that expects `cargo build --release --manifest-path packages/rust/Cargo.toml` to produce `packages/rust/target/release/kg`, then copy it to `bin/kg-rs`.

**Step 2: Run build to verify it fails**

Run: `make build-rust`
Expected: FAIL because the Rust crate does not exist yet.

**Step 3: Write minimal implementation**

Create the crate skeleton and wire the target into `Makefile` and `all`.

**Step 4: Run build to verify it passes**

Run: `make build-rust`
Expected: PASS and `bin/kg-rs` exists

### Task 3: Port create and query commands to Rust

**Files:**
- Create: `packages/rust/src/*.rs`
- Verify with: `tests/test_cli_create.py`
- Verify with: `tests/test_cli_query.py`

**Step 1: Write focused parity tests**

Use the existing Python CLI tests with `KG_USE_RUST=1` and the built Rust binary to exercise `create`, `list`, `search`, and `stats`.

**Step 2: Run tests to verify they fail**

Run: `python3 -m unittest tests.test_cli_create tests.test_cli_query -v`
Expected: FAIL through the Rust delegation path because the crate is only a stub.

**Step 3: Write minimal implementation**

Implement repository resolution, slug generation, template rendering, markdown/frontmatter loading, in-memory indexing, and command argument parsing.

**Step 4: Run tests to verify they pass**

Run: `python3 -m unittest tests.test_cli_create tests.test_cli_query -v`
Expected: PASS

### Task 4: Port validation and project git commands to Rust

**Files:**
- Create: `packages/rust/src/*.rs`
- Verify with: `tests/test_cli_validate.py`
- Verify with: `tests/test_cli_project_remote.py`

**Step 1: Write focused parity tests**

Use the existing validation and project remote tests with `KG_USE_RUST=1`.

**Step 2: Run tests to verify they fail**

Run: `python3 -m unittest tests.test_cli_validate tests.test_cli_project_remote -v`
Expected: FAIL until Rust reaches parity.

**Step 3: Write minimal implementation**

Implement validation, project metadata loading, git remote add/fetch/push/sync, and matching output/error behavior.

**Step 4: Run tests to verify they pass**

Run: `python3 -m unittest tests.test_cli_validate tests.test_cli_project_remote -v`
Expected: PASS

### Task 5: Run full verification and integrate

**Files:**
- Modify: `Makefile`
- Modify: `scripts/kg/app.py`
- Verify: `packages/rust`
- Verify: `tests`

**Step 1: Run full build and test verification**

Run: `make all`
Expected: PASS

**Step 2: Commit**

```bash
git add Makefile scripts/kg/app.py packages/rust tests docs/plans/2026-03-11-rust-cli-port-implementation.md
git commit -m "feat: add rust kg cli port"
```

**Step 3: Push**

```bash
git push
```
