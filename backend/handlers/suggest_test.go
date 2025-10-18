package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/de-upayan/wordle-ai/backend/models"
)

func TestSuggestStreamInvalidMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/suggest/stream", nil)
	w := httptest.NewRecorder()

	SuggestStream(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("Expected status %d, got %d", http.StatusMethodNotAllowed, w.Code)
	}
}

func TestSuggestStreamInvalidJSON(t *testing.T) {
	body := strings.NewReader("invalid json")
	req := httptest.NewRequest(http.MethodPost, "/api/v1/suggest/stream", body)
	w := httptest.NewRecorder()

	SuggestStream(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestSuggestStreamValidRequest(t *testing.T) {
	reqData := models.SuggestRequest{
		GuessNumber: 2,
		Constraints: models.ConstraintMap{
			GreenLetters: map[int]string{
				1: "L",
				2: "I",
			},
			YellowLetters: map[string][]int{
				"A": {2},
				"N": {3},
			},
			GrayLetters: map[string]struct{}{
				"S": {},
				"T": {},
				"E": {},
				"C": {},
				"G": {},
			},
		},
		MaxDepth: 3,
	}

	body, _ := json.Marshal(reqData)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/suggest/stream", bytes.NewReader(body))
	w := httptest.NewRecorder()

	SuggestStream(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	// Check headers
	if w.Header().Get("Content-Type") != "text/event-stream" {
		t.Errorf("Expected Content-Type text/event-stream, got %s", w.Header().Get("Content-Type"))
	}

	if w.Header().Get("Cache-Control") != "no-cache" {
		t.Errorf("Expected Cache-Control no-cache, got %s", w.Header().Get("Cache-Control"))
	}

	if w.Header().Get("Connection") != "keep-alive" {
		t.Errorf("Expected Connection keep-alive, got %s", w.Header().Get("Connection"))
	}
}

func TestSuggestStreamSSEFormat(t *testing.T) {
	reqData := models.SuggestRequest{
		GuessNumber: 1,
		Constraints: models.ConstraintMap{
			GreenLetters:  make(map[int]string),
			YellowLetters: make(map[string][]int),
			GrayLetters:   make(map[string]struct{}),
		},
		MaxDepth: 2,
	}

	body, _ := json.Marshal(reqData)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/suggest/stream",
		bytes.NewReader(body))
	w := httptest.NewRecorder()

	SuggestStream(w, req)

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
				if err := json.Unmarshal([]byte(jsonStr), &data); err != nil {
					t.Errorf("Invalid JSON in data line: %s, error: %v", jsonStr, err)
				}
			}
		}
	}
}

func TestSuggestStreamEventContent(t *testing.T) {
	reqData := models.SuggestRequest{
		GuessNumber: 1,
		Constraints: models.ConstraintMap{
			GreenLetters:  make(map[int]string),
			YellowLetters: make(map[string][]int),
			GrayLetters:   make(map[string]struct{}),
		},
		MaxDepth: 1,
	}

	body, _ := json.Marshal(reqData)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/suggest/stream",
		bytes.NewReader(body))
	w := httptest.NewRecorder()

	SuggestStream(w, req)

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

	// Check for done flag
	if !strings.Contains(response, "\"done\":true") {
		t.Error("Response missing done flag set to true")
	}
}

func TestCancelStreamInvalidMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet,
		"/api/v1/suggest/cancel", nil)
	w := httptest.NewRecorder()

	CancelStream(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("Expected status %d, got %d",
			http.StatusMethodNotAllowed, w.Code)
	}
}

func TestCancelStreamNotFound(t *testing.T) {
	reqData := models.CancelRequest{
		StreamID: "nonexistent-id",
	}

	body, _ := json.Marshal(reqData)
	req := httptest.NewRequest(http.MethodPost,
		"/api/v1/suggest/cancel",
		bytes.NewReader(body))
	w := httptest.NewRecorder()

	CancelStream(w, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("Expected status %d, got %d",
			http.StatusNotFound, w.Code)
	}
}
