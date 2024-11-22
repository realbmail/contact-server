package db_redis

import (
	"context"
	"github.com/go-redis/redis/v8"
	"github.com/realbmail/contact-server/common"
	pbs "github.com/realbmail/contact-server/proto"
	"sync"
)

const (
	TableAccount = "account:"
	TableEmail   = "email:"
)

var (
	instance *DbManager
	once     sync.Once
)

type DbManager struct {
	cli *redis.Client
	ctx context.Context
}

func (rdm *DbManager) UpdateContactDetails(address string, contacts []*pbs.ContactItem, isDel bool) error {
	panic("unsupported now")
}

func (rdm *DbManager) QueryContacts(address string, startAfterEmail string) ([]*pbs.ContactItem, error) {
	panic("unsupported now")
}

func DbInst() *DbManager {
	once.Do(func() {
		instance = &DbManager{
			ctx: context.Background(),
			cli: redis.NewClient(&redis.Options{
				Addr:         __dbConf.Addr,     //"localhost:6379", // Redis地址
				Password:     __dbConf.Password, // 密码（如果有的话）
				DB:           __dbConf.DB,
				PoolSize:     __dbConf.PoolSize,
				MinIdleConns: __dbConf.MinIdleConns,
			}),
		}
	})
	return instance
}

func (rdm *DbManager) KeepAlive() bool {
	_, err := rdm.cli.Ping(rdm.ctx).Result()
	if err != nil {
		return false
	}
	return true
}

func (rdm *DbManager) CreateActiveLink(data *common.ActiveLinkData) error {
	panic("api not support any more")
}

func (rdm *DbManager) GetActiveLink(token string) (*common.ActiveLinkData, error) {
	panic("api not support any more")
}
