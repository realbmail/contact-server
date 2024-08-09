package service

type Req struct {
	EmailAddr string `json:"email_addr,omitempty"`
	BMailAddr string `json:"b_mail_addr,omitempty"`
}

type Rsp struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Payload any    `json:"payload,omitempty"`
}
