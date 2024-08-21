package service

import (
	"fmt"
	"github.com/gorilla/sessions"
	"net/http"
	"sync"
)

var _sesInst *SessionManager
var sessionOnce sync.Once

const (
	SessionNameSystem = "session-name-for-bmail"
)

type SessionManager struct {
	store *sessions.CookieStore
}

func SMInst() *SessionManager {
	sessionOnce.Do(func() {
		_sesInst = newSM()
	})
	return _sesInst
}

func newSM() *SessionManager {
	var store = sessions.NewCookieStore([]byte(__httpConf.SessionKey))
	store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   __httpConf.SessionMaxAge,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	}
	return &SessionManager{
		store: store,
	}
}

func (sm *SessionManager) Get(key string, r *http.Request) (any, error) {
	session, err := sm.store.Get(r, SessionNameSystem)
	if err != nil {
		return nil, err
	}

	data := session.Values[key]
	if data == nil {
		return nil, fmt.Errorf("val not found for seession key:%s", key)
	}
	return data, nil
}

func (sm *SessionManager) Set(r *http.Request, w http.ResponseWriter, key string, val any) error {
	session, err := sm.store.Get(r, SessionNameSystem)
	if err != nil {
		return err
	}

	session.Values[key] = val
	return session.Save(r, w)
}

func (sm *SessionManager) Del(key string, r *http.Request, w http.ResponseWriter) error {
	session, err := sm.store.Get(r, SessionNameSystem)
	if err != nil {
		return nil
	}
	session.Values[key] = nil
	return session.Save(r, w)
}
