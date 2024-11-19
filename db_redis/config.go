package db_redis

import "fmt"

type RedisCfg struct {
	Addr         string `json:"addr"`
	Password     string `json:"password"`
	DB           int    `json:"db"`
	PoolSize     int    `json:"pool_size"`
	MinIdleConns int    `json:"min_idle_conns"`
}

func (c *RedisCfg) String() string {
	s := "\n========redis config========"
	s += "\nAddress:" + c.Addr
	s += fmt.Sprintf("\nDB NO:%d", c.DB)
	s += fmt.Sprintf("\nPool Size:%d", c.PoolSize)
	s += fmt.Sprintf("\nMin Idle Conns:%d", c.MinIdleConns)
	s += "\n============================"
	return s
}

var __dbConf *RedisCfg

func InitConf(c *RedisCfg) {
	__dbConf = c
}
