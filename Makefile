.PHONY: build test all clean

BIN := bin/kg

build:
	@mkdir -p bin
	GO111MODULE=on go build -o $(BIN) ./cmd/kg
	@echo Built $(BIN)

test:
	python -m unittest -v

all: build test

clean:
	rm -rf bin
