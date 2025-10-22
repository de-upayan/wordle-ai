# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Build the static site
RUN npm run build

# Production stage - serve static files
FROM node:22-alpine

WORKDIR /app

# Install serve to serve static files
RUN npm install -g serve

# Copy built files from builder and structure for /wordle-ai/ path
COPY --from=builder /app/dist ./wordle-ai

EXPOSE 3000

CMD ["serve", "-l", "3000"]

