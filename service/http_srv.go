package service

import (
	"fmt"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/google/uuid"
	"github.com/realbmail/contact-server/common"
	pbs "github.com/realbmail/contact-server/proto"
	"github.com/realbmail/contact-server/wallet"
	"google.golang.org/protobuf/proto"
	"net"
	"net/http"
	"time"
)

type Service struct {
	router *chi.Mux
}

func (s *Service) Start() {
	go func() {
		r := chi.NewRouter()
		r.Use(middleware.Recoverer)
		r.HandleFunc("/update_user_level", updateUserLevel)
		r.HandleFunc("/query_user_level", queryUserLevel)
		r.HandleFunc("/delete_user_level", deleteUser)
		r.HandleFunc("/query_by_email", queryEmailReflect)
		var err = http.ListenAndServe("127.0.0.1:"+__httpConf.DebugPort, r)
		fmt.Println("debug server err:", err)
	}()

	addr := __httpConf.HttpHost + ":" + __httpConf.HttpPort
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		panic(err)
	}

	if __httpConf.UseHttps {
		fmt.Println("https service start success:", addr)
		panic(http.ServeTLS(listener, s.router, __httpConf.SSLCertFile, __httpConf.SSLKeyFile))
	} else {
		fmt.Println("http service start success:", addr)
		panic(http.Serve(listener, s.router))
	}
}
func queryUserLevel(w http.ResponseWriter, r *http.Request) {

	var action pbs.AccountOperation

	var err = ReadJsonRequest(r, &action)
	if err != nil {
		WriteJsonError(w, err)
		return
	}

	acc, err := __httpConf.database.QueryAccount(action.Address)
	if err != nil {
		WriteJsonError(w, err)
		return
	}

	WriteJsonRequest(w, Rsp{Success: true, Payload: acc})
}
func queryEmailReflect(w http.ResponseWriter, r *http.Request) {

	var action pbs.AccountOperation

	var err = ReadJsonRequest(r, &action)
	if err != nil {
		WriteJsonError(w, err)
		return
	}

	if len(action.Emails) == 0 {
		WriteJsonError(w, fmt.Errorf("no email address found"))
		return
	}

	acc, err := __httpConf.database.QueryReflectByOneEmail(action.Emails[0])
	if err != nil {
		WriteJsonError(w, err)
		return
	}

	WriteJsonRequest(w, Rsp{Success: true, Payload: acc})
}

func deleteUser(w http.ResponseWriter, r *http.Request) {

	var action pbs.AccountOperation

	var err = ReadJsonRequest(r, &action)
	if err != nil {
		WriteJsonError(w, err)
		return
	}

	err = __httpConf.database.DeleteAccount(action.Address)
	if err != nil {
		WriteJsonError(w, err)
		return
	}

	WriteJsonRequest(w, Rsp{Success: true, Payload: ""})
}

func updateUserLevel(w http.ResponseWriter, r *http.Request) {

	var action pbs.AccountOperation

	var err = ReadJsonRequest(r, &action)
	if err != nil {
		WriteJsonError(w, err)
		return
	}

	err = __httpConf.database.UpdateAccountLevel(action.Address, int8(action.UserLevel))
	if err != nil {
		WriteJsonError(w, err)
		return
	}

	WriteJsonRequest(w, Rsp{Success: true})
}

