package main

import (
	"encoding/json"
	"fmt"
	pbs "github.com/realbmail/contact-server/proto"
	"github.com/realbmail/contact-server/service"
	"github.com/spf13/cobra"
)

type startParam struct {
	level   int8
	address string
	query   bool
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
	flags.BoolVarP(&param.query, "query",
		"q", false, "dbtool.lnx -q [Address]")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		panic(err)
	}
}

func mainRun(_ *cobra.Command, _ []string) {
	var req = &pbs.AccountOperation{
		Address:   param.address,
		UserLevel: int32(param.level),
	}
	var url = "http://127.0.0.1:8887"
	api := url + "/update_user_level"
	if param.query {
		api = url + "/query_user_level"
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
