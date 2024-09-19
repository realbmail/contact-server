package db_leveldb

import (
	"errors"
	"github.com/realbmail/contact-server/common"
	"github.com/syndtr/goleveldb/leveldb"
)

func (dm *DbManager) QueryAccount(bmailAddr string) (*common.BMailAccount, error) {
	//TODO implement me
	panic("implement me")
}

func (dm *DbManager) OperateAccount(bmailAddr string, emailAddr []string, isDel bool) error {
	//TODO implement me
	panic("implement me")
}

func (dm *DbManager) CreateBMailAccount(accountId string, level int8) error {
	accountKeyStr := TableAccount + accountId

	lock := dm.getLock(accountKeyStr)
	defer dm.releaseLock(accountKeyStr, lock)

	obj := common.BMailAccount{
		UserLel: level,
	}

	var existingAccount common.BMailAccount
	err := ReadStruct(dm.levelDB, accountKeyStr, &existingAccount)
	if err == nil {
		common.LogInst().Warn().Str("bmail-account", accountId).Msg("duplicate create action")
		return nil
	} else if !errors.Is(err, leveldb.ErrNotFound) {
		return err
	}

	err = WriteStruct(dm.levelDB, accountKeyStr, obj)
	if err != nil {
		return err
	}

	return nil
}

func (dm *DbManager) UpdateBinding(bmailAddr string, emailAddr string) error {

	accountKeyStr := TableAccount + bmailAddr
	accountLock := dm.getLock(accountKeyStr)
	defer dm.releaseLock(accountKeyStr, accountLock)

	var account common.BMailAccount
	err := ReadStruct(dm.levelDB, accountKeyStr, &account)
	if err != nil {
		if errors.Is(err, leveldb.ErrNotFound) {
			return common.NewBMError(common.BMErrNoRight, "Activate your account first")
		}
		return err
	}

	oldBMailAddress, err := dm.updateEmailReflectOnly(bmailAddr, emailAddr)
	if err != nil {
		return err
	}

	if oldBMailAddress != "" && oldBMailAddress != bmailAddr {
		if err = dm.removeEmailFromAccount(oldBMailAddress, emailAddr); err != nil {
			return err
		}
	}

	if contains(account.EMailAddress, emailAddr) {
		return nil
	}

	account.EMailAddress = append(account.EMailAddress, emailAddr)
	return WriteStruct(dm.levelDB, accountKeyStr, account)
}

func (dm *DbManager) removeEmailFromAccount(accountId string, emailAddr string) error {
	accountKeyStr := TableAccount + accountId
	accountLock := dm.getLock(accountKeyStr)
	defer dm.releaseLock(accountKeyStr, accountLock)

	var account common.BMailAccount
	err := ReadStruct(dm.levelDB, accountKeyStr, &account)

	if err != nil {
		common.LogInst().Err(err).Str("account", accountId).Str("email", emailAddr).Msg("remove binding error")
		if errors.Is(err, leveldb.ErrNotFound) {
			return nil
		}
		return err
	}

	account.EMailAddress = remove(account.EMailAddress, emailAddr)

	return WriteStruct(dm.levelDB, accountKeyStr, account)
}

func (dm *DbManager) DeleteBinding(bmailAddr string, emailAddr string) error {
	return dm.removeEmailFromAccount(bmailAddr, emailAddr)
}
