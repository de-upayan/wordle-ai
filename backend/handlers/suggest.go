package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/de-upayan/wordle-ai/backend/models"
)

// TODO(de-upayan): Load word lists (answers.txt, guesses.txt)
// at startup and cache them for performance
// SuggestStream handles POST /api/v1/suggest/stream
// Returns Server-Sent Events with progressive suggestions
func SuggestStream(w http.ResponseWriter, r *http.Request) {
	// Only accept POST requests with JSON body
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse request body
	var req models.SuggestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		log.Printf("Error decoding request: %v", err)
		return
	}

	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Get flusher for streaming
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming not supported", http.StatusInternalServerError)
		return
	}

	// TODO(de-upayan): Replace hardcoded test data with actual AI
	// engine that performs iterative deepening search
	testWords := []string{"BLIND", "ROUND", "POUND"}
	testScores := []float64{0.85, 0.92, 0.95}
	testRemaining := []int{42, 38, 35}

	// TODO(de-upayan): Implement word filtering based on
	// constraints (greenLetters, yellowLetters, grayLetters)
	for depth := 1; depth <= req.MaxDepth && depth <= len(testWords); depth++ {
		event := models.SuggestionEvent{
			Word:      testWords[depth-1],
			Depth:     depth,
			Score:     testScores[depth-1],
			Remaining: testRemaining[depth-1],
		}

		// Marshal event data
		data, err := json.Marshal(event)
		if err != nil {
			log.Printf("Error marshaling event: %v", err)
			continue
		}

		// Send SSE event
		fmt.Fprintf(w, "event: suggestion\n")
		fmt.Fprintf(w, "data: %s\n\n", string(data))
		flusher.Flush()

		// TODO(de-upayan): Remove simulated delay once real AI
		// engine is integrated
		time.Sleep(100 * time.Millisecond)
	}

	// Send done event
	finalDepth := req.MaxDepth
	if finalDepth > len(testWords) {
		finalDepth = len(testWords)
	}
	doneEvent := models.DoneEvent{
		FinalWord: testWords[finalDepth-1],
		Depth:     finalDepth,
	}

	doneData, err := json.Marshal(doneEvent)
	if err != nil {
		log.Printf("Error marshaling done event: %v", err)
		return
	}

	fmt.Fprintf(w, "event: done\n")
	fmt.Fprintf(w, "data: %s\n\n", string(doneData))
	flusher.Flush()
}
