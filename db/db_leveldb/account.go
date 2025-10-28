package db_leveldb

import (
	"errors"
	"github.com/realbmail/contact-server/common"
	"github.com/syndtr/goleveldb/leveldb"
)

func (dm *DbManager) QueryAccount(bmailAddr string) (*common.BMailAccount, error) {
	accountKeyStr := TableAccount + bmailAddr
	accountLock := dm.getLock(accountKeyStr)
	defer dm.releaseLock(accountKeyStr, accountLock)

	var account common.BMailAccount
	err := ReadStruct(dm.levelDB, accountKeyStr, &account)
	if err != nil {
		if errors.Is(err, leveldb.ErrNotFound) {
			return &common.BMailAccount{}, nil
		}
		common.LogInst().Err(err).Str("bmail-address", bmailAddr).Msg("not found account obj :")
		return nil, err
	}
	return &account, nil
}

//
//func (dm *DbManager) OperateAccount(bmailAddr string, emailAddr []string, isDel bool) error {
//	if isDel {
//		for i := 0; i < len(emailAddr); i++ {
//			email := emailAddr[i]
//			if err := dm.DeleteBinding(bmailAddr, email); err != nil {
//				return err
//			}
//		}
//	} else {
//		for i := 0; i < len(emailAddr); i++ {
//			email := emailAddr[i]
//			if err := dm.UpdateBinding(bmailAddr, email); err != nil {
//				return err
//			}
//		}
//	}
//	return nil
//}

func (dm *DbManager) UpdateAccountLevel(accountId string, level int8) error {
	accountKeyStr := TableAccount + accountId

	lock := dm.getLock(accountKeyStr)
	defer dm.releaseLock(accountKeyStr, lock)

	var existingAccount common.BMailAccount
	err := ReadStruct(dm.levelDB, accountKeyStr, &existingAccount)
	if err != nil {
		common.LogInst().Err(err).Str("address", accountId).Msg("error reading account")
		return err
	}

	existingAccount.UserLel = level
	return WriteStruct(dm.levelDB, accountKeyStr, existingAccount)
}

func (dm *DbManager) ActiveAccount(accountId string, level int8) error {
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
		common.LogInst().Err(err).Str("address", accountId).Msg("read account for active error")
		return err
	}

	return WriteStruct(dm.levelDB, accountKeyStr, obj)
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
		common.LogInst().Err(err).Str("address", bmailAddr).Str("email", emailAddr).Msg("read struct failed")
		return err
	}

	oldBMailAddress, err := dm.updateEmailReflectOnly(bmailAddr, emailAddr)
	if err != nil {
		common.LogInst().Err(err).Str("address", bmailAddr).Str("email", emailAddr).Msg("update email reflect error")
		return err
	}

	if oldBMailAddress != "" && oldBMailAddress != bmailAddr {
		common.LogInst().Debug().Str("address", bmailAddr).Str("email", emailAddr).Msg("need remove from old binding")
		if err = dm.removeEmailFromAccount(oldBMailAddress, emailAddr); err != nil {
			common.LogInst().Err(err).Str("address", bmailAddr).Str("email", emailAddr).Msg("remove from old binding error")
			return err
		}
	}

	if contains(account.EMailAddress, emailAddr) {
		common.LogInst().Debug().Str("address", bmailAddr).Str("email", emailAddr).Msg("email already bound to account")
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
		common.LogInst().Err(err).Str("address", accountId).Str("email", emailAddr).Msg("remove binding error")
		if errors.Is(err, leveldb.ErrNotFound) {
			return nil
		}
		return err
	}

	account.EMailAddress = remove(account.EMailAddress, emailAddr)

	return WriteStruct(dm.levelDB, accountKeyStr, account)
}

func (dm *DbManager) DeleteBinding(bmailAddr string, emailAddr string) error {
	accountKeyStr := TableAccount + bmailAddr
	accountLock := dm.getLock(accountKeyStr)
	defer dm.releaseLock(accountKeyStr, accountLock)

	var account common.BMailAccount
	if err := ReadStruct(dm.levelDB, accountKeyStr, &account); err != nil {
		if errors.Is(err, leveldb.ErrNotFound) {
			return common.NewBMError(common.BMErrNoRight, "Activate your account first")
		}
		common.LogInst().Err(err).Str("address", bmailAddr).Str("email", emailAddr).Msg("read binding error")
		return err
	}

	if err := dm.deleteEmailReflect(emailAddr); err != nil {
		common.LogInst().Err(err).Str("address", bmailAddr).Str("email", emailAddr).Msg("delete email reflection error")
		return err
	}

	account.EMailAddress = remove(account.EMailAddress, emailAddr)
	return WriteStruct(dm.levelDB, accountKeyStr, account)
}

func (dm *DbManager) UninstallByUser(bmailAddr string) error {
	return nil
}

func (dm *DbManager) deleteEmailReflect(email string) error {
	emailKeyStr := TableEmail + email
	lock := dm.getLock(emailKeyStr)
	defer dm.releaseLock(emailKeyStr, lock)
	return Delete(dm.levelDB, emailKeyStr)
}
