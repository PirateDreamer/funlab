package handler

import (
	"errors"
	"net/http"
	"strconv"

	userservice "funlab-api/internal/application/user"
	domainuser "funlab-api/internal/domain/user"
	"funlab-api/pkg/response"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	svc *userservice.UserService
}

func NewUserHandler(svc *userservice.UserService) *UserHandler {
	return &UserHandler{svc: svc}
}

func (h *UserHandler) Create(c *gin.Context) {
	var req userservice.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	result, err := h.svc.Create(c.Request.Context(), &req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.SuccessWithCode(c, http.StatusCreated, result)
}

func (h *UserHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	result, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, result)
}

func (h *UserHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var req userservice.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	result, err := h.svc.Update(c.Request.Context(), id, &req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, result)
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	if err := h.svc.Delete(c.Request.Context(), id); err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, nil)
}

func (h *UserHandler) List(c *gin.Context) {
	var req userservice.ListUsersRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	result, err := h.svc.List(c.Request.Context(), &req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.Success(c, result)
}

func (h *UserHandler) handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, domainuser.ErrUserNotFound):
		response.NotFound(c, err.Error())
	case errors.Is(err, domainuser.ErrEmailExists):
		response.Conflict(c, err.Error())
	case errors.Is(err, domainuser.ErrInvalidEmail):
		response.BadRequest(c, err.Error())
	default:
		response.InternalError(c, "internal server error")
	}
}
