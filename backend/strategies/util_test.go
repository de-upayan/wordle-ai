package strategies

import (
	"sort"
	"testing"

	"github.com/de-upayan/wordle-ai/backend/models"
)

// TestFilterCandidateWords tests FilterCandidateWords with
// comprehensive table-driven test cases covering all constraint
// combinations: green, yellow, gray, and their interactions.
func TestFilterCandidateWords(t *testing.T) {
	tests := []struct {
		name            string
		constraints     models.ConstraintMap
		wordList        []string
		expectedMatches []string
	}{
		// Basic Combined: Green + Yellow + Gray
		{
			name: "Basic Combined",
			constraints: models.ConstraintMap{
				GreenLetters:  map[int]string{0: "S"},
				YellowLetters: map[string][]int{"T": {3}},
				GrayLetters:   map[string]struct{}{"E": {}},
			},
			wordList: []string{"SLATE", "START", "SPORT",
				"STUMP", "STING"},
			expectedMatches: []string{"SPORT", "START", "STING",
				"STUMP"},
		},

		// Min Count Failure: Yellow requires 2 P's
		{
			name: "Min Count Failure",
			constraints: models.ConstraintMap{
				GreenLetters:  make(map[int]string),
				YellowLetters: map[string][]int{"P": {0, 1}},
				GrayLetters:   make(map[string]struct{}),
			},
			wordList: []string{"PUPPY", "HAPPY", "APPLE",
				"CRISP"},
			expectedMatches: []string{"CRISP", "HAPPY"},
		},

		// Max Count (Yellow+Gray): Gray R enforces max 1
		{
			name: "Max Count (Yellow+Gray)",
			constraints: models.ConstraintMap{
				GreenLetters:  map[int]string{4: "Y"},
				YellowLetters: map[string][]int{"R": {0}},
				GrayLetters: map[string]struct{}{
					"R": {},
				},
			},
			wordList: []string{"WORRY", "SORRY", "BERRY",
				"TARRY"},
			expectedMatches: []string{},
		},

		// Max Count (Green+Gray): Gray E enforces max 1
		{
			name: "Max Count (Green+Gray)",
			constraints: models.ConstraintMap{
				GreenLetters:  map[int]string{1: "E"},
				YellowLetters: make(map[string][]int),
				GrayLetters: map[string]struct{}{
					"E": {}, "R": {},
				},
			},
			wordList: []string{"FEWER", "LEVER", "SEVEN",
				"MEALY"},
			expectedMatches: []string{"MEALY"},
		},

		// Min Count: Yellows Only - requires 2 O's
		{
			name: "Min Count: Yellows Only",
			constraints: models.ConstraintMap{
				GreenLetters:  make(map[int]string),
				YellowLetters: map[string][]int{"O": {0, 1}},
				GrayLetters:   make(map[string]struct{}),
			},
			wordList: []string{"OOZES", "LOOPS", "POOCH",
				"MOOSE"},
			expectedMatches: []string{},
		},

		// Green Mismatch: Wrong letter at position
		{
			name: "Green Mismatch",
			constraints: models.ConstraintMap{
				GreenLetters:  map[int]string{1: "A"},
				YellowLetters: make(map[string][]int),
				GrayLetters:   make(map[string]struct{}),
			},
			wordList:        []string{"BADGE", "CABLE", "MAPLE"},
			expectedMatches: []string{"BADGE", "CABLE", "MAPLE"},
		},

		// Yellow Mismatch: Letter at forbidden position
		{
			name: "Yellow Mismatch",
			constraints: models.ConstraintMap{
				GreenLetters:  make(map[int]string),
				YellowLetters: map[string][]int{"A": {0}},
				GrayLetters:   make(map[string]struct{}),
			},
			wordList:        []string{"BEACH", "AWASH", "AWAIT"},
			expectedMatches: []string{"BEACH"},
		},

		// Gray (Max 0) Only: Letters must not appear
		{
			name: "Gray (Max 0) Only",
			constraints: models.ConstraintMap{
				GreenLetters:  make(map[int]string),
				YellowLetters: make(map[string][]int),
				GrayLetters: map[string]struct{}{
					"C": {}, "A": {},
				},
			},
			wordList: []string{"CRANE", "BEACH", "SUPER",
				"PIXEL"},
			expectedMatches: []string{"SUPER", "PIXEL"},
		},

		// Empty Word List: Graceful handling
		{
			name: "Empty Word List",
			constraints: models.ConstraintMap{
				GreenLetters:  make(map[int]string),
				YellowLetters: make(map[string][]int),
				GrayLetters:   make(map[string]struct{}),
			},
			wordList:        []string{},
			expectedMatches: []string{},
		},

		// No Constraints: All words match
		{
			name: "No Constraints",
			constraints: models.ConstraintMap{
				GreenLetters:  make(map[int]string),
				YellowLetters: make(map[string][]int),
				GrayLetters:   make(map[string]struct{}),
			},
			wordList:        []string{"APPLE", "ABOUT", "BEACH"},
			expectedMatches: []string{"APPLE", "ABOUT", "BEACH"},
		},

		// Green and Gray Same Letter: Exact count enforcement
		{
			name: "Green and Gray Same Letter",
			constraints: models.ConstraintMap{
				GreenLetters:  map[int]string{3: "E"},
				YellowLetters: make(map[string][]int),
				GrayLetters:   map[string]struct{}{"E": {}},
			},
			wordList: []string{"SUPER", "WIPER", "CAPER",
				"EMBER", "ENTER", "EATER"},
			expectedMatches: []string{"SUPER", "WIPER", "CAPER"},
		},

		// Yellow and Gray Same Letter: Exact count enforcement
		{
			name: "Yellow and Gray Same Letter",
			constraints: models.ConstraintMap{
				GreenLetters:  make(map[int]string),
				YellowLetters: map[string][]int{"R": {2}},
				GrayLetters:   map[string]struct{}{"R": {}},
			},
			wordList: []string{"SUPER", "WIPER", "CAPER",
				"REFER", "RARER", "ROTOR"},
			expectedMatches: []string{"SUPER", "WIPER", "CAPER"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := FilterCandidateWords(
				tt.constraints,
				tt.wordList,
			)

			// Sort both slices for comparison
			sort.Strings(result)
			sort.Strings(tt.expectedMatches)

			if len(result) != len(tt.expectedMatches) {
				t.Errorf(
					"Expected %d matches, got %d. "+
						"Expected: %v, Got: %v",
					len(tt.expectedMatches),
					len(result),
					tt.expectedMatches,
					result,
				)
				return
			}

			// Compare sorted slices
			for i, word := range result {
				if word != tt.expectedMatches[i] {
					t.Errorf(
						"Mismatch at index %d: "+
							"expected %s, got %s",
						i,
						tt.expectedMatches[i],
						word,
					)
				}
			}
		})
	}
}

