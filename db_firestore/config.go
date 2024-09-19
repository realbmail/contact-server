package db_firestore

import "fmt"

var __dbConf *FSCfg

const (
	DefaultFirestoreProjectID = "dessage"
	DefaultDatabaseID         = "bmail-contact"
)

type FSCfg struct {
	ProjectID   string `json:"project_id"`
	DatabaseID  string `json:"database_id"`
	KeyFilePath string `json:"key_file_path"`
	LocalRun    bool   `json:"local_run"`
}

func (c *FSCfg) String() string {
	s := "\n------firestore config------"
	s += "\nlocal run:\t" + fmt.Sprintf("%t", c.LocalRun)
	s += "\nproject id:\t" + c.ProjectID
	s += "\ndatabase id:\t" + c.DatabaseID
	s += "\nkey path :\t" + c.KeyFilePath
	s += "\n--------------------------"
	return s
}

func InitConf(c *FSCfg) {
	__dbConf = c
	_ = DbInst()
}
