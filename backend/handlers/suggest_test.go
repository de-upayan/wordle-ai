package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/de-upayan/wordle-ai/backend/models"
	"github.com/de-upayan/wordle-ai/backend/strategies"
)

func TestSuggestStreamInvalidMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/suggest/stream", nil)
	w := httptest.NewRecorder()
	strategy := strategies.NewTestStrategy()

	SuggestStream(w, req, strategy)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("Expected status %d, got %d", http.StatusMethodNotAllowed, w.Code)
	}
}

func TestSuggestStreamInvalidJSON(t *testing.T) {
	body := strings.NewReader("invalid json")
	req := httptest.NewRequest(http.MethodPost, "/api/v1/suggest/stream", body)
	w := httptest.NewRecorder()
	strategy := strategies.NewTestStrategy()

	SuggestStream(w, req, strategy)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestSuggestStreamValidRequest(t *testing.T) {
	reqData := models.SuggestRequest{
		GameState: models.GameState{
			History: []models.GuessEntry{
				{
					Guess: models.StringToWord("SLATE"),
					Feedback: models.Feedback{
						Colors: [5]models.LetterColor{
							models.GREEN, models.YELLOW,
							models.GRAY, models.GRAY,
							models.GRAY,
						},
					},
				},
			},
		},
		MaxDepth: 3,
	}

	body, _ := json.Marshal(reqData)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/suggest/stream",
		bytes.NewReader(body))
	w := httptest.NewRecorder()
	strategy := strategies.NewTestStrategy()

	SuggestStream(w, req, strategy)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d",
			http.StatusOK, w.Code)
	}

	// Check headers
	if w.Header().Get("Content-Type") !=
		"text/event-stream" {
		t.Errorf(
			"Expected Content-Type text/event-stream, "+
				"got %s",
			w.Header().Get("Content-Type"))
	}

	if w.Header().Get("Cache-Control") != "no-cache" {
		t.Errorf("Expected Cache-Control no-cache, got %s",
			w.Header().Get("Cache-Control"))
	}

	if w.Header().Get("Connection") != "keep-alive" {
		t.Errorf("Expected Connection keep-alive, got %s",
			w.Header().Get("Connection"))
	}
}

func TestSuggestStreamSSEFormat(t *testing.T) {
	reqData := models.SuggestRequest{
		GameState: models.GameState{
			History: []models.GuessEntry{},
		},
		MaxDepth: 2,
	}

	body, _ := json.Marshal(reqData)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/suggest/stream",
		bytes.NewReader(body))
	w := httptest.NewRecorder()
	strategy := strategies.NewTestStrategy()

	SuggestStream(w, req, strategy)

	response := w.Body.String()

	// Check for suggestions events
	if !strings.Contains(response, "event: suggestions") {
		t.Error("Response missing 'event: suggestions'")
	}

	// Check for data lines
	if !strings.Contains(response, "data: ") {
		t.Error("Response missing 'data: ' lines")
	}

	// Verify JSON in data
	lines := strings.Split(response, "\n")
	for _, line := range lines {
		if strings.HasPrefix(line, "data: ") {
			jsonStr := strings.TrimPrefix(line, "data: ")
			if jsonStr != "" {
				var data map[string]interface{}
				if err := json.Unmarshal(
					[]byte(jsonStr), &data); err != nil {
					t.Errorf(
						"Invalid JSON in data line: "+
							"%s, error: %v",
						jsonStr, err)
				}
			}
		}
	}
}

func TestSuggestStreamEventContent(t *testing.T) {
	reqData := models.SuggestRequest{
		GameState: models.GameState{
			History: []models.GuessEntry{},
		},
		MaxDepth: 1,
	}

	body, _ := json.Marshal(reqData)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/suggest/stream",
		bytes.NewReader(body))
	w := httptest.NewRecorder()
	strategy := strategies.NewTestStrategy()

	SuggestStream(w, req, strategy)

	response := w.Body.String()

	// Check for expected test word
	if !strings.Contains(response, "STARE") {
		t.Error("Response missing expected test word 'STARE'")
	}

	// Check for score
	if !strings.Contains(response, "8.5") {
		t.Error("Response missing expected score '8.5'")
	}

	// Check for suggestions event
	if !strings.Contains(response, "event: suggestions") {
		t.Error("Response missing 'event: suggestions'")
	}

	// Check for depth
	if !strings.Contains(response, "\"depth\":1") {
		t.Error("Response missing depth 1")
	}

	// Check for streamId
	if !strings.Contains(response, "\"streamId\":") {
		t.Error("Response missing streamId")
	}

	// Check for completion event
	if !strings.Contains(response, "event: stream-completed") {
		t.Error("Response missing stream-completed event")
	}

	// Check for status completed
	if !strings.Contains(response, "\"status\":\"completed\"") {
		t.Error("Response missing status completed")
	}
}

func TestCloseStreamInvalidMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet,
		"/api/v1/suggest/close", nil)
	w := httptest.NewRecorder()

	CloseStream(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("Expected status %d, got %d",
			http.StatusMethodNotAllowed, w.Code)
	}
}

func TestCloseStreamNotFound(t *testing.T) {
	reqData := models.CloseRequest{
		StreamID: "nonexistent-id",
	}

	body, _ := json.Marshal(reqData)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/suggest/close",
		bytes.NewReader(body))
	w := httptest.NewRecorder()

	CloseStream(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d",
			http.StatusNotFound, w.Code)
	}
}
