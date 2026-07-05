package bootstrap

import (
	"log/slog"

	pageapp "funlab-api/internal/application/page"
	userapp "funlab-api/internal/application/user"
	"funlab-api/internal/config"
	"funlab-api/internal/infrastructure/persistence"
	"funlab-api/internal/interface/httpserver"
)

func Bootstrap(cfg *config.Config) (*httpserver.Server, func(), error) {
	db, dbCleanup, err := persistence.NewDatabase(cfg)
	if err != nil {
		return nil, nil, err
	}

	logger := slog.Default()

	// infra 层：仓储实现
	pageRepo := persistence.NewPageRepository(db)
	userRepo := persistence.NewUserRepository(db)

	// application 层：应用服务（函数选项模式注入）
	pageSvc := pageapp.NewPageService(pageRepo,
		pageapp.WithPageLogger(logger),
	)
	userSvc := userapp.NewUserService(userRepo,
		userapp.WithUserLogger(logger),
	)

	// interface 层：HTTP 处理器（依赖服务接口）
	pageHandler := httpserver.NewPageHandler(pageSvc)
	userHandler := httpserver.NewUserHandler(userSvc)

	handlers := []httpserver.Handler{
		pageHandler,
		userHandler,
	}

	srv := httpserver.NewServer(cfg, handlers)

	cleanup := func() { dbCleanup() }
	return srv, cleanup, nil
}
