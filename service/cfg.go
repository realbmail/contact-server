package service

import (
	"fmt"
	"html/template"
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
}
