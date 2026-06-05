package main

import (
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"funlab-api/internal/bootstrap"
	"funlab-api/internal/config"
)

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})))

	cfg, err := config.Load("config/config.yaml")
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	srv, cleanup, err := bootstrap.Bootstrap(cfg)
	if err != nil {
		slog.Error("failed to bootstrap", "error", err)
		os.Exit(1)
	}
	defer cleanup()

	go func() {
		if err := srv.Run(); err != nil {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("shutting down server...")
}
