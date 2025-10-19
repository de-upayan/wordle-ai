package strategies

import (
	"context"
	"math"
	"sort"

	"github.com/de-upayan/wordle-ai/backend/data"
	"github.com/de-upayan/wordle-ai/backend/models"
)

// InformationGainStrategy implements a greedy solving strategy
// using information gain (entropy reduction) as the heuristic.
type InformationGainStrategy struct {
	answerList []string
	guessList  []string
}

// NewInformationGainStrategy creates a new InformationGainStrategy
func NewInformationGainStrategy() *InformationGainStrategy {
	return &InformationGainStrategy{
		answerList: data.GetAnswersList(),
		guessList:  data.GetGuessesList(),
	}
}

// Solve implements the SolvingStrategy interface using
// information gain heuristic
func (igs *InformationGainStrategy) Solve(
	ctx context.Context,
	gameState models.GameState,
	maxDepth int,
	callback SuggestionCallback,
) error {
	// Convert answer list to Word type
	answerWords := make([]models.Word, len(igs.answerList))
	for i, word := range igs.answerList {
		answerWords[i] = models.StringToWord(word)
	}

	// Get possible answers based on game state
	possibleAnswers := FilterCandidateWords(
		gameState,
		answerWords,
	)

	// If no possible answers, return empty suggestions
	if len(possibleAnswers) == 0 {
		callback([]models.SuggestionItem{}, maxDepth, 0)
		return nil
	}

	// Check if context was cancelled
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}

	// Evaluate guesses and return top 5 suggestions
	suggestions := igs.evaluateGuesses(possibleAnswers)

	// Call callback with suggestions at maxDepth
	callback(suggestions, maxDepth, len(possibleAnswers))

	return nil
}

// evaluateGuesses evaluates candidate guesses and returns top 5
// suggestions sorted by information gain
func (igs *InformationGainStrategy) evaluateGuesses(
	possibleAnswers []models.Word,
) []models.SuggestionItem {
	// Special case: only one possible answer left
	// Return it with max float score (guaranteed solution)
	if len(possibleAnswers) == 1 {
		return []models.SuggestionItem{
			{
				Word:  possibleAnswers[0].String(),
				Score: math.MaxFloat64,
			},
		}
	}

	type guessScore struct {
		word  string
		score float64
	}

	var guesses []guessScore

	// Calculate information gain for each candidate guess
	for _, guess := range igs.guessList {
		gain := igs.calculateInformationGain(
			guess,
			possibleAnswers,
		)
		guesses = append(guesses, guessScore{
			word:  guess,
			score: gain,
		})
	}

	// Sort by information gain (descending)
	sort.Slice(guesses, func(i, j int) bool {
		return guesses[i].score > guesses[j].score
	})

	// Return top 5 suggestions
	result := make([]models.SuggestionItem, 0, 5)
	for i := 0; i < len(guesses) && i < 5; i++ {
		result = append(result, models.SuggestionItem{
			Word:  guesses[i].word,
			Score: guesses[i].score,
		})
	}

	return result
}

// calculateInformationGain calculates the information gain
// (entropy reduction) for a candidate guess given the set of
// possible answers
func (igs *InformationGainStrategy) calculateInformationGain(
	guess string,
	possibleAnswers []models.Word,
) float64 {
	if len(possibleAnswers) == 0 {
		return 0
	}

	// Current entropy before the guess
	currentEntropy := igs.calculateEntropy(
		len(possibleAnswers),
	)

	// Convert guess to Word type
	guessWord := models.StringToWord(guess)

	// Partition answers by feedback pattern
	feedbackPartitions := make(map[string]int)
	for _, answer := range possibleAnswers {
		feedback := GetFeedback(answer, guessWord)
		// Convert feedback to string for map key
		feedbackKey := feedbackToString(feedback)
		feedbackPartitions[feedbackKey]++
	}

	// Calculate expected entropy after the guess
	expectedEntropy := 0.0
	totalAnswers := float64(len(possibleAnswers))
	for _, count := range feedbackPartitions {
		if count > 0 {
			probability := float64(count) / totalAnswers
			expectedEntropy += probability *
				igs.calculateEntropy(count)
		}
	}

	// Information gain = reduction in entropy
	return currentEntropy - expectedEntropy
}

// feedbackToString converts a Feedback struct to a string
// for use as a map key
func feedbackToString(fb models.Feedback) string {
	s := make([]byte, 5)
	for i, color := range fb.Colors {
		switch color {
		case models.GREEN:
			s[i] = 'G'
		case models.YELLOW:
			s[i] = 'Y'
		case models.GRAY:
			s[i] = 'B'
		}
	}
	return string(s)
}

// calculateEntropy calculates Shannon entropy for a set of
// equiprobable outcomes
func (igs *InformationGainStrategy) calculateEntropy(
	count int,
) float64 {
	if count <= 1 {
		return 0
	}

	probability := 1.0 / float64(count)
	return -float64(count) * probability *
		math.Log2(probability)
}
