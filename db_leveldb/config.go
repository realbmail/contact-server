package db_leveldb

const (
	DefaultDBPath = "./database"
)

var __dbConf *LBCfg

type LBCfg struct {
	DBPath string `json:"db_path"`
}

func (c *LBCfg) String() string {
	s := "\n------level levelDB config------"
	s += "\ndatabase path:\t" + c.DBPath
	s += "\n--------------------------"
	return s
}

func InitConf(c *LBCfg) {
	__dbConf = c
	_ = DbInst()
}
