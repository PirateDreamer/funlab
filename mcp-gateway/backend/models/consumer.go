package models

import "time"

type Consumer struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Name      string    `gorm:"uniqueIndex;size:255" json:"name"`
	Status    string    `gorm:"size:50;default:active" json:"status"`
}
