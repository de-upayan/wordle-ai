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
 * Puzzle state based on remaining answers
 */
export enum PuzzleState {
  VALID = 'valid',
  SOLVED = 'solved',
  INVALID = 'invalid',
}

/**
 * Complete game state
 * Uniquely represents the game by guess count and constraints
 */
export interface GameState {
  guesses: Guess[]
  constraints: Constraints
  guessCount: number
  currentRowIndex: number
}

/**
 * Single suggestion with score
 */
export interface SuggestionItem {
  word: string
  score: number
}

/**
 * SSE event with top 5 suggestions at current depth
 */
export interface SuggestionsEvent {
  streamId: string
  suggestions: SuggestionItem[]
  topSuggestion: SuggestionItem | null
  depth: number
  done: boolean
  remainingAnswers: number
}

/**
 * Union type for SSE events (currently only suggestions)
 */
export type SSEEvent = SuggestionsEvent

/**
 * Suggestion data displayed to the user
 * Contains multiple suggestions sorted by score (descending)
 */
export interface Suggestion {
  suggestions: SuggestionItem[]
  topSuggestion: SuggestionItem | null
  remainingAnswers: number
}

