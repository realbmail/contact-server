package main

import (
	"encoding/json"
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
			CheckSignature: true,
			HttpPort:       "8001",
			RefreshContent: true,
			UseHttps:       false,
			SSLCertFile:    "",
			SSLKeyFile:     "",
			SessionKey:     "",
			SessionMaxAge:  1800,
		},
		FSCfg: &firestore.DbCfg{
			ProjectID:   firestore.DefaultFirestoreProjectID,
			DatabaseID:  firestore.DefaultDatabaseID,
			KeyFilePath: "dessage-c3b5c95267fb.json",
			LocalRun:    false,
		},
	}

	bts, _ := json.MarshalIndent(cfg, "", "\t")
	_ = os.WriteFile("config.sample.json", bts, 0644)
}
