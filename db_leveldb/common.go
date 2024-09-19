package db_leveldb

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"github.com/syndtr/goleveldb/leveldb"
)

func WriteString(db *leveldb.DB, key string, value string) error {
	return db.Put([]byte(key), []byte(value), nil)
}

func ReadString(db *leveldb.DB, key string) (string, error) {
	data, err := db.Get([]byte(key), nil)
	if err != nil {
		return "", err
	}
	return string(data), nil
}

func WriteInt(db *leveldb.DB, key string, value int64) error {
	buf := make([]byte, 8)
	binary.BigEndian.PutUint64(buf, uint64(value))
	return db.Put([]byte(key), buf, nil)
}

func ReadInt(db *leveldb.DB, key string) (int64, error) {
	data, err := db.Get([]byte(key), nil)
	if err != nil {
		return 0, err
	}
	if len(data) != 8 {
		return 0, fmt.Errorf("invalid data length for int64")
	}
	value := int64(binary.BigEndian.Uint64(data))
	return value, nil
}

func WriteStruct(db *leveldb.DB, key string, value interface{}) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return db.Put([]byte(key), data, nil)
}

func ReadStruct(db *leveldb.DB, key string, result interface{}) error {
	data, err := db.Get([]byte(key), nil)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, result)
}
