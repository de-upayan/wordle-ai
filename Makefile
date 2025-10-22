.PHONY: install dev build lint serve

install:
	npm install

dev:
	npm run dev

build:
	npm run build

lint:
	npm run lint

serve:
	mkdir -p /tmp/wordle-ai-serve/wordle-ai && \
	cp -r dist/* /tmp/wordle-ai-serve/wordle-ai/ && \
	npx serve /tmp/wordle-ai-serve -l 3000
