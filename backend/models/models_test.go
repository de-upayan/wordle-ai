package models

import (
	"encoding/json"
	"testing"
)

func TestGameStateCreation(t *testing.T) {
	gs := GameState{
		GuessNumber: 2,
		Constraints: ConstraintMap{
			GreenLetters:  make(map[int]string),
			YellowLetters: make(map[string][]int),
			GrayLetters:   make(map[string]struct{}),
		},
	}

	if gs.GuessNumber != 2 {
		t.Errorf("Expected GuessNumber 2, got %d", gs.GuessNumber)
	}
}

func TestConstraintMapCreation(t *testing.T) {
	cm := ConstraintMap{
		GreenLetters: map[int]string{
			1: "L",
			2: "I",
		},
		YellowLetters: map[string][]int{
			"A": {2},
			"N": {3},
		},
		GrayLetters: map[string]struct{}{
			"S": {},
			"T": {},
			"E": {},
		},
	}

	if len(cm.GreenLetters) != 2 {
		t.Errorf("Expected 2 green letters, got %d", len(cm.GreenLetters))
	}

	if len(cm.YellowLetters) != 2 {
		t.Errorf("Expected 2 yellow letters, got %d", len(cm.YellowLetters))
	}

	if len(cm.GrayLetters) != 3 {
		t.Errorf("Expected 3 gray letters, got %d", len(cm.GrayLetters))
	}

	if cm.GreenLetters[1] != "L" {
		t.Errorf("Expected green letter at position 1 to be L")
	}
}

func TestSuggestRequestMarshaling(t *testing.T) {
	req := SuggestRequest{
		GuessNumber: 2,
		Constraints: ConstraintMap{
			GreenLetters: map[int]string{
				1: "L",
				2: "I",
			},
			YellowLetters: map[string][]int{
				"A": {2},
			},
			GrayLetters: map[string]struct{}{
				"S": {},
			},
		},
		MaxDepth: 6,
	}

	data, err := json.Marshal(req)
	if err != nil {
		t.Fatalf("Failed to marshal request: %v", err)
	}

	var unmarshaled SuggestRequest
	err = json.Unmarshal(data, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal request: %v", err)
	}

	if unmarshaled.GuessNumber != 2 {
		t.Errorf("Expected GuessNumber 2, got %d", unmarshaled.GuessNumber)
	}

	if unmarshaled.MaxDepth != 6 {
		t.Errorf("Expected MaxDepth 6, got %d", unmarshaled.MaxDepth)
	}
}
