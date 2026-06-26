package models

import "time"

type MCPTool struct {
	ID          uint      `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	ServiceID   uint      `gorm:"index" json:"service_id"`
	Name        string    `gorm:"size:255" json:"name"`
	Description string    `gorm:"size:2048" json:"description"`
	Schema      string    `gorm:"type:text" json:"schema"`
	HTTPMethod  string    `gorm:"size:50" json:"http_method"`
	HTTPPath    string    `gorm:"size:1024" json:"http_path"`
	Service     MCPService `gorm:"foreignKey:ServiceID" json:"service,omitempty"`
}
