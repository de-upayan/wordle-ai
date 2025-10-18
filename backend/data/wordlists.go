package data

import "sync"

// WordlistMaps provides O(1) lookup for word validation.
// These maps are initialized once at startup and shared across
// all goroutines for efficient concurrent access.
type WordlistMaps struct {
	answersMap map[string]struct{}
	guessesMap map[string]struct{}
	mu         sync.RWMutex
}

var (
	// wordlistMaps is a singleton instance initialized at package init
	wordlistMaps *WordlistMaps
	once         sync.Once
)

// init initializes the wordlist maps at package load time
func init() {
	once.Do(func() {
		wordlistMaps = &WordlistMaps{
			answersMap: make(map[string]struct{}),
			guessesMap: make(map[string]struct{}),
		}

		// Populate answers map
		for _, word := range Answers {
			wordlistMaps.answersMap[word] = struct{}{}
		}

		// Populate guesses map
		for _, word := range Guesses {
			wordlistMaps.guessesMap[word] = struct{}{}
		}
	})
}

// GetWordlistMaps returns the singleton instance of WordlistMaps
func GetWordlistMaps() *WordlistMaps {
	return wordlistMaps
}

// IsValidAnswer checks if a word is in the answers wordlist
func (wm *WordlistMaps) IsValidAnswer(word string) bool {
	wm.mu.RLock()
	defer wm.mu.RUnlock()
	_, exists := wm.answersMap[word]
	return exists
}

// IsValidGuess checks if a word is in the guesses wordlist
func (wm *WordlistMaps) IsValidGuess(word string) bool {
	wm.mu.RLock()
	defer wm.mu.RUnlock()
	_, exists := wm.guessesMap[word]
	return exists
}

// GetAnswersCount returns the number of valid answers
func (wm *WordlistMaps) GetAnswersCount() int {
	wm.mu.RLock()
	defer wm.mu.RUnlock()
	return len(wm.answersMap)
}

// GetGuessesCount returns the number of valid guesses
func (wm *WordlistMaps) GetGuessesCount() int {
	wm.mu.RLock()
	defer wm.mu.RUnlock()
	return len(wm.guessesMap)
}

// GetAnswersList returns a copy of the answers list
func GetAnswersList() []string {
	return Answers
}

// GetGuessesList returns a copy of the guesses list
func GetGuessesList() []string {
	return Guesses
}

