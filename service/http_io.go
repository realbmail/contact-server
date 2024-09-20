package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	pbs "github.com/realbmail/contact-server/proto"
	"google.golang.org/protobuf/proto"
	"io"
	"net/http"
)

func ReadJsonRequest(r *http.Request, val any) error {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		return err
	}

	err = json.Unmarshal(body, val)
	if err != nil {
		return err
	}
	return nil
}

func WriteJsonError(w http.ResponseWriter, err error) {
	var rsp = &Rsp{
		Success: false,
		Message: err.Error(),
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)
	data, _ := json.Marshal(rsp)
	_, _ = w.Write(data)
}

func WriteJsonRequest(w http.ResponseWriter, val any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	data, _ := json.Marshal(val)
	_, _ = w.Write(data)
}

func DoHttp(url, cTyp string, data []byte) ([]byte, error) {
	httpReq, err := http.NewRequestWithContext(context.Background(), http.MethodPost, url, bytes.NewReader(data))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", cTyp)
	resp, err := http.DefaultClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("expected status OK, got %v", resp.Status)
	}

	respData, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return respData, nil
}

func ReadProtoRequest(w http.ResponseWriter, r *http.Request) (*pbs.BMReq, error) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Unable to read body", http.StatusBadRequest)
		return nil, err
	}

	var request = &pbs.BMReq{}
	if err := proto.Unmarshal(body, request); err != nil {
		return nil, err
	}

	return request, nil
}

func WriteProtoResponse(w http.ResponseWriter, response *pbs.BMRsp) {
	w.Header().Set("Content-Type", "application/x-protobuf")
	w.WriteHeader(http.StatusOK)
	data, _ := proto.Marshal(response)
	_, _ = w.Write(data)
}

func WriteError(w http.ResponseWriter, err error) {
	var rsp = &pbs.BMRsp{
		Success: false,
		Msg:     err.Error(),
	}
	w.Header().Set("Content-Type", "application/x-protobuf")
	w.WriteHeader(http.StatusInternalServerError)
	data, _ := proto.Marshal(rsp)
	_, _ = w.Write(data)
}
