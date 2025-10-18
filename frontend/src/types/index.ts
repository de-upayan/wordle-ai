import { TileColor } from '../components/LetterTile'

/**
 * Represents a single guess made by the user
 */
export interface Guess {
  word: string
  feedback: TileColor[]
}

/**
 * Constraints derived from user feedback
 * Used to filter possible words for the next suggestion
 */
export interface Constraints {
  greenLetters: Record<number, string>
  yellowLetters: Record<string, number[]>
  grayLetters: Set<string>
}

/**
 * Game status enum
 */
export enum GameStatus {
  PLAYING = 'playing',
  WON = 'won',
  LOST = 'lost',
}

/**
 * Complete game state
 * Uniquely represents the game by guess count and constraints
 */
export interface GameState {
  guesses: Guess[]
  constraints: Constraints
  guessCount: number
  gameStatus: GameStatus
  currentRowIndex: number
}

/**
 * SSE event for a suggestion update
 */
export interface SuggestionEvent {
  type: 'suggestion'
  word: string
  depth: number
  score: number
  remainingPossibilities: number
}

/**
 * SSE event indicating search is complete
 */
export interface DoneEvent {
  type: 'done'
  finalWord: string
  finalDepth: number
  finalScore: number
  finalRemainingPossibilities: number
}

/**
 * Union type for SSE events
 */
export type SSEEvent = SuggestionEvent | DoneEvent

/**
 * Suggestion data displayed to the user
 */
export interface Suggestion {
  word: string
  depth: number
  score: number
  remainingPossibilities: number
}

