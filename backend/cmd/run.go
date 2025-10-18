package cmd

import (
	"log"
	"net/http"

	"github.com/de-upayan/wordle-ai/backend/handlers"
)

// Main initializes and starts the HTTP server with all routes
// and configurations.
func Main() {
	// Register handlers
	http.HandleFunc(
		"/api/v1/suggest/stream",
		handlers.SuggestStream,
	)
	http.HandleFunc(
		"/api/v1/suggest/cancel",
		handlers.CancelStream,
	)

	// Health check endpoint
	http.HandleFunc("/health", func(w http.ResponseWriter,
		r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Start server
	port := ":8080"
	log.Printf("Starting server on %s", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
