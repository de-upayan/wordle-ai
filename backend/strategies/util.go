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
