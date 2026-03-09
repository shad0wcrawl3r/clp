package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog/log"
)

// ErrorResponse is the standard error body returned on failures.
type ErrorResponse struct {
	Error string `json:"error"`
}

func parseUUID(s string) (pgtype.UUID, error) {
	var u pgtype.UUID
	if err := u.Scan(s); err != nil {
		return pgtype.UUID{}, fmt.Errorf("invalid UUID %q", s)
	}
	return u, nil
}

func parseDate(s string) (pgtype.Date, error) {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return pgtype.Date{}, fmt.Errorf("invalid date %q, expected YYYY-MM-DD", s)
	}
	return pgtype.Date{Time: t, Valid: true}, nil
}

func optText(s string) pgtype.Text {
	return pgtype.Text{String: s, Valid: s != ""}
}

// dbErr maps pgx.ErrNoRows to 404; logs and returns a generic 500 for everything else.
// Internal error details are never sent to the client.
func dbErr(c fiber.Ctx, err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return c.Status(fiber.StatusNotFound).JSON(ErrorResponse{Error: "not found"})
	}
	log.Error().Err(err).Str("path", c.Path()).Msg("database error")
	return c.Status(fiber.StatusInternalServerError).JSON(ErrorResponse{Error: "internal server error"})
}

// queryInt parses a query param as int32, returning def if absent or invalid.
func queryInt(c fiber.Ctx, key string, def int32) int32 {
	s := c.Query(key)
	if s == "" {
		return def
	}
	n, err := strconv.ParseInt(s, 10, 32)
	if err != nil {
		return def
	}
	return int32(n)
}

func pgBool(b bool) pgtype.Bool {
	return pgtype.Bool{Bool: b, Valid: true}
}

// uuidStr returns the string representation of a pgtype.UUID.
func uuidStr(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	return fmt.Sprintf("%x-%x-%x-%x-%x",
		u.Bytes[0:4], u.Bytes[4:6], u.Bytes[6:8], u.Bytes[8:10], u.Bytes[10:16])
}

// marshalJSON encodes v to JSON bytes; returns nil on error.
func marshalJSON(v any) ([]byte, error) {
	if v == nil {
		return json.Marshal(map[string]any{})
	}
	return json.Marshal(v)
}
