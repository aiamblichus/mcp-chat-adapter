.PHONY: build

build:
	yarn install
	yarn build

inspect:
	yarn inspect

cli:
	yarn cli

run:
	yarn run tsx src/cli.ts
