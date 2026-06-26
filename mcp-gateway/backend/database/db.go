package database

import (
	"mcp-gateway/config"
	"mcp-gateway/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init(cfg *config.Config) error {
	var err error
	DB, err = gorm.Open(sqlite.Open(cfg.DBPath), &gorm.Config{})
	if err != nil {
		return err
	}
	return DB.AutoMigrate(
		&models.MCPService{},
		&models.MCPTool{},
		&models.Consumer{},
		&models.APIKey{},
	)
}
