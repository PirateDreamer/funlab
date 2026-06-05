package httpserver

import (
	"fmt"

	"funlab-api/internal/config"
	"funlab-api/internal/infrastructure/handler"
	"funlab-api/internal/infrastructure/httpserver/middleware"

	"github.com/gin-gonic/gin"
)

type Server struct {
	engine *gin.Engine
	cfg    *config.Config
}

func NewServer(cfg *config.Config, userHandler *handler.UserHandler) *Server {
	gin.SetMode(cfg.GetServer().Mode)

	r := gin.New()
	r.Use(
		middleware.Recovery(),
		middleware.Logger(),
		middleware.CORS(cfg),
	)

	registerRoutes(r, userHandler)

	return &Server{engine: r, cfg: cfg}
}

func (s *Server) Run() error {
	addr := fmt.Sprintf("%s:%d", s.cfg.GetServer().Host, s.cfg.GetServer().Port)
	return s.engine.Run(addr)
}
