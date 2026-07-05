package persistence

import (
	"context"
	"errors"
	"time"

	domainuser "funlab-api/internal/domain/user"

	"gorm.io/gorm"
)

type gormUser struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement"`
	Email     string    `gorm:"type:varchar(255);uniqueIndex;not null"`
	Username  string    `gorm:"type:varchar(100);not null"`
	Password  string    `gorm:"type:varchar(255);not null"`
	Status    int8      `gorm:"type:tinyint;default:1"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

func (gormUser) TableName() string { return "users" }

func (g *gormUser) toEntity() *domainuser.User {
	return &domainuser.User{
		ID:        g.ID,
		Email:     g.Email,
		Username:  g.Username,
		Password:  g.Password,
		Status:    g.Status,
		CreatedAt: g.CreatedAt,
		UpdatedAt: g.UpdatedAt,
	}
}

func fromEntity(u *domainuser.User) *gormUser {
	return &gormUser{
		ID:        u.ID,
		Email:     u.Email,
		Username:  u.Username,
		Password:  u.Password,
		Status:    u.Status,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) domainuser.Repository {
	return &userRepository{db: db}
}

func (r *userRepository) FindByID(ctx context.Context, id uint64) (*domainuser.User, error) {
	var model gormUser
	if err := r.db.WithContext(ctx).First(&model, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domainuser.ErrUserNotFound
		}
		return nil, err
	}
	return model.toEntity(), nil
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*domainuser.User, error) {
	var model gormUser
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&model).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domainuser.ErrUserNotFound
		}
		return nil, err
	}
	return model.toEntity(), nil
}

func (r *userRepository) Create(ctx context.Context, u *domainuser.User) error {
	return r.db.WithContext(ctx).Create(fromEntity(u)).Error
}

func (r *userRepository) Update(ctx context.Context, u *domainuser.User) error {
	return r.db.WithContext(ctx).Save(fromEntity(u)).Error
}

func (r *userRepository) Delete(ctx context.Context, id uint64) error {
	return r.db.WithContext(ctx).Delete(&gormUser{}, id).Error
}

func (r *userRepository) List(ctx context.Context, offset, limit int) ([]*domainuser.User, int64, error) {
	var models []gormUser
	var total int64

	if err := r.db.WithContext(ctx).Model(&gormUser{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := r.db.WithContext(ctx).Offset(offset).Limit(limit).Order("id DESC").Find(&models).Error; err != nil {
		return nil, 0, err
	}

	users := make([]*domainuser.User, len(models))
	for i, m := range models {
		users[i] = m.toEntity()
	}
	return users, total, nil
}
