package strategies

import (
	"context"
	"time"

	"github.com/de-upayan/wordle-ai/backend/models"
)

// TestStrategy is a hardcoded strategy for testing purposes
// Returns predetermined suggestions that improve with depth
type TestStrategy struct {
	suggestionsByDepth map[int][]models.SuggestionItem
}

// NewTestStrategy creates a new TestStrategy instance
func NewTestStrategy() *TestStrategy {
	return &TestStrategy{
		suggestionsByDepth: map[int][]models.SuggestionItem{
			1: {
				{Word: "STARE", Score: 8.5},
				{Word: "SLATE", Score: 8.3},
				{Word: "CRANE", Score: 8.1},
				{Word: "TRACE", Score: 7.9},
				{Word: "RAISE", Score: 7.7},
			},
			2: {
				{Word: "STARE", Score: 8.7},
				{Word: "SLATE", Score: 8.5},
				{Word: "CRATE", Score: 8.3},
				{Word: "TRADE", Score: 8.1},
				{Word: "RAISE", Score: 7.9},
			},
			3: {
				{Word: "STARE", Score: 8.9},
				{Word: "SLATE", Score: 8.7},
				{Word: "CRATE", Score: 8.5},
				{Word: "TRADE", Score: 8.3},
				{Word: "SPARE", Score: 8.1},
			},
			4: {
				{Word: "STARE", Score: 9.1},
				{Word: "SLATE", Score: 8.9},
				{Word: "CRATE", Score: 8.7},
				{Word: "TRADE", Score: 8.5},
				{Word: "SPARE", Score: 8.3},
			},
			5: {
				{Word: "STARE", Score: 9.3},
				{Word: "SLATE", Score: 9.1},
				{Word: "CRATE", Score: 8.9},
				{Word: "TRADE", Score: 8.7},
				{Word: "SPARE", Score: 8.5},
			},
		},
	}
}

// Solve implements the SolvingStrategy interface
// Iterates through depths and calls the callback with suggestions
func (ts *TestStrategy) Solve(
	ctx context.Context,
	gameState models.GameState,
	maxDepth int,
	callback SuggestionCallback,
) error {
	for depth := 1; depth <= maxDepth; depth++ {
		// Check if context was cancelled
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		// Get suggestions for this depth
		suggestions := ts.getSuggestions(depth)

		// Call the callback with suggestions
		// done is true when we reach maxDepth
		done := depth == maxDepth
		if !callback(suggestions, depth, done, 1) {
			// Callback returned false, stop solving
			break
		}

		// Simulated delay for testing purposes
		time.Sleep(100 * time.Millisecond)
	}
	return nil
}

// getSuggestions returns suggestions for the given depth
// For depths > 5, returns depth 5 suggestions with improved
// scores
func (ts *TestStrategy) getSuggestions(
	depth int,
) []models.SuggestionItem {
	if sugg, ok := ts.suggestionsByDepth[depth]; ok {
		return sugg
	}

	// For depths > 5, use depth 5 suggestions with improved
	// scores
	baseSugg := ts.suggestionsByDepth[5]
	suggestions := make(
		[]models.SuggestionItem,
		len(baseSugg),
	)
	for i, item := range baseSugg {
		suggestions[i] = models.SuggestionItem{
			Word:  item.Word,
			Score: item.Score + float64(depth-5)*0.1,
		}
	}
	return suggestions
}
