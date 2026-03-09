package postgres

import (
	"context"
	"math/rand"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
	"github.com/shadowcrawler/clp/internal/database"
	"github.com/shadowcrawler/clp/internal/types"
)

// GetPGPool creates a pgxpool from PgConfig with sensible defaults.
// Returns an error if connection fails.
func GetPGPool(ctx context.Context, cfg types.PgConfig) (*pgxpool.Pool, error) {
	pgxCfg, err := cfg.AsPgxConfig()
	if err != nil {
		return nil, err
	}

	// Production-friendly pool defaults
	if pgxCfg.MaxConns == 0 {
		pgxCfg.MaxConns = 20
	}
	if pgxCfg.MinConns == 0 {
		pgxCfg.MinConns = 2
	}
	if pgxCfg.MaxConnLifetime == 0 {
		pgxCfg.MaxConnLifetime = time.Hour
	}
	if pgxCfg.MaxConnIdleTime == 0 {
		pgxCfg.MaxConnIdleTime = 30 * time.Minute
	}
	if pgxCfg.HealthCheckPeriod == 0 {
		pgxCfg.HealthCheckPeriod = 1 * time.Minute
	}

	pool, err := pgxpool.NewWithConfig(ctx, pgxCfg)
	if err != nil {
		return nil, err
	}

	// Optional health check
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}

	return pool, nil
}

// GetPGStore creates a Fiber Postgres Storage using retries with Fibonacci backoff.
// Accepts a context for cancellation (shutdown handling).
func GetPGStore(ctx context.Context, cfg types.PgConfig) (*Storage, error) {
	attempts := 0
	f1, f2 := 1, 1
	const maxBackoff = 30 // cap backoff at 30 seconds
	const maxAttempts = 10

	for {
		if attempts >= maxAttempts {
			log.Error().Msgf("Failed connecting to postgres after %d attempts. Exiting", attempts)
			os.Exit(1)
		}
		select {
		case <-ctx.Done():
			log.Warn().Msg("Context canceled, stopping Postgres connection attempts")
			return nil, ctx.Err()
		default:
		}

		attempts++

		store, err := tryConnect(ctx, cfg)
		if err == nil {
			log.Info().Msgf("Connected to postgres on attempt %d", attempts)
			return store, nil
		}
		if strings.Contains(err.Error(), "missing required fields") {
			log.Error().
				Err(err).
				Msgf("Exiting...")
			os.Exit(1)
		}

		sleep := f1
		jitter := rand.Intn(5)
		if sleep > maxBackoff {
			sleep = maxBackoff
		}
		sleep = sleep + jitter
		log.Error().
			Err(err).
			Msgf("Attempt %d failed. Retrying in %d seconds", attempts, sleep)
		time.Sleep(time.Duration(sleep) * time.Second)
		f1, f2 = f2, f1+f2
	}
}

// tryConnect uses GetPGPool to create a pool and wraps it in Fiber storage.
func tryConnect(ctx context.Context, cfg types.PgConfig) (*Storage, error) {
	pool, err := GetPGPool(ctx, cfg)
	if err != nil {
		return nil, err
	}

	queries := database.New(pool)
	return &Storage{
		pool:    pool,
		Queries: queries,
	}, nil
	// Wrap the pool in Fiber Postgres storage
}
