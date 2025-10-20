import { PuzzleState } from '../types/index'

/**
 * Style classes for different puzzle states
 */
export const puzzleStateStyles = {
  [PuzzleState.VALID]: {
    text: {
      light: 'text-gray-900',
      dark: 'text-gray-300',
    },
  },
  [PuzzleState.SOLVED]: {
    text: {
      light: 'text-green-600',
      dark: 'text-green-400',
    },
  },
  [PuzzleState.INVALID]: {
    text: {
      light: 'text-red-600',
      dark: 'text-red-400',
    },
  },
}

/**
 * Get the puzzle state based on remaining answers
 */
export function getPuzzleState(
  remainingAnswers: number
): PuzzleState {
  if (remainingAnswers === 0) {
    return PuzzleState.INVALID
  }
  if (remainingAnswers === 1) {
    return PuzzleState.SOLVED
  }
  return PuzzleState.VALID
}

/**
 * Get text style classes for a puzzle state
 */
export function getPuzzleStateTextStyle(
  state: PuzzleState,
  isDarkMode: boolean
): string {
  const mode = isDarkMode ? 'dark' : 'light'
  return puzzleStateStyles[state].text[mode]
}

