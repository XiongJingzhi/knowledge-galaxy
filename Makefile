.PHONY: build build-rust test all clean

BIN := bin/kg
BIN_RS := bin/kg-rs

build:
	@mkdir -p bin
	GO111MODULE=on go build -o $(BIN) ./cmd/kg
	@echo Built $(BIN)

build-rust:
	@mkdir -p bin
	cargo build --release --manifest-path packages/rust/Cargo.toml
	@# cargo places the binary under packages/rust/target/release/kg
	@cp packages/rust/target/release/kg $(BIN_RS) || true
	@echo Built $(BIN_RS)

test:
	python -m unittest -v

all: build build-rust test

clean:
	rm -rf bin
