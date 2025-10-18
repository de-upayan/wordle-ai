export type TileColor = 'empty' | 'green' | 'yellow' | 'gray'

interface LetterTileProps {
  letter: string
  color: TileColor
  onClick?: () => void
  isActive?: boolean
  isSuggestion?: boolean
}

const colorClasses: Record<TileColor, string> = {
  empty: 'bg-white text-black',
  green: 'bg-green-600 text-white',
  yellow: 'bg-yellow-500 text-black',
  gray: 'bg-gray-500 text-white',
}

export function LetterTile({
  letter,
  color,
  onClick,
  isActive = false,
  isSuggestion = false,
}: LetterTileProps) {
  return (
    <button
      className={`w-16 h-16 flex items-center justify-center
        text-5xl font-black border-2
        transition-all uppercase
        ${colorClasses[color]}
        ${isSuggestion ? 'text-teal-500 opacity-50' : ''}
        ${isActive ? 'border-blue-500' : 'border-gray-300'}
        ${onClick ? 'cursor-pointer hover:scale-105 hover:shadow-md' : 'cursor-default'}
        ${letter === '' && color === 'empty' && !isSuggestion ? 'opacity-50' : ''}`}
      onClick={onClick}
    >
      {letter}
    </button>
  )
}

