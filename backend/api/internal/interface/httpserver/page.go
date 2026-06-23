package httpserver

import (
	"context"
	"net/http"
	"strconv"

	pageapp "funlab-api/internal/application/page"
	"funlab-api/pkg/ginc"

	"github.com/gin-gonic/gin"
)

type PageHandler struct {
	svc *pageapp.PageService
}

func NewPageHandler(svc *pageapp.PageService) *PageHandler {
	return &PageHandler{svc: svc}
}

func (h *PageHandler) RegisterRouter(r *gin.RouterGroup) {
	pageR := r.Group("/page")
	pageR.POST("/publish", ginc.Run(h.Publish))
}

func (h *PageHandler) RegisterPublicRoutes(r *gin.Engine) {
	r.GET("/p/:pageId", h.ViewPage)
}

func (h *PageHandler) Publish(ctx context.Context, c *gin.Context, req pageapp.PublishPageRequest) (*pageapp.PublishPageResponse, error) {
	host := c.Request.Host
	resp, err := h.svc.Publish(ctx, req)
	if err != nil {
		return nil, err
	}
	resp.URL = "http://" + host + resp.URL
	return resp, nil
}

func (h *PageHandler) ViewPage(c *gin.Context) {
	idStr := c.Param("pageId")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		c.HTML(http.StatusBadRequest, "", "<h1>Invalid page ID</h1>")
		return
	}

	p, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		c.HTML(http.StatusNotFound, "", "<h1>Page not found</h1>")
		return
	}

	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(p.HTMLContent))
}
