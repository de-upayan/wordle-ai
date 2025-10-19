package strategies

import (
	"github.com/de-upayan/wordle-ai/backend/models"
)

// FilterCandidateWords filters the word list based on the
// constraint map. Returns only words that satisfy all constraints:
// - Green letters must be at exact positions
// - Yellow letters must be in word but not at forbidden positions
// - Gray letters must not appear in word
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
func matchesConstraints(
	word string,
	constraints models.ConstraintMap,
) bool {
	// Check green letters (exact position matches)
	for pos, letter := range constraints.GreenLetters {
		if pos >= len(word) || string(word[pos]) != letter {
			return false
		}
	}

	// Check yellow letters (must be in word but not at
	// forbidden positions)
	for letter, forbiddenPositions := range constraints.YellowLetters {
		// Letter must exist in word
		if !contains(word, letter) {
			return false
		}

		// Letter must not be at forbidden positions
		for _, pos := range forbiddenPositions {
			if pos < len(word) &&
				string(word[pos]) == letter {
				return false
			}
		}
	}

	// Check gray letters (must not be in word)
	for grayLetter := range constraints.GrayLetters {
		if contains(word, grayLetter) {
			return false
		}
	}

	return true
}

// contains checks if a word contains a letter
func contains(word, letter string) bool {
	for _, ch := range word {
		if string(ch) == letter {
			return true
		}
	}
	return false
}
