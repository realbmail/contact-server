package wallet

import (
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/realbmail/contact-server/common"
	"golang.org/x/crypto/nacl/secretbox"
	"gopkg.in/gomail.v2"
	"strings"
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
		fmt.Println("============================")
		fmt.Println("current admin address:" + inst.Address.BmailAddress)
		fmt.Println("current etherum address:" + inst.Address.EthAddress)
		fmt.Println("============================")
	})
	return instance
}

const (
	tokenExpiration = 24 * time.Hour
)

func sendEmail(tos []string, subject, body string) error {
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

func SendActiveMail(data *common.ActiveLinkData, subject, body string, isUnbind bool) {
	signature, err := instance.SignMessage(data.SigData())
	if err != nil {
		common.LogInst().Err(err).Str("active-data", string(data.SigData())).Msg("generate active link failed")
		return
	}

	activeLink := fmt.Sprintf("%s?token=%s&signature=%s&unbind=%t", common.ActiveVeryfyUrl, data.Token, signature, isUnbind)

	body = strings.Replace(body, "__active_link__", activeLink, -1)

	err = sendEmail([]string{data.Email}, subject, body)
	if err != nil {
		common.LogInst().Err(err).Str("email", data.Email).Msg("send mail failed")
		err = sendEmail([]string{data.Email}, subject, body)
		if err != nil {
			common.LogInst().Err(err).Str("email", data.Email).Msg("send mail again failed")
		}
	} else {
		common.LogInst().Debug().Str("active-data", string(data.SigData())).Msg("send active mail success")
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

func DecryptAdminAesKey(sender, thirdAddr, none, aesKey, mailReceiver string, bindEmail map[string]bool) ([]byte, error) {
	noneBts, err := hex.DecodeString(none)
	if err != nil {
		return nil, err
	}

	if len(noneBts) != 24 {
		return nil, fmt.Errorf("invalid nonce param")
	}

	sharedKeySender, err := instance.KeyFromPeerAddr(sender)
	if err != nil {
		return nil, err
	}

	aesKeyBts, err := hex.DecodeString(aesKey)
	if err != nil {
		return nil, err
	}

	decryptAesKey, err := decryptData(aesKeyBts, noneBts, sharedKeySender)
	if err != nil {
		return nil, err
	}

	decodedMailReceiver, err := base64.StdEncoding.DecodeString(mailReceiver)
	if err != nil {
		return nil, err
	}

	plainMailReceiver, err := decryptData(decodedMailReceiver, noneBts, decryptAesKey)
	if err != nil {
		return nil, err
	}

	var mailList []string
	err = json.Unmarshal(plainMailReceiver, &mailList)
	if err != nil {
		return nil, err
	}

	var isMatch = false
	for _, s := range mailList {
		if bindEmail[s] {
			isMatch = true
			break
		}
	}
	if !isMatch {
		return nil, fmt.Errorf("no right to decrypt this mail")
	}

	sharedKeyThird, err := instance.KeyFromPeerAddr(thirdAddr)
	if err != nil {
		return nil, err
	}

	return encryptData(decryptAesKey, noneBts, sharedKeyThird)
}

func encryptData(aesKey []byte, nonce []byte, sharedKey []byte) ([]byte, error) {
	var s [32]byte
	var n [24]byte
	copy(s[:], sharedKey)
	copy(n[:], nonce)

	encrypted := secretbox.Seal(nil, aesKey, &n, &s)
	return encrypted, nil
}

func decryptData(encryptedData []byte, nonce []byte, sharedKey []byte) ([]byte, error) {
	var s [32]byte
	var n [24]byte
	copy(s[:], sharedKey)
	copy(n[:], nonce)
	decrypted, ok := secretbox.Open(nil, encryptedData, &n, &s)
	if !ok {
		return nil, fmt.Errorf("decryption failed")
	}
	return decrypted, nil
}
