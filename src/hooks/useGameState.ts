import { useState, useCallback, useMemo } from 'react'
import { GameState, GuessEntry, LetterColor } from '../types/index'
import { TileColor } from '../components/LetterTile'

/**
 * Custom hook for managing game state
 * Handles state transitions and game logic
 */
export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    history: [],
  })

  /**
   * Get the current row index (number of guesses made)
   */
  const currentRowIndex = useMemo(
    () => gameState.history.length,
    [gameState.history.length]
  )

  /**
   * Add a guess to the game state
   */
  const addGuess = useCallback(
    (word: string, feedback: TileColor[]) => {
      const newEntry: GuessEntry = {
        word: word.toUpperCase(),
        feedback: {
          colors: feedback as LetterColor[],
        },
      }

      setGameState((prev) => ({
        history: [...prev.history, newEntry],
      }))
    },
    []
  )

  /**
   * Update feedback colors for a specific guess
   */
  const setFeedback = useCallback(
    (guessIndex: number, feedback: TileColor[]) => {
      setGameState((prev) => {
        const updatedHistory = [...prev.history]
        if (updatedHistory[guessIndex]) {
          updatedHistory[guessIndex].feedback.colors =
            feedback as LetterColor[]
        }
        return { history: updatedHistory }
      })
    },
    []
  )

  /**
   * Check if current row is complete (all tiles colored)
   */
  const isRowComplete = useCallback((): boolean => {
    if (currentRowIndex === 0) return false

    const currentGuess = gameState.history[currentRowIndex - 1]
    if (!currentGuess) return false

    return currentGuess.feedback.colors.length === 5 &&
      currentGuess.feedback.colors.every(
        (color) => color !== undefined
      )
  }, [gameState.history, currentRowIndex])

  /**
   * Remove the last guess from history
   */
  const undoGuess = useCallback(() => {
    setGameState((prev) => ({
      history: prev.history.slice(0, -1),
    }))
  }, [])

  /**
   * Reset game to initial state
   */
  const reset = useCallback(() => {
    setGameState({ history: [] })
  }, [])

  return {
    gameState,
    addGuess,
    setFeedback,
    reset,
    undoGuess,
    isRowComplete,
    currentRowIndex,
  }
}

