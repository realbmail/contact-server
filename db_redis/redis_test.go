package db_redis

import (
	"fmt"
	"testing"
)

func TestPing(t *testing.T) {
	InitConf(&RedisCfg{
		Addr:         "localhost:6379",
		Password:     "foobared",
		DB:           0,
		PoolSize:     10,
		MinIdleConns: 3,
	})
	fmt.Print("ping result:\n", DbInst().KeepAlive())
}
