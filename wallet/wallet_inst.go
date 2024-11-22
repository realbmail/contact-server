package wallet

import (
	"errors"
	"fmt"
	"github.com/realbmail/contact-server/common"
	"gopkg.in/gomail.v2"
	"sync"
	"time"
)

type WConf struct {
	WalletPath string `json:"wallet_path"`
	WalletAuth string `json:"wallet_auth"`
	SmtpHost   string `json:"smtp_host"`
	SmtpPort   int    `json:"smtp_port"`
	EMail      string `json:"e_mail"`
	EPassword  string `json:"e_password"`
}

func (c *WConf) String() string {
	s := "\n========wallet config========"
	s += "\nWallet Path:" + c.WalletPath
	s += "\nEMail Host:" + c.SmtpHost
	s += "\nEMail Port:" + fmt.Sprintf("%d", c.SmtpPort)
	s += "\nEMail Account:" + c.EMail
	s += "\n============================"
	return s
}

var _wConf *WConf

func InitConf(c *WConf) {
	_wConf = c
}

var (
	instance *Wallet
	once     sync.Once
)

func WInst() *Wallet {
	once.Do(func() {
		inst, err := OpenWalletFromPath(_wConf.WalletPath, _wConf.WalletAuth)
		if err != nil {
			panic(err)
		}
		instance = inst
	})
	return instance
}

const (
	tokenExpiration = 24 * time.Hour
)

func sendEmail(tos []string, body, subject string) error {
	smtpHost := _wConf.SmtpHost
	smtpPort := _wConf.SmtpPort
	senderEmail := _wConf.EMail
	senderPassword := _wConf.EPassword

	m := gomail.NewMessage()
	m.SetHeader("From", senderEmail)
	m.SetHeader("To", tos...)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	d := gomail.NewDialer(smtpHost, smtpPort, senderEmail, senderPassword)

	if err := d.DialAndSend(m); err != nil {
		return err
	}
	return nil
}

func SendActiveMail(data *common.ActiveLinkData, subject, body string) {
	signature, err := instance.SignMessage(data.SigData())
	if err != nil {
		common.LogInst().Err(err).Str("active-data", string(data.SigData())).Msg("generate active link failed")
		return
	}

	activeLink := fmt.Sprintf("%s?token=%s&signature=%s", common.ActiveVeryfyUrl, data.Token, signature)

	body = fmt.Sprintf(body, activeLink, data.Address, data.Email)

	err = sendEmail([]string{data.Email}, subject, body)
	if err != nil {
		common.LogInst().Err(err).Str("active-data", string(data.SigData())).Msg("send mail failed")
	}
}

func VerifyActivationLink(data *common.ActiveLinkData, signature string) error {

	now := time.Now().Unix()
	if now-data.CreateTime > int64(tokenExpiration.Seconds()) {
		return errors.New("activation link has expired")
	}

	dataToSign := data.SigData()

	return VerifyMessage(instance.Address.BmailAddress, signature, dataToSign)
}
