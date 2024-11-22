package db_redis

import "fmt"

type RedisCfg struct {
	Addr         string `json:"redis_addr"`
	Password     string `json:"redis_password"`
	DB           int    `json:"redis_db"`
	PoolSize     int    `json:"redis_pool_size"`
	MinIdleConns int    `json:"redis_min_idle_conns"`
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
	fmt.Println(c.String())
}
