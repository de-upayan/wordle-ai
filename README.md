# Wordle AI Solver

A Wordle solver/assistant that provides AI-powered suggestions to help you solve the official Wordle game.

## Setup

The project includes:
- **React** + **Vite** frontend for fast development
- **Chakra UI** for component library and styling
- **Go** backend service with AI solver
- **Docker** integration for containerized deployment

## Running the Project

### Development (Recommended)

Run the backend and frontend in separate terminals:

**Terminal 1 - Backend:**
```bash
cd backend
go run main.go
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Then open http://localhost:5173 in your browser.

- **Frontend**: http://localhost:5173 (with hot reload)
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
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml # For production deployment
├── Makefile          # Development commands
└── README.md         # This file
```

## API Integration

Frontend communicates with backend at:
- **Docker**: `http://backend:8080` (internal network)
- **Local**: `http://localhost:8080`

Environment variable: `VITE_API_BASE_URL`

## Useful Commands

```bash
make dev              # Show development setup instructions
make test             # Run backend tests
make docker-down      # Stop Docker services (if running)
```

## Troubleshooting

**Frontend won't connect to backend:**
- Ensure backend is running on http://localhost:8080
- Check browser console for errors
- Verify `VITE_API_BASE_URL` is set correctly

**Port already in use:**
- Backend (8080): `lsof -i :8080`
- Frontend (5173): `lsof -i :5173`
