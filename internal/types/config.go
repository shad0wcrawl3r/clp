// Package types contains the types used in the application
package types

type HttpConfig struct{} // A blank type for now. Should contain the HTTP related params like TLS, port, host, etc

type JWTConfig struct {
	Secret        string `mapstructure:"secret"`
	Expiry        string `mapstructure:"expiry"`        // access token TTL, e.g. "15m"
	RefreshExpiry string `mapstructure:"refreshExpiry"` // refresh token TTL, e.g. "168h"
}

type Config struct {
	Http     HttpConfig `mapstructure:"http"`
	JWT      JWTConfig  `mapstructure:"jwt"`
	PgConfig PgConfig   `mapstructure:"postgres"`
}
