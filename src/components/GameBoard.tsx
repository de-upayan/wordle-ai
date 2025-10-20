import { useEffect, useRef } from 'react'
import { LetterTile, TileColor } from './LetterTile'
import { GuessEntry, PuzzleState } from '../types/index'

interface GameBoardProps {
  guesses: GuessEntry[]
  currentRowIndex: number
  suggestion?: string
  isTyping: boolean
  typedWord: string
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
  onTileClick,
  isDarkMode = false,
  puzzleState,
}: GameBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    boardRef.current?.focus()
  }, [])



  const renderRow = (rowIndex: number) => {
    const guess = guesses[rowIndex]
    const isCurrentRow = rowIndex === currentRowIndex
    const displayWord = isCurrentRow && isTyping ? typedWord : guess?.word || ''

    return (
      <div key={rowIndex} className="flex gap-1 sm:gap-1.5
        lg:gap-2">
        {Array(5)
          .fill(null)
          .map((_, tileIndex) => {
            const letter = displayWord[tileIndex] || ''
            const color = (guess?.feedback.colors[tileIndex] ||
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
      className="flex flex-col gap-1 sm:gap-1.5 lg:gap-2
        outline-none"
    >
      {Array(6)
        .fill(null)
        .map((_, i) => renderRow(i))}
    </div>
  )
}

