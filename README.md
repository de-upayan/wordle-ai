# Wordle AI

A fully client-side Wordle solver that provides AI-powered suggestions to help you solve the official Wordle game. The solving algorithm runs entirely in your browser using Web Workers, with no backend required.

## Description

Wordle AI is an interactive web application that assists you in solving Wordle puzzles. It uses an entropy-based information gain algorithm to suggest the best possible guesses at each step. The application features a responsive UI with dark mode support, real-time suggestions, and keyboard-driven gameplay. All computation happens locally in your browser—no data is sent to any server.

## Getting Started

### Dependencies

- Node.js 18+ and npm
- Modern web browser with Web Worker support (Chrome, Firefox, Safari, Edge)

### Installation

```bash
make install
```

### Executing the Program

**Development Server:**
```bash
make dev
```
Open http://localhost:5173 in your browser.

**Production Build:**
```bash
make build
```
Output is in `dist/` directory, ready to deploy.

**Linting:**
```bash
make lint
```

**Preview Production Build:**
```bash
make serve
```

## Features

- **AI-Powered Suggestions**: Information gain algorithm recommends optimal guesses
- **Real-Time Computation**: Suggestions update instantly as you enter feedback
- **Partial Word Matching**: Type partial words to filter suggestions
- **Dark Mode**: Toggle between light and dark themes
- **Strict Mode**: Option to only suggest valid Wordle guesses
- **Keyboard Controls**: Full keyboard support for efficient gameplay
- **Desktop-Optimized**: Designed for keyboard-driven interaction
- **No Backend Required**: All computation runs in your browser

## Keyboard Controls

- **Letter Keys**: Type letters to build your guess
- **Enter**: Submit your guess or selected suggestion
- **Shift+Enter**: Submit the currently selected suggestion
- **Arrow Up/Down**: Navigate through suggestions
- **Backspace**: Delete the last letter
- **Ctrl+Z / Cmd+Z**: Undo the last guess
- **Click Tiles**: Cycle through feedback colors (gray → yellow → green)

## Architecture

### Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Build Tool**: Vite
- **Computation**: Web Workers (parallel processing)
- **Algorithm**: Information Gain Strategy (entropy-based heuristic)
- **Logging**: Structured logging with loglevel

### Project Structure

```
src/
├── components/          # React UI components
├── hooks/               # Custom React hooks
├── services/            # Web Worker communication layer
├── types/               # TypeScript type definitions
├── utils/               # Utility functions (logging, cookies, styling)
├── workers/             # Web Worker implementations
│   ├── strategies/      # Solving strategy implementations
│   ├── utils/           # Shared worker utilities
│   └── *.worker.ts      # Worker entry points
├── constants/           # Application constants
├── App.tsx              # Main application component
└── main.jsx             # Entry point
```

### Algorithm Overview

1. **Feedback Calculation**: Two-pass algorithm matching official Wordle rules (greens first, then yellows/grays)
2. **Word Filtering**: Constraint-based filtering to eliminate words that don't match previous feedback
3. **Information Gain**: Shannon entropy calculation to score guesses by their ability to partition the remaining answer space
4. **Top Suggestions**: Returns the top guesses with highest information gain

## Performance

- **Initial Computation**: ~10-20 seconds (computing information gain for ~10,000 guesses)
- **Subsequent Computations**: Faster as the answer space shrinks with each guess
- **Non-Blocking UI**: Web Worker prevents UI freezing during computation
- **Timeout**: 30 seconds per computation (configurable)

## Deployment

### Docker

```bash
docker build -t wordle-ai .
docker run -p 3000:3000 wordle-ai
```

Open http://localhost:3000 in your browser.

### Static Hosting

The `dist/` directory contains a production-ready static site that can be deployed to:
- GitHub Pages
- Netlify
- Vercel
- Any static file hosting service

## Help

**Suggestions not appearing:**
- Check browser console (F12) for errors
- Verify wordlists are loaded in the Network tab
- Ensure JavaScript is enabled and Web Workers are supported

**Port already in use:**
- Development: `lsof -i :5173`
- Docker: `lsof -i :3000`

**Performance issues:**
- Close other browser tabs to free up CPU cores
- Try a different browser
- Check browser console for errors

## Authors

- **Upayan De** (de-upayan)

## Version History

- **0.1.0** - Initial Release
  - Core Wordle solver with information gain algorithm
  - Web Worker-based computation
  - Dark mode support
  - Keyboard-driven UI

## License

MIT
