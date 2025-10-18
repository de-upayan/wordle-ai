import { useEffect, useRef } from 'react'
import { LetterTile, TileColor } from './LetterTile'

interface GameBoardProps {
  guesses: Array<{ word: string; colors: TileColor[] }>
  currentRowIndex: number
  suggestion?: string
  isTyping: boolean
  typedWord: string
  onGuessSubmit: (word: string) => void
  onTypingChange: (isTyping: boolean, word: string) => void
  onTileClick?: (rowIndex: number, tileIndex: number) => void
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
}: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    boardRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key.toUpperCase()

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
            const color = guess?.colors[tileIndex] || 'empty'
            const isSuggestion =
              isCurrentRow &&
              !isTyping &&
              suggestion &&
              tileIndex < suggestion.length

            return (
              <div
                key={tileIndex}
                className={`transition-opacity ${
                  isSuggestion ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <LetterTile
                  letter={
                    isSuggestion
                      ? suggestion[tileIndex]
                      : letter
                  }
                  color={color}
                  isActive={isCurrentRow}
                  onClick={
                    isCurrentRow && guess
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

