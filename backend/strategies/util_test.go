package strategies

import (
	"testing"

	"github.com/de-upayan/wordle-ai/backend/models"
)

// stringToFeedback converts a string like "GYYYB" to Feedback.
// G=green, Y=yellow, B=gray
func stringToFeedback(s string) models.Feedback {
	feedback := models.Feedback{}
	for i, ch := range s {
		switch ch {
		case 'G':
			feedback.Colors[i] = models.GREEN
		case 'Y':
			feedback.Colors[i] = models.YELLOW
		case 'B':
			feedback.Colors[i] = models.GRAY
		}
	}
	return feedback
}

// TestMatchesFeedback tests the feedback matching logic with
// table-driven test cases covering green, yellow, gray, and
// letter count constraints.
func TestMatchesFeedback(t *testing.T) {
	tests := []struct {
		name     string
		word     string
		guess    string
		feedback string
		matches  bool
	}{
		{"All green match", "SLATE", "SLATE", "GGGGG", true},
		{"Green mismatch", "SLATE", "SLEET", "GGGBB", false},
		{"Yellow at forbidden position", "SLATE", "STEAL",
			"GYYBB", false},
		{"Gray letter appears in word", "SLATE", "XYZZZ",
			"BBBBB", true},
		{"Gray letter should not appear", "SLATE", "SLEET",
			"GGBBB", false},
		{"Min count: E appears twice", "GEESE", "EEEEE",
			"BGGBG", true},
		{"Min count: insufficient E", "SLATE", "EEEEE",
			"BGGBB", false},
		{"Max count: R appears once", "SUPER", "REFER",
			"BBBGG", true},
		{"Max count: too many E", "REFER", "ERASE",
			"BYYYY", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			word := models.StringToWord(tt.word)
			guess := models.StringToWord(tt.guess)
			entry := models.GuessEntry{
				Guess:    guess,
				Feedback: stringToFeedback(tt.feedback),
			}
			result := matchesFeedback(word, entry)
			if result != tt.matches {
				t.Errorf(
					"matchesFeedback(%s, %s, %s) = %v, "+
						"want %v",
					tt.word, tt.guess, tt.feedback,
					result, tt.matches,
				)
			}
		})
	}
}

// TestGetFeedback tests feedback calculation with edge cases.
func TestGetFeedback(t *testing.T) {
	tests := []struct {
		name     string
		answer   string
		guess    string
		expected string
	}{
		{"All green", "SLATE", "SLATE", "GGGGG"},
		{"All gray", "SLATE", "XYZZZ", "BBBBB"},
		{"Duplicate letters", "GEESE", "EEEEE", "BGGBG"},
		{"Mixed feedback", "SLATE", "STEAL", "GYYYY"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			answer := models.StringToWord(tt.answer)
			guess := models.StringToWord(tt.guess)
			result := GetFeedback(answer, guess)
			expected := stringToFeedback(tt.expected)
			for i := 0; i < 5; i++ {
				if result.Colors[i] != expected.Colors[i] {
					t.Errorf(
						"GetFeedback(%s, %s)[%d] = %v, "+
							"want %v",
						tt.answer, tt.guess, i,
						result.Colors[i],
						expected.Colors[i],
					)
				}
			}
		})
	}
}
