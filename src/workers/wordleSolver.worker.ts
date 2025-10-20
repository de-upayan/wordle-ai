/**
 * Web Worker for Wordle AI solving algorithm
 * Spawns separate computation workers for each solve request
 * Terminates computation workers immediately on cancel
 */

interface WorkerState {
  answersList: string[]
  guessesList: string[]
  initialized: boolean
  currentRequestId: string | null
  currentComputeWorker: Worker | null
}

const state: WorkerState = {
  answersList: [],
  guessesList: [],
  initialized: false,
  currentRequestId: null,
  currentComputeWorker: null,
}

/**
 * Handle messages from main thread
 */
self.onmessage = (event: MessageEvent) => {
  try {
    const {
      type,
      answersList,
      guessesList,
      gameState,
      useStrictGuesses,
      requestId,
      typedWord,
    } = event.data

    if (type === 'INIT') {
      state.answersList = answersList
      state.guessesList = guessesList
      state.initialized = true

      self.postMessage({
        type: 'INIT_COMPLETE',
      })
    } else if (type === 'SOLVE') {
      if (!state.initialized) {
        throw new Error('Worker not initialized')
      }

      // Terminate any previous computation worker
      if (state.currentComputeWorker) {
        state.currentComputeWorker.terminate()
      }

      // Create new computation worker for this request
      state.currentRequestId = requestId
      state.currentComputeWorker = new Worker(
        new URL('./solveComputation.worker.ts', import.meta.url),
        { type: 'module' }
      )

      // Set up message handler for computation results
      const computeHandler = (event: MessageEvent) => {
        // Only process if this is still the current request
        if (event.data.requestId === state.currentRequestId) {
          self.postMessage(event.data)
        }
        // Otherwise silently ignore stale results
      }

      state.currentComputeWorker.addEventListener(
        'message',
        computeHandler
      )

      // Send computation request to worker
      state.currentComputeWorker.postMessage({
        gameState,
        answersList: state.answersList,
        guessesList: state.guessesList,
        useStrictGuesses,
        requestId,
        typedWord,
      })
    } else if (type === 'CANCEL') {
      // Terminate the computation worker immediately
      if (state.currentRequestId === requestId &&
          state.currentComputeWorker) {
        state.currentComputeWorker.terminate()
        state.currentComputeWorker = null
      }
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

