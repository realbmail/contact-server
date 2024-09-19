package common

type BMailAccount struct {
	UserLel      int8     `json:"user_lel"  firestore:"user_lel"`
	EMailAddress []string `json:"e_mail_address" firestore:"e_mail_address"`
	LicenseHex   string   `json:"license"  firestore:"license"`
}

type EmailReflect struct {
	BMailAddress string `json:"b_mail_address" firestore:"b_mail_address"`
}
