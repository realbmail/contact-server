package db_redis

import (
	"context"
	"github.com/go-redis/redis/v8"
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
