package main

import (
	"fmt"
	"github.com/hopwesley/fdlimit"
	"github.com/realbmail/contact-server/common"
	"github.com/realbmail/contact-server/service"
	"github.com/realbmail/contact-server/wallet"
	"github.com/spf13/cobra"
	"os"
	"os/signal"
	"strconv"
	"syscall"
)

const (
	ConfigFIleName = "config.json"
	DefaultSrvPort = "8001"
)

var (
	param = &startParam{}
)

type startParam struct {
	version bool
	config  string
	port    string
}

var rootCmd = &cobra.Command{
	Use: "contactSrv",

	Short: "contactSrv",

	Long: `usage description::TODO::`,

	Run: mainRun,
}

func init() {
	flags := rootCmd.Flags()
	flags.BoolVarP(&param.version, "version",
		"v", false, "contactSrv.lnx -v")
	flags.StringVarP(&param.config, "conf",
		"c", ConfigFIleName, "contactSrv.lnx -c config.json")
	flags.StringVarP(&param.port, "port",
		"p", "", "contactSrv.lnx -p [PORT]")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		panic(err)
	}
}

func mainRun(_ *cobra.Command, _ []string) {

	if param.version {
		common.PrintVersion()
		return
	}

	if err := fdlimit.MaxIt(); err != nil {
		panic(err)
	}
	initConfig(param.config)
	_ = wallet.WInst()
	var srv = service.NewHttpService()
	go func() {
		srv.Start()
	}()

	waitShutdownSignal()
}

func waitShutdownSignal() {
	var pidFile = os.Args[0] + ".pid"
	pid := strconv.Itoa(os.Getpid())
	fmt.Printf("\n>>>>>>>>>>service start at pid(%s)<<<<<<<<<<\n", pid)
	if err := os.WriteFile(pidFile, []byte(pid), 0644); err != nil {
		fmt.Print("failed to write running pid", err)
	}
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh,
		syscall.SIGINT,
		syscall.SIGTERM,
		syscall.SIGQUIT,
		syscall.SIGUSR1,
		syscall.SIGUSR2)
	sig := <-sigCh
	fmt.Printf("\n>>>>>>>>>>service finished(%s)<<<<<<<<<<\n", sig)
}
