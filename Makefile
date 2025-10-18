.PHONY: dev test docker-down

dev:
	@echo "Starting development servers..."
	@echo "Backend: http://localhost:8080"
	@echo "Frontend: http://localhost:5173"
	@echo ""
	@echo "Run in separate terminals:"
	@echo "  Terminal 1: cd backend && go run main.go"
	@echo "  Terminal 2: cd frontend && npm run dev"
	@echo ""

test:
	cd backend && go test ./...

docker-down:
	docker-compose down
