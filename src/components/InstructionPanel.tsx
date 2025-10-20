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

  const getInstructionText = (): string => {
    // Check puzzle state
    if (puzzleState === PuzzleState.INVALID) {
      return 'No valid answers left. Maybe you set a letter to the wrong color?'
    }

    if (puzzleState === PuzzleState.SOLVED) {
      return 'That\'s it! Puzzle solved.'
    }

    // Default instruction
    return 'Type your guess, press ⏎ to accept, and click on the letters to toggle their color. ⇧+⏎ to accept the top suggestion.'
  }

  return (
    <div
      className={`w-full text-center pt-8 pb-4 px-4 ${
        isDarkMode ? 'text-gray-300' : 'text-gray-700'
      }`}
    >
      <p className="text-sm">{getInstructionText()}</p>
    </div>
  )
}

