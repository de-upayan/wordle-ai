package models

import (
	"encoding/json"
	"testing"
)

func TestWordConversion(t *testing.T) {
	s := "STARE"
	w := StringToWord(s)

	if w.String() != s {
		t.Errorf("Expected %s, got %s", s, w.String())
	}

	if len(w) != 5 {
		t.Errorf("Expected length 5, got %d", len(w))
	}
}

func TestWordConversionPanic(t *testing.T) {
	defer func() {
		if r := recover(); r == nil {
			t.Errorf("Expected panic for invalid word length")
		}
	}()

	StringToWord("STAR") // Only 4 characters
}

func TestFeedbackCreation(t *testing.T) {
	fb := Feedback{
		Colors: [5]LetterColor{
			GREEN, GRAY, YELLOW, GRAY, GRAY,
		},
	}

	if fb.Colors[0] != GREEN {
		t.Errorf("Expected GREEN at position 0")
	}

	if fb.Colors[2] != YELLOW {
		t.Errorf("Expected YELLOW at position 2")
	}
}

func TestGuessEntryMarshaling(t *testing.T) {
	entry := GuessEntry{
		Guess: StringToWord("STARE"),
		Feedback: Feedback{
			Colors: [5]LetterColor{
				GREEN, GRAY, YELLOW, GRAY, GRAY,
			},
		},
	}

	data, err := json.Marshal(entry)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	var unmarshaled GuessEntry
	err = json.Unmarshal(data, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	if unmarshaled.Guess.String() != "STARE" {
		t.Errorf("Expected STARE, got %s",
			unmarshaled.Guess.String())
	}

	if unmarshaled.Feedback.Colors[0] != GREEN {
		t.Errorf("Expected GREEN at position 0")
	}
}

func TestGameStateCreation(t *testing.T) {
	gs := GameState{
		History: []GuessEntry{
			{
				Guess: StringToWord("STARE"),
				Feedback: Feedback{
					Colors: [5]LetterColor{
						GREEN, GRAY, YELLOW, GRAY, GRAY,
					},
				},
			},
		},
	}

	if len(gs.History) != 1 {
		t.Errorf("Expected 1 entry in history, got %d",
			len(gs.History))
	}

	if gs.History[0].Guess.String() != "STARE" {
		t.Errorf("Expected STARE, got %s",
			gs.History[0].Guess.String())
	}
}

func TestSuggestRequestMarshaling(t *testing.T) {
	req := SuggestRequest{
		GameState: GameState{
			History: []GuessEntry{
				{
					Guess: StringToWord("STARE"),
					Feedback: Feedback{
						Colors: [5]LetterColor{
							GREEN, GRAY, YELLOW, GRAY, GRAY,
						},
					},
				},
			},
		},
		MaxDepth: 6,
	}

	data, err := json.Marshal(req)
	if err != nil {
		t.Fatalf("Failed to marshal: %v", err)
	}

	var unmarshaled SuggestRequest
	err = json.Unmarshal(data, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal: %v", err)
	}

	if len(unmarshaled.GameState.History) != 1 {
		t.Errorf("Expected 1 entry in history, got %d",
			len(unmarshaled.GameState.History))
	}

	if unmarshaled.MaxDepth != 6 {
		t.Errorf("Expected MaxDepth 6, got %d",
			unmarshaled.MaxDepth)
	}
}
