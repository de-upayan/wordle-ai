package strategies

import (
	"github.com/de-upayan/wordle-ai/backend/models"
)

// FilterCandidateWords filters the word list based on the
// constraint map. Returns only words that satisfy all constraints:
//   - Green letters must be at exact positions
//   - Yellow letters must be in word but not at forbidden
//     positions
//   - Gray letters must not appear in word (unless they're
//     already green or yellow)
func FilterCandidateWords(
	constraints models.ConstraintMap,
	wordList []string,
) []string {
	var result []string

	for _, word := range wordList {
		if matchesConstraints(word, constraints) {
			result = append(result, word)
		}
	}

	return result
}

// matchesConstraints checks if a word satisfies all constraints
// using minimum and maximum letter count logic
func matchesConstraints(
	word string,
	constraints models.ConstraintMap,
) bool {
	// Step 1: Calculate minimum required counts for each letter
	// based on Green and Yellow constraints
	minRequiredCounts := make(map[string]int)

	// Add counts from Green letters
	for _, letter := range constraints.GreenLetters {
		minRequiredCounts[letter]++
	}

	// Add counts from Yellow letters
	for letter := range constraints.YellowLetters {
		minRequiredCounts[letter]++
	}

	// Step 2: Check Green Letters (exact position matches)
	for pos, letter := range constraints.GreenLetters {
		if pos >= len(word) || string(word[pos]) != letter {
			return false
		}
	}

	// Step 3: Check Yellow Letters (must be present and not
	// at forbidden positions)
	for letter, forbiddenPositions := range constraints.YellowLetters {
		// Check not at forbidden positions
		for _, pos := range forbiddenPositions {
			if pos < len(word) &&
				string(word[pos]) == letter {
				return false
			}
		}

		// Check minimum required count
		requiredCount := minRequiredCounts[letter]
		actualCount := countLetter(word, letter)
		if actualCount < requiredCount {
			return false
		}
	}

	// Step 4: Check Gray Letters (enforce maximum count)
	// Gray tiles indicate either:
	// A) Letter doesn't exist in word (if not in green/yellow)
	// B) Letter exists exactly N times (if in green/yellow)
	for grayLetter := range constraints.GrayLetters {
		requiredCount, isConfirmed := minRequiredCounts[grayLetter]

		if !isConfirmed {
			// Letter is ONLY gray (never appeared green/yellow)
			// It must not appear in word at all
			if countLetter(word, grayLetter) > 0 {
				return false
			}
		} else {
			// Letter appeared as gray AND green/yellow
			// It must appear exactly requiredCount times
			actualCount := countLetter(word, grayLetter)
			if actualCount > requiredCount {
				return false
			}
		}
	}

	return true
}

// countLetter counts occurrences of a letter in a word
func countLetter(word, letter string) int {
	count := 0
	for _, ch := range word {
		if string(ch) == letter {
			count++
		}
	}
	return count
}

// GetFeedback calculates Wordle feedback for a guess against
// an answer. Returns a feedback string where:
// - 'G' = Green (correct letter in correct position)
// - 'Y' = Yellow (correct letter in wrong position)
// - 'B' = Black (letter not in answer)
// Both answer and guess should be uppercase 5-letter words.
func GetFeedback(answer, guess string) string {
	if len(answer) != 5 || len(guess) != 5 {
		return ""
	}

	feedback := make([]byte, 5)
	answerLetters := make(map[rune]int)

	// Count available letters in answer
	for _, ch := range answer {
		answerLetters[ch]++
	}

	// First pass: mark greens and remove from available
	for i := 0; i < 5; i++ {
		if guess[i] == answer[i] {
			feedback[i] = 'G'
			answerLetters[rune(guess[i])]--
		}
	}

	// Second pass: mark yellows and grays
	for i := 0; i < 5; i++ {
		if feedback[i] == 'G' {
			continue
		}

		guessLetter := rune(guess[i])
		if answerLetters[guessLetter] > 0 {
			feedback[i] = 'Y'
			answerLetters[guessLetter]--
		} else {
			feedback[i] = 'B'
		}
	}

	return string(feedback)
}
