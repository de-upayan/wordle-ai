export type TileColor = 'empty' | 'green' | 'yellow' | 'gray'

interface LetterTileProps {
  letter: string
  color: TileColor
  onColorCycle?: () => void
  isActive?: boolean
  isSuggestion?: boolean
  isDarkMode?: boolean
}

const colorClasses: Record<TileColor, string> = {
  empty: 'bg-white text-black',
  green: 'text-white',
  yellow: 'text-white',
  gray: 'text-white',
}

const colorStyles: Record<TileColor, React.CSSProperties> = {
  empty: {},
  green: { backgroundColor: '#6aaa64' },
  yellow: { backgroundColor: '#c9b458' },
  gray: { backgroundColor: '#787c7e' },
}

export function LetterTile({
  letter,
  color,
  onColorCycle,
  isActive = false,
  isSuggestion = false,
  isDarkMode = false,
}: LetterTileProps) {
  const emptyBg = isDarkMode ? 'bg-gray-700' : 'bg-white'
  const emptyText = isDarkMode ? 'text-white' : 'text-black'
  const emptyClass = color === 'empty' ? `${emptyBg} ${emptyText}` : ''
  const suggestionBg = isDarkMode ? 'bg-gray-700' : 'bg-white'
  const isColored = color !== 'empty'
  const borderClass = isColored ? 'border-0' : 'border-2'
  const borderColor = isActive && !isColored
    ? 'border-blue-500'
    : !isColored
      ? 'border-gray-300'
      : ''

  return (
    <button
      style={!isSuggestion ? colorStyles[color] : {}}
      className={`w-16 h-16 flex items-center justify-center
        text-5xl font-black
        transition-all uppercase
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

