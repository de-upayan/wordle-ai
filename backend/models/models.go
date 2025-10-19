package models

import (
	"encoding/json"
	"fmt"
	"strings"
)

// LetterColor represents the feedback color for a single letter
type LetterColor int

const (
	GRAY LetterColor = iota
	YELLOW
	GREEN
)

// Word is a fixed-length array of exactly 5 runes
// Enforces compile-time length validation for Wordle words
type Word [5]rune

// StringToWord converts a string to a Word type
// Panics if the string is not exactly 5 characters
func StringToWord(s string) Word {
	runes := []rune(strings.ToUpper(s))
	if len(runes) != 5 {
		panic(fmt.Sprintf(
			"Word must be exactly 5 characters, got %d",
			len(runes),
		))
	}
	var w Word
	copy(w[:], runes)
	return w
}

// String converts a Word to a string
func (w Word) String() string {
	return string(w[:])
}

// Feedback represents feedback for a single 5-letter guess
// Contains exactly 5 letter colors, one for each position
type Feedback struct {
	Colors [5]LetterColor `json:"colors"`
}

// GuessEntry represents a single guess with its feedback
type GuessEntry struct {
	Guess    Word     `json:"guess"`
	Feedback Feedback `json:"feedback"`
}

// MarshalJSON implements custom JSON marshaling for GuessEntry
func (ge GuessEntry) MarshalJSON() ([]byte, error) {
	type Alias GuessEntry
	return json.Marshal(&struct {
		Word string `json:"word"`
		*Alias
	}{
		Word:  ge.Guess.String(),
		Alias: (*Alias)(&ge),
	})
}

// UnmarshalJSON implements custom JSON unmarshaling for GuessEntry
func (ge *GuessEntry) UnmarshalJSON(data []byte) error {
	type Alias GuessEntry
	aux := &struct {
		Word string `json:"word"`
		*Alias
	}{
		Alias: (*Alias)(ge),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	ge.Guess = StringToWord(aux.Word)
	return nil
}

// GameState represents the canonical state of a Wordle game
// Fully reconstructable from the history of guesses and feedback
type GameState struct {
	// History: array of guess-feedback pairs
	// Uniquely identifies the game state
	History []GuessEntry `json:"history"`
}

// SuggestRequest represents the incoming request to the suggest endpoint
type SuggestRequest struct {
	GameState GameState `json:"gameState"`
	MaxDepth  int       `json:"maxDepth"`
}

// CloseRequest represents a request to close an ongoing
// suggestion stream
type CloseRequest struct {
	StreamID string `json:"streamId"`
}

// SuggestionItem represents a single suggestion with score
type SuggestionItem struct {
	Word  string  `json:"word"`
	Score float64 `json:"score"`
}

// SuggestionsEvent represents an event with top 5
// suggestions at current depth in the SSE stream
type SuggestionsEvent struct {
	StreamID         string           `json:"streamId"`
	Suggestions      []SuggestionItem `json:"suggestions"`
	TopSuggestion    *SuggestionItem  `json:"topSuggestion"`
	Depth            int              `json:"depth"`
	RemainingAnswers int              `json:"remainingAnswers"`
}
