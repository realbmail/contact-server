package main

import (
	"fmt"
	"github.com/realbmail/contact-server/db_leveldb"
	"github.com/spf13/cobra"
)

type startParam struct {
	level   int8
	address string
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
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		panic(err)
	}
}

func mainRun(_ *cobra.Command, _ []string) {
	err := db_leveldb.DbInst().UpdateAccountLevel(param.address, param.level)
	if err != nil {
		fmt.Println("failed to update account level:", err)
		return
	}
	fmt.Println("update account level success")
}
