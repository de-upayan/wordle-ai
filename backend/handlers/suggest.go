package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"

	"github.com/de-upayan/wordle-ai/backend/logger"
	"github.com/de-upayan/wordle-ai/backend/models"
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
func SuggestStream(w http.ResponseWriter, r *http.Request) {
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

	// TODO(de-upayan): Replace hardcoded test data with actual AI
	// engine that performs iterative deepening search
	allWords := []string{
		"STARE", "SLATE", "CRANE", "TRACE", "RAISE",
		"STONE", "STORE", "SHORE", "SHARE", "SPARE",
	}
	allScores := []float64{
		8.5, 8.3, 8.1, 7.9, 7.7,
		7.5, 7.3, 7.1, 6.9, 6.7,
	}

	// TODO(de-upayan): Implement word filtering based on
	// constraints (greenLetters, yellowLetters, grayLetters)

	// Stream top 5 suggestions at each depth
	for depth := 1; depth <= req.MaxDepth; depth++ {
		// Check if stream was cancelled
		select {
		case <-cancelChan:
			log.Info("Stream cancelled",
				"streamID", streamID,
			)
			return
		default:
		}

		// Get top 5 suggestions for current depth
		topN := 5
		if len(allWords) < topN {
			topN = len(allWords)
		}

		suggestions := make([]models.SuggestionItem, 0)
		for i := 0; i < topN; i++ {
			suggestions = append(suggestions,
				models.SuggestionItem{
					Word:  allWords[i],
					Score: allScores[i],
				})
		}

		suggestionsEvent := models.SuggestionsEvent{
			StreamID:    streamID,
			Suggestions: suggestions,
			TopSuggestion: models.SuggestionItem{
				Word:  allWords[0],
				Score: allScores[0],
			},
			Depth: depth,
			Done:  depth == req.MaxDepth,
		}

		// Marshal event data
		data, err := json.Marshal(suggestionsEvent)
		if err != nil {
			log.Error("Error marshaling event",
				"error", err,
			)
			continue
		}

		log.Debug("Sending suggestions event",
			"depth", depth,
			"count", len(suggestions),
		)

		// Send SSE event
		fmt.Fprintf(w, "event: suggestions\n")
		fmt.Fprintf(w, "data: %s\n\n", string(data))
		flusher.Flush()

		// TODO(de-upayan): Remove simulated delay once real AI
		// engine is integrated
		time.Sleep(100 * time.Millisecond)
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
