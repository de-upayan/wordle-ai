/**
 * Shared utility functions for Wordle solving strategies
 * These functions are reusable across different strategy implementations
 */

type LetterColor = 'gray' | 'yellow' | 'green'

export interface Feedback {
  colors: LetterColor[]
}

export interface GuessEntry {
  word: string
  feedback: Feedback
}

export interface GameState {
  history: GuessEntry[]
}

/**
 * Calculate Wordle feedback for a guess against an answer
 * Returns colors for each position:
 * - GREEN = correct letter in correct position
 * - YELLOW = correct letter in wrong position
 * - GRAY = letter not in answer
 */
export function getFeedback(answer: string, guess: string): LetterColor[] {
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
export function countLetterInWord(
  word: string,
  letter: string
): number {
  let count = 0
  for (let i = 0; i < 5; i++) {
    if (word[i] === letter) count++
  }
  return count
}

/**
 * Check if a word matches feedback for a single guess-feedback pair
 */
export function matchesFeedback(word: string, entry: GuessEntry): boolean {
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
export function filterCandidateWords(
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
 * Filter words by prefix
 * @param words - List of words to filter
 * @param prefix - The prefix to match (case-insensitive)
 * @returns Filtered list of words starting with the prefix
 */
export function filterWordsByPrefix(
  words: string[],
  prefix: string
): string[] {
  if (!prefix) {
    return words
  }

  const lowerPrefix = prefix.toLowerCase()
  return words.filter((word) =>
    word.toLowerCase().startsWith(lowerPrefix)
  )
}

