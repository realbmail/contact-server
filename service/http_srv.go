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
		EMailAddress: "ri",
		BMailAddress: "xx",
	}
	WriteJsonRequest(w, Rsp{Success: true, Payload: c.MustJson()})
}
func queryContactByEmail(w http.ResponseWriter, r *http.Request) {
	var request = Req{}
	var err = ReadJsonRequest(r, &request)
	if err != nil {
		WriteError(w, err)
		return
	}
	response, err := QueryByEmail(&request)
	if err != nil {
		WriteError(w, err)
		return
	}
	WriteJsonRequest(w, response)
}
func queryContactByBMail(w http.ResponseWriter, r *http.Request) {
	var request = Req{}
	var err = ReadJsonRequest(r, &request)
	if err != nil {
		WriteError(w, err)
		return
	}
	response, err := QueryByBMail(&request)
	if err != nil {
		WriteError(w, err)
		return
	}
	WriteJsonRequest(w, response)
}

func NewHttpService() *Service {
	var s = &Service{}
	r := chi.NewRouter()
	r.Use(middleware.RequestLogger(&middleware.DefaultLogFormatter{Logger: common.LogInst(), NoColor: true}))
	r.Use(middleware.Recoverer)
	r.HandleFunc("/keep_alive", keepAlive)
	r.MethodFunc(http.MethodPost, "/keep_alive", keepAlive)
	r.MethodFunc(http.MethodPost, "/query_by_email", queryContactByEmail)
	r.MethodFunc(http.MethodPost, "/query_by_bmail", queryContactByBMail)
	s.router = r
	return s
}

func QueryByEmail(request *Req) (*Rsp, error) {
	var rsp = &Rsp{Success: true}
	if len(request.EmailAddr) <= 0 {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid email address")
	}
	contact, err := database.DbInst().QueryContactByEmailAddr(request.EmailAddr)
	if err != nil {
		return nil, common.NewBMError(common.BMErrDatabase, "failed to query by email:"+err.Error())
	}
	rsp.Payload = contact.MustJson()
	return rsp, nil
}

func QueryByBMail(request *Req) (*Rsp, error) {
	var rsp = &Rsp{Success: true}
	if len(request.BMailAddr) <= 0 {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid bmail address")
	}
	contact, err := database.DbInst().QueryContactByBMailAddr(request.BMailAddr)
	if err != nil {
		return nil, common.NewBMError(common.BMErrDatabase, "failed to query by bmail:"+err.Error())
	}
	rsp.Payload = contact.MustJson()
	return rsp, nil
}
