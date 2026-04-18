package comm

type BizErr struct {
	Code string `json:"code"`
	Msg  string `json:"msg"`
}

func (e *BizErr) Error() string {
	return e.Msg
}

func NewBizErr(code string, msg string) *BizErr {
	return &BizErr{
		Code: code,
		Msg:  msg,
	}
}

func NewCommBizErr(msg string) *BizErr {
	return &BizErr{
		Code: "1",
		Msg:  msg,
	}
}