// TestGetFeedback tests GetFeedback with table-driven cases
// covering green, yellow, black, and duplicate letter scenarios.
func TestGetFeedback(t *testing.T) {
	tests := []struct {
		name     string
		answer   string
		guess    string
		expected string
	}{
		{"All Green", "SLATE", "SLATE", "GGGGG"},
		{"All Black", "SLATE", "XYZZZ", "BBBBB"},
		{"Mixed", "SLATE", "STEAL", "GYYYY"},
		{"Yellow Letters", "SLATE", "LEAST", "YYGYY"},
		{"Duplicate Green", "ROUND", "ROBOT", "GGBBB"},
		{"Duplicate Yellow", "SPEED", "ERASE", "YBBYY"},
		{"Duplicate Two Guess One", "ERASE", "SPEED", "YBYYB"},
		{"Duplicate Two Guess Two", "GEESE", "EERIE", "YGBBG"},
		{"Duplicate Three Guess One", "SPEED", "EEEEE", "BBGGB"},
		{"Duplicate Three Guess Two", "GEESE", "EEEEE", "BGGBG"},
		{"Green Priority", "SLEET", "LLAMA", "BGBBB"},
		{"Multiple Duplicates", "ABACA", "AABBA", "GYYBG"},
		{"All Same Letter", "ABACA", "AAAAA", "GBGBG"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := GetFeedback(tt.answer, tt.guess)
			if result != tt.expected {
				t.Errorf(
					"GetFeedback(%s, %s) = %s, want %s",
					tt.answer,
					tt.guess,
					result,
					tt.expected,
				)
			}
		})
	}
}
