package models

import (
	"time"
)

type MCPServiceType string

const (
	ServiceTypeHTTPToMCP  MCPServiceType = "http_to_mcp"
	ServiceTypeDirectMCP  MCPServiceType = "direct_mcp"
)

type MCPTransportType string

const (
	TransportStreamableHTTP MCPTransportType = "streamable_http"
	TransportSSE            MCPTransportType = "sse"
)

type MCPService struct {
	ID             uint             `gorm:"primarykey" json:"id"`
	CreatedAt      time.Time        `json:"created_at"`
	UpdatedAt      time.Time        `json:"updated_at"`
	Name           string           `gorm:"uniqueIndex;size:255" json:"name"`
	Domain         string           `gorm:"size:255" json:"domain"`
	Path           string           `gorm:"size:255;default:/mcp" json:"path"`
	ServiceType    MCPServiceType   `gorm:"size:50;default:http_to_mcp" json:"service_type"`
	TransportType  MCPTransportType `gorm:"size:50;default:streamable_http" json:"transport_type"`
	BackendURL     string           `gorm:"size:1024" json:"backend_url"`
	Description    string           `gorm:"size:1024" json:"description"`
	AuthEnabled    bool             `gorm:"default:false" json:"auth_enabled"`
	Status         string           `gorm:"size:50;default:active" json:"status"`
}
