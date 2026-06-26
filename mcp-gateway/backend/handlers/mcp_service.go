package handlers

import (
	"net/http"
	"strconv"

	"mcp-gateway/database"
	"mcp-gateway/models"

	"github.com/gin-gonic/gin"
)

func ListMCPServices(c *gin.Context) {
	var services []models.MCPService
	database.DB.Order("created_at desc").Find(&services)
	c.JSON(http.StatusOK, gin.H{"data": services})
}

func GetMCPService(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var svc models.MCPService
	if err := database.DB.First(&svc, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "service not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": svc})
}

func CreateMCPService(c *gin.Context) {
	var svc models.MCPService
	if err := c.ShouldBindJSON(&svc); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if svc.Path == "" {
		svc.Path = "/mcp"
	}
	if svc.Status == "" {
		svc.Status = "active"
	}
	if err := database.DB.Create(&svc).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": svc})
}

func UpdateMCPService(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var svc models.MCPService
	if err := database.DB.First(&svc, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "service not found"})
		return
	}
	var input models.MCPService
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	database.DB.Model(&svc).Updates(input)
	c.JSON(http.StatusOK, gin.H{"data": svc})
}

func DeleteMCPService(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	database.DB.Delete(&models.MCPService{}, id)
	database.DB.Where("service_id = ?", id).Delete(&models.MCPTool{})
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func GetMCPServiceAccess(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var svc models.MCPService
	if err := database.DB.First(&svc, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "service not found"})
		return
	}
	scheme := "http"
	accessURL := scheme + "://" + svc.Domain + svc.Path
	curlExample := "curl -X POST " + accessURL + " -H \"Content-Type: application/json\" -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'"

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"access_url":    accessURL,
			"domain":        svc.Domain,
			"path":          svc.Path,
			"curl_example":  curlExample,
			"service_type":  svc.ServiceType,
			"transport":     svc.TransportType,
		},
	})
}
