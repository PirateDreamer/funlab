package persistence

import (
	"time"

	"funlab-api/internal/config"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func NewDatabase(cfg *config.Config) (*gorm.DB, func(), error) {
	db, err := gorm.Open(mysql.Open(cfg.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, nil, err
	}

	dcfg := cfg.GetDatabase()
	sqlDB.SetMaxIdleConns(dcfg.MaxIdleConns)
	sqlDB.SetMaxOpenConns(dcfg.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(time.Duration(dcfg.ConnMaxLifetime) * time.Second)

	if err := db.AutoMigrate(&gormUser{}, &gormPage{}); err != nil {
		return nil, nil, err
	}

	cleanup := func() { _ = sqlDB.Close() }
	return db, cleanup, nil
}
