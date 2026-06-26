package models

import "time"

type APIKey struct {
	ID         uint      `gorm:"primarykey" json:"id"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	ConsumerID uint      `gorm:"index" json:"consumer_id"`
	Key        string    `gorm:"uniqueIndex;size:255" json:"key"`
	Status     string    `gorm:"size:50;default:active" json:"status"`
	Consumer   Consumer  `gorm:"foreignKey:ConsumerID" json:"consumer,omitempty"`
}
