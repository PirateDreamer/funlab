package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"mcp-gateway/database"
	"mcp-gateway/models"
)

type JSONRPCRequest struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      json.RawMessage `json:"id"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params,omitempty"`
}

type JSONRPCResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      json.RawMessage `json:"id"`
	Result  interface{}     `json:"result,omitempty"`
	Error   *JSONRPCError   `json:"error,omitempty"`
}

type JSONRPCError struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

type InitializeResult struct {
	ProtocolVersion string             `json:"protocolVersion"`
	Capabilities    ServerCapabilities `json:"capabilities"`
	ServerInfo      ServerInfo         `json:"serverInfo"`
}

type ServerCapabilities struct {
	Tools     *ToolsCapability     `json:"tools,omitempty"`
	Resources *ResourcesCapability `json:"resources,omitempty"`
}

type ToolsCapability struct {
	ListChanged bool `json:"listChanged"`
}

type ResourcesCapability struct{}

type ServerInfo struct {
	Name    string `json:"name"`
	Version string `json:"version"`
}

type ToolSchema struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	InputSchema interface{} `json:"inputSchema"`
}

type CallToolResult struct {
	Content []ToolContent `json:"content"`
	IsError bool          `json:"isError"`
}

type ToolContent struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

func HandleMCPRequest(serviceID uint, body []byte) (*JSONRPCResponse, error) {
	var req JSONRPCRequest
	if err := json.Unmarshal(body, &req); err != nil {
		return nil, fmt.Errorf("invalid JSON-RPC request: %w", err)
	}

	if req.JSONRPC != "2.0" {
		return errorResponse(req.ID, -32600, "Invalid Request: jsonrpc must be 2.0"), nil
	}

	var svc models.MCPService
	if err := database.DB.First(&svc, serviceID).Error; err != nil {
		return errorResponse(req.ID, -32602, "Service not found"), nil
	}

	switch req.Method {
	case "initialize":
		return handleInitialize(svc, req.ID)
	case "tools/list":
		return handleToolsList(serviceID, req.ID)
	case "tools/call":
		return handleToolsCall(svc, req.ID, req.Params)
	case "notifications/initialized":
		return nil, nil
	default:
		return errorResponse(req.ID, -32601, fmt.Sprintf("Method not found: %s", req.Method)), nil
	}
}

func handleInitialize(svc models.MCPService, id json.RawMessage) (*JSONRPCResponse, error) {
	svcType := svc.ServiceType
	result := InitializeResult{
		ProtocolVersion: "2025-03-26",
		Capabilities: ServerCapabilities{
			Tools: &ToolsCapability{ListChanged: true},
		},
		ServerInfo: ServerInfo{
			Name:    svc.Name,
			Version: "1.0.0",
		},
	}
	if svcType == models.ServiceTypeDirectMCP {
		result.Capabilities.Resources = &ResourcesCapability{}
	}
	return &JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Result:  result,
	}, nil
}

func handleToolsList(serviceID uint, id json.RawMessage) (*JSONRPCResponse, error) {
	var tools []models.MCPTool
	database.DB.Where("service_id = ?", serviceID).Find(&tools)

	schemas := make([]ToolSchema, 0)
	for _, t := range tools {
		var inputSchema interface{}
		json.Unmarshal([]byte(t.Schema), &inputSchema)
		if inputSchema == nil {
			inputSchema = map[string]interface{}{"type": "object"}
		}
		schemas = append(schemas, ToolSchema{
			Name:        t.Name,
			Description: t.Description,
			InputSchema: inputSchema,
		})
	}

	return &JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Result:  map[string]interface{}{"tools": schemas},
	}, nil
}

func handleToolsCall(svc models.MCPService, id json.RawMessage, params json.RawMessage) (*JSONRPCResponse, error) {
	var callParams struct {
		Name      string          `json:"name"`
		Arguments json.RawMessage `json:"arguments"`
	}
	if err := json.Unmarshal(params, &callParams); err != nil {
		return errorResponse(id, -32602, "Invalid parameters"), nil
	}

	var tool models.MCPTool
	if err := database.DB.Where("service_id = ? AND name = ?", svc.ID, callParams.Name).First(&tool).Error; err != nil {
		return errorResponse(id, -32602, fmt.Sprintf("Tool not found: %s", callParams.Name)), nil
	}

	if svc.ServiceType == models.ServiceTypeHTTPToMCP {
		return callHTTPBackend(svc, tool, id, callParams.Arguments)
	}
	return callDirectMCP(svc, tool, id, callParams.Arguments)
}

func callHTTPBackend(svc models.MCPService, tool models.MCPTool, id json.RawMessage, args json.RawMessage) (*JSONRPCResponse, error) {
	url := strings.TrimRight(svc.BackendURL, "/") + tool.HTTPPath
	method := tool.HTTPMethod
	if method == "" {
		method = "POST"
	}

	var bodyReader io.Reader
	contentType := "application/json"
	if method == "GET" {
		bodyReader = nil
		contentType = ""
	} else {
		bodyReader = strings.NewReader(string(args))
	}

	req, err := http.NewRequest(method, url, bodyReader)
	if err != nil {
		return errorResponse(id, -32000, fmt.Sprintf("Failed to create request: %v", err)), nil
	}
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return errorResponse(id, -32000, fmt.Sprintf("Backend call failed: %v", err)), nil
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	return &JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Result: CallToolResult{
			Content: []ToolContent{
				{Type: "text", Text: string(respBody)},
			},
			IsError: resp.StatusCode >= 400,
		},
	}, nil
}

func callDirectMCP(svc models.MCPService, tool models.MCPTool, id json.RawMessage, args json.RawMessage) (*JSONRPCResponse, error) {
	return callHTTPBackend(svc, tool, id, args)
}

func errorResponse(id json.RawMessage, code int, message string) *JSONRPCResponse {
	return &JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Error: &JSONRPCError{
			Code:    code,
			Message: message,
		},
	}
}
