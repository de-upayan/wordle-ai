/**
 * Strict Guesses Strategy - filters guesses based on game history
 * Uses entropy reduction to score guesses, but only considers guesses
 * that are consistent with the game state history
 * Implements the SolvingStrategy interface
 * Uses parallel guess scoring for performance
 */

import {
  GameState,
  filterCandidateWords,
} from '../wordleUtils'
import {
  SolvingStrategy,
  SolveResult,
} from './SolvingStrategy'
import { ParallelGuessScorer } from '../utils/parallelGuessScoring'

export class StrictGuessesStrategy implements SolvingStrategy {
  private scorer: ParallelGuessScorer

  constructor() {
    this.scorer = new ParallelGuessScorer()
  }




  /**
   * Solve using strict guesses strategy - computes top 5 suggestions
   * Only considers guesses that are consistent with game history
   * Uses parallel guess scoring for performance
   * Runs in isolated worker thread that can be terminated immediately
   */
  async solve(
    gameState: GameState,
    answersList: string[],
    guessesList: string[]
  ): Promise<SolveResult> {
    // Filter possible answers based on game state
    const possibleAnswers = filterCandidateWords(
      gameState,
      answersList
    )

    // If no possible answers, return empty
    if (possibleAnswers.length === 0) {
      return {
        suggestions: [],
        remainingAnswers: 0,
      }
    }

    // Special case: only one possible answer left
    if (possibleAnswers.length === 1) {
      return {
        suggestions: [
          {
            word: possibleAnswers[0],
            score: Number.MAX_VALUE,
          },
        ],
        remainingAnswers: 1,
      }
    }

    // Filter guesses based on game history
    const validGuesses = filterCandidateWords(
      gameState,
      guessesList
    )

    // If no valid guesses, return empty
    if (validGuesses.length === 0) {
      return {
        suggestions: [],
        remainingAnswers: possibleAnswers.length,
      }
    }

    // Score guesses in parallel
    const allScores = await this.scorer.scoreGuesses(
      validGuesses,
      possibleAnswers
    )

    // Return all suggestions ranked by score
    const suggestions = allScores

    return {
      suggestions,
      remainingAnswers: possibleAnswers.length,
    }
  }
}
