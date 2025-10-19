/**
 * Letter color feedback for a single position
 */
export type LetterColor = 'gray' | 'yellow' | 'green'

/**
 * Feedback for a single 5-letter guess
 * Contains exactly 5 letter colors, one for each position
 */
export interface Feedback {
  colors: LetterColor[]
}

/**
 * A single guess with its feedback
 */
export interface GuessEntry {
  word: string
  feedback: Feedback
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
 * Fully reconstructable from the history of guesses and feedback
 */
export interface GameState {
  history: GuessEntry[]
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

