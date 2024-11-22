package common

import "fmt"

const (
	BMErrCode = iota
	BMErrInvalidParam
	BMErrDatabase
	BMErrNoRight
	BMErrDuplicate
)

type BMError struct {
	Code    int
	Message string
}

func (e *BMError) Error() string {
	return fmt.Sprintf("Code: %d, Message: %s", e.Code, e.Message)
}

func NewBMError(code int, message string) error {
	return &BMError{
		Code:    code,
		Message: message,
	}
}
