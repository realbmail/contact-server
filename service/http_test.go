package service

import (
	"encoding/json"
	"flag"
	"fmt"
	"github.com/realbmail/contact-server/database"
	"testing"
)

var address string

func init() {
	flag.StringVar(&address, "addr", "", "addr")
}

func TestKeepAlive(t *testing.T) {
	var req = &Req{}
	api := "http://localhost:8001" + "/keep_alive"
	reqData, _ := json.Marshal(req)
	respData, err := doHttp(api, "application/json", reqData)
	if err != nil {
		t.Fatalf("http failed:%v", err)
	}
	var rsp = Rsp{}
	err = json.Unmarshal(respData, &rsp)
	if err != nil {
		t.Fatal(err)
	}
	fmt.Println(rsp)
	contactStr, ok := rsp.Payload.(string)
	if !ok {
		fmt.Println("failed to parse contact data")
		return
	}
	var contact database.BMailContact
	err = json.Unmarshal([]byte(contactStr), &contact)
	if err != nil {
		fmt.Println("failed to parse contact:", err.Error())
		return
	}
	fmt.Println("email:=>", contact.EMailAddress)
	fmt.Println("bmail:=>", contact.BMailAddress)
}

func TestQueryByEmail(t *testing.T) {
	var req = &Req{EmailAddr: address}
	api := "http://localhost:8001" + "/query_by_email"
	reqData, _ := json.Marshal(req)
	respData, err := doHttp(api, "application/json", reqData)
	if err != nil {
		t.Fatalf("http failed:%v", err)
	}
	var rsp = Rsp{}
	err = json.Unmarshal(respData, &rsp)
	if err != nil {
		t.Fatal(err)
	}
	fmt.Println(rsp)
}

func TestQueryByBMail(t *testing.T) {
	var req = &Req{BMailAddr: address}
	api := "http://localhost:8001" + "/query_by_bmail"
	reqData, _ := json.Marshal(req)
	respData, err := doHttp(api, "application/json", reqData)
	if err != nil {
		t.Fatalf("http failed:%v", err)
	}
	var rsp = Rsp{}
	err = json.Unmarshal(respData, &rsp)
	if err != nil {
		t.Fatal(err)
	}
	fmt.Println(rsp)
}
