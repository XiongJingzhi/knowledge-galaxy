.PHONY: build build-go build-rust test test-python test-go test-rust all clean

BIN := bin/kg
BIN_RS := bin/kg-rs

build: build-go

build-go:
	@mkdir -p bin
	cd implementations/go/kg && GO111MODULE=on go build -o $(abspath $(BIN)) ./cmd/kg
	@echo Built $(BIN)

build-rust:
	@mkdir -p bin
	cargo build --release --manifest-path implementations/rust/kg/Cargo.toml
	@# cargo places the binary under implementations/rust/kg/target/release/kg
	@cp implementations/rust/kg/target/release/kg $(BIN_RS) || true
	@echo Built $(BIN_RS)

test: test-python test-go test-rust

test-python:
	python3 -m unittest discover -s tests -v

test-go:
	tmp=$$(mktemp -d); cd implementations/go/kg && go build -o "$$tmp/kg" ./cmd/kg; rm -rf "$$tmp"

test-rust:
	cd implementations/rust/kg && cargo build

all: build build-rust test

clean:
	rm -rf bin
