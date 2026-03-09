package types

import (
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PgConfig struct {
	ConnectionString string `mapstructure:"connectionString"` // IF this param exists, ignore all others
	Host             string `mapstructure:"host"`
	Port             int    `mapstructure:"port"`
	DB               string `mapstructure:"db"`
	User             string `mapstructure:"user"`
	Password         string `mapstructure:"password"`
	SSLMode          string `mapstructure:"sslMode"`
}

func (c *PgConfig) SetDefaults() {
	if c.Port <= 0 {
		c.Port = 5432
	}

	if c.SSLMode == "" {
		c.SSLMode = "disable"
	}

	// Common Postgres convention
	if c.DB == "" && c.User != "" {
		c.DB = c.User
	}
}

func (c *PgConfig) Validate() error {
	if c.ConnectionString != "" {
		return nil // Since this iwll override the rest of th params
	}
	missing := []string{}

	if c.Host == "" {
		missing = append(missing, "host")
	}
	if c.User == "" {
		missing = append(missing, "user")
	}
	if c.DB == "" {
		missing = append(missing, "db")
	}

	if len(missing) > 0 {
		return fmt.Errorf(
			"pg config missing required fields: %s",
			strings.Join(missing, ", "),
		)
	}
	return nil
}

func (c PgConfig) AsPgxConfig() (*pgxpool.Config, error) {
	c.SetDefaults()
	if err := c.Validate(); err != nil {
		return nil, err // WHy wait if this cant be hot-reloaded
	}
	errors := make([]error, 0)

	if c.ConnectionString != "" {
		cfg, err := pgxpool.ParseConfig(c.ConnectionString)
		if err == nil {
			return cfg, nil
		}
		errors = append(errors, err)
	}
	dsn := fmt.Sprintf(
		"host=%s port=%d dbname=%s user=%s password=%s sslmode=%s",
		c.Host,
		c.Port,
		c.DB,
		c.User,
		c.Password,
		c.SSLMode,
	)
	cfg, err := pgxpool.ParseConfig(dsn)
	if err == nil {
		return cfg, nil
	}
	errors = append(errors, err)

	return nil, fmt.Errorf("failed building into pgxconfig: %v", errors)
}
