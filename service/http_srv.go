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
	var c = database.BMailContact{
		EMailAddress: []string{"ri", "ben", "con"},
	}
	WriteJsonRequest(w, Rsp{Success: true, Payload: common.MustJson(c)})
}

func queryContactByEmail(w http.ResponseWriter, r *http.Request) {
	var request = Req{}
	var err = ReadJsonRequest(r, &request)
	if err != nil {
		common.LogInst().Err(err).Msg("read parameter for query by email failed")
		WriteError(w, err)
		return
	}
	response, err := QueryByEmail(&request)
	if err != nil {
		WriteError(w, err)
		common.LogInst().Err(err).Msg("query by email error")
		return
	}
	WriteJsonRequest(w, response)
}

func queryContactByBMail(w http.ResponseWriter, r *http.Request) {
	var request = Req{}
	var err = ReadJsonRequest(r, &request)
	if err != nil {
		common.LogInst().Err(err).Msg("read parameter for query by bmail failed")
		WriteError(w, err)
		return
	}
	response, err := QueryByBMail(&request)
	if err != nil {
		common.LogInst().Err(err).Msg("query by bmail error")
		WriteError(w, err)
		return
	}
	WriteJsonRequest(w, response)
}

func operateContact(w http.ResponseWriter, r *http.Request) {
	var request = Req{}
	var err = ReadJsonRequest(r, &request)
	if err != nil {
		common.LogInst().Err(err).Msg("read operation action parameter error")
		WriteError(w, err)
		return
	}
	response, err := OperateContact(&request)
	if err != nil {
		WriteError(w, err)
		common.LogInst().Err(err).Msg("operation action error")
		return
	}
	WriteJsonRequest(w, response)
}

func NewHttpService() *Service {
	var s = &Service{}
	r := chi.NewRouter()
	r.Use(middleware.Recoverer)
	r.HandleFunc("/keep_alive", keepAlive)
	r.MethodFunc(http.MethodPost, "/keep_alive", keepAlive)
	r.MethodFunc(http.MethodPost, "/query_by_email", queryContactByEmail)
	r.MethodFunc(http.MethodPost, "/query_by_bmail", queryContactByBMail)
	r.MethodFunc(http.MethodPost, "/operate_contact", operateContact)
	s.router = r
	return s
}

func QueryByEmail(request *Req) (*Rsp, error) {
	var rsp = &Rsp{Success: true}
	var query = request.QueryReq
	if query == nil || len(query.EmailAddr) <= 0 {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid email address")
	}
	contact, err := database.DbInst().QueryContactByEmailAddr(query.EmailAddr)
	if err != nil {
		return nil, common.NewBMError(common.BMErrDatabase, "failed to query by email:"+err.Error())
	}
	rsp.Payload = common.MustJson(contact)
	common.LogInst().Debug().Msg("query by email address success:")
	return rsp, nil
}

func QueryByBMail(request *Req) (*Rsp, error) {
	var rsp = &Rsp{Success: true}
	var query = request.QueryReq
	if query == nil || len(query.BMailAddr) <= 0 {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid bmail address")
	}
	contact, err := database.DbInst().QueryContactByBMailAddr(query.BMailAddr)
	if err != nil {
		return nil, common.NewBMError(common.BMErrDatabase, "failed to query by bmail:"+err.Error())
	}
	rsp.Payload = common.MustJson(contact)
	common.LogInst().Debug().Msg("query by bmail address success:")
	return rsp, nil
}

func OperateContact(request *Req) (*Rsp, error) {
	var rsp = &Rsp{Success: true}
	var operation = request.Operation
	if operation == nil {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid operation parameter")
	}
	err := database.DbInst().OperateBMail(operation.BMailAddr, operation.EmailAddr, operation.IsDel)
	if err != nil {
		return nil, err
	}
	return rsp, nil
}
