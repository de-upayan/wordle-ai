import log from 'loglevel'

/**
 * Configure logging levels
 * Set to 'debug' for development, 'info' for production
 */
const LOG_LEVEL = import.meta.env.MODE === 'development'
  ? 'debug'
  : 'info'

log.setLevel(LOG_LEVEL)

/**
 * Create a scoped logger for a specific module
 * @param scope - Module name (e.g., 'GameBoard', 'useGameState')
 */
export function createLogger(scope: string) {
  const prefix = `[${scope}]`

  return {
    debug: (message: string, data?: unknown) => {
      log.debug(`${prefix} ${message}`, data)
    },
    info: (message: string, data?: unknown) => {
      log.info(`${prefix} ${message}`, data)
    },
    warn: (message: string, data?: unknown) => {
      log.warn(`${prefix} ${message}`, data)
    },
    error: (message: string, data?: unknown) => {
      log.error(`${prefix} ${message}`, data)
    },
  }
}

/**
 * Global logger instance
 */
export const logger = createLogger('App')

