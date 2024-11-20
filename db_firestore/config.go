package db_firestore

import "fmt"

var __dbConf *FsCfg

const (
	DefaultFirestoreProjectID = "dessage"
	DefaultDatabaseID         = "bmail-contact"
)

type FsCfg struct {
	ProjectID   string `json:"project_id"`
	DatabaseID  string `json:"database_id"`
	KeyFilePath string `json:"key_file_path"`
	LocalRun    bool   `json:"local_run"`
}

func (c *FsCfg) String() string {
	s := "\n------firestore config------"
	s += "\nlocal run:\t" + fmt.Sprintf("%t", c.LocalRun)
	s += "\nproject id:\t" + c.ProjectID
	s += "\ndatabase id:\t" + c.DatabaseID
	s += "\nkey path :\t" + c.KeyFilePath
	s += "\n--------------------------"
	return s
}

func InitConf(c *FsCfg) {
	__dbConf = c
	fmt.Println(c.String())
}
