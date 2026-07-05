package ginc

import (
	"context"
	"reflect"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

func Run[R, T any](fn func(context.Context, *gin.Context, R) (*T, error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		var req R
		if err := c.ShouldBind(&req); err != nil {
			ResFail(ctx, c, err)
			return
		}
		res, err := fn(ctx, c, req)
		if err != nil {
			ResFail(ctx, c, err)
			return
		}
		ResSuccess(ctx, c, res)
	}
}

type Empty struct{}

func ShouldBind[R any](c *gin.Context, req *R) error {
	err := c.ShouldBind(req)
	if err == nil {
		return nil
	}
	if errs, ok := err.(validator.ValidationErrors); ok {
		for _, e := range errs {
			field := e.Field()

			errMsg := getTag(req, "errMsg", field)

			// 创建自定义错误
			return NewBizErr("2", errMsg)
		}
	}
	return nil
}

func getTag(obj any, field, name string) string {
	t := reflect.TypeOf(obj)
	if t.Kind() == reflect.Ptr {
		t = t.Elem()
	}

	f, ok := t.FieldByName(field)
	if !ok {
		return field
	}

	return f.Tag.Get(name)
}
