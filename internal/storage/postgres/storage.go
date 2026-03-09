// internal/postgres/storage.go

package postgres

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/shadowcrawler/clp/internal/database"
)

type Storage struct {
	*database.Queries
	pool *pgxpool.Pool
}

func NewStorage(pool *pgxpool.Pool) *Storage {
	return &Storage{
		Queries: database.New(pool),
		pool:    pool,
	}
}
