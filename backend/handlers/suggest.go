package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"

	"github.com/de-upayan/wordle-ai/backend/logger"
	"github.com/de-upayan/wordle-ai/backend/models"
	"github.com/de-upayan/wordle-ai/backend/strategies"
)

var log = logger.New()

// activeStreams tracks ongoing suggestion streams by ID
// Maps streamID -> close channel
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

	// Generate unique stream ID
	streamID := uuid.New().String()

	// Create logger with streamID tag
	streamLog := log.WithTag(streamID)

	streamLog.Info("Request decoded successfully",
		"historyLength", len(req.GameState.History),
		"maxDepth", req.MaxDepth,
	)

	// Create close channel for this stream
	closeChan := make(chan struct{})
	streamsMutex.Lock()
	activeStreams[streamID] = closeChan
	streamsMutex.Unlock()

	// Cleanup on exit
	defer func() {
		streamsMutex.Lock()
		delete(activeStreams, streamID)
		streamsMutex.Unlock()
		close(closeChan)
	}()

	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Get flusher for streaming
	flusher, ok := w.(http.Flusher)
	if !ok {
		streamLog.Error("Streaming not supported",
			"error", "flusher not available",
		)
		http.Error(w, "Streaming not supported",
			http.StatusInternalServerError)
		return
	}

	// Send initial response with stream ID
	initialResponse := map[string]string{
		"streamId": streamID,
	}
	data, err := json.Marshal(initialResponse)
	if err != nil {
		streamLog.Error("Error marshaling initial response",
			"error", err,
		)
		http.Error(w, "Internal server error",
			http.StatusInternalServerError)
		return
	}

	streamLog.Info("Stream created")

	fmt.Fprintf(w, "event: stream-created\n")
	fmt.Fprintf(w, "data: %s\n\n", string(data))
	flusher.Flush()

	// Use game state from request
	gameState := req.GameState

	// Create context that can be cancelled
	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	// Monitor for close signal
	go func() {
		<-closeChan
		cancel()
	}()

	// Define callback for strategy to send suggestions
	callback := func(
		suggestions []models.SuggestionItem,
		depth int,
		remainingAnswers int,
	) bool {
		var topSuggestion *models.SuggestionItem
		if len(suggestions) > 0 {
			topSuggestion = &suggestions[0]
		}

		suggestionsEvent := models.SuggestionsEvent{
			StreamID:         streamID,
			Suggestions:      suggestions,
			TopSuggestion:    topSuggestion,
			Depth:            depth,
			RemainingAnswers: remainingAnswers,
		}

		// Marshal event data
		data, err := json.Marshal(suggestionsEvent)
		if err != nil {
			streamLog.Error("Error marshaling event",
				"error", err,
			)
			return true
		}

		topWord := ""
		if topSuggestion != nil {
			topWord = topSuggestion.Word
		}

		streamLog.Debug("Sending suggestions event",
			"depth", depth,
			"count", len(suggestions),
			"remainingAnswers", remainingAnswers,
			"topWord", topWord,
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
		streamLog.Debug("Strategy solve completed or cancelled",
			"error", err,
		)
	}

	// Send completion event
	streamLog.Info("Strategy completed, sending completion event")
	completionEvent := map[string]any{
		"streamId": streamID,
		"status":   "completed",
	}
	completionData, err := json.Marshal(completionEvent)
	if err != nil {
		streamLog.Error("Error marshaling completion event",
			"error", err,
		)
	} else {
		fmt.Fprintf(w, "event: stream-completed\n")
		fmt.Fprintf(w, "data: %s\n\n",
			string(completionData))
		flusher.Flush()
	}

	// Wait 1 second before closing to allow frontend to
	// process the completion event
	time.Sleep(1 * time.Second)
	streamLog.Info("Stream handler exiting")
}

// CloseStream handles POST /api/v1/suggest/close
// Closes an ongoing suggestion stream by ID
func CloseStream(w http.ResponseWriter, r *http.Request) {
	log.Info("CloseStream handler called",
		"method", r.Method,
		"path", r.RequestURI,
	)

	if r.Method != http.MethodPost {
		log.Warn("Invalid method for CloseStream",
			"method", r.Method,
		)
		http.Error(w, "Method not allowed",
			http.StatusMethodNotAllowed)
		return
	}

	var req models.CloseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Error("Error decoding close request",
			"error", err,
		)
		http.Error(w, "Invalid request body",
			http.StatusBadRequest)
		return
	}

	streamID := req.StreamID
	streamLog := log.WithTag(streamID)

	streamLog.Info("Close request decoded")

	streamsMutex.RLock()
	closeChan, exists := activeStreams[req.StreamID]
	streamsMutex.RUnlock()

	if !exists {
		streamLog.Warn("Stream not found")
		http.Error(w, "Stream not found",
			http.StatusNotFound)
		return
	}

	// Signal close
	select {
	case closeChan <- struct{}{}:
		streamLog.Info("Stream closed successfully")
	default:
		// Stream already finished
		streamLog.Debug("Stream already finished")
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "closed",
	})
}
