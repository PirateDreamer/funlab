package handlers

import (
	"net/http"
	"strconv"

	"mcp-gateway/database"
	"mcp-gateway/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func ListConsumers(c *gin.Context) {
	var consumers []models.Consumer
	database.DB.Order("created_at desc").Find(&consumers)
	c.JSON(http.StatusOK, gin.H{"data": consumers})
}

func CreateConsumer(c *gin.Context) {
	var consumer models.Consumer
	if err := c.ShouldBindJSON(&consumer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if consumer.Status == "" {
		consumer.Status = "active"
	}
	if err := database.DB.Create(&consumer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": consumer})
}

func DeleteConsumer(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	database.DB.Delete(&models.Consumer{}, id)
	database.DB.Where("consumer_id = ?", id).Delete(&models.APIKey{})
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func ListAPIKeys(c *gin.Context) {
	var keys []models.APIKey
	database.DB.Preload("Consumer").Order("created_at desc").Find(&keys)
	c.JSON(http.StatusOK, gin.H{"data": keys})
}

func CreateAPIKey(c *gin.Context) {
	var input struct {
		ConsumerID uint `json:"consumer_id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	key := models.APIKey{
		ConsumerID: input.ConsumerID,
		Key:        "mcp_" + uuid.New().String(),
		Status:     "active",
	}
	if err := database.DB.Create(&key).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	database.DB.Preload("Consumer").First(&key, key.ID)
	c.JSON(http.StatusCreated, gin.H{"data": key})
}

func DeleteAPIKey(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	database.DB.Delete(&models.APIKey{}, id)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}