func keepAlive(w http.ResponseWriter, r *http.Request) {
	var c = common.BMailAccount{
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
	r.HandleFunc("/", keepAlive)
	r.HandleFunc("/keep_alive", keepAlive)
	r.HandleFunc("/keep_alive2", keepAlive2)
	r.HandleFunc(common.ActiveVeryfyUrl, ActiveVerify)
	r.MethodFunc(http.MethodPost, "/query_by_one_email", callFunc(QueryReflectByEmail))
	r.MethodFunc(http.MethodPost, "/query_by_email_array", callFunc(QueryReflectByEmailArray))
	r.MethodFunc(http.MethodPost, "/query_account", callFunc(QueryAccount))
	r.MethodFunc(http.MethodPost, "/account_singIn", callFunc(AccountSignIn))
	r.MethodFunc(http.MethodPost, "/account_create", callFunc(AccountActive))
	r.MethodFunc(http.MethodPost, "/account_active", callFunc(AccountActive))
	r.MethodFunc(http.MethodPost, "/operate_contact", callFunc(OperateContact))
	r.MethodFunc(http.MethodPost, "/query_contact", callFunc(QueryContact))
	r.MethodFunc(http.MethodPost, "/bind_account", callFunc(BindAccount))
	r.MethodFunc(http.MethodPost, "/unbind_account", callFunc(UnbindAccount))
	r.MethodFunc(http.MethodPost, "/admin_address", callFunc(AdminAddress))
	r.MethodFunc(http.MethodPost, "/active_by_email", callFunc(ActiveByEmail))
	s.router = r

	return s
}

func QueryReflectByEmail(request *pbs.BMReq) (*pbs.BMRsp, error) {
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

	emailContact, err := __httpConf.database.QueryReflectByOneEmail(query.OneEmailAddr)
	if err != nil {
		common.LogInst().Err(err).Str("email-addr", query.OneEmailAddr).Msg("query database failed for one email")
		return nil, common.NewBMError(common.BMErrDatabase, "failed to query by email:"+err.Error())
	}

	var contact = &pbs.EmailReflect{
		Address: emailContact.BMailAddress,
	}
	rsp.Payload = common.MustProto(contact)

	common.LogInst().Debug().Str("email-addr", query.OneEmailAddr).Msgf("query by one email address success:%v", contact)
	return rsp, nil
}

func QueryReflectByEmailArray(request *pbs.BMReq) (*pbs.BMRsp, error) {
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

	accountArr, err := __httpConf.database.QueryReflectsByEmails(query.EmailList)
	if err != nil {
		common.LogInst().Err(err).Msgf("query database failed for email array:%v", query.EmailList)
		return nil, common.NewBMError(common.BMErrDatabase, "failed to query by email array:"+err.Error())
	}

	var result = make(map[string]*pbs.EmailReflect)
	for k, v := range accountArr {
		result[k] = &pbs.EmailReflect{
			Address: v.BMailAddress,
		}
	}
	emailContacts := &pbs.EmailReflects{
		Reflects: result,
	}

	rsp.Payload = common.MustProto(emailContacts)
	common.LogInst().Debug().Msgf("query by email address array success:%v", query.EmailList)
	return rsp, nil
}

func AccountSignIn(request *pbs.BMReq) (*pbs.BMRsp, error) {
	var rsp = &pbs.BMRsp{Success: true}
	if len(request.Address) <= 0 {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid sign in address")
	}
	var query = &pbs.QueryReq{}

	account, err := __httpConf.database.QueryAccount(request.Address)
	if err != nil {
		return nil, common.NewBMError(common.BMErrDatabase, "failed to query by bmail:"+err.Error())
	}

	var result = &pbs.BMailAccount{
		Address: query.Address,
		Level:   int32(account.UserLel),
		License: account.LicenseHex,
		Emails:  account.EMailAddress,
	}
	rsp.Payload = common.MustProto(result)
	common.LogInst().Debug().Str("address", request.Address).Msg("account sign in success")
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

	account, err := __httpConf.database.QueryAccount(query.Address)
	if err != nil {
		return nil, common.NewBMError(common.BMErrDatabase, "failed to query by bmail:"+err.Error())
	}

	var result = &pbs.BMailAccount{
		Address: query.Address,
		Level:   int32(account.UserLel),
		License: account.LicenseHex,
		Emails:  account.EMailAddress,
	}

	rsp.Payload = common.MustProto(result)
	common.LogInst().Debug().Str("address", query.Address).Msg("query by bmail address success")

	return rsp, nil
}

func AccountActive(request *pbs.BMReq) (*pbs.BMRsp, error) {
	var rsp = &pbs.BMRsp{Success: true}
	var operation = &pbs.AccountOperation{}
	err := proto.Unmarshal(request.Payload, operation)
	if err != nil {
		return nil, err
	}

	if operation.IsDel || len(request.Signature) <= 0 {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid account creation parameter")
	}

	err = __httpConf.database.ActiveAccount(operation.Address, int8(UserLevelFree))
	if err != nil {
		return nil, err
	}

	common.LogInst().Debug().Str("bmail", operation.Address).Msg("account active success")
	return rsp, nil
}

func OperateContact(request *pbs.BMReq) (*pbs.BMRsp, error) {
	var rsp = &pbs.BMRsp{Success: true}
	var contact = &pbs.ContactOperation{}
	err := proto.Unmarshal(request.Payload, contact)
	if err != nil {
		return nil, err
	}
	if len(contact.Contacts) == 0 {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid contact parameter for operation")
	}

	err = __httpConf.database.UpdateContactDetails(request.Address, contact.Contacts, contact.IsDel)
	if err != nil {
		return nil, err
	}

	common.LogInst().Debug().Str("owner-address", request.Address).Msgf("operate contact success:%v", contact.Contacts)
	return rsp, nil
}

func QueryContact(request *pbs.BMReq) (*pbs.BMRsp, error) {
	var rsp = &pbs.BMRsp{Success: true}
	var query = &pbs.QueryReq{}
	err := proto.Unmarshal(request.Payload, query)
	if err != nil {
		return nil, err
	}

	if len(request.Address) <= 0 {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid bmail address")
	}

	contacts, err := __httpConf.database.QueryContacts(request.Address, query.OneEmailAddr)
	if err != nil {
		return nil, err
	}
	var result = &pbs.ContactOperation{
		Contacts: contacts,
	}
	rsp.Payload = common.MustProto(result)
	common.LogInst().Debug().Msg("query contacts success")
	return rsp, nil
}

func BindAccount(request *pbs.BMReq) (*pbs.BMRsp, error) {
	var rsp = &pbs.BMRsp{Success: true}
	var action = &pbs.BindAction{}
	err := proto.Unmarshal(request.Payload, action)
	if err != nil {
		return nil, err
	}
	if len(action.Address) == 0 || len(action.Mail) == 0 {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid bind action parameter")
	}

	err = checkRightsOfAction(action)
	if err != nil {
		common.LogInst().Err(err).Str("mail", action.Mail).Str("address", action.Address).Msg("bind action error")
		return nil, err
	}

	err = __httpConf.database.UpdateBinding(action.Address, action.Mail)
	if err != nil {
		return nil, err
	}

	common.LogInst().Debug().Str("bmail", action.Address).Msgf("bind account success:%v", action.Mail)
	return rsp, nil
}

func UnbindAccount(request *pbs.BMReq) (*pbs.BMRsp, error) {
	var rsp = &pbs.BMRsp{Success: true}
	var action = &pbs.BindAction{}
	err := proto.Unmarshal(request.Payload, action)
	if err != nil {
		return nil, err
	}
	if len(action.Address) == 0 {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid bind action parameter")
	}

	err = __httpConf.database.DeleteBinding(action.Address, action.Mail)
	if err != nil {
		return nil, err
	}

	common.LogInst().Debug().Str("bmail", action.Address).Msgf("unbind account success:%v", action.Mail)
	return rsp, nil
}

func AdminAddress(request *pbs.BMReq) (*pbs.BMRsp, error) {
	var rsp = &pbs.BMRsp{Success: true}
	var query = &pbs.QueryReq{}
	err := proto.Unmarshal(request.Payload, query)
	if err != nil {
		return nil, err
	}
	if len(query.Address) == 0 {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid admin query parameter")
	}

	var addr = wallet.WInst().Address
	var result = &pbs.WalletAddress{
		Address: addr.BmailAddress,
		EthAddr: addr.EthAddress,
	}
	rsp.Payload = common.MustProto(result)
	common.LogInst().Debug().Msg("query admin address success")
	return rsp, nil
}

func ActiveByEmail(request *pbs.BMReq) (*pbs.BMRsp, error) {

	var rsp = &pbs.BMRsp{Success: true}
	var action = &pbs.EMailActive{}
	err := proto.Unmarshal(request.Payload, action)
	if err != nil {
		return nil, err
	}

	if len(action.Email) == 0 {
		return nil, common.NewBMError(common.BMErrInvalidParam, "invalid active parameter")
	}
	token := uuid.NewString()
	data := &common.ActiveLinkData{
		Token:      token,
		Address:    request.Address,
		Email:      action.Email,
		CreateTime: time.Now().Unix(),
	}
	err = __httpConf.database.CreateActiveLink(data)
	if err != nil {
		return nil, err
	}
	go func() {
		wallet.SendActiveMail(data, action.Subject, action.Body)
	}()
	return rsp, nil
}

func ActiveVerify(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	token := query.Get("token")
	if token == "" {
		http.Error(w, "Missing token parameter", http.StatusBadRequest)
		return
	}
	data, err := __httpConf.database.GetActiveLink(token)
	if err != nil {
		http.Error(w, "No active data found", http.StatusBadRequest)
		return
	}

	signature := query.Get("signature")
	if signature == "" {
		http.Error(w, "Missing signature parameter", http.StatusBadRequest)
		return
	}

	err = wallet.VerifyActivationLink(data, signature)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	err = __httpConf.database.ActiveAccount(data.Address, int8(UserLevelFree))
	if err != nil {
		http.Error(w, "Active Account failed", http.StatusBadRequest) //TODO::
		return
	}
	err = __httpConf.database.UpdateBinding(data.Address, data.Email)
	if err != nil {
		http.Error(w, "Update binding relationship failed", http.StatusBadRequest) //TODO::
		return
	}

	w.WriteHeader(http.StatusOK)
	_, _ = fmt.Fprintln(w, "Activation completed successfully!")
}
