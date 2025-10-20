import { GameState, SuggestionItem } from '../types/index'
import { createLogger } from '../utils/logger'

const logger = createLogger('WordleSolverService')

export interface SuggestionResult {
  suggestions: SuggestionItem[]
  remainingAnswers: number
}

/**
 * Service to manage Web Worker communication for Wordle solving
 * Handles worker lifecycle, initialization, and suggestion computation
 */
export class WordleSolverService {
  private worker: Worker | null = null
  private initPromise: Promise<void> | null = null
  private answersList: string[] = []
  private guessesList: string[] = []

  /**
   * Initialize the service with wordlists
   * Must be called before computeSuggestions
   */
  async initialize(
    answersList: string[],
    guessesList: string[]
  ): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = new Promise((resolve, reject) => {
      try {
        // Create worker from URL
        this.worker = new Worker(
          new URL(
            '../workers/wordleSolver.worker.ts',
            import.meta.url
          ),
          { type: 'module' }
        )

        logger.info('Web Worker created')

        // Set up message handler for INIT_COMPLETE
        const initHandler = (e: MessageEvent) => {
          if (e.data.type === 'INIT_COMPLETE') {
            logger.info('Web Worker initialized successfully')
            this.worker!.removeEventListener('message', initHandler)
            resolve()
          } else if (e.data.type === 'ERROR') {
            logger.error('Worker initialization error', {
              error: e.data.error,
            })
            this.worker!.removeEventListener('message', initHandler)
            reject(new Error(e.data.error))
          }
        }

        this.worker.addEventListener('message', initHandler)

        // Send INIT message
        this.answersList = answersList
        this.guessesList = guessesList

        logger.info('Sending INIT message to worker', {
          answersCount: answersList.length,
          guessesCount: guessesList.length,
        })

        this.worker.postMessage({
          type: 'INIT',
          answersList,
          guessesList,
        })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        logger.error('Failed to initialize worker', {
          error: errorMessage,
        })
        reject(error)
      }
    })

    return this.initPromise
  }

  /**
   * Compute suggestions for a game state
   * Returns a promise that resolves with suggestions and remaining answers
   * Includes timeout handling
   * Note: Initial computation with all 2315 answers can take 10-20 seconds
   */
  async computeSuggestions(
    gameState: GameState,
    timeoutMs: number = 30000
  ): Promise<SuggestionResult> {
    if (!this.worker) {
      throw new Error('Worker not initialized. Call initialize() first.')
    }

    // Ensure initialization is complete
    if (this.initPromise) {
      await this.initPromise
    }

    logger.info('Computing suggestions', {
      historyLength: gameState.history.length,
    })

    const computePromise = new Promise<SuggestionResult>(
      (resolve, reject) => {
        const handler = (e: MessageEvent) => {
          if (e.data.type === 'SOLVE_COMPLETE') {
            logger.info('Suggestions computed', {
              count: e.data.suggestions.length,
              remainingAnswers: e.data.remainingAnswers,
            })
            this.worker!.removeEventListener('message', handler)
            resolve({
              suggestions: e.data.suggestions,
              remainingAnswers: e.data.remainingAnswers,
            })
          } else if (e.data.type === 'ERROR') {
            logger.error('Solver error', {
              error: e.data.error,
            })
            this.worker!.removeEventListener('message', handler)
            reject(new Error(e.data.error))
          }
        }

        this.worker!.addEventListener('message', handler)

        // Send SOLVE message
        this.worker!.postMessage({
          type: 'SOLVE',
          gameState,
        })
      }
    )

    // Race with timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Solver computation timeout')),
        timeoutMs
      )
    )

    return Promise.race([computePromise, timeoutPromise])
  }

  /**
   * Terminate the worker and clean up resources
   */
  terminate(): void {
    if (this.worker) {
      logger.info('Terminating Web Worker')
      this.worker.terminate()
      this.worker = null
      this.initPromise = null
    }
  }
}

// Export singleton instance
export const wordleSolverService = new WordleSolverService()

