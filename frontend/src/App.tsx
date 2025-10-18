import { useState, useEffect } from 'react'
import { GameBoard } from './components/GameBoard'
import { ColorPicker } from './components/ColorPicker'
import { SuggestionPanel } from './components/SuggestionPanel'
import { TileColor } from './components/LetterTile'

interface Guess {
  word: string
  colors: TileColor[]
}

function App() {
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [typedWord, setTypedWord] = useState('')
  const [currentRowIndex, setCurrentRowIndex] = useState(0)
  const [selectedColor, setSelectedColor] = useState<string | null>(
    null,
  )
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const handleGuessSubmit = (word: string) => {
    console.log('Guess submitted:', word)
    const newGuess = {
      word: word.toUpperCase(),
      colors: Array(5).fill('empty'),
    }
    setGuesses([...guesses, newGuess])
    setCurrentRowIndex(currentRowIndex + 1)
    setTypedWord('')
    setIsTyping(false)
  }

  const handleTypingChange = (typing: boolean, word: string) => {
    setIsTyping(typing)
    setTypedWord(word.toUpperCase())
  }

  const handleTileClick = (rowIndex: number, tileIndex: number) => {
    console.log(`Tile clicked: row ${rowIndex}, tile ${tileIndex}`)
    if (selectedColor && guesses[rowIndex]) {
      const updatedGuesses = [...guesses]
      updatedGuesses[rowIndex].colors[tileIndex] =
        selectedColor as TileColor
      setGuesses(updatedGuesses)
    }
  }

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    console.log('Color selected:', color)
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
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Test UI - Phase 1 Components
            </p>
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
              guesses={guesses}
              currentRowIndex={currentRowIndex}
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
            isVisible={!isTyping && currentRowIndex < 6}
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
