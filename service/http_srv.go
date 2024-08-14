package service

import (
	"fmt"
	"github.com/go-chi/chi/v5"
	"github.com/realbmail/contact-server/common"
	"github.com/realbmail/contact-server/database"
	pbs "github.com/realbmail/contact-server/proto"
	"google.golang.org/protobuf/proto"
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

func keepAlive2(w http.ResponseWriter, r *http.Request) {
	WriteProtoResponse(w, &pbs.BMRsp{Success: true})
}

func callFunc(callback func(request *pbs.BMReq) (*pbs.BMRsp, error)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		request, err := ReadProtoRequest(w, r)
		if err != nil {
			common.LogInst().Err(err).Msg("read parameter for query by email failed")
			WriteError(w, err)
			return
		}

		err = pbs.VerifyProto(request)
		if err != nil {
			common.LogInst().Err(err).Msg("request signature verify failed")
			WriteError(w, err)
			return
		}

		response, err := callback(request)
		if err != nil {
			WriteError(w, err)
			common.LogInst().Err(err).Msg("query by email error")
			return
		}
		WriteProtoResponse(w, response)
	}
}

func NewHttpService() *Service {
	var s = &Service{}
	r := chi.NewRouter()
	r.Use(middleware.Recoverer)
	r.HandleFunc("/keep_alive", keepAlive)
	r.HandleFunc("/keep_alive2", keepAlive2)
	r.MethodFunc(http.MethodPost, "/query_by_one_email", callFunc(QueryByOneEmail))
	r.MethodFunc(http.MethodPost, "/query_by_email_array", callFunc(QueryByEmailArray))
	r.MethodFunc(http.MethodPost, "/query_account", callFunc(QueryAccount))
	r.MethodFunc(http.MethodPost, "/operate_contact", callFunc(OperateContact))
	r.MethodFunc(http.MethodPost, "/account_create", callFunc(AccountCreate))
	s.router = r
	return s
}

func QueryByOneEmail(request *pbs.BMReq) (*pbs.BMRsp, error) {
	var rsp = &pbs.BMRsp{Success: true}
	var query = &pbs.QueryReq{}
	err := proto.Unmarshal(request.Payload, query)
	if err != nil {
		return nil, err
	}
	if query == nil || len(query.OneEmailAddr) <= 0 {
		common.LogInst().Warn().Msg("invalid parameter for querying by one email")
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid email address")
	}

	emailContact, err := database.DbInst().QueryAccountByOneEmail(query.OneEmailAddr)
	if err != nil {
		common.LogInst().Err(err).Str("email-addr", query.OneEmailAddr).Msg("query database failed for one email")
		return nil, common.NewBMError(common.BMErrDatabase, "failed to query by email:"+err.Error())
	}

	var contact = &pbs.EmailContact{
		Address: emailContact.BMailAddress,
	}
	rsp.Payload = common.MustProto(contact)

	common.LogInst().Debug().Str("email-addr", query.OneEmailAddr).Msg("query by one email address success")
	return rsp, nil
}

func QueryByEmailArray(request *pbs.BMReq) (*pbs.BMRsp, error) {
	var rsp = &pbs.BMRsp{Success: true}
	var query = &pbs.QueryReq{}
	err := proto.Unmarshal(request.Payload, query)
	if err != nil {
		return nil, err
	}

	if len(query.EmailList) <= 0 {
		common.LogInst().Warn().Msg("invalid parameter for querying by email array")
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid email address array")
	}

	accountArr, err := database.DbInst().QueryAccountsByEmails(query.EmailList)
	if err != nil {
		common.LogInst().Err(err).Msgf("query database failed for email array:%v", query.EmailList)
		return nil, common.NewBMError(common.BMErrDatabase, "failed to query by email array:"+err.Error())
	}

	var result = make(map[string]*pbs.EmailContact)
	for k, v := range accountArr {
		result[k] = &pbs.EmailContact{
			Address: v.BMailAddress,
		}
	}
	emailContacts := &pbs.EmailContacts{
		Contacts: result,
	}

	rsp.Payload = common.MustProto(emailContacts)
	common.LogInst().Debug().Msgf("query by email address array success:%v", query.EmailList)
	return rsp, nil
}

func QueryAccount(request *pbs.BMReq) (*pbs.BMRsp, error) {
	var rsp = &pbs.BMRsp{Success: true}

	var query = &pbs.QueryReq{}
	err := proto.Unmarshal(request.Payload, query)
	if err != nil {
		return nil, err
	}

	if len(query.Address) <= 0 {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid bmail address")
	}

	account, err := database.DbInst().QueryAccount(query.Address)
	if err != nil {
		return nil, common.NewBMError(common.BMErrDatabase, "failed to query by bmail:"+err.Error())
	}

	var result = &pbs.BMailAccount{
		Address: query.Address,
		Level:   int32(account.UserLel),
		License: account.License,
		Emails:  account.EMailAddress,
	}

	rsp.Payload = common.MustProto(result)
	common.LogInst().Debug().Msg("query by bmail address success")

	return rsp, nil
}

func OperateContact(request *pbs.BMReq) (*pbs.BMRsp, error) {
	var rsp = &pbs.BMRsp{Success: true}
	var operation = &pbs.Operation{}
	err := proto.Unmarshal(request.Payload, operation)
	if err != nil {
		return nil, err
	}
	if len(operation.Address) == 0 {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid operation parameter")
	}
	err = database.DbInst().OperateAccount(operation.Address, operation.Emails, operation.IsDel)
	if err != nil {
		return nil, err
	}

	common.LogInst().Debug().Bool("is-deletion", operation.IsDel).
		Str("bmail", operation.Address).Msgf("operate contact success:%v", operation.Emails)
	return rsp, nil
}

func AccountCreate(request *pbs.BMReq) (*pbs.BMRsp, error) {
	var rsp = &pbs.BMRsp{Success: true}
	var operation = &pbs.Operation{}
	err := proto.Unmarshal(request.Payload, operation)
	if err != nil {
		return nil, err
	}

	if operation.IsDel || len(request.Signature) <= 0 {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid account creation parameter")
	}

	err = database.DbInst().CreateBMailAccount(operation.Address, database.UserLevelFree)
	if err != nil {
		return nil, err
	}

	common.LogInst().Debug().Str("bmail", operation.Address).Msg("account creation success")
	return rsp, nil
}
