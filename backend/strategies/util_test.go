package strategies

import (
	"testing"

	"github.com/de-upayan/wordle-ai/backend/models"
)

func TestFilterCandidateWordsGreenLetters(t *testing.T) {
	constraints := models.ConstraintMap{
		GreenLetters:  map[int]string{0: "S", 1: "L"},
		YellowLetters: make(map[string][]int),
		GrayLetters:   make(map[string]struct{}),
	}

	wordList := []string{"SLATE", "SLANT", "SLING", "PLANT",
		"SLEET"}
	result := FilterCandidateWords(constraints, wordList)

	// Should match: SLATE, SLANT, SLING, SLEET
	// Should not match: PLANT (doesn't start with SL)
	if len(result) != 4 {
		t.Errorf("Expected 4 results, got %d", len(result))
	}

	for _, word := range result {
		if len(word) < 2 || word[0] != 'S' || word[1] != 'L' {
			t.Errorf("Word %s doesn't match green "+
				"constraints", word)
		}
	}
}

func TestFilterCandidateWordsYellowLetters(t *testing.T) {
	constraints := models.ConstraintMap{
		GreenLetters: make(map[int]string),
		YellowLetters: map[string][]int{
			"A": {0}, // 'A' in word but not at position 0
		},
		GrayLetters: make(map[string]struct{}),
	}

	wordList := []string{"ABOUT", "APPLE", "ALARM", "BEACH",
		"OCEAN"}
	result := FilterCandidateWords(constraints, wordList)

	// Should match: BEACH (has 'A' at pos 1), OCEAN (has 'A'
	// at pos 3)
	// Should not match: ABOUT, APPLE, ALARM (have 'A' at pos 0)
	if len(result) != 2 {
		t.Errorf("Expected 2 results, got %d", len(result))
	}

	for _, word := range result {
		if word == "ABOUT" || word == "APPLE" ||
			word == "ALARM" {
			t.Errorf("Word %s shouldn't match yellow "+
				"constraints", word)
		}
	}
}

func TestFilterCandidateWordsGrayLetters(t *testing.T) {
	constraints := models.ConstraintMap{
		GreenLetters:  make(map[int]string),
		YellowLetters: make(map[string][]int),
		GrayLetters: map[string]struct{}{
			"S": {}, "T": {}, "E": {},
		},
	}

	wordList := []string{"SLATE", "PLANT", "BEACH", "WORLD"}
	result := FilterCandidateWords(constraints, wordList)

	// Should match: WORLD (no S, T, E)
	// Should not match: SLATE, PLANT, BEACH (contain gray
	// letters)
	if len(result) != 1 {
		t.Errorf("Expected 1 result, got %d", len(result))
	}

	if result[0] != "WORLD" {
		t.Errorf("Expected 'WORLD', got %s", result[0])
	}
}

func TestFilterCandidateWordsCombined(t *testing.T) {
	constraints := models.ConstraintMap{
		GreenLetters: map[int]string{
			0: "L",
			4: "Y",
		},
		YellowLetters: map[string][]int{
			"I": {1},
		},
		GrayLetters: map[string]struct{}{
			"S": {}, "T": {},
		},
	}

	wordList := []string{"LOFIY", "LISTY", "LOWLY", "LIILY"}
	result := FilterCandidateWords(constraints, wordList)

	// Should match: LOFIY (L at 0, Y at 4, I at pos 3 not 1,
	// no S/T)
	// Should not match: LISTY (has T), LOWLY (no I), LIILY (I
	// at pos 1)
	if len(result) != 1 {
		t.Errorf("Expected 1 result, got %d", len(result))
	}

	if result[0] != "LOFIY" {
		t.Errorf("Expected 'LOFIY', got %s", result[0])
	}
}

func TestEmptyWordList(t *testing.T) {
	constraints := models.ConstraintMap{
		GreenLetters:  make(map[int]string),
		YellowLetters: make(map[string][]int),
		GrayLetters:   make(map[string]struct{}),
	}

	result := FilterCandidateWords(constraints, []string{})
	if len(result) != 0 {
		t.Errorf("Expected 0 results for empty list, got %d",
			len(result))
	}
}

