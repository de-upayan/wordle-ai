.PHONY: dev dev-backend dev-frontend test docker-down

dev:
	@echo "Starting Wordle AI development environment..."
	@echo "Backend will run on http://localhost:8080"
	@echo "Frontend will run on http://localhost:5173"
	@echo "Press Ctrl+C to stop both services"
	@trap 'kill %1 %2' EXIT; \
	$(MAKE) dev-backend & \
	sleep 2; \
	$(MAKE) dev-frontend; \
	wait

dev-backend:
	cd backend && go run main.go

dev-frontend:
	cd frontend && npm run dev

test:
	cd backend && go test ./...

docker-down:
	docker-compose down
