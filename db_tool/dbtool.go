package main

import (
	"encoding/json"
	"fmt"
	pbs "github.com/realbmail/contact-server/proto"
	"github.com/realbmail/contact-server/service"
	"github.com/spf13/cobra"
	"github.com/syndtr/goleveldb/leveldb"
	"log"
)

type startParam struct {
	level     int8
	address   string
	action    int8
	localPath string
	debugPort string
	email     string
}

var param = &startParam{}
var rootCmd = &cobra.Command{
	Use: "dbtool",

	Short: "dbtool",

	Long: `usage description::TODO::`,

	Run: mainRun,
}

func init() {
	flags := rootCmd.Flags()
	flags.Int8VarP(&param.level, "level",
		"l", 1, "dbtool.lnx -l 1")
	flags.StringVarP(&param.address, "address",
		"a", "", "dbtool.lnx -a [Address]")
	flags.Int8VarP(&param.action, "actionTyp",
		"t", 0, "dbtool.lnx -t [Address]")
	flags.StringVarP(&param.localPath, "local-path",
		"p", "", "dbtool.lnx -p [path/to/database]")
	flags.StringVarP(&param.debugPort, "debug-port",
		"d", "8887", "dbtool.lnx -d [PORT]")
	flags.StringVarP(&param.email, "email",
		"e", "", "dbtool.lnx -e [EMAIL ADDRESS]")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		panic(err)
	}
}

func mainRun(_ *cobra.Command, _ []string) {
	if len(param.localPath) > 0 {
		readLocalAll(param.localPath)
		return
	}
	var req = &pbs.AccountOperation{
		Address:   param.address,
		UserLevel: int32(param.level),
		Emails:    []string{param.email},
	}
	var url = "http://127.0.0.1:" + param.debugPort
	var api = "" // := url + "/update_user_level"
	switch param.action {
	case 0:
		api = url + "/query_user_level"
		break
	case 1:
		api = url + "/update_user_level"
		break
	case 2:
		api = url + "/delete_user_level"
		break
	case 3:
		api = url + "/query_by_email"
		break
	}

	reqData, _ := json.Marshal(req)
	respData, err := service.DoHttp(api, "application/json", reqData)
	if err != nil {
		fmt.Println("-------->>>>:http failed:", err)
		if respData != nil {
			var rsp = service.Rsp{}
			_ = json.Unmarshal(respData, &rsp)
			fmt.Println(rsp)
		}
		return
	}

	var rsp = service.Rsp{}
	err = json.Unmarshal(respData, &rsp)
	if err != nil {
		fmt.Println("-------->>>>:parse json failed:", err)
		return
	}

	fmt.Println(rsp)
}

func readLocalAll(pathDir string) {
	// 打开 LevelDB 数据库
	db, err := leveldb.OpenFile(pathDir, nil)
	if err != nil {
		log.Fatalf("Failed to open leveldb: %v", err)
	}
	defer db.Close()

	// 创建一个迭代器遍历所有的键值对
	iter := db.NewIterator(nil, nil)
	defer iter.Release()

	fmt.Println("Reading all key-value pairs from testdb:")

	for iter.Next() {
		// 获取键值对
		key := iter.Key()
		value := iter.Value()

		// 输出键值对
		fmt.Printf("Key: %s, Value: %s\n", string(key), string(value))
	}

	// 检查迭代是否发生错误
	if err := iter.Error(); err != nil {
		log.Fatalf("Iterator error: %v", err)
	}
}
