package service

import (
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"github.com/realbmail/contact-server/common"
	pbs "github.com/realbmail/contact-server/proto"
	"github.com/realbmail/contact-server/wallet"
	"google.golang.org/protobuf/proto"
	"testing"
)

const (
	api_url = "http://127.0.0.1:8001"
	//api_url = "https://sharp-happy-grouse.ngrok-free.app"
	//api_url = "https://dessage.xyz/bmail_server"
)

var address string
var address2 string

func init() {
	flag.StringVar(&address, "addr", "", "addr")
	flag.StringVar(&address2, "addr2", "", "addr2")
}

func TestKeepAlive(t *testing.T) {
	var req = &Req{}
	api := api_url + "/keep_alive"
	reqData, _ := json.Marshal(req)
	respData, err := DoHttp(api, "application/json", reqData)
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
	var contact common.BMailAccount
	err = json.Unmarshal([]byte(contactStr), &contact)
	if err != nil {
		fmt.Println("failed to parse contact:", err.Error())
		return
	}
	fmt.Println("email:=>", contact.EMailAddress)
}

func TestQueryByOneEmail(t *testing.T) {
	obj := &QueryReq{
		OneEmailAddr: address,
	}
	var req = &Req{PayLoad: obj, Signature: "", AccountID: ""}
	api := api_url + "/query_by_one_email"
	reqData, _ := json.Marshal(req)
	respData, err := DoHttp(api, "application/json", reqData)
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

func TestQueryByEmailArray(t *testing.T) {
	obj := QueryReq{
		EmailAddrArr: []string{
			address,
			address2,
		},
	}

	var req = &Req{PayLoad: &obj, Signature: "", AccountID: ""}
	api := api_url + "/query_by_email_array"
	reqData, _ := json.Marshal(req)
	respData, err := DoHttp(api, "application/json", reqData)
	if err != nil {
		t.Fatalf("http failed:%v", err)
	}
	var rsp = Rsp{}
	err = json.Unmarshal(respData, &rsp)
	if err != nil {
		t.Fatal(err)
	}
	fmt.Println(rsp)
	var account = make(map[string]common.EmailReflect)
	contactStr, _ := rsp.Payload.(string)
	_ = json.Unmarshal([]byte(contactStr), &account)
	fmt.Println(account)
}

func TestQueryAccounts(t *testing.T) {
	obj := &QueryReq{
		BMailAddr: address,
	}
	var req = &Req{PayLoad: obj, Signature: "", AccountID: ""}
	api := api_url + "/query_account"
	reqData, _ := json.Marshal(req)
	respData, err := DoHttp(api, "application/json", reqData)
	if err != nil {
		t.Fatalf("http failed:%v", err)
	}
	var rsp = Rsp{}
	err = json.Unmarshal(respData, &rsp)
	if err != nil {
		t.Fatal(err)
	}
	fmt.Println(rsp)
	var bmc common.BMailAccount
	_ = json.Unmarshal([]byte(rsp.Payload.(string)), &bmc)
	fmt.Println(bmc.EMailAddress)
}

func TestAddContact(t *testing.T) {
	obj := &Operation{
		IsDel:     false,
		BMailAddr: "BM6ED6c4nAJQnLzApmuKSC1uaDFoQVpFTUGyDdixLYj5bw",
		EmailAddr: []string{
			"ribencong@gmail.com",
			"ribencong@126.com",
			"ribencong@163.com",
			"99927800@qq.com",
			"hopwesley@126.com",
		},
	}
	var req = &Req{
		PayLoad:   obj,
		Signature: "",
		AccountID: "",
	}
	api := api_url + "/operate_account"
	reqData, _ := json.Marshal(req)
	respData, err := DoHttp(api, "application/json", reqData)
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
	obj := &Operation{
		IsDel:     true,
		BMailAddr: "BM6ED6c4nAJQnLzApmuKSC1uaDFoQVpFTUGyDdixLYj5bw",
		EmailAddr: []string{
			"ribencong@gmail.com",
			"99927800@qq.com",
			"hopwesley@126.com",
		},
	}
	var req = &Req{
		PayLoad:   obj,
		Signature: "",
		AccountID: "",
	}

	api := api_url + "/operate_account"
	reqData, _ := json.Marshal(req)
	respData, err := DoHttp(api, "application/json", reqData)
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

func TestProtoQueryByOneEmail(t *testing.T) {
	seed, err := hex.DecodeString("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1")
	if err != nil {
		t.Fatal(err)
	}
	key := wallet.NewMailKeyFromSeed(seed)
	obj := &pbs.QueryReq{
		OneEmailAddr: address,
	}

	payload := common.MustProto(obj)
	sig := key.SignMessage(payload)
	var req = &pbs.BMReq{Payload: payload, Signature: sig, Address: key.Address.BmailAddress}
	api := api_url + "/query_by_one_email"
	respData, err := DoHttp(api, "application/x-protobuf", common.MustProto(req))
	if err != nil {
		t.Fatalf("http failed:%v", err)
	}
	var rsp = pbs.BMRsp{}
	err = proto.Unmarshal(respData, &rsp)
	if err != nil {
		t.Fatal(err)
	}

	fmt.Println(rsp.Success)
	if !rsp.Success {
		t.Fatal("response success")
	}
	var contact = pbs.EmailReflect{}
	err = proto.Unmarshal(rsp.Payload, &contact)
	if err != nil {
		t.Fatal(err)
	}

	fmt.Println(key.Address, contact.String())
}

func TestProtoQueryByEmailArray(t *testing.T) {
	seed, err := hex.DecodeString("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1")
	if err != nil {
		t.Fatal(err)
	}
	key := wallet.NewMailKeyFromSeed(seed)

	obj := &pbs.QueryReq{
		EmailList: []string{
			address,
			address2,
		},
	}
	payload := common.MustProto(obj)
	sig := key.SignMessage(payload)
	var req = &pbs.BMReq{Payload: payload, Signature: sig, Address: key.Address.BmailAddress}

	api := api_url + "/query_by_email_array"
	respData, err := DoHttp(api, "application/x-protobuf", common.MustProto(req))
	if err != nil {
		t.Fatalf("http failed:%v", err)
	}
	var rsp = pbs.BMRsp{}
	err = proto.Unmarshal(respData, &rsp)
	if err != nil {
		t.Fatal(err)
	}

	fmt.Println(rsp.Success)
	if !rsp.Success {
		t.Fatal("response success")
	}

	var contact = pbs.EmailReflects{}
	err = proto.Unmarshal(rsp.Payload, &contact)
	if err != nil {
		t.Fatal(err)
	}

	fmt.Println(key.Address, contact.String())
}

func TestProtoQueryAccounts(t *testing.T) {

	seed, err := hex.DecodeString("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1")
	if err != nil {
		t.Fatal(err)
	}
	key := wallet.NewMailKeyFromSeed(seed)

	obj := &pbs.BMReq{
		Address: key.Address.BmailAddress,
	}

	payload := common.MustProto(obj)
	sig := key.SignMessage(payload)

	var req = &pbs.BMReq{Payload: common.MustProto(obj), Signature: sig, Address: key.Address.BmailAddress}
	api := api_url + "/query_account"
	respData, err := DoHttp(api, "application/x-protobuf", common.MustProto(req))
	if err != nil {
		t.Fatalf("http failed:%v", err)
	}
	var rsp = pbs.BMRsp{}

	err = proto.Unmarshal(respData, &rsp)
	if err != nil {
		t.Fatal(err)
	}

	fmt.Println(rsp.Success)
	if !rsp.Success {
		t.Fatal("response success")
	}

	var bmc = &pbs.BMailAccount{}

	err = proto.Unmarshal(rsp.Payload, bmc)
	if err != nil {
		t.Fatal(err)
	}

	fmt.Println(key.Address, bmc.String())
}

func TestActiveAccount(t *testing.T) {
	seed, err := hex.DecodeString("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1")
	if err != nil {
		t.Fatal(err)
	}
	key := wallet.NewMailKeyFromSeed(seed)

	var action = &pbs.AccountOperation{
		Address: key.Address.BmailAddress,
	}

	payload := common.MustProto(action)
	sig := key.SignMessage(payload)
	var request = &pbs.BMReq{
		Address:   key.Address.BmailAddress,
		Payload:   payload,
		Signature: sig,
	}
	api := api_url + "/account_active"
	respData, err := DoHttp(api, "application/x-protobuf", common.MustProto(request))
	if err != nil {
		t.Fatalf("http failed:%v", err)
	}
	var rsp = pbs.BMRsp{}

	err = proto.Unmarshal(respData, &rsp)
	if err != nil {
		t.Fatal(err)
	}

	fmt.Println("======>>> active result:=>", rsp.Success)
}

func TestBindAccount(t *testing.T) {
	seed, err := hex.DecodeString("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1")
	if err != nil {
		t.Fatal(err)
	}
	key := wallet.NewMailKeyFromSeed(seed)

	var action = &pbs.BindAction{
		Address: key.Address.BmailAddress,
		Mail:    address,
	}

	payload := common.MustProto(action)
	sig := key.SignMessage(payload)
	var request = &pbs.BMReq{
		Address:   key.Address.BmailAddress,
		Payload:   payload,
		Signature: sig,
	}
	api := api_url + "/bind_account"
	respData, err := DoHttp(api, "application/x-protobuf", common.MustProto(request))
	if err != nil {
		t.Fatalf("http failed:%v", err)
	}
	var rsp = pbs.BMRsp{}

	err = proto.Unmarshal(respData, &rsp)
	if err != nil {
		t.Fatal(err)
	}

	fmt.Println("======>>> bind result:=>", rsp.Success, rsp.Msg)
}

func TestBindAccQuery(t *testing.T) {
	seed, err := hex.DecodeString("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1")
	if err != nil {
		t.Fatal(err)
	}
	key := wallet.NewMailKeyFromSeed(seed)

	var action = &pbs.QueryReq{
		Address: key.Address.BmailAddress,
	}

	payload := common.MustProto(action)
	sig := key.SignMessage(payload)
	var request = &pbs.BMReq{
		Address:   key.Address.BmailAddress,
		Payload:   payload,
		Signature: sig,
	}
	api := api_url + "/query_account"
	respData, err := DoHttp(api, "application/x-protobuf", common.MustProto(request))
	if err != nil {
		t.Fatalf("http failed:%v", err)
	}
	var rsp = pbs.BMRsp{}

	err = proto.Unmarshal(respData, &rsp)
	if err != nil {
		t.Fatal(err)
	}

	fmt.Println("======>>> bind result:=>", rsp.Success)
	var result = &pbs.BMailAccount{}
	_ = proto.Unmarshal(rsp.Payload, result)
	fmt.Println("======>>> bind info:=>", result)
}

func TestBindEmailQuery(t *testing.T) {
	seed, err := hex.DecodeString("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1")
	if err != nil {
		t.Fatal(err)
	}
	key := wallet.NewMailKeyFromSeed(seed)

	var action = &pbs.QueryReq{
		OneEmailAddr: address,
	}

	payload := common.MustProto(action)
	sig := key.SignMessage(payload)
	var request = &pbs.BMReq{
		Address:   key.Address.BmailAddress,
		Payload:   payload,
		Signature: sig,
	}
	api := api_url + "/query_by_one_email"
	respData, err := DoHttp(api, "application/x-protobuf", common.MustProto(request))
	if err != nil {
		t.Fatalf("http failed:%v", err)
	}
	var rsp = pbs.BMRsp{}

	err = proto.Unmarshal(respData, &rsp)
	if err != nil {
		t.Fatal(err)
	}

	fmt.Println("======>>> bind result:=>", rsp.Success)
	var result = &pbs.EmailReflect{}
	_ = proto.Unmarshal(rsp.Payload, result)
	fmt.Println("======>>> bind info:=>", result)
}

func TestBindEmailArrQuery(t *testing.T) {
	seed, err := hex.DecodeString("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1")
	if err != nil {
		t.Fatal(err)
	}
	key := wallet.NewMailKeyFromSeed(seed)

	var action = &pbs.QueryReq{
		EmailList: []string{address, address2},
	}

	payload := common.MustProto(action)
	sig := key.SignMessage(payload)
	var request = &pbs.BMReq{
		Address:   key.Address.BmailAddress,
		Payload:   payload,
		Signature: sig,
	}
	api := api_url + "/query_by_email_array"
	respData, err := DoHttp(api, "application/x-protobuf", common.MustProto(request))
	if err != nil {
		t.Fatalf("http failed:%v", err)
	}
	var rsp = pbs.BMRsp{}

	err = proto.Unmarshal(respData, &rsp)
	if err != nil {
		t.Fatal(err)
	}

	fmt.Println("======>>> bind result:=>", rsp.Success)
	var result = &pbs.EmailReflects{}
	_ = proto.Unmarshal(rsp.Payload, result)
	fmt.Println("======>>> bind info:=>", result)
}
