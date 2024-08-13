package service

import "github.com/realbmail/contact-server/common"

type Req struct {
	PayLoad   any    `json:"pay_load"`
	Signature string `json:"signature"`
	AccountID string `json:"account_id"`
}

func (r *Req) VerifySig() error {
	return common.VerifySig(r.PayLoad, r.Signature, r.AccountID)
}

type QueryReq struct {
	OneEmailAddr string   `json:"one_email_addr,omitempty"`
	BMailAddr    string   `json:"b_mail_addr,omitempty"`
	EmailAddrArr []string `json:"email_addr_arr,omitempty"`
}

type Operation struct {
	IsDel     bool     `json:"is_del"`
	BMailAddr string   `json:"b_mail_addr"`
	EmailAddr []string `json:"email_addr,omitempty"`
}

type Rsp struct {
	Success   bool   `json:"success"`
	Message   string `json:"message,omitempty"`
	Payload   any    `json:"payload,omitempty"`
	Signature any    `json:"signature,omitempty"`
}
