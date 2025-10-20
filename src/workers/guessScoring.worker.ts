/**
 * Guess scoring worker
 * Scores a chunk of guesses in parallel
 * Receives a batch of guesses and possible answers,
 * calculates information gain for each guess
 */

import { getFeedback } from './wordleUtils'

interface GuessScoringTask {
  guesses: string[]
  possibleAnswers: string[]
}

interface GuessScoringResult {
  scores: Array<{ word: string; score: number }>
}

/**
 * Calculate Shannon entropy for a set of equiprobable outcomes
 */
function calculateEntropy(count: number): number {
  if (count <= 1) return 0
  const probability = 1.0 / count
  return -count * probability * Math.log2(probability)
}

/**
 * Calculate information gain (entropy reduction) for a guess
 */
function calculateInformationGain(
  guess: string,
  possibleAnswers: string[]
): number {
  if (possibleAnswers.length === 0) return 0

  // Current entropy before the guess
  const currentEntropy = calculateEntropy(possibleAnswers.length)

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
      expectedEntropy += probability * calculateEntropy(count)
    }
  }

  // Information gain = reduction in entropy
  return currentEntropy - expectedEntropy
}

/**
 * Handle scoring request
 */
self.onmessage = (
  event: MessageEvent<{ id: string; data: GuessScoringTask }>
) => {
  try {
    const { id, data } = event.data
    const { guesses, possibleAnswers } = data

    // Score all guesses in this batch
    const scores: Array<{ word: string; score: number }> = []
    for (const guess of guesses) {
      const gain = calculateInformationGain(guess, possibleAnswers)
      scores.push({ word: guess, score: gain })
    }

    self.postMessage({
      id,
      result: { scores },
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error)
    self.postMessage({
      id: event.data.id,
      error: errorMessage,
    })
  }
}

