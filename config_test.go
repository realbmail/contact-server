package main

import (
	"encoding/json"
	"github.com/realbmail/contact-server/database"
	"github.com/realbmail/contact-server/service"
	"os"
	"testing"
)

func TestCreateDefaultConfigFile(t *testing.T) {
	cfg := &Config{
		LogLevel: "debug",
		LogFile:  "srv.log",
		JSEnv:    "production",
		HttpCfg: &service.HttpCfg{
			HttpPort:       "8001",
			RefreshContent: true,
			UseHttps:       false,
			SSLCertFile:    "",
			SSLKeyFile:     "",
			SessionKey:     "",
			SessionMaxAge:  1800,
		},
		DbCfg: &database.DbCfg{
			ProjectID:   database.DefaultFirestoreProjectID,
			DatabaseID:  database.DefaultDatabaseID,
			KeyFilePath: "dessage-c3b5c95267fb.json",
			LocalRun:    false,
		},
	}

	bts, _ := json.MarshalIndent(cfg, "", "\t")
	_ = os.WriteFile("config.sample.json", bts, 0644)
}
