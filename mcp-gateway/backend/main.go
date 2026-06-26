package main

import (
	"log"

	"mcp-gateway/config"
	"mcp-gateway/database"
	"mcp-gateway/handlers"
	"mcp-gateway/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	if err := database.Init(cfg); err != nil {
		log.Fatalf("failed to init database: %v", err)
	}
	log.Println("database initialized")

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowAllOrigins:  true,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "X-API-Key", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	api := r.Group("/api/v1")
	{
		mcp := api.Group("/mcp-services")
		{
			mcp.GET("", handlers.ListMCPServices)
			mcp.GET("/:id", handlers.GetMCPService)
			mcp.POST("", handlers.CreateMCPService)
			mcp.PUT("/:id", handlers.UpdateMCPService)
			mcp.DELETE("/:id", handlers.DeleteMCPService)
			mcp.GET("/:id/access", handlers.GetMCPServiceAccess)
		}

		mcpProtocol := api.Group("/mcp/:id")
		{
			mcpProtocol.POST("", handlers.HandleMCPStreamableHTTP)
			mcpProtocol.GET("/sse", handlers.HandleMCPSSE)
			mcpProtocol.POST("/messages", handlers.HandleMCPMessages)
		}

		tools := api.Group("/mcp-services/:id/tools")
		{
			tools.GET("", handlers.ListMCPTools)
			tools.POST("/upload", handlers.UploadMCPTools)
			tools.POST("", handlers.CreateMCPTool)
			tools.DELETE("/:toolId", handlers.DeleteMCPTool)
		}

		consumers := api.Group("/consumers")
		{
			consumers.GET("", handlers.ListConsumers)
			consumers.POST("", handlers.CreateConsumer)
			consumers.DELETE("/:id", handlers.DeleteConsumer)
		}

		apiKeys := api.Group("/api-keys")
		{
			apiKeys.GET("", handlers.ListAPIKeys)
			apiKeys.POST("", handlers.CreateAPIKey)
			apiKeys.DELETE("/:id", handlers.DeleteAPIKey)
		}
	}

	protected := api.Group("/mcp/:id")
	protected.Use(middleware.APIKeyAuth())
	{
		protected.POST("/protected", handlers.HandleMCPStreamableHTTP)
	}

	log.Printf("server starting on port %s", cfg.Port)
	r.Run(":" + cfg.Port)
}
