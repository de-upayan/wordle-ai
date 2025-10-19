package strategies

import (
	"github.com/de-upayan/wordle-ai/backend/models"
)

// FilterCandidateWords filters the word list based on the
// game state history. Returns only words that satisfy all
// feedback constraints from previous guesses.
func FilterCandidateWords(
	gameState models.GameState,
	wordList []models.Word,
) []models.Word {
	var result []models.Word

	for _, word := range wordList {
		if matchesGameState(word, gameState) {
			result = append(result, word)
		}
	}

	return result
}

// matchesGameState checks if a word matches all feedback
// from the game state history.
func matchesGameState(
	word models.Word,
	gameState models.GameState,
) bool {
	// Check that word matches feedback for each guess
	for _, entry := range gameState.History {
		if !matchesFeedback(word, entry) {
			return false
		}
	}
	return true
}

// countLetterInWord counts occurrences of a rune in a Word
func countLetterInWord(word models.Word, letter rune) int {
	count := 0
	for i := 0; i < 5; i++ {
		if word[i] == letter {
			count++
		}
	}
	return count
}

// matchesFeedback checks if a word matches the feedback
// for a single guess-feedback pair. Implements correct logic
// for minimum and maximum letter count constraints.
func matchesFeedback(
	word models.Word,
	entry models.GuessEntry,
) bool {
	guess := entry.Guess
	feedback := entry.Feedback

	// 1. Pre-calculate minimum required counts for this
	// guess (letters that appeared green/yellow)
	minRequiredCounts := make(map[rune]int)
	for i := 0; i < 5; i++ {
		if feedback.Colors[i] == models.GREEN ||
			feedback.Colors[i] == models.YELLOW {
			minRequiredCounts[guess[i]]++
		}
	}

	// 2. Check Green Letters (exact position matches)
	for i := 0; i < 5; i++ {
		if feedback.Colors[i] == models.GREEN {
			if word[i] != guess[i] {
				return false
			}
		}
	}

	// 3. Check Yellow Letters (must not be at forbidden
	// positions)
	for i := 0; i < 5; i++ {
		if feedback.Colors[i] == models.YELLOW {
			if word[i] == guess[i] {
				return false
			}
		}
	}

	// 4. Check minimum required counts
	for letter, minCount := range minRequiredCounts {
		if countLetterInWord(word, letter) < minCount {
			return false
		}
	}

	// 5. Check Gray Letters (enforce maximum count)
	// If letter appeared green/yellow, max count is
	// minRequiredCounts[letter]. If only gray, max is 0.
	for i := 0; i < 5; i++ {
		if feedback.Colors[i] == models.GRAY {
			letter := guess[i]
			if countLetterInWord(word, letter) >
				minRequiredCounts[letter] {
				return false
			}
		}
	}

	return true
}

// GetFeedback calculates Wordle feedback for a guess against
// an answer. Returns a Feedback struct with colors for each
// position:
// - GREEN = correct letter in correct position
// - YELLOW = correct letter in wrong position
// - GRAY = letter not in answer
func GetFeedback(answer, guess models.Word) models.Feedback {
	feedback := models.Feedback{}
	answerLetters := make(map[rune]int)

	// Count available letters in answer
	for _, ch := range answer {
		answerLetters[ch]++
	}

	// First pass: mark greens and remove from available
	for i := 0; i < 5; i++ {
		if answer[i] == guess[i] {
			feedback.Colors[i] = models.GREEN
			answerLetters[rune(answer[i])]--
		}
	}

	// Second pass: mark yellows and grays
	for i := 0; i < 5; i++ {
		if feedback.Colors[i] == models.GREEN {
			continue
		}

		guessLetter := rune(guess[i])
		if answerLetters[guessLetter] > 0 {
			feedback.Colors[i] = models.YELLOW
			answerLetters[guessLetter]--
		} else {
			feedback.Colors[i] = models.GRAY
		}
	}

	return feedback
}
