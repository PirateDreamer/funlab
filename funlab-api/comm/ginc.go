package comm

import (
	"context"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type Response struct {
	Code string `json:"code"`
	Msg  string `json:"msg"`
	Err  error  `json:"err"`
	Data any    `json:"data"`
}

func FailWithData(ctx context.Context, c *gin.Context, data any, err error) {
	var resErr *BizErr
	switch e := err.(type) {
	case *BizErr:
		resErr = e
	default:
		resErr = NewCommBizErr("系统开小差")
	}
	c.JSON(500, &Response{
		Code: resErr.Code,
		Msg:  resErr.Msg,
		Err:  err,
		Data: data,
	})
}

func Fail(ctx context.Context, c *gin.Context, err error) {
	FailWithData(ctx, c, nil, err)
}

func Success(ctx context.Context, c *gin.Context, data any) {
	c.JSON(200, &Response{
		Code: "0",
		Msg:  "成功",
		Err:  nil,
		Data: data,
	})
}

func Run[T, R any](fn func(ctx context.Context, c *gin.Context, req R) (T, error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := context.Background()
		var req R
		if err := c.ShouldBind(&req); err != nil {
			Fail(ctx, c, err)
			c.Abort()
			return
		}
		res, err := fn(ctx, c, req)

		// 响应时间和trace_id
		c.Writer.Header().Set("X-Response-Time", strconv.FormatInt(time.Now().Unix(), 10))
		c.Writer.Header().Set("X-Trace-Id", c.Request.Header.Get("X-Trace-Id"))

		if err != nil {
			Fail(ctx, c, err)
		} else {
			Success(ctx, c, res)
		}
	}
}
