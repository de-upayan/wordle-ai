package cmd

import (
	"net/http"

	"github.com/de-upayan/wordle-ai/backend/handlers"
	"github.com/de-upayan/wordle-ai/backend/logger"
	"github.com/de-upayan/wordle-ai/backend/strategies"
)

var log = logger.New()

// corsMiddleware adds CORS headers to responses
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter,
		r *http.Request) {
		log.Info("Incoming request",
			"method", r.Method,
			"path", r.RequestURI,
			"remote_addr", r.RemoteAddr,
		)

		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set(
			"Access-Control-Allow-Methods",
			"GET, POST, PUT, DELETE, OPTIONS",
		)
		w.Header().Set(
			"Access-Control-Allow-Headers",
			"Content-Type, Authorization",
		)

		// Handle preflight requests
		if r.Method == http.MethodOptions {
			log.Debug("Handling CORS preflight request",
				"path", r.RequestURI,
			)
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Main initializes and starts the HTTP server with all routes
// and configurations.
func Main() {
	mux := http.NewServeMux()

	// Initialize solving strategy
	strategy := strategies.NewInformationGainStrategy()

	// Register handlers
	mux.HandleFunc(
		"/api/v1/suggest/stream",
		func(w http.ResponseWriter, r *http.Request) {
			handlers.SuggestStream(w, r, strategy)
		},
	)
	mux.HandleFunc(
		"/api/v1/suggest/close",
		handlers.CloseStream,
	)

	// Health check endpoint
	mux.HandleFunc("/health", func(w http.ResponseWriter,
		r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Wrap with CORS middleware
	handler := corsMiddleware(mux)

	// Start server
	port := ":8080"
	log.Info("Starting server", "port", port)
	if err := http.ListenAndServe(port, handler); err != nil {
		log.Error("Server error", "error", err)
		panic(err)
	}
}
