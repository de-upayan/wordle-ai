import { useEffect, useRef } from 'react'
import { LetterTile, TileColor } from './LetterTile'
import { Guess, PuzzleState } from '../types/index'

interface GameBoardProps {
  guesses: Guess[]
  currentRowIndex: number
  suggestion?: string
  isTyping: boolean
  typedWord: string
  onGuessSubmit: (word: string) => void
  onTypingChange: (isTyping: boolean, word: string) => void
  onTileClick?: (rowIndex: number, tileIndex: number) => void
  isDarkMode?: boolean
  puzzleState?: PuzzleState
}

export function GameBoard({
  guesses,
  currentRowIndex,
  suggestion = '',
  isTyping,
  typedWord,
  onGuessSubmit,
  onTypingChange,
  onTileClick,
  isDarkMode = false,
  puzzleState,
}: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    boardRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key.toUpperCase()

    // Accept top suggestion with Shift+Enter
    if (e.shiftKey && key === 'ENTER') {
      e.preventDefault()
      if (suggestion.length === 5) {
        onGuessSubmit(suggestion)
        onTypingChange(false, '')
      }
      return
    }

    if (/^[A-Z]$/.test(key)) {
      e.preventDefault()
      if (typedWord.length < 5) {
        onTypingChange(true, typedWord + key)
      }
    } else if (key === 'ENTER') {
      e.preventDefault()
      const wordToSubmit = isTyping ? typedWord : suggestion
      if (wordToSubmit.length === 5) {
        onGuessSubmit(wordToSubmit)
        onTypingChange(false, '')
      }
    } else if (key === 'BACKSPACE') {
      e.preventDefault()
      if (isTyping) {
        onTypingChange(true, typedWord.slice(0, -1))
      }
    }
  }

  const renderRow = (rowIndex: number) => {
    const guess = guesses[rowIndex]
    const isCurrentRow = rowIndex === currentRowIndex
    const displayWord = isCurrentRow && isTyping ? typedWord : guess?.word || ''

    return (
      <div key={rowIndex} className="flex gap-2">
        {Array(5)
          .fill(null)
          .map((_, tileIndex) => {
            const letter = displayWord[tileIndex] || ''
            const color = (guess?.feedback[tileIndex] ||
              'empty') as TileColor

            // Show suggestion when on current row, not typing,
            // and suggestion exists
            const isSuggestion =
              !!(isCurrentRow &&
              !isTyping &&
              suggestion &&
              tileIndex < suggestion.length)

            // Show suggestion as overlay when typing and
            // user hasn't typed at this position yet
            const showSuggestionOverlay =
              !!(isCurrentRow &&
              isTyping &&
              !letter &&
              suggestion &&
              tileIndex < suggestion.length)

            return (
              <div key={tileIndex}>
                <LetterTile
                  letter={
                    isSuggestion || showSuggestionOverlay
                      ? suggestion[tileIndex]
                      : letter
                  }
                  color={color}
                  isSuggestion={
                    isSuggestion || showSuggestionOverlay
                  }
                  isActive={isCurrentRow}
                  isDarkMode={isDarkMode}
                  puzzleState={puzzleState}
                  onColorCycle={
                    guess
                      ? () =>
                          onTileClick?.(
                            rowIndex,
                            tileIndex
                          )
                      : undefined
                  }
                />
              </div>
            )
          })}
      </div>
    )
  }

  return (
    <div
      ref={boardRef}
      className="flex flex-col gap-2 outline-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {Array(6)
        .fill(null)
        .map((_, i) => renderRow(i))}
    </div>
  )
}

