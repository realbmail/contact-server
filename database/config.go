package database

import "fmt"

var __dbConf *DbCfg

const (
	DefaultFirestoreProjectID = "dessage"
	DefaultDatabaseID         = "bmail-contact"
)

type DbCfg struct {
	ProjectID   string `json:"project_id"`
	DatabaseID  string `json:"database_id"`
	KeyFilePath string `json:"key_file_path"`
	LocalRun    bool   `json:"local_run"`
}

func (c *DbCfg) String() string {
	s := "\n------file store config------"
	s += "\nlocal run:\t" + fmt.Sprintf("%t", c.LocalRun)
	s += "\nproject id:\t" + c.ProjectID
	s += "\ndatabase id:\t" + c.DatabaseID
	s += "\nkey path :\t" + c.KeyFilePath
	s += "\n--------------------------"
	return s
}

func InitConf(c *DbCfg) {
	__dbConf = c
	_ = DbInst()
}
