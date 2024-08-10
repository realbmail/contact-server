package service

import (
	"fmt"
	"github.com/go-chi/chi/v5"
	"github.com/realbmail/contact-server/common"
	"github.com/realbmail/contact-server/database"
	"net/http"

	"github.com/go-chi/chi/v5/middleware"
)

type Service struct {
	router *chi.Mux
}

func (s *Service) Start() {
	if __httpConf.UseHttps {
		fmt.Println("https service start success:", __httpConf.HttpPort)
		panic(http.ListenAndServeTLS(":"+__httpConf.HttpPort, __httpConf.SSLCertFile, __httpConf.SSLKeyFile, s.router))
	} else {
		fmt.Println("http service start success:", __httpConf.HttpPort)
		panic(http.ListenAndServe(":"+__httpConf.HttpPort, s.router))
	}
}
func keepAlive(w http.ResponseWriter, r *http.Request) {
	var c = database.BMailAccount{
		EMailAddress: []string{"ri", "ben", "con"},
	}
	WriteJsonRequest(w, Rsp{Success: true, Payload: common.MustJson(c)})
}

func callFunc(callback func(request *Req) (*Rsp, error)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		var request = Req{}
		var err = ReadJsonRequest(r, &request)
		if err != nil {
			common.LogInst().Err(err).Msg("read parameter for query by email failed")
			WriteError(w, err)
			return
		}
		response, err := callback(&request)
		if err != nil {
			WriteError(w, err)
			common.LogInst().Err(err).Msg("query by email error")
			return
		}
		WriteJsonRequest(w, response)
	}
}

func NewHttpService() *Service {
	var s = &Service{}
	r := chi.NewRouter()
	r.Use(middleware.Recoverer)
	r.HandleFunc("/keep_alive", keepAlive)
	r.MethodFunc(http.MethodPost, "/keep_alive", keepAlive)
	r.MethodFunc(http.MethodPost, "/query_by_email", callFunc(QueryByEmail))
	r.MethodFunc(http.MethodPost, "/query_account", callFunc(QueryAccount))
	r.MethodFunc(http.MethodPost, "/operate_contact", callFunc(OperateContact))
	r.MethodFunc(http.MethodPost, "/account_create", callFunc(AccountCreate))
	s.router = r
	return s
}

func QueryByEmail(request *Req) (*Rsp, error) {
	var rsp = &Rsp{Success: true}
	var query = request.QueryReq
	if query == nil || len(query.EmailAddr) <= 0 {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid email address")
	}
	contact, err := database.DbInst().QueryAccountByEmail(query.EmailAddr)
	if err != nil {
		return nil, common.NewBMError(common.BMErrDatabase, "failed to query by email:"+err.Error())
	}
	rsp.Payload = common.MustJson(contact)
	common.LogInst().Debug().Msg("query by email address success")
	return rsp, nil
}

func QueryAccount(request *Req) (*Rsp, error) {
	var rsp = &Rsp{Success: true}
	var query = request.QueryReq
	if query == nil || len(query.BMailAddr) <= 0 {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid bmail address")
	}
	contact, err := database.DbInst().QueryAccount(query.BMailAddr)
	if err != nil {
		return nil, common.NewBMError(common.BMErrDatabase, "failed to query by bmail:"+err.Error())
	}
	rsp.Payload = common.MustJson(contact)
	common.LogInst().Debug().Msg("query by bmail address success")
	return rsp, nil
}

func OperateContact(request *Req) (*Rsp, error) {
	var rsp = &Rsp{Success: true}
	var operation = request.Operation
	if operation == nil || len(operation.EmailAddr) == 0 {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid operation parameter")
	}
	err := database.DbInst().OperateAccount(operation.BMailAddr, operation.EmailAddr, operation.IsDel)
	if err != nil {
		return nil, err
	}

	common.LogInst().Debug().Bool("is-deletion", operation.IsDel).
		Str("bmail", operation.BMailAddr).Msg("operate contact success")
	return rsp, nil
}

func AccountCreate(request *Req) (*Rsp, error) {
	var rsp = &Rsp{Success: true}
	var operation = request.Operation

	if operation == nil || operation.IsDel {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid account creation parameter")
	}

	err := database.DbInst().CreateBMailAccount(operation.BMailAddr, database.UserLevelFree)
	if err != nil {
		return nil, err
	}

	common.LogInst().Debug().Str("bmail", operation.BMailAddr).Msg("account creation success")
	return rsp, nil
}
