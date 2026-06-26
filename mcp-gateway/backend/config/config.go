package config

import "os"

type Config struct {
	DBPath string
	Port   string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "mcp-gateway.db"
	}
	return &Config{
		DBPath: dbPath,
		Port:   port,
	}
}
