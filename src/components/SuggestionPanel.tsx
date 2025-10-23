import { useEffect } from 'react'
import { Suggestion, SuggestionItem, PuzzleState } from '../types/index'
import {
  getPuzzleState,
  getPuzzleStateTextStyle,
} from '../utils/puzzleStateStyles'
import { MAX_SUGGESTIONS } from '../constants'

interface SuggestionPanelProps {
  suggestion?: Suggestion
  isDarkMode?: boolean
  onPuzzleStateChange?: (state: PuzzleState | null) => void
  useStrictGuesses?: boolean
  onUseStrictGuessesChange?: (value: boolean) => void
  selectedSuggestionIndex?: number
  isLoading?: boolean
}

function SuggestionRow({
  item,
  isSelected,
  isDarkMode,
  isBlank = false,
  puzzleState,
}: {
  item?: SuggestionItem
  isSelected: boolean
  isDarkMode: boolean
  isBlank?: boolean
  puzzleState?: PuzzleState
}) {
  if (isBlank) {
    return (
      <div
        className="py-2 sm:py-2.5 lg:py-3 flex items-center
          justify-between gap-2 sm:gap-2.5 lg:gap-3
          bg-transparent"
      />
    )
  }

  // Display infinity if puzzle is solved
  const isSolved = puzzleState === PuzzleState.SOLVED

  return (
    <div
      className="py-2 sm:py-2.5 lg:py-3 flex items-center
        justify-between gap-2 sm:gap-2.5 lg:gap-3
        bg-transparent"
    >
      {/* Word with letter squares */}
      <div className="flex gap-0.5 sm:gap-0.5 lg:gap-1">
        {item!.word.split('').map((letter, idx) => (
          <div
            key={idx}
            className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8
              lg:h-8 flex items-center justify-center
              border-2 font-bold text-base sm:text-lg
              lg:text-3xl ${
              isSelected
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
        className={`text-xs sm:text-sm lg:text-lg
          font-semibold whitespace-nowrap ${
          isSelected
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
  isDarkMode = false,
  onPuzzleStateChange,
  useStrictGuesses = true,
  onUseStrictGuessesChange,
  selectedSuggestionIndex = 0,
  isLoading = false,
}: SuggestionPanelProps) {

  const puzzleState = suggestion
    ? getPuzzleState(suggestion.remainingAnswers)
    : null

  useEffect(() => {
    onPuzzleStateChange?.(puzzleState)
  }, [puzzleState, onPuzzleStateChange])

  return (
    <div
      className={`p-3 sm:p-4 lg:p-4 flex flex-col
        w-54 sm:w-66 lg:w-64 h-auto sm:h-auto lg:h-106
        max-h-48 sm:max-h-64 lg:max-h-none ${
        isDarkMode
          ? 'bg-gray-800'
          : 'bg-gray-50'
      }`}
    >

      {/* Strict Guesses Toggle */}
      <div className="mb-3 sm:mb-4 lg:mb-4 flex items-center
        justify-between">
        <span className={`text-xs font-semibold ${
          isDarkMode
            ? 'text-gray-400'
            : 'text-gray-600'
        }`}>
          Strict Guesses
        </span>
        <button
          onClick={() =>
            onUseStrictGuessesChange?.(
              !useStrictGuesses
            )
          }
          className={`relative inline-flex h-5 w-8
            items-center rounded-full
            transition-colors duration-300 ${
            useStrictGuesses
              ? isDarkMode
                ? 'bg-blue-700'
                : 'bg-blue-400'
              : isDarkMode
              ? 'bg-gray-600'
              : 'bg-gray-300'
          }`}
          title={useStrictGuesses
            ? 'Disable strict guesses'
            : 'Enable strict guesses'}
        >
          <span
            className={`absolute inline-flex h-4 w-4
              items-center justify-center transform
              rounded-full bg-white transition-all
              duration-300 ${
              useStrictGuesses
                ? 'translate-x-3.5'
                : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-1 items-center
            justify-center">
            <div className="flex flex-col items-center
              gap-2">
              <div className={`w-4 h-4 border-2
                border-t-2 rounded-full animate-spin ${
                isDarkMode
                  ? 'border-gray-600 border-t-gray-400'
                  : 'border-gray-300 border-t-gray-600'
              }`} />
              <p className={`text-xs ${
                isDarkMode
                  ? 'text-gray-500'
                  : 'text-gray-400'
              }`}>
                Calculating suggestions
              </p>
            </div>
          </div>
        </div>
      ) : suggestion && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Remaining Answers Count */}
          <div className={`mb-2 sm:mb-3 lg:mb-3 pb-2
            sm:pb-3 lg:pb-3 border-b ${
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
              <p className={`text-sm sm:text-base
                lg:text-lg font-bold ${
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

          {/* Suggestions List or No Valid Guesses */}
          {suggestion.suggestions.length === 0 ? (
            <div className="flex flex-1 items-center
              justify-center">
              <p className={`text-center text-xs sm:text-xs
                lg:text-xs ${
                isDarkMode
                  ? 'text-gray-500'
                  : 'text-gray-400'
              }`}>
                No valid guesses.
              </p>
            </div>
          ) : (
            <div className="flex flex-col flex-1
              justify-around overflow-y-auto">
              {Array.from({ length: MAX_SUGGESTIONS }).map(
                (_, idx) => {
                  const item = suggestion.suggestions[idx]
                  return (
                    <SuggestionRow
                      key={idx}
                      item={item}
                      isSelected={idx === selectedSuggestionIndex}
                      isDarkMode={isDarkMode}
                      isBlank={!item}
                      puzzleState={puzzleState || undefined}
                    />
                  )
                },
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

