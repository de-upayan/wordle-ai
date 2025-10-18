# Wordle AI Assistant - Design

## Overview
AI-powered assistant that suggests optimal Wordle guesses based on feedback. NOT a playable game—works alongside the official Wordle.

**Architecture Principle:** Stateless service with canonical game state representation.

## Project Structure

```
wordle-ai/
├── backend/          # Go backend service
├── frontend/         # React frontend application
└── design.md         # This file
```

## API Endpoint

### GET /api/v1/suggest/stream

Stream progressive suggestions as the engine searches deeper (like chess engines).

**Request Structure (JSON):**

```json
{
  "guessNumber": 2,
  "constraints": {
    "greenLetters": {
      "1": "L",
      "2": "I"
    },
    "yellowLetters": {
      "A": [2],
      "N": [3]
    },
    "grayLetters": ["S", "T", "E", "C", "G"]
  },
  "maxDepth": 6
}
```

**Response: Server-Sent Events (text/event-stream)**

Each update as depth increases:
```
event: suggestion
data: {"word": "BLIND", "depth": 1, "score": 0.85, "remaining": 42}

event: suggestion
data: {"word": "ROUND", "depth": 2, "score": 0.92, "remaining": 38}

event: suggestion
data: {"word": "POUND", "depth": 3, "score": 0.95, "remaining": 35}

event: done
data: {"finalWord": "POUND", "depth": 3}
```

**Backend Behavior:**
- Iterative deepening with alpha-beta pruning
- Returns best guess at each depth level (1 to maxDepth)
- Continues searching until `maxDepth` is reached
- Each update includes: word, search depth, score, remaining possibilities
- Frontend displays suggestions in real-time as they arrive

**Frontend Behavior:**
- Shows initial suggestion (depth 1) immediately in semi-transparent next row
- Updates suggestion as deeper searches complete
- Displays panel with top candidate words at current depth
- Similar to chess engine analysis display

## Canonical Game State

```go
// GameState represents the canonical state of a Wordle game
// Independent of the sequence of guesses that led to it
type GameState struct {
  // GuessNumber: how many guesses have been made (0-6)
  // Used to track progress and determine game end conditions
  GuessNumber int

  // Constraints: all letter constraints derived from feedback
  // Uniquely identifies which words are still possible
  Constraints ConstraintMap
}

// ConstraintMap represents all letter constraints from feedback
// Derived from the sequence of guesses and their feedback
type ConstraintMap struct {
  // GreenLetters: map[position] -> letter
  // Letters that are in the correct position
  // Example: position 1 must be 'L', position 2 must be 'I'
  // Constraint: word[pos] == letter
  GreenLetters map[int]string

  // YellowLetters: map[letter] -> []forbidden_positions
  // Letters that are in the word but at wrong positions
  // Example: 'A' is in word but NOT at positions [2, 3]
  // Constraint: word contains letter AND word[pos] != letter for each pos
  YellowLetters map[string][]int

  // GrayLetters: set of excluded letters (using map[string]struct{})
  // Letters that are NOT in the word at all
  // Example: {'S', 'T', 'E', 'C', 'G'}
  // Constraint: word does not contain any gray letter
  GrayLetters map[string]struct{}
}
```

