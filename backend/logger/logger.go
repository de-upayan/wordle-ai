package logger

import (
	"context"
	"log/slog"
	"os"
	"strings"
)

// Logger wraps slog.Logger for structured logging
type Logger struct {
	*slog.Logger
}

// New creates a new logger instance with JSON output
func New() *Logger {
	// Create a JSON handler
	handler := slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{
		Level: getLogLevel(),
	})

	logger := slog.New(handler)
	return &Logger{logger}
}

// getLogLevel reads LOG_LEVEL environment variable
func getLogLevel() slog.Level {
	logLevel := os.Getenv("LOG_LEVEL")
	switch strings.ToLower(logLevel) {
	case "debug":
		return slog.LevelDebug
	case "info":
		return slog.LevelInfo
	case "warn":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

// WithTag returns a new logger with a tag in context
func (l *Logger) WithTag(tag string) *Logger {
	newLogger := l.Logger.With("tag", tag)
	return &Logger{newLogger}
}

// WithTags returns a new logger with multiple tags
func (l *Logger) WithTags(tags map[string]string) *Logger {
	attrs := make([]any, 0, len(tags)*2)
	for k, v := range tags {
		attrs = append(attrs, k, v)
	}
	newLogger := l.Logger.With(attrs...)
	return &Logger{newLogger}
}

// Info logs an info level message with attributes
func (l *Logger) Info(msg string, args ...any) {
	l.Logger.Info(msg, args...)
}

// Warn logs a warning level message with attributes
func (l *Logger) Warn(msg string, args ...any) {
	l.Logger.Warn(msg, args...)
}

// Error logs an error level message with attributes
func (l *Logger) Error(msg string, args ...any) {
	l.Logger.Error(msg, args...)
}

// Debug logs a debug level message with attributes
func (l *Logger) Debug(msg string, args ...any) {
	l.Logger.Debug(msg, args...)
}

// InfoCtx logs an info level message with context
func (l *Logger) InfoCtx(ctx context.Context, msg string,
	args ...any) {
	l.Logger.InfoContext(ctx, msg, args...)
}

// WarnCtx logs a warning level message with context
func (l *Logger) WarnCtx(ctx context.Context, msg string,
	args ...any) {
	l.Logger.WarnContext(ctx, msg, args...)
}

// ErrorCtx logs an error level message with context
func (l *Logger) ErrorCtx(ctx context.Context, msg string,
	args ...any) {
	l.Logger.ErrorContext(ctx, msg, args...)
}

// DebugCtx logs a debug level message with context
func (l *Logger) DebugCtx(ctx context.Context, msg string,
	args ...any) {
	l.Logger.DebugContext(ctx, msg, args...)
}
