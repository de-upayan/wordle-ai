import { useState, useEffect } from 'react'
import { Suggestion, SuggestionItem, PuzzleState } from '../types/index'
import {
  getPuzzleState,
  getPuzzleStateTextStyle,
} from '../utils/puzzleStateStyles'

// Maximum number of suggestions to display
const MAX_SUGGESTIONS = 5

interface SuggestionPanelProps {
  suggestion?: Suggestion
  isLoading?: boolean
  error?: string
  isDarkMode?: boolean
  boardHeight?: number
  onPuzzleStateChange?: (state: PuzzleState | null) => void
}

function SuggestionRow({
  item,
  isTop,
  isDarkMode,
  isBlank = false,
  puzzleState,
}: {
  item?: SuggestionItem
  isTop: boolean
  isDarkMode: boolean
  isBlank?: boolean
  puzzleState?: PuzzleState
}) {
  if (isBlank) {
    return (
      <div
        className="py-3 flex items-center justify-between
          gap-3 bg-transparent"
      />
    )
  }

  // Display infinity if puzzle is solved
  const isSolved = puzzleState === PuzzleState.SOLVED

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
        {isSolved ? '∞' : item!.score.toFixed(2)}
      </span>
    </div>
  )
}

export function SuggestionPanel({
  suggestion,
  isLoading = false,
  error,
  isDarkMode = false,
  boardHeight = 0,
  onPuzzleStateChange,
}: SuggestionPanelProps) {

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
                    puzzleState={puzzleState || undefined}
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

