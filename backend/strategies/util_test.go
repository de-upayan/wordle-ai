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