func TestGetFeedbackAllGreen(t *testing.T) {
	feedback := GetFeedback("SLATE", "SLATE")
	expected := "GGGGG"
	if feedback != expected {
		t.Errorf("Expected %s, got %s", expected, feedback)
	}
}

func TestGetFeedbackAllBlack(t *testing.T) {
	feedback := GetFeedback("SLATE", "XYZZZ")
	expected := "BBBBB"
	if feedback != expected {
		t.Errorf("Expected %s, got %s", expected, feedback)
	}
}

func TestGetFeedbackMixed(t *testing.T) {
	// SLATE vs STEAL: S=G, T=Y, E=Y, A=G, L=Y
	feedback := GetFeedback("SLATE", "STEAL")
	expected := "GYYYY"
	if feedback != expected {
		t.Errorf("Expected %s, got %s", expected, feedback)
	}
}

func TestGetFeedbackYellowLetters(t *testing.T) {
	// SLATE vs LEAST: L=Y, E=Y, A=G, S=Y, T=Y
	feedback := GetFeedback("SLATE", "LEAST")
	expected := "YYGYY"
	if feedback != expected {
		t.Errorf("Expected %s, got %s", expected, feedback)
	}
}

func TestGetFeedbackDuplicateLetters(t *testing.T) {
	// SLEET vs LLAMA: L=B (already used at pos 0),
	// L=G, E=B, M=B, A=B
	feedback := GetFeedback("SLEET", "LLAMA")
	expected := "BGBBB"
	if feedback != expected {
		t.Errorf("Expected %s, got %s", expected, feedback)
	}
}

func TestGetFeedbackDuplicateLettersYellow(t *testing.T) {
	// SPEED vs ERASE: E=Y, R=B, A=B, S=Y, E=Y
	feedback := GetFeedback("SPEED", "ERASE")
	expected := "YBBYY"
	if feedback != expected {
		t.Errorf("Expected %s, got %s", expected, feedback)
	}
}

func TestNoConstraints(t *testing.T) {
	constraints := models.ConstraintMap{
		GreenLetters:  make(map[int]string),
		YellowLetters: make(map[string][]int),
		GrayLetters:   make(map[string]struct{}),
	}

	wordList := []string{"APPLE", "ABOUT", "BEACH"}
	result := FilterCandidateWords(constraints, wordList)

	// With no constraints, all words should match
	if len(result) != 3 {
		t.Errorf("Expected 3 results with no constraints, "+
			"got %d", len(result))
	}
}

// Edge case tests for duplicate letters

// Test 1: Guess has 2 of a letter, secret has 1 in different
// position → expect 1 yellow, 1 gray
func TestDuplicateLetterTwoGuessOneSecret(t *testing.T) {
	// Answer: ERASE, Guess: SPEED
	// S at pos 0: in ERASE but wrong position → Y
	// P at pos 1: not in ERASE → B
	// E at pos 2: in ERASE but wrong position → Y
	// E at pos 3: in ERASE but already used → Y
	// D at pos 4: not in ERASE → B
	feedback := GetFeedback("ERASE", "SPEED")
	expected := "YBYYB"
	if feedback != expected {
		t.Errorf("Expected %s, got %s", expected, feedback)
	}
}

// Test 2: Guess has 2 of a letter, secret has 1 in same
// position → expect 1 green, 1 gray
func TestDuplicateLetterTwoGuessOneSecretGreen(t *testing.T) {
	// Guess: ROBOT, Answer: ROUND
	// R at pos 0: matches R → G
	// O at pos 1: matches O → G
	// B at pos 2: not in ROUND → B
	// O at pos 3: in ROUND but already used → B
	// T at pos 4: not in ROUND → B
	feedback := GetFeedback("ROUND", "ROBOT")
	expected := "GGBBB"
	if feedback != expected {
		t.Errorf("Expected %s, got %s", expected, feedback)
	}
}

