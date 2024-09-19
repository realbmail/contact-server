package service

import (
	"fmt"
	"github.com/realbmail/contact-server/common"
	"github.com/realbmail/contact-server/db_firestore"
	"github.com/realbmail/contact-server/db_leveldb"
	pbs "github.com/realbmail/contact-server/proto"
	"html/template"
)

const (
	DBTypFirestore = 1
	DBTypLevelDB   = 2
)

type HttpCfg struct {
	CheckSignature      bool   `json:"check_signature"`
	HttpPort            string `json:"http_port"`
	RefreshContent      bool   `json:"refresh_content"`
	UseHttps            bool   `json:"use_https"`
	SSLCertFile         string `json:"ssl_cert_file"`
	SSLKeyFile          string `json:"ssl_key_file"`
	SessionKey          string `json:"session_key"`
	SessionMaxAge       int    `json:"session_max_age"`
	htmlTemplateManager *template.Template
	DatabaseTyp         int `json:"database_typ"`
	database            DatabaseI
}

func (c *HttpCfg) String() string {
	s := "\n------server config------"
	s += "\nhttp port:\t" + c.HttpPort
	s += "\nrefresh content:\t" + fmt.Sprintf("%t", c.RefreshContent)
	s += "\nuse https:\t" + fmt.Sprintf("%t", c.UseHttps)
	s += "\nssl cert file:\t" + c.SSLCertFile
	s += "\nssl key file:\t" + c.SSLKeyFile
	s += "\n-------------------------"
	return s
}

var __httpConf *HttpCfg

func InitConf(c *HttpCfg) {
	__httpConf = c
	if __httpConf.DatabaseTyp == DBTypFirestore {
		__httpConf.database = db_firestore.DbInst()
	} else if __httpConf.DatabaseTyp == DBTypLevelDB {
		__httpConf.database = db_leveldb.DbInst()
	}
}

type DatabaseI interface {
	QueryReflectByOneEmail(emailAddr string) (*common.EmailReflect, error)
	QueryReflectsByEmails(emailAddrs []string) (map[string]common.EmailReflect, error)
	QueryAccount(bmailAddr string) (*common.BMailAccount, error)
	OperateAccount(bmailAddr string, emailAddr []string, isDel bool) error
	CreateBMailAccount(accountId string, level int8) error
	UpdateBinding(bmailAddr string, emailAddr string) error
	DeleteBinding(bmailAddr string, emailAddr string) error
	UpdateContactDetails(address string, contacts []*pbs.ContactItem, isDel bool) error
	QueryContacts(address string, startAfterEmail string) ([]*pbs.ContactItem, error)
}
