package service

import (
	"fmt"
	"github.com/realbmail/contact-server/common"
	"github.com/realbmail/contact-server/db/db_firestore"
	"github.com/realbmail/contact-server/db/db_leveldb"
	"github.com/realbmail/contact-server/db/db_redis"
	pbs "github.com/realbmail/contact-server/proto"
	"html/template"
)

const (
	DBTypFirestore = 1
	DBTypLevelDB   = 2
	DBTypRedis     = 3
)

type HttpCfg struct {
	CheckSignature      bool   `json:"check_signature"`
	HttpHost            string `json:"http_host"`
	DebugPort           string `json:"debug_port"`
	HttpPort            string `json:"http_port"`
	RefreshContent      bool   `json:"refresh_content"`
	UseHttps            bool   `json:"use_https"`
	SSLCertFile         string `json:"ssl_cert_file"`
	SSLKeyFile          string `json:"ssl_key_file"`
	SessionKey          string `json:"session_key"`
	SessionMaxAge       int    `json:"session_max_age"`
	DatabaseTyp         int    `json:"database_typ"`
	htmlTemplateManager *template.Template
	database            DatabaseI
}

func dataBaseType(dbNo int) string {
	switch dbNo {
	case DBTypFirestore:
		return "firestore"
	case DBTypLevelDB:
		return "levelDB"
	case DBTypRedis:
		return "DBTypRedis"

	default:
		return "unknown"
	}
}

func (c *HttpCfg) String() string {
	s := "\n------server config------"
	s += "\nhttp host:\t" + c.HttpHost
	s += "\nhttp port:\t" + c.HttpPort
	s += "\ndebug port:\t" + c.DebugPort
	s += "\nrefresh content:\t" + fmt.Sprintf("%t", c.RefreshContent)
	s += "\ncheck signature:\t" + fmt.Sprintf("%t", c.CheckSignature)
	s += "\nuse https:\t" + fmt.Sprintf("%t", c.UseHttps)
	s += "\nssl cert file:\t" + c.SSLCertFile
	s += "\nssl key file:\t" + c.SSLKeyFile
	s += "\nsession max age:\t" + fmt.Sprintf("%d", c.SessionMaxAge)
	s += "\ndatabase typ:\t" + dataBaseType(c.DatabaseTyp)
	s += "\n-------------------------"
	return s
}

var __httpConf *HttpCfg

func InitConf(c *HttpCfg) {
	__httpConf = c
	if __httpConf.DatabaseTyp == DBTypFirestore {
		__httpConf.database = db_firestore.DbInst()
		fmt.Println("======>>> using firestore as database")
	} else if __httpConf.DatabaseTyp == DBTypLevelDB {
		__httpConf.database = db_leveldb.DbInst()
		fmt.Println("======>>> using level db as database")
	} else if __httpConf.DatabaseTyp == DBTypRedis {
		__httpConf.database = db_redis.DbInst()
		fmt.Println("======>>> using redis as database")
	}
	if len(__httpConf.DebugPort) == 0 {
		__httpConf.DebugPort = "8887"
	}
}

type DatabaseI interface {
	QueryReflectByOneEmail(emailAddr string) (*common.EmailReflect, error)
	QueryReflectsByEmails(emailAddrs []string) (map[string]common.EmailReflect, error)
	QueryAccount(bmailAddr string) (*common.BMailAccount, error)
	ActiveAccount(accountId string, level int8) error
	UpdateAccountLevel(accountId string, level int8) error
	UpdateBinding(bmailAddr string, emailAddr string) error
	DeleteBinding(bmailAddr string, emailAddr string) error
	UpdateContactDetails(address string, contacts []*pbs.ContactItem, isDel bool) error
	QueryContacts(address string, startAfterEmail string) ([]*pbs.ContactItem, error)
	DeleteAccount(bmailAddr string) error
	CreateActiveLink(data *common.ActiveLinkData) error
	GetActiveLink(token string) (*common.ActiveLinkData, error)
	RemoveActiveLink(token string) error
}
