import { useState, useEffect, useRef } from 'react'
import { GameBoard } from './components/GameBoard'
import { SuggestionPanel } from './components/SuggestionPanel'
import { InstructionPanel } from './components/InstructionPanel'
import { TileColor } from './components/LetterTile'
import { useGameState } from './hooks/useGameState'
import { createLogger } from './utils/logger'
import { wordleAIClient } from './services/api'
import {
  SuggestionsEvent,
  Suggestion,
  PuzzleState,
} from './types/index'

const logger = createLogger('App')

function App() {
  const [isTyping, setIsTyping] = useState(false)
  const [typedWord, setTypedWord] = useState('')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [maxDepth, setMaxDepth] = useState(10)
  const [currentDepth, setCurrentDepth] = useState(0)
  const [boardHeight, setBoardHeight] = useState(0)
  const [suggestion, setSuggestion] = useState<Suggestion | null>(
    null
  )
  const [isLoadingSuggestions, setIsLoadingSuggestions] =
    useState(false)
  const [suggestionError, setSuggestionError] = useState<
    string | null
  >(null)
  const [puzzleState, setPuzzleState] = useState<
    PuzzleState | null
  >(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const streamIdRef = useRef<string | null>(null)
  const activeStreamIdRef = useRef<string | null>(null)
  const { gameState, addGuess, setFeedback } = useGameState()

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

  // Create a stable key for constraints to avoid
  // unnecessary stream restarts
  const constraintsKey = JSON.stringify({
    green: gameState.constraints.greenLetters,
    yellow: gameState.constraints.yellowLetters,
    gray: Array.from(
      gameState.constraints.grayLetters
    ).sort(),
  })

  // Fetch suggestions when game state changes
  useEffect(() => {
    setIsLoadingSuggestions(true)
    setSuggestionError(null)

    logger.info('Fetching suggestions', {
      guessCount: gameState.guessCount,
      maxDepth,
    })

    // Start new stream
    wordleAIClient
      .streamSuggestions(
        gameState.guessCount,
        gameState.constraints,
        maxDepth,
        (event: SuggestionsEvent) => {
          // Ignore callbacks from old streams
          if (event.streamId !== activeStreamIdRef.current) {
            logger.debug('Ignoring event from old stream', {
              eventStreamId: event.streamId,
              activeStreamId: activeStreamIdRef.current,
            })
            return
          }

          logger.debug('Received suggestions', {
            depth: event.depth,
            count: event.suggestions.length,
          })
          setCurrentDepth(event.depth)
          setSuggestion({
            suggestions: event.suggestions,
            topSuggestion: event.topSuggestion,
            remainingAnswers: event.remainingAnswers,
          })
        },
        (error: Error) => {
          logger.error('Suggestion stream error', {
            error: error.message,
          })
          setSuggestionError(error.message)
          setIsLoadingSuggestions(false)
        },
        () => {
          logger.info('Suggestion stream completed')
          setIsLoadingSuggestions(false)
        }
      )
      .then((streamId) => {
        logger.info('Stream started successfully', {
          streamId,
        })
        streamIdRef.current = streamId
        activeStreamIdRef.current = streamId
      })
      .catch((err) => {
        logger.error('Failed to start stream', {
          error: String(err),
        })
        setIsLoadingSuggestions(false)
      })

    return () => {
      // Cleanup: close stream if component unmounts
      // or dependencies change
      if (streamIdRef.current) {
        logger.info('Closing stream on cleanup', {
          streamId: streamIdRef.current,
        })
        wordleAIClient.closeStream(streamIdRef.current)
          .catch((err: Error) => {
            logger.warn('Failed to close stream on cleanup', {
              error: String(err),
            })
          })
      }
    }
  }, [gameState.guessCount, constraintsKey, maxDepth])

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

    const guess = gameState.guesses[rowIndex]
    if (!guess) {
      logger.warn('No guess at row', { rowIndex })
      return
    }

    const currentColor = guess.feedback[tileIndex]
    const newColor = cycleColor(currentColor)

    logger.info('Cycling tile color', {
      rowIndex,
      tileIndex,
      letter: guess.word[tileIndex],
      from: currentColor,
      to: newColor,
    })

    const updatedFeedback = [
      ...gameState.guesses[rowIndex].feedback,
    ]
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
            guesses={gameState.guesses}
            currentRowIndex={gameState.currentRowIndex}
            suggestion={
              suggestion?.topSuggestion?.word || ''
            }
            isTyping={isTyping}
            typedWord={typedWord}
            onGuessSubmit={handleGuessSubmit}
            onTypingChange={handleTypingChange}
            onTileClick={handleTileClick}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Suggestion Panel */}
        <SuggestionPanel
          suggestion={
            suggestion || defaultSuggestion
          }
          isLoading={isLoadingSuggestions}
          isDarkMode={isDarkMode}
          maxDepth={maxDepth}
          currentDepth={currentDepth}
          onMaxDepthChange={setMaxDepth}
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
