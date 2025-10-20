/**
 * Web Worker for Wordle AI solving algorithm
 * Runs in background thread to prevent UI blocking
 * Communicates with main thread via postMessage
 */

type LetterColor = 'gray' | 'yellow' | 'green'

interface Feedback {
  colors: LetterColor[]
}

interface GuessEntry {
  word: string
  feedback: Feedback
}

interface GameState {
  history: GuessEntry[]
}

interface SuggestionItem {
  word: string
  score: number
}

interface WorkerState {
  answersList: string[]
  guessesList: string[]
  initialized: boolean
}

const state: WorkerState = {
  answersList: [],
  guessesList: [],
  initialized: false,
}

/**
 * Calculate Wordle feedback for a guess against an answer
 * Returns colors for each position:
 * - GREEN = correct letter in correct position
 * - YELLOW = correct letter in wrong position
 * - GRAY = letter not in answer
 */
function getFeedback(answer: string, guess: string): LetterColor[] {
  const feedback: LetterColor[] = ['gray', 'gray', 'gray', 'gray', 'gray']
  const answerLetters = new Map<string, number>()

  // Count available letters in answer
  for (const ch of answer) {
    answerLetters.set(ch, (answerLetters.get(ch) || 0) + 1)
  }

  // First pass: mark greens and remove from available
  for (let i = 0; i < 5; i++) {
    if (answer[i] === guess[i]) {
      feedback[i] = 'green'
      answerLetters.set(answer[i], answerLetters.get(answer[i])! - 1)
    }
  }

  // Second pass: mark yellows and grays
  for (let i = 0; i < 5; i++) {
    if (feedback[i] === 'green') continue

    const guessLetter = guess[i]
    const available = answerLetters.get(guessLetter) || 0

    if (available > 0) {
      feedback[i] = 'yellow'
      answerLetters.set(guessLetter, available - 1)
    } else {
      feedback[i] = 'gray'
    }
  }

  return feedback
}

/**
 * Count occurrences of a letter in a word
 */
function countLetterInWord(word: string, letter: string): number {
  let count = 0
  for (let i = 0; i < 5; i++) {
    if (word[i] === letter) count++
  }
  return count
}

/**
 * Check if a word matches feedback for a single guess-feedback pair
 */
function matchesFeedback(word: string, entry: GuessEntry): boolean {
  const guess = entry.word
  const feedback = entry.feedback.colors

  // Pre-calculate minimum required counts
  const minRequiredCounts = new Map<string, number>()
  for (let i = 0; i < 5; i++) {
    if (feedback[i] === 'green' || feedback[i] === 'yellow') {
      minRequiredCounts.set(
        guess[i],
        (minRequiredCounts.get(guess[i]) || 0) + 1
      )
    }
  }

  // Check Green Letters (exact position matches)
  for (let i = 0; i < 5; i++) {
    if (feedback[i] === 'green' && word[i] !== guess[i]) {
      return false
    }
  }

  // Check Yellow Letters (must not be at forbidden positions)
  for (let i = 0; i < 5; i++) {
    if (feedback[i] === 'yellow' && word[i] === guess[i]) {
      return false
    }
  }

  // Check minimum required counts
  for (const [letter, minCount] of minRequiredCounts) {
    if (countLetterInWord(word, letter) < minCount) {
      return false
    }
  }

  // Check Gray Letters (enforce maximum count)
  for (let i = 0; i < 5; i++) {
    if (feedback[i] === 'gray') {
      const letter = guess[i]
      const maxCount = minRequiredCounts.get(letter) || 0
      if (countLetterInWord(word, letter) > maxCount) {
        return false
      }
    }
  }

  return true
}

/**
 * Filter candidate words based on game state
 * Returns only words that satisfy all feedback constraints
 */
function filterCandidateWords(
  gameState: GameState,
  wordList: string[]
): string[] {
  return wordList.filter((word) => {
    for (const entry of gameState.history) {
      if (!matchesFeedback(word, entry)) {
        return false
      }
    }
    return true
  })
}

/**
 * Calculate Shannon entropy for a set of equiprobable outcomes
 */
function calculateEntropy(count: number): number {
  if (count <= 1) return 0
  const probability = 1.0 / count
  return -count * probability * Math.log2(probability)
}

/**
 * Calculate information gain (entropy reduction) for a guess
 */
function calculateInformationGain(
  guess: string,
  possibleAnswers: string[]
): number {
  if (possibleAnswers.length === 0) return 0

  // Current entropy before the guess
  const currentEntropy = calculateEntropy(possibleAnswers.length)

  // Partition answers by feedback pattern
  const feedbackPartitions = new Map<string, number>()
  for (const answer of possibleAnswers) {
    const feedback = getFeedback(answer, guess)
    const feedbackKey = feedback.join('')
    feedbackPartitions.set(
      feedbackKey,
      (feedbackPartitions.get(feedbackKey) || 0) + 1
    )
  }

  // Calculate expected entropy after the guess
  let expectedEntropy = 0.0
  const totalAnswers = possibleAnswers.length
  for (const count of feedbackPartitions.values()) {
    if (count > 0) {
      const probability = count / totalAnswers
      expectedEntropy += probability * calculateEntropy(count)
    }
  }

  // Information gain = reduction in entropy
  return currentEntropy - expectedEntropy
}

/**
 * Main solve function - computes top 5 suggestions
 */
function solve(gameState: GameState): {
  suggestions: SuggestionItem[]
  remainingAnswers: number
} {
  // Filter possible answers based on game state
  const possibleAnswers = filterCandidateWords(gameState, state.answersList)

  // If no possible answers, return empty
  if (possibleAnswers.length === 0) {
    return {
      suggestions: [],
      remainingAnswers: 0,
    }
  }

  // Special case: only one possible answer left
  if (possibleAnswers.length === 1) {
    return {
      suggestions: [
        {
          word: possibleAnswers[0],
          score: Number.MAX_VALUE,
        },
      ],
      remainingAnswers: 1,
    }
  }

  // Calculate information gain for each guess
  const guessScores: Array<{ word: string; score: number }> = []
  for (const guess of state.guessesList) {
    const gain = calculateInformationGain(guess, possibleAnswers)
    guessScores.push({ word: guess, score: gain })
  }

  // Sort by information gain (descending)
  guessScores.sort((a, b) => b.score - a.score)

  // Return top 5 suggestions
  const suggestions = guessScores.slice(0, 5)

  return {
    suggestions,
    remainingAnswers: possibleAnswers.length,
  }
}

/**
 * Handle messages from main thread
 */
self.onmessage = (event: MessageEvent) => {
  try {
    const { type, answersList, guessesList, gameState } = event.data

    if (type === 'INIT') {
      state.answersList = answersList
      state.guessesList = guessesList
      state.initialized = true

      self.postMessage({
        type: 'INIT_COMPLETE',
      })
    } else if (type === 'SOLVE') {
      if (!state.initialized) {
        throw new Error('Worker not initialized')
      }

      const result = solve(gameState)

      self.postMessage({
        type: 'SOLVE_COMPLETE',
        suggestions: result.suggestions,
        remainingAnswers: result.remainingAnswers,
      })
    } else {
      throw new Error(`Unknown message type: ${type}`)
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error)
    self.postMessage({
      type: 'ERROR',
      error: errorMessage,
    })
  }
}

