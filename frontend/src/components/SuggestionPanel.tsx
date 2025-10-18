import { Suggestion, SuggestionItem } from '../types/index'

interface SuggestionPanelProps {
  suggestion?: Suggestion
  isLoading?: boolean
  error?: string
  isDarkMode?: boolean
}

function SuggestionRow({
  item,
  isTop,
  isDarkMode,
}: {
  item: SuggestionItem
  isTop: boolean
  isDarkMode: boolean
}) {
  return (
    <div
      className={`p-3 flex gap-3 items-center
        justify-between ${
        isTop
          ? isDarkMode
            ? 'bg-green-900'
            : 'bg-green-100'
          : isDarkMode
            ? 'bg-gray-700'
            : 'bg-white'
      }`}
    >
      <span
        className={`font-bold px-3 py-1 rounded-full
          text-sm ${
          isTop
            ? isDarkMode
              ? 'bg-green-700 text-green-100'
              : 'bg-green-200 text-green-900'
            : isDarkMode
              ? 'bg-blue-700 text-blue-100'
              : 'bg-blue-100 text-blue-800'
        }`}
      >
        {item.word}
      </span>
      <span
        className={`text-sm font-semibold ${
          isTop
            ? isDarkMode
              ? 'text-green-100'
              : 'text-green-900'
            : isDarkMode
              ? 'text-gray-300'
              : 'text-gray-700'
        }`}
      >
        {item.score.toFixed(2)}
      </span>
    </div>
  )
}

export function SuggestionPanel({
  suggestion,
  isLoading = false,
  error,
  isDarkMode = false,
}: SuggestionPanelProps) {
  return (
    <div
      className={`p-4 rounded-lg flex flex-col flex-1 ${
        isDarkMode
          ? 'bg-gray-800'
          : 'bg-gray-50'
      }`}
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
        <div className="flex flex-col flex-1">
          <div className="flex flex-col flex-1
            justify-around">
            {suggestion.suggestions.map(
              (item, idx) => (
                <SuggestionRow
                  key={idx}
                  item={item}
                  isTop={idx === 0}
                  isDarkMode={isDarkMode}
                />
              ),
            )}
          </div>

          {isLoading && (
            <div className="flex gap-2 items-center mt-2">
              <div
                className="animate-spin h-4 w-4 border-2
                  border-blue-500 border-t-transparent
                  rounded-full"
              ></div>
              <p
                className={`text-xs ${
                  isDarkMode
                    ? 'text-gray-400'
                    : 'text-gray-500'
                }`}
              >
                Searching deeper...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

