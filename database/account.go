package database

import (
	"cloud.google.com/go/firestore"
	"context"
	"github.com/realbmail/contact-server/common"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type BMailAccount struct {
	UserLel      int8     `json:"user_lel"  firestore:"user_lel"`
	EMailAddress []string `json:"e_mail_address" firestore:"e_mail_address"`
	LicenseHex   string   `json:"license"  firestore:"license"`
}

func (dm *DbManager) QueryAccount(bmailAddr string) (*BMailAccount, error) {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()
	contactDoc := dm.fileCli.Collection(DBTableAccount).Doc(bmailAddr)

	docSnapshot, err := contactDoc.Get(opCtx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return &BMailAccount{}, nil
		}
		common.LogInst().Err(err).Str("bmail-address", bmailAddr).Msg("not found contact obj :")
		return nil, err
	}
	var contact BMailAccount
	err = docSnapshot.DataTo(&contact)
	if err != nil {
		common.LogInst().Err(err).Str("bmail-address", bmailAddr).Msg("parse contact obj failed:")
		return nil, err
	}
	return &contact, nil
}

func (dm *DbManager) CreateBMailAccount(accountId string, level int8) error {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut*10)
	defer cancel()
	docRef := dm.fileCli.Collection(DBTableAccount).Doc(accountId)
	var obj = BMailAccount{
		UserLel: level,
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

func (dm *DbManager) OperateAccount(bmailAddr string, emailAddr []string, isDel bool) error {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut*20)
	defer cancel()

	err := dm.fileCli.RunTransaction(opCtx, func(ctx context.Context, tx *firestore.Transaction) error {
		docRef := dm.fileCli.Collection(DBTableAccount).Doc(bmailAddr)
		accountSnapShot, err := tx.Get(docRef)
		if err != nil {
			return common.NewBMError(common.BMErrNoRight, "create account first please")
		}

		var contact BMailAccount
		err = accountSnapShot.DataTo(&contact)
		if err != nil {
			return err
		}

		emailAddrInterface := make([]interface{}, len(emailAddr))
		for i, v := range emailAddr {
			emailAddrInterface[i] = v
		}

		oldAccToUpdate, err := dm.updateEmailReflect(tx, bmailAddr, emailAddr, isDel)
		if err != nil {
			return err
		}

		if isDel {
			err = tx.Update(docRef, []firestore.Update{
				{
					Path:  "e_mail_address",
					Value: firestore.ArrayRemove(emailAddrInterface...),
				},
			})
		} else {
			err = tx.Update(docRef, []firestore.Update{
				{
					Path:  "e_mail_address",
					Value: firestore.ArrayUnion(emailAddrInterface...),
				},
			})
		}

		if err != nil {
			return err
		}

		if len(oldAccToUpdate) == 0 {
			return nil
		}

		for email, addr := range oldAccToUpdate {
			docRef = dm.fileCli.Collection(DBTableAccount).Doc(addr)
			if err != nil {
				continue
			}

			err = tx.Update(docRef, []firestore.Update{
				{
					Path:  "e_mail_address",
					Value: firestore.ArrayRemove(email),
				},
			})
		}

		return nil
	})

	return err
}
