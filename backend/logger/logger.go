package logger

import (
	"fmt"
	"os"
	"strings"

	"github.com/rs/zerolog"
)

// contextKeyStreamID is the key for storing streamID in context
type contextKey string

const contextKeyStreamID contextKey = "streamID"

// Logger wraps zerolog.Logger for structured logging
type Logger struct {
	*zerolog.Logger
}

// New creates a new logger instance with console output
func New() *Logger {
	// Setup console writer with colors
	output := zerolog.ConsoleWriter{
		Out:        os.Stderr,
		TimeFormat: "15:04:05",
	}

	// Customize console output formatting
	output.FormatLevel = func(i interface{}) string {
		level := strings.ToUpper(
			strings.TrimPrefix(
				strings.TrimSuffix(
					i.(string), "\""),
				"\""))
		switch level {
		case "DEBUG":
			return "\x1b[36mDEBUG\x1b[0m"
		case "INFO":
			return "\x1b[32mINFO\x1b[0m"
		case "WARN":
			return "\x1b[33mWARN\x1b[0m"
		case "ERROR":
			return "\x1b[31mERROR\x1b[0m"
		default:
			return level
		}
	}

	output.FormatFieldName = func(i interface{}) string {
		return "\x1b[90m" + i.(string) + ":\x1b[0m"
	}

	output.FormatFieldValue = func(i interface{}) string {
		val := ""
		switch v := i.(type) {
		case string:
			val = v
		default:
			val = toString(i)
		}
		return "\x1b[37m" + val + "\x1b[0m"
	}

	logger := zerolog.New(output).
		With().
		Timestamp().
		Logger()

	// Check for LOG_LEVEL environment variable
	if logLevel := os.Getenv("LOG_LEVEL"); logLevel != "" {
		switch strings.ToLower(logLevel) {
		case "debug":
			zerolog.SetGlobalLevel(zerolog.DebugLevel)
		case "info":
			zerolog.SetGlobalLevel(zerolog.InfoLevel)
		case "warn":
			zerolog.SetGlobalLevel(zerolog.WarnLevel)
		case "error":
			zerolog.SetGlobalLevel(zerolog.ErrorLevel)
		default:
			zerolog.SetGlobalLevel(zerolog.InfoLevel)
		}
	} else {
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}

	return &Logger{&logger}
}

// WithStreamID returns a new logger with streamID in context
func (l *Logger) WithStreamID(
	streamID string,
) *Logger {
	newLogger := l.Logger.With().
		Str("streamID", streamID).
		Logger()
	return &Logger{&newLogger}
}

// Info logs an info level message with attributes
func (l *Logger) Info(msg string, args ...any) {
	l.Logger.Info().Fields(
		parseArgs(args)).Msg(msg)
}

// Warn logs a warning level message with attributes
func (l *Logger) Warn(msg string, args ...any) {
	l.Logger.Warn().Fields(
		parseArgs(args)).Msg(msg)
}

// Error logs an error level message with attributes
func (l *Logger) Error(msg string, args ...any) {
	l.Logger.Error().Fields(
		parseArgs(args)).Msg(msg)
}

// Debug logs a debug level message with attributes
func (l *Logger) Debug(msg string, args ...any) {
	l.Logger.Debug().Fields(
		parseArgs(args)).Msg(msg)
}

// parseArgs converts key-value pairs to a map for zerolog
func parseArgs(args []any) map[string]any {
	fields := make(map[string]any)
	for i := 0; i < len(args)-1; i += 2 {
		if key, ok := args[i].(string); ok {
			fields[key] = args[i+1]
		}
	}
	return fields
}

// toString converts any value to string
func toString(i interface{}) string {
	return fmt.Sprintf("%v", i)
}
