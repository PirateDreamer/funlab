package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"mcp-gateway/database"
	"mcp-gateway/models"

	"github.com/gin-gonic/gin"
)

type SwaggerPath struct {
	Post *SwaggerOperation `json:"post,omitempty"`
	Get  *SwaggerOperation `json:"get,omitempty"`
	Put  *SwaggerOperation `json:"put,omitempty"`
	Del  *SwaggerOperation `json:"delete,omitempty"`
}

type SwaggerOperation struct {
	Summary     string                 `json:"summary"`
	Description string                 `json:"description"`
	OperationID string                 `json:"operationId"`
	Parameters  []SwaggerParameter     `json:"parameters,omitempty"`
	RequestBody *SwaggerRequestBody    `json:"requestBody,omitempty"`
	Responses   map[string]interface{} `json:"responses"`
	Tags        []string               `json:"tags,omitempty"`
}

type SwaggerParameter struct {
	Name        string      `json:"name"`
	In          string      `json:"in"`
	Required    bool        `json:"required"`
	Description string      `json:"description"`
	Schema      interface{} `json:"schema"`
}

type SwaggerRequestBody struct {
	Content map[string]SwaggerMediaType `json:"content"`
}

type SwaggerMediaType struct {
	Schema interface{} `json:"schema"`
}

type SwaggerDoc struct {
	Paths map[string]SwaggerPath `json:"paths"`
	Info  struct {
		Title   string `json:"title"`
		Version string `json:"version"`
	} `json:"info"`
}

func ListMCPTools(c *gin.Context) {
	serviceIDStr := c.Param("id")
	serviceID, err := strconv.ParseUint(serviceIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid service id"})
		return
	}
	var tools []models.MCPTool
	database.DB.Where("service_id = ?", serviceID).Find(&tools)
	c.JSON(http.StatusOK, gin.H{"data": tools})
}

func UploadMCPTools(c *gin.Context) {
	serviceIDStr := c.Param("id")
	serviceID, err := strconv.ParseUint(serviceIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid service id"})
		return
	}

	var svc models.MCPService
	if err := database.DB.First(&svc, serviceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "service not found"})
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	defer file.Close()

	if header.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file too large (max 5MB)"})
		return
	}

	content, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read file"})
		return
	}

	var swagger SwaggerDoc
	if err := json.Unmarshal(content, &swagger); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid swagger file: " + err.Error()})
		return
	}

	if len(swagger.Paths) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no paths found in swagger file"})
		return
	}

	var tools []models.MCPTool
	for path, methods := range swagger.Paths {
		ops := []struct {
			Method string
			Op     *SwaggerOperation
		}{
			{"GET", methods.Get},
			{"POST", methods.Post},
			{"PUT", methods.Put},
			{"DELETE", methods.Del},
		}

		for _, op := range ops {
			if op.Op == nil {
				continue
			}
			name := op.Op.OperationID
			if name == "" {
				name = fmt.Sprintf("%s_%s", op.Method, path)
			}

			schema := buildInputSchema(op.Op)
			schemaBytes, _ := json.Marshal(schema)

			tool := models.MCPTool{
				ServiceID:   uint(serviceID),
				Name:        name,
				Description: op.Op.Summary,
				Schema:      string(schemaBytes),
				HTTPMethod:  op.Method,
				HTTPPath:    path,
			}
			tools = append(tools, tool)
		}
	}

	if len(tools) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no operations found in swagger file"})
		return
	}

	database.DB.Where("service_id = ?", serviceID).Delete(&models.MCPTool{})
	for i := range tools {
		database.DB.Create(&tools[i])
	}

	c.JSON(http.StatusOK, gin.H{"data": tools, "message": fmt.Sprintf("imported %d tools", len(tools))})
}

func DeleteMCPTool(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("toolId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tool id"})
		return
	}
	database.DB.Delete(&models.MCPTool{}, id)
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func buildInputSchema(op *SwaggerOperation) map[string]interface{} {
	properties := make(map[string]interface{})
	required := make([]string, 0)

	if op.Parameters != nil {
		for _, p := range op.Parameters {
			prop := map[string]interface{}{
				"type":        "string",
				"description": p.Description,
			}
			if schema, ok := p.Schema.(map[string]interface{}); ok {
				if t, ok := schema["type"]; ok {
					prop["type"] = t
				}
			}
			properties[p.Name] = prop
			if p.Required {
				required = append(required, p.Name)
			}
		}
	}

	if op.RequestBody != nil {
		if media, ok := op.RequestBody.Content["application/json"]; ok {
			if schema, ok := media.Schema.(map[string]interface{}); ok {
				properties["requestBody"] = schema
			}
		}
	}

	schema := map[string]interface{}{
		"type":       "object",
		"properties": properties,
	}
	if len(required) > 0 {
		schema["required"] = required
	}
	return schema
}

func CreateMCPTool(c *gin.Context) {
	serviceIDStr := c.Param("id")
	serviceID, err := strconv.ParseUint(serviceIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid service id"})
		return
	}

	var tool models.MCPTool
	if err := c.ShouldBindJSON(&tool); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	tool.ServiceID = uint(serviceID)
	if tool.Schema == "" {
		tool.Schema = `{"type":"object"}`
	}

	if err := database.DB.Create(&tool).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": tool})
}
