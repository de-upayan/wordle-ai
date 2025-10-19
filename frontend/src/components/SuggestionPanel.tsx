import { useState, useEffect } from 'react'
import { Suggestion, SuggestionItem, PuzzleState } from '../types/index'
import {
  getPuzzleState,
  getPuzzleStateTextStyle,
} from '../utils/puzzleStateStyles'

// JavaScript's Number.MAX_VALUE is approximately 1.7976931348623157e+308
// Go's math.MaxFloat64 is 1.7976931348623157e+308
const MAX_FLOAT64 = 1.7976931348623157e308

// Maximum number of suggestions to display
const MAX_SUGGESTIONS = 4

interface SuggestionPanelProps {
  suggestion?: Suggestion
  isLoading?: boolean
  error?: string
  isDarkMode?: boolean
  maxDepth?: number
  currentDepth?: number
  onMaxDepthChange?: (depth: number) => void
  boardHeight?: number
  onPuzzleStateChange?: (state: PuzzleState | null) => void
}

function SuggestionRow({
  item,
  isTop,
  isDarkMode,
  isBlank = false,
}: {
  item?: SuggestionItem
  isTop: boolean
  isDarkMode: boolean
  isBlank?: boolean
}) {
  if (isBlank) {
    return (
      <div
        className="py-3 flex items-center justify-between
          gap-3 bg-transparent"
      />
    )
  }

  return (
    <div
      className="py-3 flex items-center justify-between gap-3
        bg-transparent"
    >
      {/* Word with letter squares */}
      <div className="flex gap-1">
        {item!.word.split('').map((letter, idx) => (
          <div
            key={idx}
            className={`w-8 h-8 flex items-center
              justify-center border-2 font-bold text-2xl ${
              isTop
                ? isDarkMode
                  ? 'bg-green-800 border-green-700 text-green-100'
                  : 'bg-green-100 border-green-400 text-gray-900'
                : isDarkMode
                  ? 'bg-gray-600 border-gray-500 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            {letter}
          </div>
        ))}
      </div>

      {/* Score */}
      <span
        className={`text-lg font-semibold whitespace-nowrap ${
          isTop
            ? isDarkMode
              ? 'text-green-100'
              : 'text-green-900'
            : isDarkMode
              ? 'text-gray-300'
              : 'text-gray-700'
        }`}
      >
        {item!.score >= MAX_FLOAT64 ? '∞' :
          item!.score.toFixed(2)}
      </span>
    </div>
  )
}

export function SuggestionPanel({
  suggestion,
  isLoading = false,
  error,
  isDarkMode = false,
  maxDepth = 10,
  currentDepth = 0,
  onMaxDepthChange,
  boardHeight = 0,
  onPuzzleStateChange,
}: SuggestionPanelProps) {
  const [localMaxDepth, setLocalMaxDepth] = useState(
    maxDepth
  )

  const handleDepthChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newDepth = parseInt(e.target.value, 10)
    setLocalMaxDepth(newDepth)
    onMaxDepthChange?.(newDepth)
  }

  const depthPercentage = maxDepth > 0
    ? (currentDepth / maxDepth) * 100
    : 0

  const puzzleState = suggestion
    ? getPuzzleState(suggestion.remainingAnswers)
    : null

  useEffect(() => {
    onPuzzleStateChange?.(puzzleState)
  }, [puzzleState, onPuzzleStateChange])

  return (
    <div
      className={`p-4 flex flex-col
        w-64 ${
        isDarkMode
          ? 'bg-gray-800'
          : 'bg-gray-50'
      }`}
      style={{
        height: boardHeight > 0 ? `${boardHeight}px` : 'auto',
      }}
    >
      {/* Max Depth Slider */}
      <div className="mb-2">
        <div className="flex justify-between items-center
          mb-1">
          <label
            className={`text-xs font-semibold ${
              isDarkMode
                ? 'text-gray-300'
                : 'text-gray-700'
            }`}
          >
            Max Depth
          </label>
          <span
            className={`text-xs font-bold ${
              isDarkMode
                ? 'text-blue-400'
                : 'text-blue-600'
            }`}
          >
            {localMaxDepth}
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="20"
          value={localMaxDepth}
          onChange={handleDepthChange}
          className="w-full h-2 rounded-lg appearance-none
            cursor-pointer"
          style={{
            background: `linear-gradient(to right,
              #3b82f6 0%,
              #3b82f6 ${(localMaxDepth / 20) * 100}%,
              ${isDarkMode ? '#374151' : '#d1d5db'}
              ${(localMaxDepth / 20) * 100}%,
              ${isDarkMode ? '#374151' : '#d1d5db'} 100%)`,
          }}
        />
      </div>

      {/* Current Depth Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center
          mb-1">
          <label
            className={`text-xs font-semibold ${
              isDarkMode
                ? 'text-gray-300'
                : 'text-gray-700'
            }`}
          >
            Current Depth
          </label>
          <span
            className={`text-xs font-bold ${
              isDarkMode
                ? 'text-green-400'
                : 'text-green-600'
            }`}
          >
            {currentDepth} / {maxDepth}
          </span>
        </div>
        <div
          className={`w-full h-2 rounded-full overflow-hidden
            mt-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
        >
          <div
            className="h-full bg-gradient-to-r
              from-green-400 to-green-600 transition-all
              duration-300"
            style={{ width: `${depthPercentage}%` }}
          ></div>
        </div>
      </div>

      {error && (
        <div
          className="p-3 bg-red-50 rounded-md border
            border-red-200 mb-4"
        >
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {isLoading && !suggestion && (
        <div className="flex flex-col gap-3 items-center
          justify-center flex-1">
          <div
            className="animate-spin h-6 w-6 border-2
              border-blue-500 border-t-transparent
              rounded-full"
          ></div>
          <p
            className={`text-sm ${
              isDarkMode
                ? 'text-gray-400'
                : 'text-gray-600'
            }`}
          >
            Fetching suggestions...
          </p>
        </div>
      )}

      {suggestion && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Remaining Answers Count */}
          <div className={`mb-3 pb-3 border-b ${
            isDarkMode ? 'border-gray-700' :
              'border-gray-200'
          }`}>
            <div className="flex justify-between
              items-center">
              <p className={`text-xs font-semibold ${
                isDarkMode
                  ? 'text-gray-400'
                  : 'text-gray-600'
              }`}>
                Remaining Answers
              </p>
              <p className={`text-lg font-bold ${
                puzzleState
                  ? getPuzzleStateTextStyle(
                      puzzleState,
                      isDarkMode
                    )
                  : ''
              }`}>
                {suggestion.remainingAnswers}
              </p>
            </div>
          </div>

          {/* Suggestions List */}
          <div className="flex flex-col flex-1
            justify-around overflow-y-auto">
            {Array.from({ length: MAX_SUGGESTIONS }).map(
              (_, idx) => {
                const item = suggestion.suggestions[idx]
                return (
                  <SuggestionRow
                    key={idx}
                    item={item}
                    isTop={idx === 0}
                    isDarkMode={isDarkMode}
                    isBlank={!item}
                  />
                )
              },
            )}
          </div>
        </div>
      )}
    </div>
  )
}

