package db_leveldb

import (
	"github.com/syndtr/goleveldb/leveldb"
	"sync"
)

var (
	instance *DbManager
	once     sync.Once
)

type DbManager struct {
	db *leveldb.DB
}

func DbInst() *DbManager {
	once.Do(func() {
		db, err := leveldb.OpenFile("./database", nil)
		if err != nil {
			panic(err)
		}
		instance = &DbManager{
			db: db,
		}
	})
	return instance
}

func CloseDB() {
	if instance != nil {
		_ = instance.db.Close()
	}
}
