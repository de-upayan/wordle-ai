/**
 * Information Gain Strategy - uses entropy reduction to score guesses
 * Implements the SolvingStrategy interface
 */

import {
  GameState,
  getFeedback,
  filterCandidateWords,
} from '../wordleUtils'
import {
  SolvingStrategy,
  SolveResult,
} from './SolvingStrategy'

export class InformationGainStrategy implements SolvingStrategy {
  /**
   * Calculate Shannon entropy for a set of equiprobable outcomes
   */
  private calculateEntropy(count: number): number {
    if (count <= 1) return 0
    const probability = 1.0 / count
    return -count * probability * Math.log2(probability)
  }

  /**
   * Calculate information gain (entropy reduction) for a guess
   */
  private calculateInformationGain(
    guess: string,
    possibleAnswers: string[]
  ): number {
    if (possibleAnswers.length === 0) return 0

    // Current entropy before the guess
    const currentEntropy = this.calculateEntropy(possibleAnswers.length)

    // Partition answers by feedback pattern
    const feedbackPartitions = new Map<string, number>()
    for (const answer of possibleAnswers) {
      const feedback = getFeedback(answer, guess)
      const feedbackKey = feedback.join('')
      feedbackPartitions.set(
        feedbackKey,
        (feedbackPartitions.get(feedbackKey) || 0) + 1
      )
    }

    // Calculate expected entropy after the guess
    let expectedEntropy = 0.0
    const totalAnswers = possibleAnswers.length
    for (const count of feedbackPartitions.values()) {
      if (count > 0) {
        const probability = count / totalAnswers
        expectedEntropy += probability * this.calculateEntropy(count)
      }
    }

    // Information gain = reduction in entropy
    return currentEntropy - expectedEntropy
  }

  /**
   * Solve using information gain strategy - computes top 5 suggestions
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

    // Calculate information gain for each guess
    const guessScores: Array<{ word: string; score: number }> = []
    for (const guess of guessesList) {
      const gain = this.calculateInformationGain(guess, possibleAnswers)
      guessScores.push({ word: guess, score: gain })
    }

    // Sort by information gain (descending)
    guessScores.sort((a, b) => b.score - a.score)

    // Return top 5 suggestions
    const suggestions = guessScores.slice(0, 5)

    return {
      suggestions,
      remainingAnswers: possibleAnswers.length,
    }
  }
}

