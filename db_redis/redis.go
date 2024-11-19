package db_redis

import (
	"context"
	"github.com/go-redis/redis/v8"
	"github.com/realbmail/contact-server/common"
	pbs "github.com/realbmail/contact-server/proto"
	"sync"
)

var (
	instance *DbManager
	once     sync.Once
)

type DbManager struct {
	cli *redis.Client
	ctx context.Context
}

func (rdm *DbManager) QueryReflectByOneEmail(emailAddr string) (*common.EmailReflect, error) {
	//TODO implement me
	panic("implement me")
}

func (rdm *DbManager) QueryReflectsByEmails(emailAddrs []string) (map[string]common.EmailReflect, error) {
	//TODO implement me
	panic("implement me")
}

func (rdm *DbManager) QueryAccount(bmailAddr string) (*common.BMailAccount, error) {
	//TODO implement me
	panic("implement me")
}

func (rdm *DbManager) OperateAccount(bmailAddr string, emailAddr []string, isDel bool) error {
	//TODO implement me
	panic("implement me")
}

func (rdm *DbManager) ActiveAccount(accountId string, level int8) error {
	//TODO implement me
	panic("implement me")
}

func (rdm *DbManager) UpdateAccountLevel(accountId string, level int8) error {
	//TODO implement me
	panic("implement me")
}

func (rdm *DbManager) UpdateBinding(bmailAddr string, emailAddr string) error {
	//TODO implement me
	panic("implement me")
}

func (rdm *DbManager) DeleteBinding(bmailAddr string, emailAddr string) error {
	//TODO implement me
	panic("implement me")
}

func (rdm *DbManager) UpdateContactDetails(address string, contacts []*pbs.ContactItem, isDel bool) error {
	//TODO implement me
	panic("implement me")
}

func (rdm *DbManager) QueryContacts(address string, startAfterEmail string) ([]*pbs.ContactItem, error) {
	//TODO implement me
	panic("implement me")
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
