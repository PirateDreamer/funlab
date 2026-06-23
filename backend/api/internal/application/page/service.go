package page

import (
	"context"
	"fmt"

	domainpage "funlab-api/internal/domain/page"
)

type PageService struct {
	repo domainpage.Repository
}

func NewPageService(repo domainpage.Repository) *PageService {
	return &PageService{repo: repo}
}

func (s *PageService) Publish(ctx context.Context, req PublishPageRequest) (*PublishPageResponse, error) {
	p := domainpage.New(req.Name, req.SchemaJSON, req.HTML)

	if err := s.repo.Create(ctx, p); err != nil {
		return nil, fmt.Errorf("create page: %w", err)
	}

	return &PublishPageResponse{
		ID:  p.ID,
		URL: fmt.Sprintf("/p/%d", p.ID),
	}, nil
}

func (s *PageService) GetByID(ctx context.Context, id uint64) (*domainpage.Page, error) {
	p, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("find page: %w", err)
	}
	return p, nil
}
