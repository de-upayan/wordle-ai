.PHONY: dev-backend dev-frontend test docker-up docker-down

dev-backend:
	@cd backend && mkdir -p logs/main && \
	go run main.go 2>&1 | tee logs/main/current

dev-frontend:
	cd frontend && npm run dev

test:
	cd backend && go test ./...

docker-up:
	docker-compose up --build

docker-down:
	docker-compose down
