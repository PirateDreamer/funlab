package persistence

import (
	"context"
	"errors"
	"time"

	domainpage "funlab-api/internal/domain/page"

	"gorm.io/gorm"
)

type gormPage struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement"`
	Name        string    `gorm:"type:varchar(255);not null"`
	SchemaJSON  string    `gorm:"type:longtext;not null"`
	HTMLContent string    `gorm:"type:longtext;not null"`
	CreatedAt   time.Time `gorm:"autoCreateTime"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime"`
}

func (gormPage) TableName() string { return "pages" }

func (g *gormPage) toEntity() *domainpage.Page {
	return &domainpage.Page{
		ID:          g.ID,
		Name:        g.Name,
		SchemaJSON:  g.SchemaJSON,
		HTMLContent: g.HTMLContent,
		CreatedAt:   g.CreatedAt,
		UpdatedAt:   g.UpdatedAt,
	}
}

func fromPageEntity(p *domainpage.Page) *gormPage {
	return &gormPage{
		ID:          p.ID,
		Name:        p.Name,
		SchemaJSON:  p.SchemaJSON,
		HTMLContent: p.HTMLContent,
		CreatedAt:   p.CreatedAt,
		UpdatedAt:   p.UpdatedAt,
	}
}

type pageRepository struct {
	db *gorm.DB
}

func NewPageRepository(db *gorm.DB) domainpage.Repository {
	return &pageRepository{db: db}
}

func (r *pageRepository) FindByID(ctx context.Context, id uint64) (*domainpage.Page, error) {
	var model gormPage
	if err := r.db.WithContext(ctx).First(&model, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domainpage.ErrPageNotFound
		}
		return nil, err
	}
	return model.toEntity(), nil
}

func (r *pageRepository) Create(ctx context.Context, p *domainpage.Page) error {
	model := fromPageEntity(p)
	if err := r.db.WithContext(ctx).Create(model).Error; err != nil {
		return err
	}
	p.ID = model.ID
	p.CreatedAt = model.CreatedAt
	p.UpdatedAt = model.UpdatedAt
	return nil
}

func (r *pageRepository) Update(ctx context.Context, p *domainpage.Page) error {
	return r.db.WithContext(ctx).Save(fromPageEntity(p)).Error
}
