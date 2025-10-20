/**
 * Cookie utility functions for persisting user preferences
 */

const DARK_MODE_COOKIE = 'wordle_ai_dark_mode'
const STRICT_GUESSES_COOKIE = 'wordle_ai_strict_guesses'
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 year in seconds

/**
 * Set a cookie with the given name and value
 */
function setCookie(
  name: string,
  value: string,
  maxAge: number = COOKIE_MAX_AGE
): void {
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; max-age=${maxAge}; path=/; SameSite=Lax`
}

/**
 * Get a cookie value by name
 */
function getCookie(name: string): string | null {
  const cookies = document.cookie.split('; ')
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split('=')
    if (cookieName === name) {
      return decodeURIComponent(cookieValue)
    }
  }
  return null
}

/**
 * Save dark mode preference to cookie
 */
export function saveDarkModeCookie(isDarkMode: boolean): void {
  setCookie(DARK_MODE_COOKIE, isDarkMode ? 'true' : 'false')
}

/**
 * Load dark mode preference from cookie
 * Returns null if cookie doesn't exist
 */
export function loadDarkModeCookie(): boolean | null {
  const value = getCookie(DARK_MODE_COOKIE)
  if (value === null) return null
  return value === 'true'
}

/**
 * Save strict guesses preference to cookie
 */
export function saveStrictGuessesCookie(
  useStrictGuesses: boolean
): void {
  setCookie(
    STRICT_GUESSES_COOKIE,
    useStrictGuesses ? 'true' : 'false'
  )
}

/**
 * Load strict guesses preference from cookie
 * Returns null if cookie doesn't exist
 */
export function loadStrictGuessesCookie(): boolean | null {
  const value = getCookie(STRICT_GUESSES_COOKIE)
  if (value === null) return null
  return value === 'true'
}

