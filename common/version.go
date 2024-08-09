package common

import "fmt"

var (
	Version   string
	Commit    string
	BuildTime string
)

func PrintVersion() {
	fmt.Println("\n==================================================")
	fmt.Printf("Version:\t%s\n", Version)
	fmt.Printf("Build:\t\t%s\n", BuildTime)
	fmt.Printf("Commit:\t\t%s\n", Commit)
	fmt.Println("==================================================")
}
