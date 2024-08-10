package service

import (
	"encoding/json"
	"flag"
	"fmt"
	"github.com/realbmail/contact-server/database"
	"testing"
)

const (
	//api_url = "http://localhost:8001"
	api_url = "https://sharp-happy-grouse.ngrok-free.app"
)

var address string

func init() {
	flag.StringVar(&address, "addr", "", "addr")
}

func TestKeepAlive(t *testing.T) {
	var req = &Req{}
	api := api_url + "/keep_alive"
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
	var contact database.BMailAccount
	err = json.Unmarshal([]byte(contactStr), &contact)
	if err != nil {
		fmt.Println("failed to parse contact:", err.Error())
		return
	}
	fmt.Println("email:=>", contact.EMailAddress)
}

func TestQueryByEmail(t *testing.T) {
	var req = &Req{QueryReq: &QueryReq{
		EmailAddr: address,
	}}
	api := api_url + "/query_by_email"
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

func TestQueryAccounts(t *testing.T) {
	var req = &Req{QueryReq: &QueryReq{
		BMailAddr: address,
	}}
	api := api_url + "/query_account"
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
	var bmc database.BMailAccount
	json.Unmarshal([]byte(rsp.Payload.(string)), &bmc)
	fmt.Println(bmc.EMailAddress)
}

func TestAddContact(t *testing.T) {
	var req = &Req{
		Operation: &Operation{
			IsDel:     false,
			BMailAddr: "BM6ED6c4nAJQnLzApmuKSC1uaDFoQVpFTUGyDdixLYj5bw",
			EmailAddr: []string{
				"ribencong@gmail.com",
				"ribencong@126.com",
				"ribencong@163.com",
				"99927800@qq.com",
				"hopwesley@126.com",
			},
		},
	}
	api := api_url + "/operate_contact"
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

func TestRemoveContact(t *testing.T) {
	var req = &Req{
		Operation: &Operation{
			IsDel:     true,
			BMailAddr: "BM6ED6c4nAJQnLzApmuKSC1uaDFoQVpFTUGyDdixLYj5bw",
			EmailAddr: []string{
				"ribencong@gmail.com",
				"99927800@qq.com",
				"hopwesley@126.com",
			},
		},
	}

	api := api_url + "/operate_contact"
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
