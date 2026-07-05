package middleware

import (
	"time"

	"funlab-api/internal/config"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CORS(cfg *config.Config) gin.HandlerFunc {
	corsCfg := cfg.GetCORS()
	return cors.New(cors.Config{
		AllowOrigins:     corsCfg.AllowOrigins,
		AllowMethods:     corsCfg.AllowMethods,
		AllowHeaders:     corsCfg.AllowHeaders,
		AllowCredentials: true,
		MaxAge:           time.Duration(corsCfg.MaxAge) * time.Hour,
	})
}
