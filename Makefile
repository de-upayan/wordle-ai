.PHONY: test docker-up docker-down docker-up-prod

test:
	cd backend && go test ./...

docker-up:
	docker-compose -f docker-compose.yml up --build

docker-up-prod:
	docker-compose -f docker-compose.prod.yml up --build

docker-down:
	docker-compose down
