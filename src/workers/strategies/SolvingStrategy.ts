/**
 * Strategy interface for different Wordle solving approaches
 */

import { GameState } from '../wordleUtils'

export interface SuggestionItem {
  word: string
  score: number
}

export interface SolveResult {
  suggestions: SuggestionItem[]
  remainingAnswers: number
}

export interface SolvingStrategy {
  solve(
    gameState: GameState,
    answersList: string[],
    guessesList: string[]
  ): Promise<SolveResult>
}

