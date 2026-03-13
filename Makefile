.PHONY: build build-go build-rust build-desktop build-go-cross build-rust-cross test test-python test-go test-rust test-desktop all clean

BIN := bin/kg
BIN_RS := bin/kg-rs
DIST_DIR := dist

GO_TARGETS := darwin/amd64 darwin/arm64 linux/amd64 linux/arm64 windows/amd64
RUST_TARGETS := x86_64-apple-darwin aarch64-apple-darwin x86_64-unknown-linux-gnu aarch64-unknown-linux-gnu x86_64-pc-windows-msvc

build: build-go

build-go:
	@mkdir -p bin
	@(cd $(abspath implementations/go/kg) && GO111MODULE=on go build -o $(abspath $(BIN)) ./cmd/kg)
	@echo Built $(BIN)

build-rust:
	@mkdir -p bin
	cargo build --release --manifest-path implementations/rust/kg/Cargo.toml
	@# cargo places the binary under implementations/rust/kg/target/release/kg
	@cp implementations/rust/kg/target/release/kg $(BIN_RS) || true
	@echo Built $(BIN_RS)

build-desktop:
	cd apps/desktop && npm run build
	cargo build --manifest-path apps/desktop/src-tauri/Cargo.toml
	@echo Built desktop frontend and Tauri backend

build-go-cross:
	@mkdir -p $(DIST_DIR)
	@for target in $(GO_TARGETS); do \
		os=$${target%/*}; \
		arch=$${target#*/}; \
		ext=""; \
		if [ "$$os" = "windows" ]; then ext=".exe"; fi; \
		out="$(abspath $(DIST_DIR))/go/kg-$$os-$$arch$$ext"; \
		echo "Building Go $$os/$$arch -> $$out"; \
		mkdir -p "$$(dirname "$$out")"; \
		(cd $(abspath implementations/go/kg) && GOOS=$$os GOARCH=$$arch GO111MODULE=on go build -o "$$out" ./cmd/kg); \
	done

build-rust-cross:
	@mkdir -p $(DIST_DIR)
	@for target in $(RUST_TARGETS); do \
		case "$$target" in \
			x86_64-apple-darwin) out="$(abspath $(DIST_DIR))/rust/kg-darwin-amd64"; src="implementations/rust/kg/target/$$target/release/kg" ;; \
			aarch64-apple-darwin) out="$(abspath $(DIST_DIR))/rust/kg-darwin-arm64"; src="implementations/rust/kg/target/$$target/release/kg" ;; \
			x86_64-unknown-linux-gnu) out="$(abspath $(DIST_DIR))/rust/kg-linux-amd64"; src="implementations/rust/kg/target/$$target/release/kg" ;; \
			aarch64-unknown-linux-gnu) out="$(abspath $(DIST_DIR))/rust/kg-linux-arm64"; src="implementations/rust/kg/target/$$target/release/kg" ;; \
			x86_64-pc-windows-msvc) out="$(abspath $(DIST_DIR))/rust/kg-windows-amd64.exe"; src="implementations/rust/kg/target/$$target/release/kg.exe" ;; \
			*) echo "Unknown Rust target $$target"; exit 1 ;; \
		esac; \
		echo "Building Rust $$target -> $$out"; \
		mkdir -p "$$(dirname "$$out")"; \
		cargo build --release --manifest-path implementations/rust/kg/Cargo.toml --target "$$target"; \
		cp "$$src" "$$out"; \
	done

test: test-python test-go test-rust test-desktop

test-python:
	python3 -m unittest \
		tests.test_cli_capture \
		tests.test_cli_create \
		tests.test_cli_project_remote \
		tests.test_cli_query \
		tests.test_cli_smoke \
		tests.test_cli_validate \
		-v

test-go:
	python3 -m unittest tests.test_go_cli_behavior -v

test-rust:
	cargo +stable test --manifest-path implementations/rust/kg/Cargo.toml
	python3 -m unittest tests.test_rust_cli_behavior -v

test-desktop:
	cd apps/desktop && npm test
	cargo test --manifest-path apps/desktop/src-tauri/Cargo.toml

all: build build-rust build-desktop test

clean:
	rm -rf bin $(DIST_DIR)
