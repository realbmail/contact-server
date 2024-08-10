package common

import "encoding/json"

func MustJson(val any) string {
	jsonData, _ := json.Marshal(val)
	return string(jsonData)
}
