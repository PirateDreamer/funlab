package page

import (
	"context"
	"fmt"
	"log/slog"

	domainpage "funlab-api/internal/domain/page"
)

// PageService 页面应用服务接口
type PageService interface {
	Publish(ctx context.Context, req PublishPageRequest) (*PublishPageResponse, error)
	GetByID(ctx context.Context, id uint64) (*domainpage.Page, error)
}

// PageServiceOption 页面服务函数选项
type PageServiceOption func(*pageService)

// WithPageLogger 设置日志器
func WithPageLogger(logger *slog.Logger) PageServiceOption {
	return func(s *pageService) {
		s.logger = logger
	}
}

type pageService struct {
	repo   domainpage.Repository
	logger *slog.Logger
}

// NewPageService 创建页面服务（函数选项模式）
func NewPageService(repo domainpage.Repository, opts ...PageServiceOption) PageService {
	s := &pageService{
		repo:   repo,
		logger: slog.Default(),
	}
	for _, opt := range opts {
		opt(s)
	}
	return s
}

func (s *pageService) Publish(ctx context.Context, req PublishPageRequest) (*PublishPageResponse, error) {
	p := domainpage.New(req.Name, req.SchemaJSON, req.HTML)

	if err := s.repo.Create(ctx, p); err != nil {
		s.logger.ErrorContext(ctx, "create page failed", "error", err)
		return nil, fmt.Errorf("create page: %w", err)
	}

	s.logger.InfoContext(ctx, "page published", "id", p.ID, "name", p.Name)

	return &PublishPageResponse{
		ID:  p.ID,
		URL: fmt.Sprintf("/p/%d", p.ID),
	}, nil
}

func (s *pageService) GetByID(ctx context.Context, id uint64) (*domainpage.Page, error) {
	p, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("find page: %w", err)
	}
	return p, nil
}
