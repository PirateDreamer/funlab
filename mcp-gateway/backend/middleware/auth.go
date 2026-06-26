package middleware

import (
	"net/http"

	"mcp-gateway/database"
	"mcp-gateway/models"

	"github.com/gin-gonic/gin"
)

func APIKeyAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.GetHeader("X-API-Key")
		if apiKey == "" {
			apiKey = c.Query("api_key")
		}
		if apiKey == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "API key is required"})
			return
		}

		var key models.APIKey
		if err := database.DB.Where("\"key\" = ? AND status = ?", apiKey, "active").First(&key).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "invalid API key"})
			return
		}

		c.Set("consumer_id", key.ConsumerID)
		c.Next()
	}
}
