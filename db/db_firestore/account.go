package db_firestore

import (
	"cloud.google.com/go/firestore"
	"context"
	"github.com/realbmail/contact-server/common"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (dm *DbManager) QueryAccount(bmailAddr string) (*common.BMailAccount, error) {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()
	contactDoc := dm.fileCli.Collection(DBTableAccount).Doc(bmailAddr)

	docSnapshot, err := contactDoc.Get(opCtx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return &common.BMailAccount{}, nil
		}
		common.LogInst().Err(err).Str("bmail-address", bmailAddr).Msg("not found contact obj :")
		return nil, err
	}
	var contact common.BMailAccount
	err = docSnapshot.DataTo(&contact)
	if err != nil {
		common.LogInst().Err(err).Str("bmail-address", bmailAddr).Msg("parse contact obj failed:")
		return nil, err
	}
	contact.MapToArray()
	return &contact, nil
}

func (dm *DbManager) UpdateAccountLevel(accountId string, level int8) error {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut*10)
	defer cancel()
	docRef := dm.fileCli.Collection(DBTableAccount).Doc(accountId)
	accountSnapShot, err := docRef.Get(opCtx)
	if err != nil {
		return err
	}
	var obj common.BMailAccount
	err = accountSnapShot.DataTo(&obj)
	if err != nil {
		return err
	}
	obj.UserLel = level
	_, err = docRef.Set(opCtx, obj)
	return err
}

func (dm *DbManager) ActiveAccount(accountId string, defaultLevel int8) error {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut*10)
	defer cancel()
	docRef := dm.fileCli.Collection(DBTableAccount).Doc(accountId)
	var obj = common.BMailAccount{
		UserLel: defaultLevel,
	}
	_, err := docRef.Get(opCtx)
	if err == nil {
		common.LogInst().Warn().Str("bmail-account", accountId).Msg("duplicate create action")
		return nil
	} else {
		if status.Code(err) != codes.NotFound {
			return err
		}
	}

	_, err = docRef.Set(opCtx, obj)
	return err
}

func (dm *DbManager) databaseToObj(tableName, key string, obj any, saveCallback func(docRef *firestore.DocumentRef) error) (error, bool) {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()

	docRef := dm.fileCli.Collection(tableName).Doc(key)
	accountSnapShot, err := docRef.Get(opCtx)
	if err != nil {
		if status.Code(err) != codes.NotFound {
			return err, false
		}
		return err, true
	}
	err = accountSnapShot.DataTo(obj)
	if err != nil {
		return err, false
	}

	if saveCallback != nil {
		if err = saveCallback(docRef); err != nil {
			return err, false
		}
		_, err = docRef.Set(opCtx, obj)
	}

	return err, false
}

func (dm *DbManager) UpdateBinding(bmailAddr string, emailAddr string) error {
	var contact common.BMailAccount

	err, _ := dm.databaseToObj(DBTableAccount, bmailAddr, &contact, func(docRef *firestore.DocumentRef) error {
		if contact.MailStoreObj == nil {
			contact.MailStoreObj = make(map[string]bool)
		}
		contact.MailStoreObj[emailAddr] = true
		return nil
	})

	if err != nil {
		return err
	}

	oldBMailAddress, err := dm.updateEmailReflectOnly(bmailAddr, emailAddr)
	if err != nil || oldBMailAddress == "" {
		return err
	}

	var oldAccount common.BMailAccount
	err, _ = dm.databaseToObj(DBTableAccount, oldBMailAddress, &oldAccount, func(docRef *firestore.DocumentRef) error {
		if oldAccount.MailStoreObj == nil {
			return nil
		}
		delete(oldAccount.MailStoreObj, emailAddr)
		return nil
	})

	return err
}

func (dm *DbManager) DeleteBinding(bmailAddr string, emailAddr string) error {
	var contact common.BMailAccount
	err, isNotFound := dm.databaseToObj(DBTableAccount, bmailAddr, &contact, func(docRef *firestore.DocumentRef) error {
		if contact.MailStoreObj == nil {
			return nil
		}
		delete(contact.MailStoreObj, emailAddr)
		return nil
	})

	if err != nil {
		if isNotFound {
			return nil
		}
		return err
	}

	return dm.deleteEmailReflect(emailAddr)
}

func (dm *DbManager) DeleteAccount(bmailAddr string) error {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()

	docRef := dm.fileCli.Collection(DBTableAccount).Doc(bmailAddr)

	docSnap, err := docRef.Get(opCtx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return nil
		}
		return err
	}

	var account common.BMailAccount
	err = docSnap.DataTo(&account)
	if err != nil {
		return err
	}

	if account.MailStoreObj != nil {
		for email := range account.MailStoreObj {
			err := dm.deleteEmailReflect(email)
			if err != nil {
				return err
			}
		}
	}

	_, err = docRef.Delete(opCtx)
	if err != nil {
		return err
	}

	return nil
}
