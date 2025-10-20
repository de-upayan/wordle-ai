import { useState, useEffect } from 'react'
import { createLogger } from '../utils/logger'

const logger = createLogger('useWordlists')

/**
 * Custom hook for loading and caching Wordle wordlists
 * Loads answers.txt and guesses.txt from public/wordlists/
 * on app startup and caches them in state
 */
export function useWordlists() {
  const [answersList, setAnswersList] = useState<string[]>([])
  const [guessesList, setGuessesList] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadWordlists = async () => {
      try {
        logger.info('Loading wordlists from public/wordlists/')

        // Fetch both wordlists in parallel
        const [answersResponse, guessesResponse] = await Promise.all([
          fetch('/wordlists/answers.txt'),
          fetch('/wordlists/guesses.txt'),
        ])

        if (!answersResponse.ok) {
          throw new Error(
            `Failed to load answers.txt: ${answersResponse.statusText}`
          )
        }

        if (!guessesResponse.ok) {
          throw new Error(
            `Failed to load guesses.txt: ${guessesResponse.statusText}`
          )
        }

        // Parse wordlists
        const answersText = await answersResponse.text()
        const guessesText = await guessesResponse.text()

        const answers = answersText
          .split('\n')
          .map((w) => w.trim().toUpperCase())
          .filter((w) => w.length === 5)

        const guesses = guessesText
          .split('\n')
          .map((w) => w.trim().toUpperCase())
          .filter((w) => w.length === 5)

        logger.info('Wordlists loaded successfully', {
          answersCount: answers.length,
          guessesCount: guesses.length,
        })

        setAnswersList(answers)
        setGuessesList(guesses)
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

