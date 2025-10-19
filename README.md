# Wordle AI Solver

A Wordle solver/assistant that provides AI-powered suggestions to help you solve the official Wordle game.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Go with structured logging
- **Containerization**: Docker
- **Orchestration**: Kubernetes

## Running the Project

### Local Development

Run backend and frontend in separate terminals:

**Terminal 1 - Backend:**
```bash
make dev-backend
```

**Terminal 2 - Frontend:**
```bash
make dev-frontend
```

Then open http://localhost:5173 in your browser.

### Kubernetes

Deploy the application to Kubernetes with separate backend and frontend services.

#### Prerequisites

- Kubernetes cluster running (e.g., Minikube, Docker Desktop with Kubernetes enabled, or cloud provider)
- `kubectl` configured to access your cluster
- Docker installed and running

#### Local Minikube Setup

**Start Minikube:**
```bash
minikube start
```

**Configure Docker to use Minikube's Docker daemon:**
```bash
eval $(minikube docker-env)
```

This command configures your shell to use Minikube's Docker daemon, so images built locally are available to the cluster without pushing to a registry.

#### Build Docker Images

**Build backend image:**
```bash
docker build -t wordle-ai-backend:latest ./backend
```

**Build frontend image:**
```bash
# Build with Kubernetes backend URL
docker build \
  --build-arg VITE_API_BASE_URL=http://backend-service:8080 \
  -t wordle-ai-frontend:latest ./frontend
```

**Note:** The frontend is built as a production build and served as static files. The `VITE_API_BASE_URL` is baked into the build at compile time.

#### Deploy to Kubernetes

**Deploy all resources:**
```bash
kubectl apply -f k8s/all-in-one.yaml
```

Or deploy individual components:
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

#### Check Deployment Status

```bash
# View all resources in the wordle-ai namespace
kubectl get all -n wordle-ai

# View pods
kubectl get pods -n wordle-ai

# View services
kubectl get svc -n wordle-ai

# View deployments
kubectl get deployments -n wordle-ai

# Watch pod status in real-time
kubectl get pods -n wordle-ai -w
```

#### Access the Application

**For Minikube:**
```bash
# Get the Minikube IP
minikube ip

# Port-forward to access frontend locally
kubectl port-forward svc/frontend-service 5173:80 -n wordle-ai

# Then open http://localhost:5173 in your browser
```

**For cloud Kubernetes:**
```bash
# Get the external IP/port for frontend
kubectl get svc frontend-service -n wordle-ai

# Wait for EXTERNAL-IP to be assigned, then access via that IP
```

#### View Logs

```bash
# Backend pod logs (all replicas)
kubectl logs -f deployment/backend -n wordle-ai

# Frontend pod logs
kubectl logs -f deployment/frontend -n wordle-ai

# Specific pod logs
kubectl logs -f <pod-name> -n wordle-ai
```

#### Scale Backend Replicas

```bash
# Scale to 3 replicas
kubectl scale deployment backend --replicas=3 -n wordle-ai

# View current replicas
kubectl get deployment backend -n wordle-ai
```

#### Troubleshooting

**Images not found (ImagePullBackOff):**
- Ensure you ran `eval $(minikube docker-env)` in the current terminal
- Build images in the same terminal after running the above command
- Use exact image names: `wordle-ai-backend:latest` and `wordle-ai-frontend:latest`

**Port already in use:**
```bash
# Use a different port for port-forwarding
kubectl port-forward svc/frontend-service 8000:80 -n wordle-ai
# Then access http://localhost:8000
```

**View Minikube dashboard:**
```bash
minikube dashboard
```

#### Clean Up

```bash
# Delete all resources
kubectl delete namespace wordle-ai

# Stop Minikube (preserves state)
minikube stop

# Delete Minikube cluster (removes everything)
minikube delete
```

#### Architecture

- **Backend Service**: 2 replicas with load balancing via Kubernetes Service
- **Frontend Service**: 1 replica exposed via LoadBalancer
- **Communication**: Frontend connects to backend via `http://backend-service:8080` (internal DNS)
- **Health Checks**: Liveness and readiness probes configured for both services
- **Resource Limits**: CPU and memory requests/limits defined for both services

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
├── k8s/               # Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── backend-service.yaml
│   ├── backend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── frontend-deployment.yaml
│   └── all-in-one.yaml
├── Makefile          # Development commands
└── README.md         # This file
```

## Environment Variables

**Frontend** (`VITE_API_BASE_URL`):
- Local development: `http://localhost:8080`
- Kubernetes: `http://backend-service:8080` (set in k8s/configmap.yaml)

**Backend** (`LOG_LEVEL`):
- Default: `info` (set in k8s/configmap.yaml)

## Available Commands

```bash
make dev-backend      # Run backend locally
make dev-frontend     # Run frontend locally
make test             # Run backend tests
```

## Troubleshooting

**Frontend won't connect to backend:**
- Ensure backend is running on http://localhost:8080
- Check browser console for errors
- Verify `VITE_API_BASE_URL` is set correctly

**Port already in use:**
- Backend (8080): `lsof -i :8080`
- Frontend (5173): `lsof -i :5173`
