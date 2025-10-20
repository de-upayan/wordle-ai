import { Suggestion, PuzzleState } from '../types/index'
import { getPuzzleState } from '../utils/puzzleStateStyles'

interface InstructionPanelProps {
  isDarkMode?: boolean
  suggestion?: Suggestion | null
}

export function InstructionPanel({
  isDarkMode = false,
  suggestion,
}: InstructionPanelProps) {
  const puzzleState = suggestion
    ? getPuzzleState(suggestion.remainingAnswers)
    : null

  const getInstructionText = (isMobile: boolean): string => {
    // Check puzzle state
    if (puzzleState === PuzzleState.INVALID) {
      return isMobile
        ? 'No valid answers left.'
        : 'No valid answers left. Maybe you set a letter to the wrong color?'
    }

    if (puzzleState === PuzzleState.SOLVED) {
      return 'Puzzle solved!'
    }

    // Default instruction
    return isMobile
      ? 'Type guess, press ⏎, click letters to toggle color.'
      : 'Type your guess, press ⏎ to accept, and click on the letters to toggle their color. ⇧+⏎ to accept the top suggestion.'
  }

  return (
    <div
      className={`w-full text-center pt-4 sm:pt-6 lg:pt-8
        pb-2 sm:pb-3 lg:pb-4 px-2 sm:px-4 lg:px-4 ${
        isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`}
    >
      <p className="text-xs sm:text-sm lg:text-sm">
        {getInstructionText(window.innerWidth < 768)}
      </p>
    </div>
  )
}

