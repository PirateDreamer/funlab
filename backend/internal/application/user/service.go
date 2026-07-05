package user

import (
	"context"
	"fmt"
	"log/slog"

	domainuser "funlab-api/internal/domain/user"

	"golang.org/x/crypto/bcrypt"
)

// UserService 用户应用服务接口
type UserService interface {
	Create(ctx context.Context, req *CreateUserRequest) (*UserResponse, error)
	GetByID(ctx context.Context, id uint64) (*UserResponse, error)
	Update(ctx context.Context, id uint64, req *UpdateUserRequest) (*UserResponse, error)
	Delete(ctx context.Context, id uint64) error
	List(ctx context.Context, req *ListUsersRequest) (*ListUsersResponse, error)
}

// UserServiceOption 用户服务函数选项
type UserServiceOption func(*userService)

// WithUserLogger 设置日志器
func WithUserLogger(logger *slog.Logger) UserServiceOption {
	return func(s *userService) {
		s.logger = logger
	}
}

// WithBcryptCost 设置 bcrypt 加密成本（默认 bcrypt.DefaultCost）
func WithBcryptCost(cost int) UserServiceOption {
	return func(s *userService) {
		s.bcryptCost = cost
	}
}

type userService struct {
	repo       domainuser.Repository
	logger     *slog.Logger
	bcryptCost int
}

// NewUserService 创建用户服务（函数选项模式）
func NewUserService(repo domainuser.Repository, opts ...UserServiceOption) UserService {
	s := &userService{
		repo:       repo,
		logger:     slog.Default(),
		bcryptCost: bcrypt.DefaultCost,
	}
	for _, opt := range opts {
		opt(s)
	}
	return s
}

func (s *userService) Create(ctx context.Context, req *CreateUserRequest) (*UserResponse, error) {
	existing, _ := s.repo.FindByEmail(ctx, req.Email)
	if existing != nil {
		return nil, domainuser.ErrEmailExists
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), s.bcryptCost)
	if err != nil {
		s.logger.ErrorContext(ctx, "hash password failed", "error", err)
		return nil, fmt.Errorf("hash password: %w", err)
	}

	u := domainuser.New(req.Email, req.Username, string(hashed))
	if err := s.repo.Create(ctx, u); err != nil {
		s.logger.ErrorContext(ctx, "create user failed", "error", err)
		return nil, fmt.Errorf("create user: %w", err)
	}

	s.logger.InfoContext(ctx, "user created", "id", u.ID, "email", u.Email)
	return toResponse(u), nil
}

func (s *userService) GetByID(ctx context.Context, id uint64) (*UserResponse, error) {
	u, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return toResponse(u), nil
}

func (s *userService) Update(ctx context.Context, id uint64, req *UpdateUserRequest) (*UserResponse, error) {
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
		s.logger.ErrorContext(ctx, "update user failed", "error", err)
		return nil, err
	}

	s.logger.InfoContext(ctx, "user updated", "id", u.ID)
	return toResponse(u), nil
}

func (s *userService) Delete(ctx context.Context, id uint64) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		s.logger.ErrorContext(ctx, "delete user failed", "error", err)
		return err
	}
	s.logger.InfoContext(ctx, "user deleted", "id", id)
	return nil
}

func (s *userService) List(ctx context.Context, req *ListUsersRequest) (*ListUsersResponse, error) {
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
