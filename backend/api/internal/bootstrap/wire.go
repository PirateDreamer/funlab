package bootstrap

import (
	pageapp "funlab-api/internal/application/page"
	"funlab-api/internal/config"
	"funlab-api/internal/infrastructure/persistence"
	"funlab-api/internal/interface/httpserver"
)

func Bootstrap(cfg *config.Config) (*httpserver.Server, func(), error) {
	db, dbCleanup, err := persistence.NewDatabase(cfg)
	if err != nil {
		return nil, nil, err
	}

	// 初始化repo层
	pageRepo := persistence.NewPageRepository(db)

	// 应用层初始化
	pageSvc := pageapp.NewPageService(pageRepo)

	// handler 层
	pageHandler := httpserver.NewPageHandler(pageSvc)

	handlers := []httpserver.Handler{
		pageHandler,
	}

	srv := httpserver.NewServer(cfg, handlers)

	cleanup := func() { dbCleanup() }
	return srv, cleanup, nil
}