// Test 3: Guess has 2 of a letter, secret has 2 → expect
// appropriate yellow/green combinations
func TestDuplicateLetterTwoGuessTwo(t *testing.T) {
	// Answer: GEESE, Guess: EERIE
	// E at pos 0: in GEESE but wrong position → Y
	// E at pos 1: matches E → G
	// R at pos 2: not in GEESE → B
	// I at pos 3: not in GEESE → B
	// E at pos 4: matches E → G
	feedback := GetFeedback("GEESE", "EERIE")
	expected := "YGBBG"
	if feedback != expected {
		t.Errorf("Expected %s, got %s", expected, feedback)
	}
}

// Test 4: Guess has 3 of a letter, secret has 1 → expect 1
// colored, 2 gray
func TestDuplicateLetterThreeGuessOne(t *testing.T) {
	// Answer: SPEED, Guess: EEEEE
	// E at pos 0: not matching but in SPEED → Y
	// E at pos 1: not matching but in SPEED → Y
	// E at pos 2: matches E → G
	// E at pos 3: matches E → G
	// E at pos 4: in SPEED but already used → B
	feedback := GetFeedback("SPEED", "EEEEE")
	expected := "BBGGB"
	if feedback != expected {
		t.Errorf("Expected %s, got %s", expected, feedback)
	}
}

// Test 5: Guess has 3 of a letter, secret has 2 → expect 2
// colored, 1 gray
func TestDuplicateLetterThreeGuessTwo(t *testing.T) {
	// Answer: GEESE, Guess: EEEEE
	// E at pos 0: not matching but in GEESE → Y
	// E at pos 1: matches E → G
	// E at pos 2: not matching but in GEESE → Y
	// E at pos 3: matches E → G
	// E at pos 4: in GEESE but already used → B
	feedback := GetFeedback("GEESE", "EEEEE")
	expected := "BGGBG"
	if feedback != expected {
		t.Errorf("Expected %s, got %s", expected, feedback)
	}
}

// Test 6: Green priority - one green, one yellow for same
// letter
func TestGreenPriorityOverYellow(t *testing.T) {
	// Answer: SLEET, Guess: LLAMA
	// L at pos 0: not matching but in SLEET → Y
	// L at pos 1: matches L → G
	// A at pos 2: not in SLEET → B
	// M at pos 3: not in SLEET → B
	// A at pos 4: not in SLEET → B
	feedback := GetFeedback("SLEET", "LLAMA")
	expected := "BGBBB"
	if feedback != expected {
		t.Errorf("Expected %s, got %s", expected, feedback)
	}
}

// Test 7: Multiple duplicates in different positions
func TestMultipleDuplicatesInDifferentPositions(t *testing.T) {
	// Guess: AABBA, Answer: ABACA
	// A at pos 0: matches A → G
	// A at pos 1: in ABACA but wrong position → Y
	// B at pos 2: in ABACA but wrong position → Y
	// B at pos 3: in ABACA but already used → B
	// A at pos 4: matches A → G
	feedback := GetFeedback("ABACA", "AABBA")
	expected := "GYYBG"
	if feedback != expected {
		t.Errorf("Expected %s, got %s", expected, feedback)
	}
}

// Test 8: All same letter, all in different positions
func TestAllSameLetterDifferentPositions(t *testing.T) {
	// Answer: ABACA, Guess: AAAAA
	// A at pos 0: matches A → G (A count: 3→2)
	// A at pos 1: not matching, A count is 2 → Y (A count: 2→1)
	// A at pos 2: matches A → G (A count: 1→0)
	// A at pos 3: not matching, A count is 0 → B
	// A at pos 4: matches A → G (A count: 0→-1)
	feedback := GetFeedback("ABACA", "AAAAA")
	expected := "GBGBG"
	if feedback != expected {
		t.Errorf("Expected %s, got %s", expected, feedback)
	}
}
