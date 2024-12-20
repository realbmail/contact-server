package main

import (
	"encoding/json"
	"fmt"
	"github.com/realbmail/contact-server/common"
	"github.com/realbmail/contact-server/db/db_firestore"
	"github.com/realbmail/contact-server/db/db_leveldb"
	"github.com/realbmail/contact-server/db/db_redis"
	"github.com/realbmail/contact-server/service"
	"github.com/realbmail/contact-server/wallet"
	"os"
)

type Config struct {
	LogLevel string `json:"log_level"`
	LogFile  string `json:"log_file"`
	JSEnv    string `json:"js_env"`
	*service.HttpCfg
	*db_firestore.FsCfg
	*db_leveldb.LBCfg
	*db_redis.RedisCfg
	*wallet.WConf
}

var _sysConfig *Config = nil

func (c Config) String() string {
	s := "\n------system config------"
	s += "\nlog level:\t" + c.LogLevel
	s += "\nlog file:\t" + c.LogFile
	s += "\njs environment:\t" + c.JSEnv
	s += "\n-------------------------"
	s += "\r\n" + c.HttpCfg.String() + "\r\n"
	s += "\r\n" + c.WConf.String() + "\r\n"
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

	switch cf.HttpCfg.DatabaseTyp {
	case service.DBTypFirestore:
		db_firestore.InitConf(cf.FsCfg)
		break
	case service.DBTypRedis:
		db_redis.InitConf(cf.RedisCfg)
		break
	case service.DBTypLevelDB:
		db_leveldb.InitConf(cf.LBCfg)
		break
	}

	service.InitConf(cf.HttpCfg)
	wallet.InitConf(cf.WConf)
	_sysConfig = cf
	fmt.Println(cf.String())
	common.SetLogLevel(cf.LogLevel, cf.LogFile)
	return cf
}
