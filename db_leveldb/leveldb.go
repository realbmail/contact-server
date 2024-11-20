package db_leveldb

import (
	"fmt"
	pbs "github.com/realbmail/contact-server/proto"
	"github.com/syndtr/goleveldb/leveldb"
	"sync"
)

const (
	TableAccount = "__table_account__"
	TableEmail   = "__table_email__"
)

var (
	instance *DbManager
	once     sync.Once
)

type DbManager struct {
	levelDB *leveldb.DB
	locker  sync.Map
}

func (dm *DbManager) UpdateContactDetails(address string, contacts []*pbs.ContactItem, isDel bool) error {
	return fmt.Errorf("implement me")
}

func (dm *DbManager) QueryContacts(address string, startAfterEmail string) ([]*pbs.ContactItem, error) {
	return nil, fmt.Errorf("implement me")
}

func DbInst() *DbManager {
	once.Do(func() {
		db, err := leveldb.OpenFile("database", nil)
		if err != nil {
			panic(err)
		}
		instance = &DbManager{
			levelDB: db,
		}
	})
	return instance
}

func CloseDB() {
	if instance != nil {
		_ = instance.levelDB.Close()
	}
}

func (dm *DbManager) getLock(key string) *sync.Mutex {
	lockInst, _ := dm.locker.LoadOrStore(key, &sync.Mutex{})
	lock := lockInst.(*sync.Mutex)
	lock.Lock()
	return lock
}

func (dm *DbManager) releaseLock(key string, lock *sync.Mutex) {
	lock.Unlock()
	dm.locker.Delete(key)
}

// 检查字符串切片中是否包含特定字符串
func contains(slice []string, item string) bool {
	for _, v := range slice {
		if v == item {
			return true
		}
	}
	return false
}

// 从字符串切片中移除特定字符串
func remove(slice []string, item string) []string {
	var result []string
	for _, v := range slice {
		if v != item {
			result = append(result, v)
		}
	}
	return result
}
func (dm *DbManager) DeleteAccount(bmailAddr string) error {
	panic("implement me")
}
