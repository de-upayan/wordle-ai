package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/google/uuid"

	"github.com/de-upayan/wordle-ai/backend/logger"
	"github.com/de-upayan/wordle-ai/backend/models"
	"github.com/de-upayan/wordle-ai/backend/strategies"
)

var log = logger.New()

// activeStreams tracks ongoing suggestion streams by ID
// Maps streamID -> cancel channel
var (
	activeStreams = make(map[string]chan struct{})
	streamsMutex  sync.RWMutex
)

// TODO(de-upayan): Load word lists (answers.txt, guesses.txt)
// at startup and cache them for performance
// SuggestStream handles POST /api/v1/suggest/stream
// Returns Server-Sent Events with progressive suggestions
func SuggestStream(
	w http.ResponseWriter,
	r *http.Request,
	strategy strategies.SolvingStrategy,
) {
	log.Info("SuggestStream handler called",
		"method", r.Method,
		"path", r.RequestURI,
	)

	// Only accept POST requests with JSON body
	if r.Method != http.MethodPost {
		log.Warn("Invalid method for SuggestStream",
			"method", r.Method,
		)
		http.Error(w, "Method not allowed",
			http.StatusMethodNotAllowed)
		return
	}

	// Parse request body
	var req models.SuggestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Error("Error decoding request",
			"error", err,
		)
		http.Error(w, "Invalid request body",
			http.StatusBadRequest)
		return
	}

	log.Info("Request decoded successfully",
		"guessNumber", req.GuessNumber,
		"maxDepth", req.MaxDepth,
	)

	// Generate unique stream ID
	streamID := uuid.New().String()

	// Create cancel channel for this stream
	cancelChan := make(chan struct{})
	streamsMutex.Lock()
	activeStreams[streamID] = cancelChan
	streamsMutex.Unlock()

	// Cleanup on exit
	defer func() {
		streamsMutex.Lock()
		delete(activeStreams, streamID)
		streamsMutex.Unlock()
		close(cancelChan)
	}()

	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Get flusher for streaming
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming not supported",
			http.StatusInternalServerError)
		return
	}

	// TODO(de-upayan): Implement word filtering based on
	// constraints (greenLetters, yellowLetters, grayLetters)

	// Create game state from request
	gameState := models.GameState{
		GuessNumber: req.GuessNumber,
		Constraints: req.Constraints,
	}

	// Create context that can be cancelled
	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	// Monitor for cancellation
	go func() {
		<-cancelChan
		cancel()
	}()

	// Define callback for strategy to send suggestions
	callback := func(
		suggestions []models.SuggestionItem,
		depth int,
		done bool,
		remainingAnswers int,
	) bool {
		suggestionsEvent := models.SuggestionsEvent{
			StreamID:         streamID,
			Suggestions:      suggestions,
			TopSuggestion:    suggestions[0],
			Depth:            depth,
			Done:             done,
			RemainingAnswers: remainingAnswers,
		}

		// Marshal event data
		data, err := json.Marshal(suggestionsEvent)
		if err != nil {
			log.Error("Error marshaling event",
				"error", err,
			)
			return true
		}

		log.Debug("Sending suggestions event",
			"depth", depth,
			"count", len(suggestions),
		)

		// Send SSE event
		fmt.Fprintf(w, "event: suggestions\n")
		fmt.Fprintf(w, "data: %s\n\n", string(data))
		flusher.Flush()

		return true
	}

	// Run the strategy
	if err := strategy.Solve(
		ctx,
		gameState,
		req.MaxDepth,
		callback,
	); err != nil {
		log.Debug("Strategy solve completed or cancelled",
			"error", err,
		)
	}
}

// CancelStream handles POST /api/v1/suggest/cancel
// Cancels an ongoing suggestion stream by ID
func CancelStream(w http.ResponseWriter, r *http.Request) {
	log.Info("CancelStream handler called",
		"method", r.Method,
		"path", r.RequestURI,
	)

	if r.Method != http.MethodPost {
		log.Warn("Invalid method for CancelStream",
			"method", r.Method,
		)
		http.Error(w, "Method not allowed",
			http.StatusMethodNotAllowed)
		return
	}

	var req models.CancelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Error("Error decoding cancel request",
			"error", err,
		)
		http.Error(w, "Invalid request body",
			http.StatusBadRequest)
		return
	}

	log.Info("Cancel request decoded",
		"streamID", req.StreamID,
	)

	streamsMutex.RLock()
	cancelChan, exists := activeStreams[req.StreamID]
	streamsMutex.RUnlock()

	if !exists {
		http.Error(w, "Stream not found",
			http.StatusNotFound)
		return
	}

	// Signal cancellation
	select {
	case cancelChan <- struct{}{}:
		log.Info("Stream cancelled successfully",
			"streamID", req.StreamID,
		)
	default:
		// Stream already finished
		log.Debug("Stream already finished",
			"streamID", req.StreamID,
		)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "cancelled",
	})
}
