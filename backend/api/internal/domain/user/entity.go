package user

import "time"

type User struct {
	ID        uint64
	Email     string
	Username  string
	Password  string
	Status    int8
	CreatedAt time.Time
	UpdatedAt time.Time
}

func New(email, username, hashedPassword string) *User {
	return &User{
		Email:    email,
		Username: username,
		Password: hashedPassword,
		Status:   1,
	}
}

func (u *User) IsActive() bool { return u.Status == 1 }

func (u *User) Deactivate() { u.Status = 0 }
