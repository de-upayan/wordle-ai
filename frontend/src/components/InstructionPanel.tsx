import { GameStatus } from '../types/index'

interface InstructionPanelProps {
  gameStatus: GameStatus
  guessCount: number
  isDarkMode?: boolean
}

export function InstructionPanel({
  gameStatus,
  guessCount,
  isDarkMode = false,
}: InstructionPanelProps) {
  const getInstructionText = (): string => {
    switch (gameStatus) {
      case GameStatus.WON:
        return `You won in ${guessCount} ${
          guessCount === 1 ? 'guess' : 'guesses'
        }! 🎉`
      case GameStatus.LOST:
        return 'Game over! You ran out of guesses. 😢'
      case GameStatus.PLAYING:
      default:
        return 'Type your guess, press ⏎ to accept, and click on the letters to toggle their color. ⇧+⏎ to accept the top suggestion.'
    }
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

