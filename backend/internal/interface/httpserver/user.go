package httpserver

import (
	"context"
	"strconv"

	userapp "funlab-api/internal/application/user"
	"funlab-api/pkg/ginc"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	svc userapp.UserService
}

func NewUserHandler(svc userapp.UserService) *UserHandler {
	return &UserHandler{svc: svc}
}

func (h *UserHandler) RegisterRouter(r *gin.RouterGroup) {
	userR := r.Group("/user")
	userR.POST("/loginByPass", ginc.Run(h.LoginByPass))
	userR.POST("", ginc.Run(h.Create))
	userR.GET("/:id", h.GetByID)
	userR.PUT("/:id", ginc.Run(h.Update))
	userR.DELETE("/:id", h.Delete)
	userR.GET("", h.List)
}

// --- DTOs ---

type LoginByPassReq struct {
	Account  string `json:"account" binding:"required"`
	Password string `json:"password"`
}

type LoginByPassResp struct {
	Token string `json:"token"`
}

// --- Handlers ---

func (h *UserHandler) LoginByPass(ctx context.Context, c *gin.Context, req LoginByPassReq) (*LoginByPassResp, error) {
	return nil, nil
}

func (h *UserHandler) Create(ctx context.Context, c *gin.Context, req userapp.CreateUserRequest) (*userapp.UserResponse, error) {
	return h.svc.Create(ctx, &req)
}

func (h *UserHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		ginc.ResFail(c.Request.Context(), c, ginc.NewBizErr("2", "invalid user id"))
		return
	}
	resp, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		ginc.ResFail(c.Request.Context(), c, err)
		return
	}
	ginc.ResSuccess(c.Request.Context(), c, resp)
}

func (h *UserHandler) Update(ctx context.Context, c *gin.Context, req userapp.UpdateUserRequest) (*userapp.UserResponse, error) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		return nil, ginc.NewBizErr("2", "invalid user id")
	}
	return h.svc.Update(ctx, id, &req)
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		ginc.ResFail(c.Request.Context(), c, ginc.NewBizErr("2", "invalid user id"))
		return
	}
	if err := h.svc.Delete(c.Request.Context(), id); err != nil {
		ginc.ResFail(c.Request.Context(), c, err)
		return
	}
	ginc.ResSuccess(c.Request.Context(), c, nil)
}

func (h *UserHandler) List(c *gin.Context) {
	var req userapp.ListUsersRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		ginc.ResFail(c.Request.Context(), c, err)
		return
	}
	resp, err := h.svc.List(c.Request.Context(), &req)
	if err != nil {
		ginc.ResFail(c.Request.Context(), c, err)
		return
	}
	ginc.ResSuccess(c.Request.Context(), c, resp)
}
