package common

import (
	"encoding/json"
	"google.golang.org/protobuf/proto"
)

func MustJson(val any) string {
	jsonData, _ := json.Marshal(val)
	return string(jsonData)
}
func MustProto(val proto.Message) []byte {
	jsonData, _ := proto.Marshal(val)
	return jsonData
}
