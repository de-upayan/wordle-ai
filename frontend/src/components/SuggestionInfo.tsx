interface SuggestionInfoProps {
  word?: string
  depth?: number
  score?: number
  remainingPossibilities?: number
  isLoading?: boolean
  isTyping?: boolean
  isDarkMode?: boolean
}

export function SuggestionInfo({
  word,
  depth,
  score,
  remainingPossibilities,
  isLoading = false,
  isTyping = false,
  isDarkMode = false,
}: SuggestionInfoProps) {
  if (isTyping || !word) return null

  return (
    <div
      className={`mt-4 p-4 rounded-md border ${
        isDarkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-blue-50 border-blue-200'
      } ${isLoading ? 'animate-pulse' : ''}`}
    >
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <p className={`font-bold text-lg ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Suggestion:</p>
          <span className={`px-3 py-1 rounded-full text-md font-bold ${
            isDarkMode
              ? 'bg-blue-900 text-blue-200'
              : 'bg-blue-100 text-blue-800'
          }`}>
            {word}
          </span>
        </div>

        <div className={`flex gap-4 text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {depth !== undefined && (
            <p>
              <strong>Depth:</strong> {depth}
            </p>
          )}
          {score !== undefined && (
            <p>
              <strong>Score:</strong> {score.toFixed(2)}
            </p>
          )}
          {remainingPossibilities !== undefined && (
            <p>
              <strong>Remaining:</strong>{' '}
              {remainingPossibilities}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

