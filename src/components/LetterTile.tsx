import { PuzzleState } from '../types/index'
import { TILE_COLORS } from '../constants'

export type TileColor = 'empty' | 'green' | 'yellow' | 'gray'

interface LetterTileProps {
  letter: string
  color: TileColor
  onColorCycle?: () => void
  isActive?: boolean
  isSuggestion?: boolean
  isDarkMode?: boolean
  puzzleState?: PuzzleState
}

const colorClasses: Record<TileColor, string> = {
  empty: 'bg-white text-black',
  green: 'text-white',
  yellow: 'text-white',
  gray: 'text-white',
}

const colorStyles: Record<TileColor, React.CSSProperties> = {
  empty: {},
  green: { backgroundColor: TILE_COLORS.green },
  yellow: { backgroundColor: TILE_COLORS.yellow },
  gray: { backgroundColor: TILE_COLORS.gray },
}

export function LetterTile({
  letter,
  color,
  onColorCycle,
  isActive = false,
  isSuggestion = false,
  isDarkMode = false,
  puzzleState,
}: LetterTileProps) {
  const emptyBg = isDarkMode ? 'bg-gray-700' : 'bg-white'
  const emptyText = isDarkMode ? 'text-white' : 'text-black'
  const emptyClass = color === 'empty' ? `${emptyBg} ${emptyText}` : ''
  const suggestionBg = isDarkMode ? 'bg-gray-700' : 'bg-white'
  const isColored = color !== 'empty'
  const borderClass = isColored ? 'border-0' : 'border-2'
  const borderColor = isActive && !isColored
    ? puzzleState === PuzzleState.INVALID
      ? 'border-red-500'
      : 'border-blue-500'
    : !isColored
      ? 'border-gray-300'
      : ''

  return (
    <button
      style={!isSuggestion ? colorStyles[color] : {}}
      className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16
        lg:h-16 flex items-center justify-center
        text-3xl sm:text-4xl lg:text-6xl font-black
        leading-none transition-all uppercase outline-none
        ${borderClass} ${borderColor}
        ${isSuggestion ? suggestionBg : emptyClass || colorClasses[color]}
        ${isSuggestion ? 'text-teal-500 opacity-50' : ''}
        ${onColorCycle ? 'cursor-pointer' : 'cursor-default'}
        ${letter === '' && color === 'empty' && !isSuggestion ? 'opacity-50' : ''}`}
      onClick={onColorCycle}
    >
      {letter}
    </button>
  )
}

