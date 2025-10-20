# Wordle AI Solver

A fully client-side Wordle solver/assistant that provides AI-powered suggestions to help you solve the official Wordle game. The solving algorithm runs entirely in your browser using Web Workers, with no backend required.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Computation**: Web Workers (non-blocking background threads)
- **Algorithm**: Information Gain Strategy (entropy-based heuristic)
- **Deployment**: GitHub Pages (static site hosting)

## How It Works

The application uses a **Strategy Pattern** architecture with pluggable solving strategies:

1. **Web Worker Architecture**: The computationally intensive Wordle solving algorithm runs in a background Web Worker thread, preventing UI blocking
2. **Information Gain Strategy**: Scores each possible guess by calculating entropy reduction (information gain), selecting guesses that maximize the expected information
3. **Utility Functions**: Shared utility functions handle feedback calculation, word filtering, and constraint satisfaction
4. **Client-Side Only**: All computation happens in the browser - no backend server required

### Algorithm Overview

- **Feedback Calculation**: Two-pass algorithm matching official Wordle rules (greens first, then yellows/grays)
- **Word Filtering**: Constraint-based filtering to eliminate words that don't match previous feedback
- **Information Gain**: Shannon entropy calculation to score guesses by their ability to partition the remaining answer space
- **Top 5 Suggestions**: Returns the 5 guesses with highest information gain

## Project Structure

```
wordle-ai/
├── src/                    # React source code
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Service layer (Web Worker communication)
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── workers/            # Web Worker files
│   │   ├── strategies/     # Solving strategy implementations
│   │   │   ├── SolvingStrategy.ts    # Strategy interface
│   │   │   └── AllGuessesStrategy.ts
│   │   ├── wordleUtils.ts  # Shared utility functions
│   │   └── wordleSolver.worker.ts    # Main worker entry point
│   ├── App.tsx
│   └── main.jsx
├── public/                 # Static assets
│   └── wordlists/          # Wordle word lists (answers.txt, guesses.txt)
├── dist/                   # Production build output
├── package.json
├── vite.config.js
├── Dockerfile              # Docker configuration for static file serving
├── Makefile                # Development commands
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
make install
```

### Local Development

```bash
make dev
```

Open http://localhost:5173 in your browser.

### Production Build

```bash
make build
```

Output is in `dist/` - ready to deploy to GitHub Pages or any static host.

### Linting

```bash
make lint
```

## Deployment

### GitHub Pages

1. Update `vite.config.js` with your repository name:
   ```javascript
   export default defineConfig({
     base: '/wordle-ai/',  // Change to your repo name
     // ...
   })
   ```

2. Build the project:
   ```bash
   make build
   ```

3. Deploy `dist/` folder to GitHub Pages

### Docker

Build and run the Docker image:

```bash
docker build -t wordle-ai .
docker run -p 3000:3000 wordle-ai
```

Then open http://localhost:3000 in your browser.

## Architecture

### Web Worker Strategy Pattern

The solving algorithm is organized using the Strategy Pattern:

- **SolvingStrategy Interface** (`src/workers/strategies/SolvingStrategy.ts`): Defines the contract for solving strategies
- **AllGuessesStrategy** (`src/workers/strategies/AllGuessesStrategy.ts`): Concrete implementation using entropy-based heuristic
- **Shared Utilities** (`src/workers/wordleUtils.ts`): Reusable functions for feedback calculation, word filtering, etc.
- **Worker Orchestrator** (`src/workers/wordleSolver.worker.ts`): Manages strategy instantiation and message handling

### Message Protocol

Main thread ↔ Web Worker communication:

```typescript
// INIT message
{ type: 'INIT', answersList: string[], guessesList: string[] }

// SOLVE message
{ type: 'SOLVE', gameState: GameState }

// SOLVE_COMPLETE response
{ type: 'SOLVE_COMPLETE', suggestions: SuggestionItem[], remainingAnswers: number }

// ERROR response
{ type: 'ERROR', error: string }
```

## Performance

- **Initial Computation**: ~10-20 seconds (computing information gain for 10,657 guesses against 2,315 answers)
- **Subsequent Computations**: Faster as the answer space shrinks with each guess
- **Non-Blocking UI**: Web Worker prevents UI freezing during computation
- **Timeout**: 30 seconds per computation (configurable in `wordleSolverService.ts`)

## Troubleshooting

**Suggestions not appearing:**
- Check browser console (F12) for errors
- Verify wordlists loaded: `fetch('/wordlists/answers.txt').then(r => r.text()).then(t => console.log(t.split('\n').length))`
- Ensure Web Worker initialized: Look for "Web Worker initialized successfully" in console

**Port already in use:**
- Development: `lsof -i :5173`
- Docker: `lsof -i :3000`

## License

MIT
