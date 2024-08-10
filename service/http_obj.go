package service

type Req struct {
	QueryReq  *QueryReq  `json:"query_req,omitempty"`
	Operation *Operation `json:"operation,omitempty"`
}

type QueryReq struct {
	EmailAddr string `json:"email_addr,omitempty"`
	BMailAddr string `json:"b_mail_addr,omitempty"`
}

type Operation struct {
	IsDel     bool     `json:"is_del"`
	BMailAddr string   `json:"b_mail_addr"`
	EmailAddr []string `json:"email_addr"`
}

type Rsp struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Payload any    `json:"payload,omitempty"`
}
