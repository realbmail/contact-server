package main

import (
	"encoding/json"
	"github.com/realbmail/contact-server/db_firestore"
	"github.com/realbmail/contact-server/db_leveldb"
	"github.com/realbmail/contact-server/db_redis"
	"github.com/realbmail/contact-server/service"
	"github.com/realbmail/contact-server/wallet"
	"os"
	"testing"
)

func TestCreateDefaultConfigFile(t *testing.T) {
	cfg := &Config{
		LogLevel: "debug",
		LogFile:  "srv.log",
		JSEnv:    "production",
		HttpCfg: &service.HttpCfg{
			CheckSignature: true,
			HttpHost:       "",
			HttpPort:       "8001",
			DebugPort:      "8887",
			RefreshContent: true,
			UseHttps:       false,
			SSLCertFile:    "",
			SSLKeyFile:     "",
			SessionKey:     "",
			SessionMaxAge:  1800,
			DatabaseTyp:    service.DBTypLevelDB,
		},
		FsCfg: &db_firestore.FsCfg{
			ProjectID:   db_firestore.DefaultFirestoreProjectID,
			DatabaseID:  db_firestore.DefaultDatabaseID,
			KeyFilePath: "dessage-c3b5c95267fb.json",
			LocalRun:    false,
		},
		LBCfg: &db_leveldb.LBCfg{
			DBPath: db_leveldb.DefaultDBPath,
		},
		RedisCfg: &db_redis.RedisCfg{
			Addr:         "localhost:6379",
			Password:     "123",
			DB:           0,
			PoolSize:     10,
			MinIdleConns: 3,
		},
		WConf: &wallet.WConf{
			WalletPath: ".wallet.json",
			WalletAuth: "",
			SmtpHost:   "smtp.gmail.com",
			SmtpPort:   465,
			EMail:      "bmailservice02@gmail.com",
		},
	}

	bts, _ := json.MarshalIndent(cfg, "", "\t")
	_ = os.WriteFile("config.sample.json", bts, 0644)
}
