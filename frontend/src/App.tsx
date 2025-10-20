import { useState, useEffect, useRef } from 'react'
import { GameBoard } from './components/GameBoard'
import { SuggestionPanel } from './components/SuggestionPanel'
import { InstructionPanel } from './components/InstructionPanel'
import { TileColor } from './components/LetterTile'
import { useGameState } from './hooks/useGameState'
import { useWordlists } from './hooks/useWordlists'
import { createLogger } from './utils/logger'
import { wordleSolverService } from './services/wordleSolverService'
import {
  Suggestion,
  PuzzleState,
} from './types/index'

const logger = createLogger('App')

function App() {
  const [isTyping, setIsTyping] = useState(false)
  const [typedWord, setTypedWord] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [boardHeight, setBoardHeight] = useState(0)
  const [suggestion, setSuggestion] = useState<Suggestion | null>(
    null
  )
  const [isComputing, setIsComputing] = useState(false)
  const [puzzleState, setPuzzleState] = useState<
    PuzzleState | null
  >(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const { gameState, addGuess, setFeedback } = useGameState()
  const { answersList, guessesList, isLoaded: wordlistsLoaded } =
    useWordlists()

  useEffect(() => {
    if (boardRef.current) {
      setBoardHeight(boardRef.current.offsetHeight)
    }
  }, [])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  // Initialize solver service when wordlists are loaded
  useEffect(() => {
    if (wordlistsLoaded && answersList.length > 0 && guessesList.length > 0) {
      logger.info('Initializing solver service', {
        answersCount: answersList.length,
        guessesCount: guessesList.length,
      })
      wordleSolverService.initialize(answersList, guessesList)
        .catch((err) => {
          logger.error('Failed to initialize solver service', {
            error: String(err),
          })
        })
    }
  }, [wordlistsLoaded, answersList, guessesList])

  // Compute suggestions when game state changes
  useEffect(() => {
    if (!wordlistsLoaded) {
      logger.debug('Wordlists not loaded yet, skipping computation')
      return
    }

    setIsComputing(true)

    logger.info('Computing suggestions', {
      historyLength: gameState.history.length,
    })

    wordleSolverService
      .computeSuggestions(gameState)
      .then((result) => {
        logger.debug('Suggestions computed', {
          count: result.suggestions.length,
          remainingAnswers: result.remainingAnswers,
        })
        setSuggestion({
          suggestions: result.suggestions,
          topSuggestion: result.suggestions[0] || null,
          remainingAnswers: result.remainingAnswers,
        })
      })
      .catch((error: Error) => {
        logger.error('Solver error', {
          error: error.message,
        })
        setSuggestion(null)
      })
      .finally(() => {
        setIsComputing(false)
      })
  }, [gameState, wordlistsLoaded])

  // Log game state changes
  useEffect(() => {
    logger.debug('Game state updated', {
      historyLength: gameState.history.length,
      history: gameState.history.map((entry) => ({
        word: entry.word,
        feedback: entry.feedback.colors,
      })),
    })
  }, [gameState])

  const handleGuessSubmit = (word: string) => {
    logger.info('Guess submitted', { word })
    const feedback: TileColor[] = Array(5).fill('gray')
    addGuess(word, feedback)
    setTypedWord('')
    setIsTyping(false)
  }

  const handleTypingChange = (typing: boolean, word: string) => {
    setIsTyping(typing)
    setTypedWord(word.toUpperCase())
  }

  const cycleColor = (
    currentColor: TileColor
  ): TileColor => {
    const cycle: Record<TileColor, TileColor> = {
      gray: 'yellow',
      yellow: 'green',
      green: 'gray',
      empty: 'gray',
    }
    return cycle[currentColor]
  }

  const handleTileClick = (rowIndex: number, tileIndex: number) => {
    logger.debug('Tile clicked', { rowIndex, tileIndex })

    const entry = gameState.history[rowIndex]
    if (!entry) {
      logger.warn('No entry at row', { rowIndex })
      return
    }

    const currentColor = entry.feedback.colors[tileIndex]
    const newColor = cycleColor(currentColor)

    logger.info('Cycling tile color', {
      rowIndex,
      tileIndex,
      letter: entry.word[tileIndex],
      from: currentColor,
      to: newColor,
    })

    const updatedFeedback = [
      ...gameState.history[rowIndex].feedback.colors,
    ] as TileColor[]
    updatedFeedback[tileIndex] = newColor
    setFeedback(rowIndex, updatedFeedback)

    logger.debug('Updated feedback', {
      rowIndex,
      feedback: updatedFeedback,
    })
  }

  // Default suggestion when no data is available
  const defaultSuggestion: Suggestion = {
    suggestions: [],
    topSuggestion: null,
    remainingAnswers: 0,
  }

  return (
    <div className={`min-h-screen transition-colors duration-300
      flex flex-col items-center justify-center ${
      isDarkMode
        ? 'bg-gray-900 text-white'
        : 'bg-white text-gray-900'
    }`}>
      {/* Dark Mode Toggle */}
      <div className="absolute top-8 right-8">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`relative inline-flex h-10 w-20 items-center
            rounded-full transition-colors duration-300 ${
              isDarkMode
                ? 'bg-gray-700'
                : 'bg-gray-300'
            }`}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span
            className={`absolute inline-flex h-8 w-8 items-center
              justify-center transform rounded-full bg-white
              transition-all duration-300 text-2xl text-black ${
                isDarkMode ? 'translate-x-11' : 'translate-x-1'
              }`}
          >
            <span
              className={`transition-opacity duration-300 ${
                isDarkMode ? 'opacity-0' : 'opacity-100'
              }`}
            >
              ☀︎
            </span>
            <span
              className={`absolute transition-opacity duration-300 ${
                isDarkMode ? 'opacity-100' : 'opacity-0'
              }`}
            >
              ⏾
            </span>
          </span>
        </button>
      </div>

      <div className="flex gap-8 items-center">
        {/* Game Board */}
        <div ref={boardRef}>
          <GameBoard
            guesses={gameState.history}
            currentRowIndex={gameState.history.length}
            suggestion={
              suggestion?.topSuggestion?.word || ''
            }
            isTyping={isTyping}
            typedWord={typedWord}
            onGuessSubmit={handleGuessSubmit}
            onTypingChange={handleTypingChange}
            onTileClick={handleTileClick}
            isDarkMode={isDarkMode}
            puzzleState={puzzleState || undefined}
          />
        </div>

        {/* Suggestion Panel */}
        <SuggestionPanel
          suggestion={
            suggestion || defaultSuggestion
          }
          isLoading={isComputing}
          isDarkMode={isDarkMode}
          boardHeight={boardHeight}
          onPuzzleStateChange={setPuzzleState}
        />
      </div>

      {/* Instruction Panel */}
      <InstructionPanel
        isDarkMode={isDarkMode}
        puzzleState={puzzleState}
      />

      {/* Footer */}
      <div
        className={`absolute bottom-4 text-xs ${
          isDarkMode ? 'text-gray-500' : 'text-gray-400'
        }`}
      >
        © 2025 de-upayan (Upayan De)
      </div>
    </div>
  )
}

export default App
