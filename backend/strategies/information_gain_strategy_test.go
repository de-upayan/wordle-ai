package strategies

import (
	"context"
	"math"
	"testing"

	"github.com/de-upayan/wordle-ai/backend/models"
)

func TestInformationGainStrategyCreation(t *testing.T) {
	strategy := NewInformationGainStrategy()
	if strategy == nil {
		t.Fatal("Expected non-nil strategy")
	}
	if len(strategy.answerList) == 0 {
		t.Error("Expected non-empty answer list")
	}
	if len(strategy.guessList) == 0 {
		t.Error("Expected non-empty guess list")
	}
}

func TestCalculateEntropy(t *testing.T) {
	strategy := NewInformationGainStrategy()

	tests := []struct {
		name     string
		count    int
		expected float64
	}{
		{"Single outcome", 1, 0},
		{"Two outcomes", 2, 1.0},
		{"Four outcomes", 4, 2.0},
		{"Eight outcomes", 8, 3.0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := strategy.calculateEntropy(tt.count)
			if result != tt.expected {
				t.Errorf("Expected %f, got %f",
					tt.expected, result)
			}
		})
	}
}

func TestCalculateInformationGain(t *testing.T) {
	strategy := NewInformationGainStrategy()

	// Test with a small set of possible answers
	possibleAnswers := []models.Word{
		models.StringToWord("SLATE"),
		models.StringToWord("SLANT"),
		models.StringToWord("SLING"),
		models.StringToWord("PLANT"),
	}

	// A guess that partitions well should have high gain
	gain := strategy.calculateInformationGain(
		"STARE",
		possibleAnswers,
	)

	if gain < 0 {
		t.Errorf("Expected non-negative gain, got %f", gain)
	}

	// Information gain should be at most the current entropy
	currentEntropy := strategy.calculateEntropy(
		len(possibleAnswers),
	)
	if gain > currentEntropy {
		t.Errorf("Gain %f exceeds current entropy %f",
			gain, currentEntropy)
	}
}

func TestInformationGainZeroAnswers(t *testing.T) {
	strategy := NewInformationGainStrategy()

	gain := strategy.calculateInformationGain(
		"STARE",
		[]models.Word{},
	)

	if gain != 0 {
		t.Errorf("Expected 0 gain for empty answers, got %f",
			gain)
	}
}

func TestEvaluateGuessesReturnsTopFive(t *testing.T) {
	strategy := NewInformationGainStrategy()

	possibleAnswers := []models.Word{
		models.StringToWord("SLATE"),
		models.StringToWord("SLANT"),
		models.StringToWord("SLING"),
		models.StringToWord("PLANT"),
		models.StringToWord("SLEET"),
		models.StringToWord("SLEEP"),
		models.StringToWord("SLEEK"),
		models.StringToWord("STEAL"),
		models.StringToWord("STALE"),
	}

	suggestions := strategy.evaluateGuesses(possibleAnswers)

	if len(suggestions) > 5 {
		t.Errorf("Expected at most 5 suggestions, got %d",
			len(suggestions))
	}

	// Verify suggestions are sorted by score (descending)
	for i := 0; i < len(suggestions)-1; i++ {
		if suggestions[i].Score <
			suggestions[i+1].Score {
			t.Error("Suggestions not sorted by score")
		}
	}
}

func TestEvaluateGuessesWithSingleAnswer(t *testing.T) {
	strategy := NewInformationGainStrategy()

	possibleAnswers := []models.Word{
		models.StringToWord("SLATE"),
	}

	suggestions := strategy.evaluateGuesses(possibleAnswers)

	// Should return exactly one suggestion
	if len(suggestions) != 1 {
		t.Errorf("Expected 1 suggestion, got %d",
			len(suggestions))
	}

	// Should be the only possible answer
	if suggestions[0].Word != "SLATE" {
		t.Errorf("Expected SLATE, got %s",
			suggestions[0].Word)
	}

	// Score should be MaxFloat64 (guaranteed solution)
	if suggestions[0].Score != math.MaxFloat64 {
		t.Errorf("Expected MaxFloat64 score, got %f",
			suggestions[0].Score)
	}
}

