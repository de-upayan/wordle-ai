.PHONY: dev-backend dev-frontend test docker-down

dev-backend:
	cd backend && go run main.go

dev-frontend:
	cd frontend && npm run dev

test:
	cd backend && go test ./...

docker-down:
	docker-compose down
