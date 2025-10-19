import { SuggestionsEvent, Constraints } from '../types/index'
import { createLogger } from '../utils/logger'

const logger = createLogger('API')

// Get API base URL from environment or default to localhost
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

logger.info('API client initialized', {
  apiBaseUrl: API_BASE_URL,
})

/**
 * Represents a suggestion stream with ID and event source
 */
interface SuggestionStream {
  streamId: string
  eventSource: EventSource
}

/**
 * API client for Wordle AI backend
 * Handles suggestion streaming and cancellation
 */
export class WordleAIClient {
  private activeStreamId: string | null = null
  private activeStreamStates: Map<string, 'active' | 'completed'> =
    new Map()

  /**
   * Stream suggestions from the backend
   * Calls onSuggestion callback for each event
   * Calls onError callback if an error occurs
   * Calls onComplete callback when stream is done
   * Returns a promise that resolves with the stream ID
   */
  streamSuggestions(
    guessNumber: number,
    constraints: Constraints,
    maxDepth: number,
    onSuggestion: (event: SuggestionsEvent) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): Promise<string> {
    logger.info('Starting suggestion stream', {
      guessNumber,
      maxDepth,
    })

    // Convert constraints to backend format
    const grayLettersArray = Array.from(
      constraints.grayLetters
    )
    const backendConstraints = {
      greenLetters: constraints.greenLetters,
      yellowLetters: constraints.yellowLetters,
      grayLetters: grayLettersArray,
    }

    const requestBody = {
      guessNumber,
      constraints: backendConstraints,
      maxDepth,
    }

    const url = `${API_BASE_URL}/api/v1/suggest/stream`
    logger.info('Making request to backend', {
      url,
      guessNumber,
      maxDepth,
    })

    // Return a promise that resolves with the stream ID
    return new Promise<string>((resolve, reject) => {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
        .then((response) => {
          logger.info('Received response from backend', {
            status: response.status,
            statusText: response.statusText,
          })
          if (!response.ok) {
            throw new Error(
              `HTTP error! status: ${response.status}`
            )
          }
          return response.body
        })
        .then((body) => {
          if (!body) {
            throw new Error('Response body is empty')
          }

          const reader = body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          let streamId = ''

          const processStream = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) {
                  logger.info('Stream completed', {
                    streamId,
                  })
                  // Mark stream as completed
                  if (streamId) {
                    this.activeStreamStates.set(
                      streamId,
                      'completed'
                    )
                  }
                  onComplete()
                  break
                }

                buffer += decoder.decode(value, {
                  stream: true,
                })
                const lines = buffer.split('\n')
                buffer = lines.pop() || ''

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const data = JSON.parse(
                        line.substring(6)
                      )
                      // Capture stream ID from first event
                      if (!streamId && data.streamId) {
                        streamId = data.streamId
                        // Mark stream as active
                        this.activeStreamStates.set(
                          streamId,
                          'active'
                        )
                        logger.info('Stream ID received', {
                          streamId,
                        })
                        resolve(streamId)
                      }
                      logger.debug(
                        'Received suggestion event',
                        {
                          depth: data.depth,
                          done: data.done,
                        }
                      )
                      onSuggestion(data)
                    } catch (e) {
                      logger.warn('Failed to parse event', {
                        error: String(e),
                      })
                    }
                  }
                }
              }
            } catch (error) {
              logger.error('Stream error', {
                error: String(error),
              })
              // Mark stream as completed on error
              if (streamId) {
                this.activeStreamStates.set(
                  streamId,
                  'completed'
                )
              }
              onError(
                error instanceof Error
                  ? error
                  : new Error(String(error))
              )
              reject(error)
            }
          }

          processStream()
        })
        .catch((error) => {
          logger.error('Failed to start stream', {
            error: String(error),
          })
          onError(
            error instanceof Error
              ? error
              : new Error(String(error))
          )
          reject(error)
        })
    })
  }

  /**
   * Check if a stream is still active
   */
  private isStreamActive(streamId: string): boolean {
    const state = this.activeStreamStates.get(streamId)
    return state === 'active'
  }

  /**
   * Close an ongoing suggestion stream
   * Sends close request to signal stream closure
   */
  async closeStream(streamId: string): Promise<void> {
    logger.info('Attempting to close stream', {
      streamId,
    })

    // Check if stream is still active
    if (!this.isStreamActive(streamId)) {
      logger.debug('Stream already completed, skipping close', {
        streamId,
      })
      return
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/suggest/close`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ streamId }),
        }
      )

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status}`
        )
      }

      logger.info('Stream closed successfully', {
        streamId,
      })
      // Mark as completed after successful closure
      this.activeStreamStates.set(streamId, 'completed')
    } catch (error) {
      logger.error('Failed to close stream', {
        streamId,
        error: String(error),
      })
      throw error
    }
  }
}

// Export singleton instance
export const wordleAIClient = new WordleAIClient()

