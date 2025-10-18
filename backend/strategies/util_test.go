package strategies

import (
	"testing"

	"github.com/de-upayan/wordle-ai/backend/models"
)

func TestFilterCandidateWordsGreenLetters(t *testing.T) {
	constraints := models.ConstraintMap{
		GreenLetters:  map[int]string{0: "s", 1: "l"},
		YellowLetters: make(map[string][]int),
		GrayLetters:   make(map[string]struct{}),
	}

	wordList := []string{"slate", "slant", "sling", "plant",
		"sleet"}
	result := FilterCandidateWords(constraints, wordList)

	// Should match: slate, slant, sling, sleet
	// Should not match: plant (doesn't start with sl)
	if len(result) != 4 {
		t.Errorf("Expected 4 results, got %d", len(result))
	}

	for _, word := range result {
		if len(word) < 2 || word[0] != 's' || word[1] != 'l' {
			t.Errorf("Word %s doesn't match green "+
				"constraints", word)
		}
	}
}

func TestFilterCandidateWordsYellowLetters(t *testing.T) {
	constraints := models.ConstraintMap{
		GreenLetters: make(map[int]string),
		YellowLetters: map[string][]int{
			"a": {0}, // 'a' in word but not at position 0
		},
		GrayLetters: make(map[string]struct{}),
	}

	wordList := []string{"about", "apple", "alarm", "beach",
		"ocean"}
	result := FilterCandidateWords(constraints, wordList)

	// Should match: beach (has 'a' at pos 1), ocean (has 'a'
	// at pos 3)
	// Should not match: about, apple, alarm (have 'a' at pos 0)
	if len(result) != 2 {
		t.Errorf("Expected 2 results, got %d", len(result))
	}

	for _, word := range result {
		if word == "about" || word == "apple" ||
			word == "alarm" {
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
			"s": {}, "t": {}, "e": {},
		},
	}

	wordList := []string{"slate", "plant", "beach", "world"}
	result := FilterCandidateWords(constraints, wordList)

	// Should match: world (no s, t, e)
	// Should not match: slate, plant, beach (contain gray
	// letters)
	if len(result) != 1 {
		t.Errorf("Expected 1 result, got %d", len(result))
	}

	if result[0] != "world" {
		t.Errorf("Expected 'world', got %s", result[0])
	}
}

func TestFilterCandidateWordsCombined(t *testing.T) {
	constraints := models.ConstraintMap{
		GreenLetters: map[int]string{
			0: "l",
			4: "y",
		},
		YellowLetters: map[string][]int{
			"i": {1},
		},
		GrayLetters: map[string]struct{}{
			"s": {}, "t": {},
		},
	}

	wordList := []string{"lofiy", "listy", "lowly", "liily"}
	result := FilterCandidateWords(constraints, wordList)

	// Should match: lofiy (l at 0, y at 4, i at pos 3 not 1,
	// no s/t)
	// Should not match: listy (has t), lowly (no i), liily (i
	// at pos 1)
	if len(result) != 1 {
		t.Errorf("Expected 1 result, got %d", len(result))
	}

	if result[0] != "lofiy" {
		t.Errorf("Expected 'lofiy', got %s", result[0])
	}
}

func TestGenerateCacheKey(t *testing.T) {
	constraints1 := models.ConstraintMap{
		GreenLetters:  map[int]string{0: "a"},
		YellowLetters: make(map[string][]int),
		GrayLetters:   make(map[string]struct{}),
	}

	constraints2 := models.ConstraintMap{
		GreenLetters:  map[int]string{0: "b"},
		YellowLetters: make(map[string][]int),
		GrayLetters:   make(map[string]struct{}),
	}

	wordList := []string{"apple", "about"}

	key1 := GenerateCacheKey(constraints1, wordList)
	key2 := GenerateCacheKey(constraints1, wordList)
	key3 := GenerateCacheKey(constraints2, wordList)

	// Same constraints should produce same key
	if key1 != key2 {
		t.Errorf("Same constraints produced different keys")
	}

	// Different constraints should produce different keys
	if key1 == key3 {
		t.Errorf("Different constraints produced same key")
	}
}

func TestCachedFilterCandidateWords(t *testing.T) {
	cached, err := NewCachedFilterCandidateWords(100)
	if err != nil {
		t.Fatalf("Failed to create cached filter: %v", err)
	}

	constraints := models.ConstraintMap{
		GreenLetters:  map[int]string{0: "s"},
		YellowLetters: make(map[string][]int),
		GrayLetters:   make(map[string]struct{}),
	}

	wordList := []string{"slate", "slant", "plant", "stone"}

	// First call should compute
	result1 := cached.Filter(constraints, wordList)
	if len(result1) != 3 {
		t.Errorf("Expected 3 results, got %d", len(result1))
	}

	// Second call should use cache
	result2 := cached.Filter(constraints, wordList)
	if len(result2) != 3 {
		t.Errorf("Expected 3 results from cache, got %d",
			len(result2))
	}

	// Results should be equal
	for i, word := range result1 {
		if word != result2[i] {
			t.Errorf("Cached result differs at index %d",
				i)
		}
	}

	// Cache should have 1 entry
	stats := cached.CacheStats()
	if stats["size"] != 1 {
		t.Errorf("Expected cache size 1, got %d",
			stats["size"])
	}
}

func TestCachedFilterClearCache(t *testing.T) {
	cached, err := NewCachedFilterCandidateWords(100)
	if err != nil {
		t.Fatalf("Failed to create cached filter: %v", err)
	}

	constraints := models.ConstraintMap{
		GreenLetters:  map[int]string{0: "a"},
		YellowLetters: make(map[string][]int),
		GrayLetters:   make(map[string]struct{}),
	}

	wordList := []string{"apple", "about"}

	// Add to cache
	cached.Filter(constraints, wordList)
	stats := cached.CacheStats()
	if stats["size"] != 1 {
		t.Errorf("Expected cache size 1, got %d",
			stats["size"])
	}

	// Clear cache
	cached.ClearCache()
	stats = cached.CacheStats()
	if stats["size"] != 0 {
		t.Errorf("Expected cache size 0 after clear, got %d",
			stats["size"])
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

func TestNoConstraints(t *testing.T) {
	constraints := models.ConstraintMap{
		GreenLetters:  make(map[int]string),
		YellowLetters: make(map[string][]int),
		GrayLetters:   make(map[string]struct{}),
	}

	wordList := []string{"apple", "about", "beach"}
	result := FilterCandidateWords(constraints, wordList)

	// With no constraints, all words should match
	if len(result) != 3 {
		t.Errorf("Expected 3 results with no constraints, "+
			"got %d", len(result))
	}
}
