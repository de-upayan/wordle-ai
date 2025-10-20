import { useState, useEffect } from 'react'
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
} from './types/index'
import { getPuzzleState } from './utils/puzzleStateStyles'

const logger = createLogger('App')

// Detect actual mobile device (not just narrow viewport)
const isMobileDevice = () => {
  // Check user agent for mobile OS
  const userAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
  // Check for touch capability
  const touchCapable = ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    ((navigator as unknown as { msMaxTouchPoints: number }).msMaxTouchPoints > 0)
  return userAgent && touchCapable
}

function App() {
  const [isMobile, setIsMobile] = useState(isMobileDevice())
  const [isTyping, setIsTyping] = useState(false)
  const [typedWord, setTypedWord] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [suggestion, setSuggestion] = useState<Suggestion | null>(
    null
  )
  const [useStrictGuesses, setUseStrictGuesses] = useState(true)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] =
    useState(0)
  const [isLoadingSuggestions, setIsLoadingSuggestions] =
    useState(false)

  // Derive puzzle state from suggestion
  const puzzleState = suggestion
    ? getPuzzleState(suggestion.remainingAnswers)
    : null
  const { gameState, addGuess, setFeedback } = useGameState()
  const { answersList, guessesList, isLoaded: wordlistsLoaded } =
    useWordlists()

  // Derive selected suggestion from index
  const selectedSuggestion =
    suggestion?.suggestions[selectedSuggestionIndex]?.word || ''

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  // Global keyboard handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()

      // Shift+Enter: submit selected suggestion
      if (e.shiftKey && key === 'ENTER') {
        e.preventDefault()
        if (selectedSuggestion.length === 5) {
          handleGuessSubmit(selectedSuggestion)
        }
        return
      }

      // Letter keys: add to typed word
      if (/^[A-Z]$/.test(key)) {
        e.preventDefault()
        if (isTyping && typedWord.length < 5) {
          handleTypingChange(true, typedWord + key)
        } else if (!isTyping && typedWord.length < 5) {
          handleTypingChange(true, key)
        }
        return
      }

      // Enter: submit typed word or suggestion
      if (key === 'ENTER') {
        e.preventDefault()
        const wordToSubmit = isTyping ? typedWord :
          selectedSuggestion
        if (wordToSubmit.length === 5) {
          handleGuessSubmit(wordToSubmit)
          handleTypingChange(false, '')
        }
        return
      }

      // Backspace: remove from typed word
      if (key === 'BACKSPACE') {
        e.preventDefault()
        if (isTyping) {
          handleTypingChange(true, typedWord.slice(0, -1))
        }
        return
      }

      // Arrow keys: navigate suggestions
      if (!suggestion || suggestion.suggestions.length === 0) {
        return
      }

      const MAX_SUGGESTIONS = 5
      const maxIndex = Math.min(
        MAX_SUGGESTIONS - 1,
        suggestion.suggestions.length - 1
      )

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : maxIndex
        )
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSuggestionIndex((prev) =>
          prev < maxIndex ? prev + 1 : 0
        )
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [suggestion, selectedSuggestion, isTyping, typedWord])

  // Reset selected index when suggestions change
  useEffect(() => {
    if (suggestion) {
      const MAX_SUGGESTIONS = 5
      const maxIndex = Math.min(
        MAX_SUGGESTIONS - 1,
        suggestion.suggestions.length - 1
      )
      if (selectedSuggestionIndex > maxIndex) {
        setSelectedSuggestionIndex(Math.max(0, maxIndex))
      }
    }
  }, [suggestion?.suggestions.length])

  // Initialize solver service when wordlists are loaded
  // Skip entirely if on mobile device
  useEffect(() => {
    if (isMobile) return

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
  }, [isMobile, wordlistsLoaded, answersList, guessesList])

  // Compute suggestions when game state or typed word changes
  // Skip if on mobile device
  useEffect(() => {
    if (isMobile) return

    if (!wordlistsLoaded) {
      logger.debug('Wordlists not loaded yet, skipping computation')
      return
    }

    logger.info('Computing suggestions', {
      historyLength: gameState.history.length,
      typedWord,
    })

    const computePromise = wordleSolverService
      .computeSuggestions(gameState, useStrictGuesses, 30000, typedWord)

    setIsLoadingSuggestions(true)
    setSuggestion(null)

    computePromise
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
        setIsLoadingSuggestions(false)
      })
      .catch((error: Error) => {
        // Don't log cancellation errors - they're expected
        if (error.message !== 'Request cancelled') {
          logger.error('Solver error', {
            error: error.message,
          })
        }
        setSuggestion(null)
      })
  }, [gameState, wordlistsLoaded, useStrictGuesses, typedWord, isMobile])

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
    remainingAnswers: answersList.length,
  }

  return (
    <div className={`min-h-screen transition-colors duration-300
      flex flex-col items-center justify-center relative ${
      isDarkMode
        ? 'bg-gray-900 text-white'
        : 'bg-white text-gray-900'
    }`}>
      {/* Mobile Device Overlay */}
      {isMobile && (
        <div className="fixed inset-0 z-50 flex items-center
          justify-center bg-black/80 backdrop-blur-sm">
          <div className={`text-center px-6 py-8 rounded-lg
            max-w-sm ${
            isDarkMode
              ? 'bg-gray-800'
              : 'bg-white'
          }`}>
            <p className={`text-lg mb-6 ${
              isDarkMode
                ? 'text-gray-300'
                : 'text-gray-600'
            }`}>
              Please view this website on a desktop for the best experience.
            </p>
            <p className={`text-sm ${
              isDarkMode
                ? 'text-gray-400'
                : 'text-gray-500'
            }`}>
              It requires keyboard input.
            </p>
          </div>
        </div>
      )}

      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6
        lg:top-8 lg:right-8">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`relative inline-flex h-8 w-16 sm:h-9
            sm:w-18 lg:h-10 lg:w-20 items-center
            rounded-full transition-colors duration-300 ${
              isDarkMode
                ? 'bg-gray-700'
                : 'bg-gray-300'
            }`}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span
            className={`absolute inline-flex h-7 w-7 sm:h-7.5
              sm:w-7.5 lg:h-8 lg:w-8 items-center
              justify-center transform rounded-full bg-white
              transition-all duration-300 text-lg sm:text-xl
              lg:text-2xl text-black ${
                isDarkMode
                  ? 'translate-x-9 sm:translate-x-10 lg:translate-x-11'
                  : 'translate-x-0.5 sm:translate-x-1 lg:translate-x-1'
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

      <div className="flex flex-col lg:flex-row gap-4
        sm:gap-6 lg:gap-8 items-center lg:items-start
        px-4 sm:px-6 lg:px-0 w-full lg:w-auto">
        {/* Game Board */}
        <GameBoard
          guesses={gameState.history}
          currentRowIndex={gameState.history.length}
          suggestion={selectedSuggestion}
          isTyping={isTyping}
          typedWord={typedWord}
          onTileClick={handleTileClick}
          isDarkMode={isDarkMode}
          puzzleState={puzzleState || undefined}
        />

        {/* Suggestion Panel */}
        <SuggestionPanel
          suggestion={
            suggestion || defaultSuggestion
          }
          isDarkMode={isDarkMode}
          useStrictGuesses={useStrictGuesses}
          onUseStrictGuessesChange={setUseStrictGuesses}
          selectedSuggestionIndex={selectedSuggestionIndex}
          isLoading={isLoadingSuggestions}
        />
      </div>

      {/* Instruction Panel */}
      <InstructionPanel
        isDarkMode={isDarkMode}
        suggestion={suggestion}
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
