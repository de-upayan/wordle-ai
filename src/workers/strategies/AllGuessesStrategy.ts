/**
 * All Guesses Strategy - uses entropy reduction to score guesses
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

export class AllGuessesStrategy implements SolvingStrategy {
  private scorer: ParallelGuessScorer

  constructor() {
    this.scorer = new ParallelGuessScorer()
  }


  /**
   * Solve using all guesses strategy - computes top 5 suggestions
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

    // Score guesses in parallel
    const allScores = await this.scorer.scoreGuesses(
      guessesList,
      possibleAnswers
    )

    // Return top 5 suggestions
    const suggestions = allScores.slice(0, 5)

    return {
      suggestions,
      remainingAnswers: possibleAnswers.length,
    }
  }
}
