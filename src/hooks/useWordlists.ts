import { useState, useEffect } from 'react'
import { createLogger } from '../utils/logger'

const logger = createLogger('useWordlists')

/**
 * Custom hook for loading and caching Wordle wordlists
 * Loads sowpods_5.txt from public/wordlists/ for both answers
 * and guesses on app startup and caches them in state
 */
export function useWordlists() {
  const [answersList, setAnswersList] = useState<string[]>([])
  const [guessesList, setGuessesList] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadWordlists = async () => {
      try {
        logger.info('Loading SOWPODS wordlist from public/wordlists/')

        // Fetch SOWPODS wordlist
        const response = await fetch('/wordlists/sowpods_5.txt')

        if (!response.ok) {
          throw new Error(
            `Failed to load sowpods_5.txt: ${response.statusText}`
          )
        }

        // Parse wordlist
        const text = await response.text()

        const words = text
          .split('\n')
          .map((w) => w.trim().toUpperCase())
          .filter((w) => w.length === 5)

        logger.info('SOWPODS_5 wordlist loaded successfully', {
          wordCount: words.length,
        })

        // Use same wordlist for both answers and guesses
        setAnswersList(words)
        setGuessesList(words)
        setIsLoaded(true)
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : String(err)
        logger.error('Failed to load wordlists', {
          error: errorMessage,
        })
        setError(errorMessage)
        setIsLoaded(false)
      }
    }

    loadWordlists()
  }, [])

  return {
    answersList,
    guessesList,
    isLoaded,
    error,
  }
}

