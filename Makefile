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
	npx serve -s dist
