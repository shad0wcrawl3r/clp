// Package state provides the state of the application
package state

import (
	"context"
	"sync"

	"github.com/rs/zerolog/log"
	"github.com/shadowcrawler/clp/internal/config"
	"github.com/shadowcrawler/clp/internal/database"
	"github.com/shadowcrawler/clp/internal/storage/postgres"
	"github.com/shadowcrawler/clp/internal/types"
)

type State struct {
	mu    *sync.Mutex
	store *postgres.Storage
	cfg   *types.Config
}

var AppState State

// DB returns the database querier for use in handlers.
func (s *State) DB() database.Querier {
	return s.store
}

// JWTSecret returns the configured JWT signing secret.
func (s *State) JWTSecret() string {
	return s.cfg.JWT.Secret
}

// JWTExpiry returns the configured access token TTL string (e.g. "15m").
func (s *State) JWTExpiry() string {
	if s.cfg.JWT.Expiry == "" {
		return "15m"
	}
	return s.cfg.JWT.Expiry
}

// JWTRefreshExpiry returns the configured refresh token TTL string (e.g. "168h").
func (s *State) JWTRefreshExpiry() string {
	if s.cfg.JWT.RefreshExpiry == "" {
		return "168h"
	}
	return s.cfg.JWT.RefreshExpiry
}

func NewState() {
	cfg := &types.Config{}
	config.ParseConfig(cfg)
	log.Info().Msgf("%+v", cfg)
	ctx := context.Background()
	store, err := postgres.GetPGStore(ctx, cfg.PgConfig)
	if err != nil {
		log.Fatal().Msgf("Failed to connect to postgres: %s", err)
	}
	AppState = State{
		mu:    &sync.Mutex{},
		store: store,
		cfg:   cfg,
	}
}
