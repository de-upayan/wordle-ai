/**
 * Parallel guess scoring utility
 * Shared logic for scoring guesses in parallel across strategies
 */

import { WorkerPool } from './WorkerPool'
import guessScoringWorkerUrl from '../guessScoring.worker.ts?worker&url'

export interface GuessScoringTask {
  guesses: string[]
  possibleAnswers: string[]
}

export interface GuessScoringResult {
  scores: Array<{ word: string; score: number }>
}

/**
 * Manages a worker pool for parallel guess scoring
 * Handles chunking, task distribution, and result merging
 */
export class ParallelGuessScorer {
  private workerPool: WorkerPool<
    GuessScoringTask,
    GuessScoringResult
  >

  constructor() {
    // Initialize worker pool with auto-sized pool
    // (based on available CPU cores, capped at 8)
    this.workerPool = new WorkerPool(guessScoringWorkerUrl)
  }

  /**
   * Score guesses in parallel
   * Splits guesses into chunks and distributes to worker pool
   * Returns sorted scores for top 5 suggestions
   */
  async scoreGuesses(
    guesses: string[],
    possibleAnswers: string[]
  ): Promise<Array<{ word: string; score: number }>> {
    // Split guesses into chunks for parallel processing
    const chunkSize = Math.ceil(guesses.length / 4)
    const chunks: string[][] = []
    for (let i = 0; i < guesses.length; i += chunkSize) {
      chunks.push(guesses.slice(i, i + chunkSize))
    }

    // Submit all chunks to worker pool
    const scoringPromises = chunks.map((chunk, index) =>
      this.workerPool.execute(`chunk-${index}`, {
        guesses: chunk,
        possibleAnswers,
      })
    )

    // Wait for all workers to complete
    const results = await Promise.all(scoringPromises)

    // Merge results from all workers
    const allScores: Array<{ word: string; score: number }> = []
    for (const result of results) {
      allScores.push(...result.scores)
    }

    // Sort by information gain (descending)
    allScores.sort((a, b) => b.score - a.score)

    return allScores
  }

  /**
   * Terminate the worker pool and clean up resources
   */
  terminate(): void {
    this.workerPool.terminate()
  }
}

