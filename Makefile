.PHONY: test docker-run docker-stop

test:
	cd backend && go test ./...

docker-run:
	docker stop wordle-backend 2>/dev/null || true
	docker rm wordle-backend 2>/dev/null || true
	docker build -t wordle-ai-backend:latest ./backend
	docker run -d -p 8080:8080 --name wordle-backend wordle-ai-backend:latest

docker-stop:
	docker stop wordle-backend 2>/dev/null || true
	docker rm wordle-backend 2>/dev/null || true
