/**
 * Solver computation worker
 * Spawned for each solve request and terminated on cancel
 * Runs the actual solving computation in isolation
 */

import { InformationGainStrategy } from './strategies/InformationGainStrategy'
import { GameState } from './wordleUtils'

interface ComputeMessage {
  gameState: GameState
  answersList: string[]
  guessesList: string[]
  requestId: string
}

/**
 * Handle computation request
 */
self.onmessage = async (event: MessageEvent<ComputeMessage>) => {
  try {
    const {
      gameState,
      answersList,
      guessesList,
      requestId,
    } = event.data

    const strategy = new InformationGainStrategy()
    const result = await strategy.solve(
      gameState,
      answersList,
      guessesList
    )

    self.postMessage({
      type: 'SOLVE_COMPLETE',
      suggestions: result.suggestions,
      remainingAnswers: result.remainingAnswers,
      requestId,
    })
  } catch (error) {
    // Don't send error if it's due to worker termination
    if (error instanceof Error &&
        error.message === 'Worker terminated') {
      return
    }

    const errorMessage =
      error instanceof Error ? error.message : String(error)
    self.postMessage({
      type: 'ERROR',
      error: errorMessage,
    })
  }
}

