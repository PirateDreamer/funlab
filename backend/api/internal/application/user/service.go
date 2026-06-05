package user

import (
	"context"
	"fmt"

	domainuser "funlab-api/internal/domain/user"

	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	repo domainuser.Repository
}

func NewUserService(repo domainuser.Repository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) Create(ctx context.Context, req *CreateUserRequest) (*UserResponse, error) {
	existing, _ := s.repo.FindByEmail(ctx, req.Email)
	if existing != nil {
		return nil, domainuser.ErrEmailExists
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	u := domainuser.New(req.Email, req.Username, string(hashed))
	if err := s.repo.Create(ctx, u); err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	return toResponse(u), nil
}

func (s *UserService) GetByID(ctx context.Context, id uint64) (*UserResponse, error) {
	u, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return toResponse(u), nil
}

func (s *UserService) Update(ctx context.Context, id uint64, req *UpdateUserRequest) (*UserResponse, error) {
	u, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if req.Username != "" {
		u.Username = req.Username
	}
	if req.Email != "" {
		u.Email = req.Email
	}
	if err := s.repo.Update(ctx, u); err != nil {
		return nil, err
	}
	return toResponse(u), nil
}

func (s *UserService) Delete(ctx context.Context, id uint64) error {
	return s.repo.Delete(ctx, id)
}

func (s *UserService) List(ctx context.Context, req *ListUsersRequest) (*ListUsersResponse, error) {
	page := req.Page
	if page <= 0 {
		page = 1
	}
	pageSize := req.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	items, total, err := s.repo.List(ctx, offset, pageSize)
	if err != nil {
		return nil, err
	}

	resp := &ListUsersResponse{
		Items:    make([]*UserResponse, len(items)),
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}
	for i, u := range items {
		resp.Items[i] = toResponse(u)
	}
	return resp, nil
}

func toResponse(u *domainuser.User) *UserResponse {
	return &UserResponse{
		ID:        u.ID,
		Email:     u.Email,
		Username:  u.Username,
		Status:    u.Status,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}
