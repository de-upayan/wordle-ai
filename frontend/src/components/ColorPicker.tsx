import { TileColor } from './LetterTile'

interface ColorPickerProps {
  onColorSelect: (color: TileColor) => void
  isVisible?: boolean
  isDarkMode?: boolean
}

const colors: Array<{ color: TileColor; label: string; bg: string }> = [
  { color: 'green', label: 'Green', bg: 'bg-green-600' },
  { color: 'yellow', label: 'Yellow', bg: 'bg-yellow-500' },
  { color: 'gray', label: 'Gray', bg: 'bg-gray-500' },
]

export function ColorPicker({
  onColorSelect,
  isVisible = true,
  isDarkMode = false,
}: ColorPickerProps) {
  if (!isVisible) return null

  return (
    <div className="mt-6">
      <p className={`text-sm font-bold mb-2 ${
        isDarkMode ? 'text-gray-400' : 'text-gray-600'
      }`}>
        Paint tiles to provide feedback:
      </p>
      <div className="flex gap-3 justify-center">
        {colors.map(({ color, label, bg }) => (
          <button
            key={color}
            className={`${bg} text-white px-4 py-2 rounded-md
              font-bold transition-all hover:opacity-80
              hover:scale-105 active:scale-95`}
            onClick={() => onColorSelect(color)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

