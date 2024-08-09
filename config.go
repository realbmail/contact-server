package main

import (
	"encoding/json"
	"fmt"
	"github.com/realbmail/contact-server/database"
	"github.com/realbmail/contact-server/service"
	"os"
)

type Config struct {
	LogLevel string `json:"log_level"`
	LogFile  string `json:"log_file"`
	JSEnv    string `json:"js_env"`
	*service.HttpCfg
	*database.DbCfg
}

var _sysConfig *Config = nil

func (c Config) String() string {
	s := "\n------system config------"
	s += "\nlog level:\t" + c.LogLevel
	s += "\nlog file:\t" + c.LogFile
	s += "\njs environment:\t" + c.JSEnv
	s += "\n-------------------------"
	s += "\r\n" + c.HttpCfg.String() + "\r\n" + c.DbCfg.String() + "\r\n"
	return s
}

func initConfig(filName string) *Config {
	cf := new(Config)

	bts, err := os.ReadFile(filName)
	if err != nil {
		panic(err)
	}

	if err = json.Unmarshal(bts, &cf); err != nil {
		panic(err)
	}
	if len(param.port) > 0 {
		cf.HttpPort = param.port
	}

	service.InitConf(cf.HttpCfg)
	database.InitConf(cf.DbCfg)
	_sysConfig = cf
	fmt.Println(cf.String())
	return cf
}
