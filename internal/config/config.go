package config

import (
	"fmt"
	"strings"

	"github.com/shadowcrawler/clp/internal/types"
	"github.com/spf13/viper"
)

func ParseConfig(cfg *types.Config) error {
	viper.AddConfigPath(".")
	viper.AddConfigPath("/etc/clp/")
	viper.SetConfigName("config")
	viper.SetConfigType("toml")
	viper.SetEnvPrefix("CLP")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	// Now, for the actual config stuff
	if err := viper.ReadInConfig(); err != nil {
		return fmt.Errorf("failed reading config: %s", err)
	}
	if err := viper.Unmarshal(cfg); err != nil {
		return fmt.Errorf("failed unmarshalling config: %s", err)
	}
	return nil
}
