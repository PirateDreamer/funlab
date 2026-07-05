package ginc

import "fmt"

type BizErr struct {
	Code string `json:"code"`
	Msg  string `json:"msg"`
}

func (e *BizErr) Error() string {
	return fmt.Sprintf(`{"code":"%s","msg":"%s"}`, e.Code, e.Msg)
}

func NewBizErr(code, msg string) *BizErr {
	return &BizErr{
		Code: code,
		Msg:  msg,
	}
}

func NewComBizErr(msg string) *BizErr {
	return &BizErr{
		Code: "1",
		Msg:  msg,
	}
}
