package strategies

import (
	"context"

	"github.com/de-upayan/wordle-ai/backend/models"
)

// SuggestionCallback is called by the strategy when suggestions
// are ready for a given depth. Returns true to continue, false
// to stop the search.
type SuggestionCallback func(
	suggestions []models.SuggestionItem,
	depth int,
	done bool,
) bool

// SolvingStrategy defines the interface for different Wordle
// solving strategies
type SolvingStrategy interface {
	// Solve performs the solving strategy and calls the callback
	// for each depth with suggestions. The context can be used to
	// signal cancellation.
	Solve(
		ctx context.Context,
		gameState models.GameState,
		maxDepth int,
		callback SuggestionCallback,
	) error
}

