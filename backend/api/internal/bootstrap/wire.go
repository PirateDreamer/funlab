package bootstrap

import (
	"funlab-api/internal/config"
	"funlab-api/internal/infrastructure/persistence"
	"funlab-api/internal/interface/httpserver"
)

func Bootstrap(cfg *config.Config) (*httpserver.Server, func(), error) {
	// 初始化中间件
	_, dbCleanup, err := persistence.NewDatabase(cfg)
	if err != nil {
		return nil, nil, err
	}

	// 初始化repo层

	// 初始化domain

	// 应用层初始化

	// userRepo := persistence.NewUserRepository(db)
	// userSvc := userservice.NewUserService(userRepo)
	// userHandler := handler.NewUserHandler(userSvc)

	handlers := []httpserver.Handler{
		httpserver.NewUserHandler(),
	}

	srv := httpserver.NewServer(cfg, handlers)

	cleanup := func() { dbCleanup() }
	return srv, cleanup, nil
}
