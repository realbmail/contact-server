package service

type Req struct {
	QueryReq  *QueryReq  `json:"query_req,omitempty"`
	Operation *Operation `json:"operation,omitempty"`
	Signature string     `json:"signature,omitempty"`
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
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Payload any    `json:"payload,omitempty"`
}
