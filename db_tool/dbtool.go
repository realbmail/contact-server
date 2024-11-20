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
	action  int8
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
