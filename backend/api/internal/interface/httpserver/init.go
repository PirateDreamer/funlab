package httpserver

import (
	"fmt"

	"funlab-api/internal/config"
	"funlab-api/internal/interface/httpserver/middleware"

	"github.com/gin-gonic/gin"
	"github.com/samber/lo"
)

type Server struct {
	engine *gin.Engine
	cfg    *config.Config
}

func NewServer(cfg *config.Config, handlers []Handler) *Server {
	gin.SetMode(cfg.GetServer().Mode)

	r := gin.New()

	api := r.Group("/api")
	api.Use(
		middleware.Recovery(),
		middleware.Logger(),
		middleware.CORS(cfg),
	)

	handlers = append(handlers, NewUserHandler())

	registerRoutes(api, handlers...)

	return &Server{engine: r, cfg: cfg}
}

func (s *Server) Run() error {
	addr := fmt.Sprintf("%s:%d", s.cfg.GetServer().Host, s.cfg.GetServer().Port)
	return s.engine.Run(addr)
}

func registerRoutes(api *gin.RouterGroup, handlers ...Handler) {
	lo.ForEach(handlers, func(item Handler, index int) {
		registerRoutes(api, item)
	})
}

type Handler interface {
	RegisterRouter(r *gin.RouterGroup)
}
