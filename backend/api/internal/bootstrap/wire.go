package bootstrap

import (
	"funlab-api/internal/config"

	userservice "funlab-api/internal/application/user"
	"funlab-api/internal/infrastructure/handler"
	"funlab-api/internal/infrastructure/httpserver"
	"funlab-api/internal/infrastructure/persistence"
)

func Bootstrap(cfg *config.Config) (*httpserver.Server, func(), error) {
	db, dbCleanup, err := persistence.NewDatabase(cfg)
	if err != nil {
		return nil, nil, err
	}

	userRepo := persistence.NewUserRepository(db)
	userSvc := userservice.NewUserService(userRepo)
	userHandler := handler.NewUserHandler(userSvc)
	srv := httpserver.NewServer(cfg, userHandler)

	cleanup := func() { dbCleanup() }
	return srv, cleanup, nil
}
