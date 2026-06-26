package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"mcp-gateway/services"

	"github.com/gin-gonic/gin"
)

func HandleMCPStreamableHTTP(c *gin.Context) {
	serviceIDStr := c.Param("id")
	serviceID, err := strconv.ParseUint(serviceIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid service id"})
		return
	}

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
		return
	}

	resp, err := services.HandleMCPRequest(uint(serviceID), body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if resp == nil {
		c.Status(http.StatusAccepted)
		return
	}

	c.JSON(http.StatusOK, resp)
}

func HandleMCPSSE(c *gin.Context) {
	serviceIDStr := c.Param("id")
	_, err := strconv.ParseUint(serviceIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid service id"})
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	endpoint := "/api/v1/mcp/" + serviceIDStr + "/messages"
	initEvent, _ := json.Marshal(map[string]string{
		"server":   "mcp-gateway",
		"endpoint": endpoint,
	})

	c.Writer.Write([]byte("event: endpoint\ndata: " + string(initEvent) + "\n\n"))
	c.Writer.Flush()
	<-c.Request.Context().Done()
}

func HandleMCPMessages(c *gin.Context) {
	serviceIDStr := c.Param("id")
	serviceID, err := strconv.ParseUint(serviceIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid service id"})
		return
	}

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
		return
	}

	resp, err := services.HandleMCPRequest(uint(serviceID), body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if resp == nil {
		c.Status(http.StatusAccepted)
		return
	}

	c.JSON(http.StatusOK, resp)
}
