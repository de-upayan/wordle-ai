interface Suggestion {
  word: string
  depth: number
  score: number
  remainingPossibilities: number
}

interface SuggestionPanelProps {
  suggestion?: Suggestion
  isLoading?: boolean
  error?: string
  isTyping?: boolean
  isDarkMode?: boolean
}

export function SuggestionPanel({
  suggestion,
  isLoading = false,
  error,
  isTyping = false,
  isDarkMode = false,
}: SuggestionPanelProps) {
  if (isTyping && !isLoading) return null

  return (
    <div className={`mt-6 p-4 rounded-lg border shadow-sm ${
      isDarkMode
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200'
    }`}>
      {error && (
        <div className="p-3 bg-red-50 rounded-md border border-red-200 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {isLoading && !suggestion && (
        <div className="flex flex-col gap-3 items-center">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-600 text-sm">
            Fetching suggestion...
          </p>
        </div>
      )}

      {suggestion && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 items-center">
            <p className="font-bold">AI Suggestion:</p>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-md font-bold">
              {suggestion.word}
            </span>
          </div>

          <div className="flex gap-4 text-sm text-gray-600">
            <p>
              <strong>Depth:</strong> {suggestion.depth}
            </p>
            <p>
              <strong>Score:</strong>{' '}
              {suggestion.score.toFixed(2)}
            </p>
            <p>
              <strong>Remaining:</strong>{' '}
              {suggestion.remainingPossibilities}
            </p>
          </div>

          {isLoading && (
            <div className="flex gap-2 items-center mt-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <p className="text-xs text-gray-500">
                Searching deeper...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

