import { useState, useEffect } from 'react'
import { GameBoard } from './components/GameBoard'
import { ColorPicker } from './components/ColorPicker'
import { SuggestionPanel } from './components/SuggestionPanel'
import { TileColor } from './components/LetterTile'
import { useGameState } from './hooks/useGameState'
import { createLogger } from './utils/logger'

const logger = createLogger('App')

function App() {
  const [isTyping, setIsTyping] = useState(false)
  const [typedWord, setTypedWord] = useState('')
  const [selectedColor, setSelectedColor] = useState<TileColor | null>(
    null,
  )
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { gameState, addGuess, setFeedback } = useGameState()

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  // Log game state changes
  useEffect(() => {
    logger.debug('Game state updated', {
      guessCount: gameState.guessCount,
      currentRowIndex: gameState.currentRowIndex,
      guesses: gameState.guesses.map((g) => ({
        word: g.word,
        feedback: g.feedback,
      })),
    })

    // Log constraints
    if (gameState.guesses.length > 0) {
      logger.info('Constraints updated', {
        greenLetters: gameState.constraints.greenLetters,
        yellowLetters: gameState.constraints.yellowLetters,
        grayLetters: Array.from(
          gameState.constraints.grayLetters
        ),
      })
    }
  }, [gameState])

  const handleGuessSubmit = (word: string) => {
    logger.info('Guess submitted', { word })
    const feedback: TileColor[] = Array(5).fill('empty')
    addGuess(word, feedback)
    setTypedWord('')
    setIsTyping(false)
  }

  const handleTypingChange = (typing: boolean, word: string) => {
    setIsTyping(typing)
    setTypedWord(word.toUpperCase())
  }

  const handleTileClick = (rowIndex: number, tileIndex: number) => {
    logger.debug('Tile clicked', { rowIndex, tileIndex })

    if (!selectedColor) {
      logger.warn('No color selected', {
        selectedColor,
      })
      return
    }

    const guess = gameState.guesses[rowIndex]
    if (!guess) {
      logger.warn('No guess at row', { rowIndex })
      return
    }

    logger.info('Painting tile', {
      rowIndex,
      tileIndex,
      letter: guess.word[tileIndex],
      color: selectedColor,
    })

    const updatedFeedback = [
      ...gameState.guesses[rowIndex].feedback,
    ]
    updatedFeedback[tileIndex] = selectedColor
    setFeedback(rowIndex, updatedFeedback)

    logger.debug('Updated feedback', {
      rowIndex,
      feedback: updatedFeedback,
    })
  }

  const handleColorSelect = (color: TileColor) => {
    setSelectedColor(color)
    logger.info('Color selected', { color })
  }

  const mockSuggestion = {
    word: 'STARE',
    depth: 2,
    score: 8.5,
    remainingPossibilities: 1200,
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode
        ? 'bg-gray-900 text-white'
        : 'bg-white text-gray-900'
    }`}>
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Dark Mode Toggle */}
        <div className="flex justify-end mb-8">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`relative inline-flex h-8 w-14 items-center
              rounded-full transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-blue-600'
                  : 'bg-gray-300'
              }`}
          >
            <span
              className={`inline-block h-6 w-6 transform
                rounded-full bg-white transition-transform
                duration-300 ${
                  isDarkMode ? 'translate-x-7' : 'translate-x-1'
                }`}
            />
          </button>
        </div>

        <div className="flex flex-col gap-8 items-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">
              Wordle AI Solver
            </h1>
          </div>

          <div
            className={`p-6 rounded-lg shadow-md w-fit flex
              justify-center ${
              isDarkMode
                ? 'bg-gray-800'
                : 'bg-white'
            }`}
          >
            <GameBoard
              guesses={gameState.guesses}
              currentRowIndex={gameState.currentRowIndex}
              suggestion={mockSuggestion.word}
              isTyping={isTyping}
              typedWord={typedWord}
              onGuessSubmit={handleGuessSubmit}
              onTypingChange={handleTypingChange}
              onTileClick={handleTileClick}
            />
          </div>

          <ColorPicker
            onColorSelect={handleColorSelect}
            isVisible={
              !isTyping && gameState.currentRowIndex < 6
            }
            isDarkMode={isDarkMode}
          />

          <SuggestionPanel
            suggestion={mockSuggestion}
            isLoading={false}
            isTyping={isTyping}
            isDarkMode={isDarkMode}
          />

          <div className={`p-4 rounded-md w-full text-sm ${
            isDarkMode
              ? 'bg-gray-800 text-gray-300'
              : 'bg-blue-50 text-gray-700'
          }`}>
            <p className="mb-2 font-bold">Test Instructions:</p>
            <p>• Type letters (A-Z) to fill the current row</p>
            <p>• Press ENTER to submit your guess</p>
            <p>• Press BACKSPACE to delete a letter</p>
            <p>• Select a color, then click tiles to paint them</p>
            <p>• Check console for click/submit events</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
