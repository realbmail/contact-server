package common

import "encoding/json"

type BMailAccount struct {
	UserLel      int8            `json:"user_lel"  firestore:"user_lel"`
	EMailAddress []string        `json:"e_mail_address" firestore:"-"`
	MailStoreObj map[string]bool `json:"-" firestore:"e_mail_address"`
	LicenseHex   string          `json:"license"  firestore:"license"`
}

func (ba *BMailAccount) MapToArray() {
	if ba.MailStoreObj == nil {
		ba.MailStoreObj = make(map[string]bool)
	}
	ba.EMailAddress = make([]string, 0, len(ba.MailStoreObj))

	for key := range ba.MailStoreObj {
		ba.EMailAddress = append(ba.EMailAddress, key)
	}
}

func (ba *BMailAccount) ArrayToMap() {
	ba.MailStoreObj = make(map[string]bool)
	for i := 0; i < len(ba.EMailAddress); i++ {
		ba.MailStoreObj[ba.EMailAddress[i]] = true
	}
}

type EmailReflect struct {
	BMailAddress string `json:"b_mail_address" firestore:"b_mail_address"`
}

const (
	ActiveVeryfyUrl = "/active_verify"
)

type ActiveLinkData struct {
	Token      string `json:"token"`
	Address    string `json:"address"`
	Email      string `json:"email"`
	CreateTime int64  `json:"create_time"`
	IsUnbind   bool   `json:"is_unbind"`
}

func (d *ActiveLinkData) SigData() []byte {
	data, _ := json.Marshal(d)
	return data
}
