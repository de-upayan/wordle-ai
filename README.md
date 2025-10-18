# Wordle AI Solver

A Wordle solver/assistant that provides AI-powered suggestions to help you solve the official Wordle game.

## Setup

The project includes:
- **React** + **Vite** frontend for fast development
- **Chakra UI** for component library and styling
- **Go** backend service with AI solver
- **Docker** integration for containerized deployment

## Running the Project

### Option 1: Docker Development (Recommended for development)
```bash
make docker-up
```

This starts both services with Vite dev server for fast hot reload:
- **Frontend**: http://localhost:5173 (with hot reload)
- **Backend**: http://localhost:8080

### Option 2: Docker Production
```bash
make docker-up-prod
```

This starts both services with optimized production build:
- **Frontend**: http://localhost:3000 (production build)
- **Backend**: http://localhost:8080

## Project Structure

```
wordle-ai/
├── backend/           # Go backend service
│   ├── main.go
│   ├── cmd/
│   ├── handlers/
│   ├── models/
│   └── Dockerfile
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml # Orchestrates both services
└── Makefile          # Convenient commands
```

## API Integration

Frontend communicates with backend at:
- **Docker**: `http://backend:8080` (internal network)
- **Local**: `http://localhost:8080`

Environment variable: `VITE_API_BASE_URL`

## Useful Commands

```bash
make docker-up        # Start dev environment (Vite dev server)
make docker-up-prod   # Start production environment (optimized build)
make docker-down      # Stop Docker services
make test            # Run backend tests
```

## Troubleshooting

**Frontend won't connect to backend:**
- Check `VITE_API_BASE_URL` environment variable
- Ensure backend is running and healthy
- Check Docker network: `docker network ls`

**Port already in use:**
- Backend: `lsof -i :8080`
- Frontend: `lsof -i :3000`
