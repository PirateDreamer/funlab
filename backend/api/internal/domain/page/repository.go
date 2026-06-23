package page

import "context"

type Repository interface {
	FindByID(ctx context.Context, id uint64) (*Page, error)
	Create(ctx context.Context, page *Page) error
	Update(ctx context.Context, page *Page) error
}
