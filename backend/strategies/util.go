package strategies

import (
	"crypto/md5"
	"fmt"
	"sync"

	"github.com/de-upayan/wordle-ai/backend/models"
	lru "github.com/hashicorp/golang-lru/v2"
)

// CacheKey represents a unique key for a constraint map and
// word list combination
type CacheKey string

// FilterCandidateWordsFunc is the function signature for filtering
// candidate words based on constraints
type FilterCandidateWordsFunc func(
	constraints models.ConstraintMap,
	wordList []string,
) []string

// CachedFilterCandidateWords wraps FilterCandidateWords with LRU
// caching. It caches results based on constraint map and word
// list, with a configurable max memory limit.
type CachedFilterCandidateWords struct {
	cache *lru.Cache[CacheKey, []string]
	mu    sync.RWMutex
}

// NewCachedFilterCandidateWords creates a new cached filter with
// the specified max cache size (number of entries).
// Recommended: 1000-5000 entries depending on memory constraints.
func NewCachedFilterCandidateWords(
	maxCacheSize int,
) (*CachedFilterCandidateWords, error) {
	cache, err := lru.New[CacheKey, []string](maxCacheSize)
	if err != nil {
		return nil, err
	}

	return &CachedFilterCandidateWords{
		cache: cache,
	}, nil
}

// GenerateCacheKey creates a unique cache key from a constraint
// map and word list. Uses MD5 hash of the constraint map
// combined with word list length for efficient key generation.
func GenerateCacheKey(
	constraints models.ConstraintMap,
	wordList []string,
) CacheKey {
	// Create a string representation of constraints
	constraintStr := fmt.Sprintf(
		"green:%v|yellow:%v|gray:%v|wordLen:%d",
		constraints.GreenLetters,
		constraints.YellowLetters,
		constraints.GrayLetters,
		len(wordList),
	)

	// Generate MD5 hash for compact key
	hash := md5.Sum([]byte(constraintStr))
	return CacheKey(fmt.Sprintf("%x", hash))
}

// Filter filters candidate words based on constraints and caches
// the result. Returns the filtered list of words that match all
// constraints.
func (c *CachedFilterCandidateWords) Filter(
	constraints models.ConstraintMap,
	wordList []string,
) []string {
	key := GenerateCacheKey(constraints, wordList)

	// Check cache first
	c.mu.RLock()
	if cached, ok := c.cache.Get(key); ok {
		c.mu.RUnlock()
		// Return a copy to prevent external modifications
		result := make([]string, len(cached))
		copy(result, cached)
		return result
	}
	c.mu.RUnlock()

	// Filter candidates
	filtered := FilterCandidateWords(constraints, wordList)

	// Store in cache
	c.mu.Lock()
	c.cache.Add(key, filtered)
	c.mu.Unlock()

	return filtered
}

// FilterCandidateWords filters the word list based on the
// constraint map. Returns only words that satisfy all constraints:
// - Green letters must be at exact positions
// - Yellow letters must be in word but not at forbidden positions
// - Gray letters must not appear in word
func FilterCandidateWords(
	constraints models.ConstraintMap,
	wordList []string,
) []string {
	var result []string

	for _, word := range wordList {
		if matchesConstraints(word, constraints) {
			result = append(result, word)
		}
	}

	return result
}

// matchesConstraints checks if a word satisfies all constraints
func matchesConstraints(
	word string,
	constraints models.ConstraintMap,
) bool {
	// Check green letters (exact position matches)
	for pos, letter := range constraints.GreenLetters {
		if pos >= len(word) || string(word[pos]) != letter {
			return false
		}
	}

	// Check yellow letters (must be in word but not at
	// forbidden positions)
	for letter, forbiddenPositions := range constraints.YellowLetters {
		// Letter must exist in word
		if !contains(word, letter) {
			return false
		}

		// Letter must not be at forbidden positions
		for _, pos := range forbiddenPositions {
			if pos < len(word) &&
				string(word[pos]) == letter {
				return false
			}
		}
	}

	// Check gray letters (must not be in word)
	for grayLetter := range constraints.GrayLetters {
		if contains(word, grayLetter) {
			return false
		}
	}

	return true
}

// contains checks if a word contains a letter
func contains(word, letter string) bool {
	for _, ch := range word {
		if string(ch) == letter {
			return true
		}
	}
	return false
}

// CacheStats returns cache statistics
func (c *CachedFilterCandidateWords) CacheStats() map[string]int {
	c.mu.RLock()
	defer c.mu.RUnlock()

	return map[string]int{
		"size": c.cache.Len(),
	}
}

// ClearCache clears all cached entries
func (c *CachedFilterCandidateWords) ClearCache() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.cache.Purge()
}
