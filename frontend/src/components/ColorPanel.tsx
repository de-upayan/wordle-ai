import { TileColor } from './LetterTile'

interface ColorPanelProps {
  onColorSelect: (color: TileColor) => void
  isPaintMode: boolean
  onPaintModeToggle: (enabled: boolean) => void
  selectedColor: TileColor | null
  isDarkMode?: boolean
}

const colors: Array<{
  color: TileColor
  label: string
  bg: string
}> = [
  { color: 'gray', label: 'Gray', bg: 'bg-gray-500' },
  { color: 'yellow', label: 'Yellow', bg: 'bg-yellow-500' },
  { color: 'green', label: 'Green', bg: 'bg-green-600' },
]

export function ColorPanel({
  onColorSelect,
  isPaintMode,
  onPaintModeToggle,
  selectedColor,
  isDarkMode = false,
}: ColorPanelProps) {
  const handleColorClick = (color: TileColor) => {
    onColorSelect(color)
  }

  const handlePaintModeToggle = () => {
    const newMode = !isPaintMode
    onPaintModeToggle(newMode)
    // When entering paint mode, default to gray
    if (newMode && !selectedColor) {
      onColorSelect('gray')
    }
  }

  return (
    <div
      className={`flex flex-col items-center gap-4 p-4
        rounded-lg ${
        isDarkMode
          ? 'bg-gray-800'
          : 'bg-gray-50'
      }`}
    >
      {/* Paint Mode Toggle Button */}
      <button
        onClick={handlePaintModeToggle}
        className={`flex items-center justify-center
          w-40 h-12 rounded-lg transition-all
          ${isPaintMode
            ? 'bg-blue-500 text-white shadow-lg'
            : isDarkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        title={isPaintMode ? 'Exit paint mode' : 'Enter paint mode'}
      >
        <span className="text-xl">🎨</span>
      </button>

      {/* Color Selection Squares */}
      <div className="flex flex-row gap-2">
        {colors.map(({ color, bg }) => (
          <button
            key={color}
            onClick={() => handleColorClick(color)}
            disabled={!isPaintMode}
            className={`w-12 h-12 rounded-md
              transition-all ${bg}
              ${selectedColor === color
                ? 'ring-4 ring-blue-400 scale-110'
                : 'ring-2 ring-gray-300'
              }
              ${isPaintMode
                ? 'cursor-pointer hover:scale-105'
                : 'cursor-not-allowed opacity-50'
              }`}
            title={`Select ${color} color`}
          />
        ))}
      </div>

      {/* Status Text */}
      {isPaintMode && (
        <div className={`text-xs font-semibold text-center ${
          isDarkMode
            ? 'text-gray-300'
            : 'text-gray-600'
        }`}>
          {selectedColor && (
            <p>
              {selectedColor.charAt(0).toUpperCase() +
                selectedColor.slice(1)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

