package ginc

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Response struct {
	Code string `json:"code"`
	Err  string `json:"err"`
	Msg  string `json:"msg"`
	Data any    `json:"data"`
}

func ResFail(ctx context.Context, c *gin.Context, err error) {
	ResFailWithData(ctx, c, err, nil)
}

func ResFailWithData(ctx context.Context, c *gin.Context, err error, data any) {
	var bizErr *BizErr
	// 判断错误类型
	switch e := err.(type) {
	case *BizErr:
		bizErr = e
	default:
		bizErr = NewComBizErr("系统开小差...")
	}
	c.JSON(
		http.StatusOK,
		Response{
			Code: bizErr.Code,
			Err:  err.Error(),
			Msg:  bizErr.Msg,
			Data: data,
		},
	)
}

func ResSuccess(ctx context.Context, c *gin.Context, data any) {
	ResSuccessWithMsg(ctx, c, "操作成功", data)
}

func ResSuccessWithMsg(ctx context.Context, c *gin.Context, msg string, data any) {
	c.JSON(
		http.StatusOK,
		Response{
			Code: "0",
			Msg:  msg,
			Data: data,
		},
	)
}

func ResHeader(ctx context.Context, c *gin.Context) {
	// c.Header("X-Trace-ID")
	// c.Header("X-Response-Time")
}
