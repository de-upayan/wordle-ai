/**
 * Web Worker for Wordle AI solving algorithm
 * Runs in background thread to prevent UI blocking
 * Communicates with main thread via postMessage
 * Uses Strategy pattern for pluggable solving strategies
 */

import { InformationGainStrategy } from './strategies/InformationGainStrategy'
import { SolvingStrategy } from './strategies/SolvingStrategy'

interface WorkerState {
  answersList: string[]
  guessesList: string[]
  initialized: boolean
  strategy: SolvingStrategy | null
}

const state: WorkerState = {
  answersList: [],
  guessesList: [],
  initialized: false,
  strategy: null,
}

/**
 * Handle messages from main thread
 */
self.onmessage = (event: MessageEvent) => {
  try {
    const { type, answersList, guessesList, gameState } = event.data

    if (type === 'INIT') {
      state.answersList = answersList
      state.guessesList = guessesList
      // Initialize with InformationGainStrategy
      state.strategy = new InformationGainStrategy()
      state.initialized = true

      self.postMessage({
        type: 'INIT_COMPLETE',
      })
    } else if (type === 'SOLVE') {
      if (!state.initialized || !state.strategy) {
        throw new Error('Worker not initialized')
      }

      const result = state.strategy.solve(
        gameState,
        state.answersList,
        state.guessesList
      )

      self.postMessage({
        type: 'SOLVE_COMPLETE',
        suggestions: result.suggestions,
        remainingAnswers: result.remainingAnswers,
      })
    } else {
      throw new Error(`Unknown message type: ${type}`)
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error)
    self.postMessage({
      type: 'ERROR',
      error: errorMessage,
    })
  }
}

