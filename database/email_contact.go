package database

import (
	"cloud.google.com/go/firestore"
	"context"
	"github.com/realbmail/contact-server/common"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (dm *DbManager) QueryAccountByEmail(emailAddr string) (*EmailContact, error) {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()
	contactDoc := dm.fileCli.Collection(DBTableEContact).Doc(emailAddr)

	docSnapshot, err := contactDoc.Get(opCtx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return &EmailContact{}, nil
		}
		common.LogInst().Err(err).Str("bmail-address", emailAddr).Msg("not found contact obj :")
		return nil, err
	}
	var contact EmailContact
	err = docSnapshot.DataTo(&contact)
	if err != nil {
		common.LogInst().Err(err).Str("bmail-address", emailAddr).Msg("parse contact obj failed:")
		return nil, err
	}

	return &contact, nil
}

func (dm *DbManager) updateEmailContact(tx *firestore.Transaction, bmail string, email []string, isDel bool) error {
	for _, address := range email {
		docRef := dm.fileCli.Collection(DBTableEContact).Doc(address)
		if isDel {
			err := tx.Delete(docRef)
			if err != nil && status.Code(err) != codes.NotFound {
				return err
			}
		} else {
			var obj = EmailContact{
				BMailAddress: bmail,
			}
			err := tx.Set(docRef, obj)
			if err != nil {
				return err
			}
		}
	}
	return nil
}
