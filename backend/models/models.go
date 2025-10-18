package models

import (
	"encoding/json"
)

// GameState represents the canonical state of a Wordle game
// Independent of the sequence of guesses that led to it
type GameState struct {
	// GuessNumber: how many guesses have been made (0-6)
	// Used to track progress and determine game end conditions
	GuessNumber int

	// Constraints: all letter constraints derived from feedback
	// Uniquely identifies which words are still possible
	Constraints ConstraintMap
}

// ConstraintMap represents all letter constraints from feedback
// Derived from the sequence of guesses and their feedback
type ConstraintMap struct {
	// GreenLetters: map[position] -> letter
	// Letters that are in the correct position
	// Example: position 1 must be 'L', position 2 must be 'I'
	// Constraint: word[pos] == letter
	GreenLetters map[int]string

	// YellowLetters: map[letter] -> []forbidden_positions
	// Letters that are in the word but at wrong positions
	// Example: 'A' is in word but NOT at positions [2, 3]
	// Constraint: word contains letter AND word[pos] != letter
	YellowLetters map[string][]int

	// GrayLetters: set of excluded letters (using map[string]struct{})
	// Letters that are NOT in the word at all
	// Example: {'S', 'T', 'E', 'C', 'G'}
	// Constraint: word does not contain any gray letter
	GrayLetters map[string]struct{}
}

// UnmarshalJSON handles custom JSON unmarshaling for ConstraintMap
// Converts grayLetters array to map[string]struct{}
func (cm *ConstraintMap) UnmarshalJSON(data []byte) error {
	type Alias ConstraintMap
	aux := &struct {
		GrayLetters []string `json:"grayLetters"`
		*Alias
	}{
		Alias: (*Alias)(cm),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	// Convert grayLetters array to map
	cm.GrayLetters = make(map[string]struct{})
	for _, letter := range aux.GrayLetters {
		cm.GrayLetters[letter] = struct{}{}
	}

	return nil
}

// SuggestRequest represents the incoming request to the suggest endpoint
type SuggestRequest struct {
	GuessNumber int           `json:"guessNumber"`
	Constraints ConstraintMap `json:"constraints"`
	MaxDepth    int           `json:"maxDepth"`
}

// SuggestionEvent represents a single suggestion event in the SSE stream
type SuggestionEvent struct {
	Word      string  `json:"word"`
	Depth     int     `json:"depth"`
	Score     float64 `json:"score"`
	Remaining int     `json:"remaining"`
}

// DoneEvent represents the final event in the SSE stream
type DoneEvent struct {
	FinalWord string `json:"finalWord"`
	Depth     int    `json:"depth"`
}
