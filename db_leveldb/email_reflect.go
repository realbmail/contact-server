package db_leveldb

import (
	"errors"
	"github.com/realbmail/contact-server/common"
	"github.com/syndtr/goleveldb/leveldb"
)

func (dm *DbManager) QueryReflectByOneEmail(emailAddr string) (*common.EmailReflect, error) {
	//TODO implement me
	panic("implement me")
}

func (dm *DbManager) QueryReflectsByEmails(emailAddrs []string) (map[string]common.EmailReflect, error) {
	//TODO implement me
	panic("implement me")
}

func (dm *DbManager) updateEmailReflectOnly(accountAddr string, email string) (string, error) {
	var oldBMailAddress string

	emailKeyStr := TableEmail + email
	emailLock := dm.getLock(emailKeyStr)
	defer dm.releaseLock(emailKeyStr, emailLock)

	var obj common.EmailReflect

	err := ReadStruct(dm.levelDB, emailKeyStr, &obj)

	if err == nil {
		if obj.BMailAddress != accountAddr {
			oldBMailAddress = obj.BMailAddress
			obj.BMailAddress = accountAddr
		} else {
			return "", nil
		}
	} else if errors.Is(err, leveldb.ErrNotFound) {
		obj = common.EmailReflect{
			BMailAddress: accountAddr,
		}
	} else {
		return "", err
	}

	err = WriteStruct(dm.levelDB, emailKeyStr, obj)
	if err != nil {
		return "", err
	}

	return oldBMailAddress, nil
}
