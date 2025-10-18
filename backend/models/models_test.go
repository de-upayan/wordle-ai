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

func TestSuggestionEventMarshaling(t *testing.T) {
	event := SuggestionEvent{
		Word:      "BLIND",
		Depth:     1,
		Score:     0.85,
		Remaining: 42,
	}

	data, err := json.Marshal(event)
	if err != nil {
		t.Fatalf("Failed to marshal event: %v", err)
	}

	var unmarshaled SuggestionEvent
	err = json.Unmarshal(data, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal event: %v", err)
	}

	if unmarshaled.Word != "BLIND" {
		t.Errorf("Expected word BLIND, got %s", unmarshaled.Word)
	}

	if unmarshaled.Score != 0.85 {
		t.Errorf("Expected score 0.85, got %f", unmarshaled.Score)
	}
}

func TestDoneEventMarshaling(t *testing.T) {
	event := DoneEvent{
		FinalWord: "POUND",
		Depth:     3,
	}

	data, err := json.Marshal(event)
	if err != nil {
		t.Fatalf("Failed to marshal done event: %v", err)
	}

	var unmarshaled DoneEvent
	err = json.Unmarshal(data, &unmarshaled)
	if err != nil {
		t.Fatalf("Failed to unmarshal done event: %v", err)
	}

	if unmarshaled.FinalWord != "POUND" {
		t.Errorf("Expected final word POUND, got %s", unmarshaled.FinalWord)
	}

	if unmarshaled.Depth != 3 {
		t.Errorf("Expected depth 3, got %d", unmarshaled.Depth)
	}
}

