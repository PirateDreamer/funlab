package httpserver

import (
	"context"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
}

func NewUserHandler() *UserHandler {
	return &UserHandler{}
}

func (h *UserHandler) RegisterRouter(r *gin.RouterGroup) {
	userR := r.Group("/user")
	userR.POST("/loginByPass")
}

type LoginByPassReq struct {
	Account  string `json:"account" binding:"required"`
	Password string `json:"password"`
}

type LoginByPassResp struct {
	Token string `json:"token"`
}

func (h *UserHandler) LoginByPass(ctx context.Context, c *gin.Context, req LoginByPassReq) (resp *LoginByPassResp, err error) {
	return nil, nil
}
