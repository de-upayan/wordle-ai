import { v4 as uuidv4 } from 'uuid'
import { GameState, SuggestionItem } from '../types/index'
import { createLogger } from '../utils/logger'

const logger = createLogger('WordleSolverService')

export interface SuggestionResult {
  suggestions: SuggestionItem[]
  remainingAnswers: number
  requestId: string
}

/**
 * Service to manage Web Worker communication for Wordle solving
 * Handles worker lifecycle, initialization, and suggestion computation
 */
export class WordleSolverService {
  private worker: Worker | null = null
  private initPromise: Promise<void> | null = null
  private currentRequestId: string | null = null
  private requestHandlers: Map<
    string,
    (e: MessageEvent) => void
  > = new Map()
  private requestRejects: Map<
    string,
    (reason?: unknown) => void
  > = new Map()
  private requestTimeouts: Map<
    string,
    ReturnType<typeof setTimeout>
  > = new Map()

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
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return uuidv4()
  }

  /**
   * Cancel the current request and forcibly reject its promise
   */
  private cancelCurrentRequest(): void {
    if (this.currentRequestId) {
      const handler = this.requestHandlers.get(
        this.currentRequestId
      )
      if (handler && this.worker) {
        this.worker.removeEventListener('message', handler)
      }
      this.requestHandlers.delete(this.currentRequestId)

      // Forcibly reject the promise
      const reject = this.requestRejects.get(
        this.currentRequestId
      )
      if (reject) {
        reject(new Error('Request cancelled'))
      }
      this.requestRejects.delete(this.currentRequestId)

      // Clear the timeout so it doesn't fire later
      const timeoutId = this.requestTimeouts.get(
        this.currentRequestId
      )
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      this.requestTimeouts.delete(this.currentRequestId)

      logger.info('Cancelled previous request', {
        requestId: this.currentRequestId,
      })

      // Send CANCEL message to worker to terminate computation
      if (this.worker) {
        this.worker.postMessage({
          type: 'CANCEL',
          requestId: this.currentRequestId,
        })
      }

      this.currentRequestId = null
    }
  }

  /**
   * Compute suggestions for a game state
   * Returns a promise that resolves with suggestions and remaining answers
   * Includes timeout handling and cancellation of stale requests
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

    // Cancel any previous request
    this.cancelCurrentRequest()

    // Generate new request ID
    const requestId = this.generateRequestId()
    this.currentRequestId = requestId

    logger.info('Computing suggestions', {
      historyLength: gameState.history.length,
      requestId,
    })

    const computePromise = new Promise<SuggestionResult>(
      (resolve, reject) => {
        // Store reject function so we can forcibly reject on cancel
        this.requestRejects.set(requestId, reject)

        const handler = (e: MessageEvent) => {
          // Only process if this is for the current request
          if (e.data.requestId !== requestId) {
            return
          }

          if (e.data.type === 'SOLVE_COMPLETE') {
            logger.info('Suggestions computed', {
              count: e.data.suggestions.length,
              remainingAnswers: e.data.remainingAnswers,
              requestId,
            })
            this.worker!.removeEventListener('message', handler)
            this.requestHandlers.delete(requestId)
            this.requestRejects.delete(requestId)
            // Clear timeout when promise resolves
            const timeoutId = this.requestTimeouts.get(requestId)
            if (timeoutId) {
              clearTimeout(timeoutId)
              this.requestTimeouts.delete(requestId)
            }
            resolve({
              suggestions: e.data.suggestions,
              remainingAnswers: e.data.remainingAnswers,
              requestId,
            })
          } else if (e.data.type === 'ERROR') {
            logger.error('Solver error', {
              error: e.data.error,
              requestId,
            })
            this.worker!.removeEventListener('message', handler)
            this.requestHandlers.delete(requestId)
            this.requestRejects.delete(requestId)
            // Clear timeout when promise rejects
            const timeoutId = this.requestTimeouts.get(requestId)
            if (timeoutId) {
              clearTimeout(timeoutId)
              this.requestTimeouts.delete(requestId)
            }
            reject(new Error(e.data.error))
          }
        }

        this.requestHandlers.set(requestId, handler)
        this.worker!.addEventListener('message', handler)

        // Set up timeout
        const timeoutId = setTimeout(() => {
          logger.warn('Solver computation timeout', { requestId })
          reject(new Error('Solver computation timeout'))
        }, timeoutMs)
        this.requestTimeouts.set(requestId, timeoutId)

        // Send SOLVE message with request ID
        this.worker!.postMessage({
          type: 'SOLVE',
          gameState,
          requestId,
        })
      }
    )

    return computePromise
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

