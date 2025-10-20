/**
 * Solver computation worker
 * Spawned for each solve request and terminated on cancel
 * Runs the actual solving computation in isolation
 */

import { StrictGuessesStrategy } from './strategies/StrictGuessesStrategy'
import { AllGuessesStrategy } from './strategies/AllGuessesStrategy'
import { GameState, filterWordsByPrefix } from './wordleUtils'

interface ComputeMessage {
  gameState: GameState
  answersList: string[]
  guessesList: string[]
  useStrictGuesses: boolean
  requestId: string
  typedWord?: string
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
      useStrictGuesses,
      requestId,
      typedWord = '',
    } = event.data

    // Filter guesses by typed word prefix
    const filteredGuesses = filterWordsByPrefix(
      guessesList,
      typedWord
    )

    const strategy = useStrictGuesses
      ? new StrictGuessesStrategy()
      : new AllGuessesStrategy()
    const result = await strategy.solve(
      gameState,
      answersList,
      filteredGuesses
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