func TestSolveWithNoConstraints(t *testing.T) {
	strategy := NewInformationGainStrategy()

	gameState := models.GameState{
		History: []models.GuessEntry{},
	}

	ctx := context.Background()
	callCount := 0
	var lastDepth int

	callback := func(
		suggestions []models.SuggestionItem,
		depth int,
		remainingAnswers int,
	) bool {
		callCount++
		lastDepth = depth
		if len(suggestions) == 0 {
			t.Error("Expected non-empty suggestions")
		}
		return true
	}

	err := strategy.Solve(ctx, gameState, 3, callback)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if callCount != 1 {
		t.Errorf("Expected 1 callback, got %d", callCount)
	}

	if lastDepth != 3 {
		t.Errorf("Expected last depth 3, got %d", lastDepth)
	}
}

func TestSolveContextCancellation(t *testing.T) {
	strategy := NewInformationGainStrategy()

	gameState := models.GameState{
		History: []models.GuessEntry{},
	}

	ctx, cancel := context.WithCancel(context.Background())
	cancel() // Cancel immediately

	callback := func(
		suggestions []models.SuggestionItem,
		depth int,
		remainingAnswers int,
	) bool {
		return true
	}

	err := strategy.Solve(ctx, gameState, 3, callback)
	if err == nil {
		t.Error("Expected context cancellation error")
	}
}

func TestSolveCallbackStopsSearch(t *testing.T) {
	strategy := NewInformationGainStrategy()

	gameState := models.GameState{
		History: []models.GuessEntry{},
	}

	ctx := context.Background()
	callCount := 0

	callback := func(
		suggestions []models.SuggestionItem,
		depth int,
		remainingAnswers int,
	) bool {
		callCount++
		// Stop after first callback
		return false
	}

	err := strategy.Solve(ctx, gameState, 5, callback)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if callCount != 1 {
		t.Errorf("Expected 1 callback, got %d", callCount)
	}
}

func TestSolveWithConstraints(t *testing.T) {
	strategy := NewInformationGainStrategy()

	gameState := models.GameState{
		History: []models.GuessEntry{
			{
				Guess: models.StringToWord("STARE"),
				Feedback: models.Feedback{
					Colors: [5]models.LetterColor{
						models.GREEN, models.GRAY,
						models.GRAY, models.GRAY,
						models.GRAY,
					},
				},
			},
		},
	}

	ctx := context.Background()
	var suggestions []models.SuggestionItem

	callback := func(
		sugg []models.SuggestionItem,
		depth int,
		remainingAnswers int,
	) bool {
		suggestions = sugg
		return true
	}

	err := strategy.Solve(ctx, gameState, 1, callback)
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Should have suggestions
	if len(suggestions) == 0 {
		t.Error("Expected non-empty suggestions")
	}

	// All suggestions should have valid scores
	for _, item := range suggestions {
		if item.Score < 0 {
			t.Errorf("Expected non-negative score, "+
				"got %f", item.Score)
		}
	}
}

func TestInformationGainStrategyImplementsInterface(t *testing.T) {
	strategy := NewInformationGainStrategy()

	// Verify it implements SolvingStrategy interface
	var _ SolvingStrategy = strategy
}

func TestInformationGainVsTestStrategy(t *testing.T) {
	igStrategy := NewInformationGainStrategy()
	testStrategy := NewTestStrategy()

	gameState := models.GameState{
		History: []models.GuessEntry{},
	}

	ctx := context.Background()

	// Test InformationGainStrategy
	igCount := 0
	igCallback := func(
		suggestions []models.SuggestionItem,
		depth int,
		remainingAnswers int,
	) bool {
		igCount++
		if len(suggestions) == 0 {
			t.Error("IG: Expected non-empty suggestions")
		}
		return true
	}

	err := igStrategy.Solve(ctx, gameState, 1, igCallback)
	if err != nil {
		t.Errorf("IG: Expected no error, got %v", err)
	}

	// Test TestStrategy
	testCount := 0
	testCallback := func(
		suggestions []models.SuggestionItem,
		depth int,
		remainingAnswers int,
	) bool {
		testCount++
		if len(suggestions) == 0 {
			t.Error("Test: Expected non-empty suggestions")
		}
		return true
	}

	err = testStrategy.Solve(ctx, gameState, 1, testCallback)
	if err != nil {
		t.Errorf("Test: Expected no error, got %v", err)
	}

	// Both should call callback same number of times
	if igCount != testCount {
		t.Errorf("Expected same callback count, "+
			"got IG=%d, Test=%d", igCount, testCount)
	}
}
