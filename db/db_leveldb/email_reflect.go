package db_leveldb

import (
	"errors"
	"github.com/realbmail/contact-server/common"
	"github.com/syndtr/goleveldb/leveldb"
)

func (dm *DbManager) QueryReflectByOneEmail(emailAddr string) (*common.EmailReflect, error) {
	emailKeyStr := TableEmail + emailAddr
	lock := dm.getLock(emailKeyStr)
	defer dm.releaseLock(emailKeyStr, lock)

	var contact common.EmailReflect
	err := ReadStruct(dm.levelDB, emailKeyStr, &contact)
	if err == nil {
		return &contact, nil
	}

	if errors.Is(err, leveldb.ErrNotFound) {
		common.LogInst().Warn().Str("email-addr", emailAddr).Msg("not found for account querying by email address")
		return &common.EmailReflect{}, nil
	}
	common.LogInst().Err(err).Str("email-addr", emailAddr).Msg("not found contact obj :")
	return nil, err
}

func (dm *DbManager) QueryReflectsByEmails(emailAddrs []string) (map[string]common.EmailReflect, error) {

	reflects := make(map[string]common.EmailReflect)

	for _, emailAddr := range emailAddrs {

		emailKeyStr := TableEmail + emailAddr
		lock := dm.getLock(emailKeyStr)
		var account common.EmailReflect
		err := ReadStruct(dm.levelDB, emailKeyStr, &account)
		dm.releaseLock(emailKeyStr, lock)

		if err == nil {
			reflects[emailAddr] = account
			continue
		}

		if errors.Is(err, leveldb.ErrNotFound) {
			common.LogInst().Info().Str("email-addr", emailAddr).Msg("Email address not found")
			continue
		}

		common.LogInst().Err(err).Str("email-addr", emailAddr).Msg("Failed to fetch document")
		return nil, err
	}

	return reflects, nil
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
