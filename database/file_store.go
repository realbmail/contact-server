package database

import (
	"cloud.google.com/go/firestore"
	"context"
	"google.golang.org/api/option"
	"os"
	"sync"
	"time"
)

const (
	DefaultDBTimeOut = 10 * time.Second
	DBTableContact   = "bmail-contact"
)

var _dbInst *DbManager
var databaseOnce sync.Once

type DbManager struct {
	fileCli *firestore.Client
	ctx     context.Context
	cancel  context.CancelFunc
}

func DbInst() *DbManager {
	databaseOnce.Do(func() {
		_dbInst = newDb()
	})
	return _dbInst
}

func newDb() *DbManager {
	ctx, cancel := context.WithCancel(context.Background())
	var client *firestore.Client
	var err error
	if __dbConf.LocalRun {
		_ = os.Setenv("FIRESTORE_EMULATOR_HOST", "localhost:8080")
		client, err = firestore.NewClientWithDatabase(ctx, __dbConf.ProjectID, __dbConf.DatabaseID)
	} else {
		client, err = firestore.NewClientWithDatabase(ctx, __dbConf.ProjectID,
			__dbConf.DatabaseID, option.WithCredentialsFile(__dbConf.KeyFilePath))
	}
	if err != nil {
		panic(err)
	}
	var dbm = &DbManager{
		fileCli: client,
		ctx:     ctx,
		cancel:  cancel,
	}
	return dbm
}
