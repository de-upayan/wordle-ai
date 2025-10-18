# Frontend Implementation Commit Plan

This document outlines the detailed commit strategy for implementing the Wordle AI Solver frontend.

## Overview

The frontend is a **Wordle solver/assistant** (NOT a playable game) that helps users solve the official Wordle by providing AI-suggested guesses and accepting manual feedback via color painting.

**Key Principle:** Stateless UI with game state uniquely represented by guess count (0-6) and constraints.

---

## Commit Phases

### Phase 1: Core UI Components
**Commits:** 1-3

#### Commit 1: Add LetterTile and GameBoard components
- `src/components/LetterTile.tsx` - Single letter tile with color states (empty, green, yellow, gray)
- `src/components/GameBoard.tsx` - 6x5 grid with inline typing support
- Keyboard handlers: A-Z, ENTER, Backspace
- State: `isTyping`, `typedWord`, `translucent suggestion display`
- Display logic: show typed letters OR translucent AI suggestion

#### Commit 2: Add ColorPicker and SuggestionInfo components
- `src/components/ColorPicker.tsx` - Three color buttons (Green, Yellow, Gray)
- `src/components/SuggestionInfo.tsx` - Display word, depth, score, remaining possibilities
- Real-time updates, hide when typing

#### Commit 3: Add SuggestionPanel component
- `src/components/SuggestionPanel.tsx` - Display current suggestion with animations
- Show depth indicator, score, remaining possibilities
- Update in real-time as SSE stream arrives

---

### Phase 2: State Management & Types
**Commits:** 4-5

#### Commit 4: Define TypeScript types
- `src/types/index.ts` - Core types:
  - `GameState` - guesses, constraints, guessCount, gameStatus
  - `Guess` - word, feedback colors
  - `Constraints` - greenLetters, yellowLetters, grayLetters
  - `SuggestionEvent`, `DoneEvent` - SSE event types

#### Commit 5: Implement useGameState hook
- `src/hooks/useGameState.ts` - Custom hook managing:
  - State: guesses, constraints, guessCount, gameStatus, currentRowIndex
  - Functions: addGuess, setFeedback, calculateConstraints, reset, isRowComplete, moveToNextRow

---

### Phase 3: Backend Integration
**Commits:** 6-7

#### Commit 6: Create API client service
- `src/services/api.ts` - fetchSuggestions function:
  - POST to `/api/v1/suggest/stream`
  - Return EventSource for SSE streaming
  - Parse suggestion and done events

#### Commit 7: Implement useSuggestions hook
- `src/hooks/useSuggestions.ts` - SSE lifecycle management:
  - Props: gameState, enabled
  - Returns: currentSuggestion, isLoading, error
  - Auto-connect on constraint changes, cleanup on unmount

---

### Phase 4: Game Flow Integration
**Commits:** 8-9

#### Commit 8: Implement tile painting and constraint calculation
- Add click handlers to LetterTile for color painting
- Track painted colors, cycle through colors on repeated clicks
- Detect row completion (all 5 tiles colored)
- Calculate constraints from feedback: Green → greenLetters[pos], Yellow → yellowLetters[letter], Gray → grayLetters

#### Commit 9: Create main App component and game flow
- `src/App.tsx` - Orchestrate GameBoard, ColorPicker, SuggestionPanel
- Connect components: display suggestion → user types/accepts → paint colors → calculate constraints → fetch new suggestion → repeat
- Implement Reset Game functionality

---

### Phase 5: Polish & Responsiveness
**Commits:** 10-12

#### Commit 10: Add responsive design
- Mobile-friendly layout
- Adjust tile size for different screens
- Stack color picker vertically on mobile

#### Commit 11: Add keyboard support and animations
- Support A-Z, ENTER, Backspace
- Auto-focus GameBoard
- Tile reveal animations, color transitions
- Suggestion update animations, fade in/out when typing

#### Commit 12: Add accessibility and error handling
- ARIA labels, keyboard navigation
- Loading spinner, error messages
- Visual indicator for active row
- Graceful error handling for API failures

---

### Phase 6: Testing & Finalization
**Commits:** 13-16

#### Commit 13: Add unit tests for hooks
- Test useGameState logic
- Test constraint calculation
- Test color picker state management

#### Commit 14: Add component tests
- Test GameBoard rendering and keyboard handling
- Test LetterTile color states
- Test ColorPicker interactions

#### Commit 15: Add integration tests
- Test full workflow: type/accept → paint → get suggestion → repeat
- Test SSE streaming, error handling

#### Commit 16: Verify end-to-end functionality
- Test complete solver workflow with running backend
- Verify all features work correctly

---

## File Structure

```
frontend/src/
├── components/
│   ├── GameBoard.tsx
│   ├── LetterTile.tsx
│   ├── ColorPicker.tsx
│   ├── SuggestionPanel.tsx
│   └── SuggestionInfo.tsx
├── hooks/
│   ├── useGameState.ts
│   └── useSuggestions.ts
├── services/
│   └── api.ts
├── types/
│   └── index.ts
├── App.tsx
└── main.jsx
```

---

## Key Implementation Details

### Inline Typing Behavior
1. User sees translucent AI suggestion in next empty row
2. User starts typing → suggestion disappears, typed letters appear
3. User presses ENTER → accept guess (AI suggestion if not typing, typed word if typing)
4. User paints tiles with colors (green/yellow/gray)
5. Once all 5 tiles colored → calculate constraints → fetch new suggestion

### Constraint Calculation
Convert colored tiles to backend format:
- **Green tile at position X with letter L** → `greenLetters[X] = L`
- **Yellow tile with letter L** → `yellowLetters[L] = [forbidden positions]`
- **Gray tile with letter L** → `grayLetters.add(L)`

### SSE Streaming
- Backend streams suggestions as search depth increases
- Frontend displays initial suggestion immediately
- Updates suggestion in real-time as deeper searches complete
- Similar to chess engine analysis display

---

## Testing Strategy

- **Unit tests:** Hooks, constraint calculation, state management
- **Component tests:** Rendering, keyboard handling, color states
- **Integration tests:** Full workflow, SSE streaming, error handling
- **E2E tests:** Complete solver workflow with running backend

