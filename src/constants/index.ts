/**
 * Application-wide constants
 */

/** Wordlist configuration */
export const WORDLIST_PATH = `${import.meta.env.BASE_URL}wordlists/sowpods_5.txt`
export const WORD_LENGTH = 5

/** Maximum number of suggestions to display to the user */
export const MAX_SUGGESTIONS = 5

/** Solver computation timeout in milliseconds */
export const SOLVER_TIMEOUT_MS = 30000

/** Cookie names for persisting user preferences */
export const DARK_MODE_COOKIE = 'wordle_ai_dark_mode'
export const STRICT_GUESSES_COOKIE = 'wordle_ai_strict_guesses'

/** Cookie max age: 1 year in seconds */
export const COOKIE_MAX_AGE = 365 * 24 * 60 * 60

/** Game board configuration */
export const GAME_ROWS = 6
export const GAME_COLS = 5

/** Tile color hex codes */
export const TILE_COLORS = {
  green: '#6aaa64',
  yellow: '#c9b458',
  gray: '#787c7e',
} as const

