package page

import "time"

type Page struct {
	ID          uint64
	Name        string
	SchemaJSON  string
	HTMLContent string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func New(name, schemaJSON, htmlContent string) *Page {
	now := time.Now()
	return &Page{
		Name:        name,
		SchemaJSON:  schemaJSON,
		HTMLContent: htmlContent,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}
