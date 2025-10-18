import { useState, useCallback } from 'react'
import {
  GameState,
  GameStatus,
  Guess,
  Constraints,
} from '../types/index'
import { TileColor } from '../components/LetterTile'

/**
 * Custom hook for managing game state
 * Handles state transitions, constraint calculation, and game logic
 */
export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    guesses: [],
    constraints: {
      greenLetters: {},
      yellowLetters: {},
      grayLetters: new Set(),
    },
    guessCount: 0,
    gameStatus: GameStatus.PLAYING,
    currentRowIndex: 0,
  })

  /**
   * Calculate constraints from feedback colors
   * Converts tile colors to constraint format for backend
   */
  const calculateConstraints = useCallback(
    (guesses: Guess[]): Constraints => {
      const constraints: Constraints = {
        greenLetters: {},
        yellowLetters: {},
        grayLetters: new Set(),
      }

      guesses.forEach((guess) => {
        guess.word.split('').forEach((letter, index) => {
          const color = guess.feedback[index]

          if (color === 'green') {
            constraints.greenLetters[index] = letter
          } else if (color === 'yellow') {
            if (!constraints.yellowLetters[letter]) {
              constraints.yellowLetters[letter] = []
            }
            if (
              !constraints.yellowLetters[letter].includes(
                index
              )
            ) {
              constraints.yellowLetters[letter].push(index)
            }
          } else if (color === 'gray') {
            constraints.grayLetters.add(letter)
          }
        })
      })

      return constraints
    },
    []
  )

  /**
   * Add a guess to the game state
   */
  const addGuess = useCallback(
    (word: string, feedback: TileColor[]) => {
      const newGuess: Guess = {
        word: word.toUpperCase(),
        feedback,
      }

      const updatedGuesses = [...gameState.guesses, newGuess]
      const newConstraints = calculateConstraints(
        updatedGuesses
      )
      const newGuessCount = updatedGuesses.length

      setGameState((prev) => ({
        ...prev,
        guesses: updatedGuesses,
        constraints: newConstraints,
        guessCount: newGuessCount,
        currentRowIndex: newGuessCount,
      }))
    },
    [gameState.guesses, calculateConstraints]
  )

  /**
   * Update feedback colors for a specific guess
   */
  const setFeedback = useCallback(
    (guessIndex: number, feedback: TileColor[]) => {
      const updatedGuesses = [...gameState.guesses]
      if (updatedGuesses[guessIndex]) {
        updatedGuesses[guessIndex].feedback = feedback
        const newConstraints = calculateConstraints(
          updatedGuesses
        )

        setGameState((prev) => ({
          ...prev,
          guesses: updatedGuesses,
          constraints: newConstraints,
        }))
      }
    },
    [gameState.guesses, calculateConstraints]
  )

  /**
   * Check if current row is complete (all tiles colored)
   */
  const isRowComplete = useCallback((): boolean => {
    if (gameState.currentRowIndex === 0) return false

    const currentGuess =
      gameState.guesses[gameState.currentRowIndex - 1]
    if (!currentGuess) return false

    return currentGuess.feedback.every(
      (color) => color !== 'empty'
    )
  }, [gameState.guesses, gameState.currentRowIndex])

  /**
   * Move to next row
   */
  const moveToNextRow = useCallback(() => {
    if (gameState.currentRowIndex < 6) {
      setGameState((prev) => ({
        ...prev,
        currentRowIndex: prev.currentRowIndex + 1,
      }))
    }
  }, [gameState.currentRowIndex])

  /**
   * Reset game to initial state
   */
  const reset = useCallback(() => {
    setGameState({
      guesses: [],
      constraints: {
        greenLetters: {},
        yellowLetters: {},
        grayLetters: new Set(),
      },
      guessCount: 0,
      gameStatus: GameStatus.PLAYING,
      currentRowIndex: 0,
    })
  }, [])

  /**
   * Set game status (won/lost)
   */
  const setGameStatus = useCallback(
    (status: GameStatus) => {
      setGameState((prev) => ({
        ...prev,
        gameStatus: status,
      }))
    },
    []
  )

  return {
    gameState,
    addGuess,
    setFeedback,
    calculateConstraints,
    reset,
    isRowComplete,
    moveToNextRow,
    setGameStatus,
  }
}

