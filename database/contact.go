package database

import (
	"cloud.google.com/go/firestore"
	"context"
	"github.com/realbmail/contact-server/common"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type BMailContact struct {
	EMailAddress []string `json:"e_mail_address" firestore:"e_mail_address"`
}

type EmailContact struct {
	BMailAddress string `json:"b_mail_address" firestore:"b_mail_address"`
}

func (dm *DbManager) QueryContactByEmailAddr(emailAddr string) (*EmailContact, error) {
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

func (dm *DbManager) QueryContactByBMailAddr(bmailAddr string) (*BMailContact, error) {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()
	contactDoc := dm.fileCli.Collection(DBTableBContact).Doc(bmailAddr)

	docSnapshot, err := contactDoc.Get(opCtx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return &BMailContact{}, nil
		}
		common.LogInst().Err(err).Str("bmail-address", bmailAddr).Msg("not found contact obj :")
		return nil, err
	}
	var contact BMailContact
	err = docSnapshot.DataTo(&contact)
	if err != nil {
		common.LogInst().Err(err).Str("bmail-address", bmailAddr).Msg("parse contact obj failed:")
		return nil, err
	}

	return &contact, nil
}

func (dm *DbManager) OperateBMail(bmailAddr string, emailAddr []string, isDel bool) error {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()
	docRef := dm.fileCli.Collection(DBTableBContact).Doc(bmailAddr)

	emailAddrInterface := make([]interface{}, len(emailAddr))
	for i, v := range emailAddr {
		emailAddrInterface[i] = v
	}

	_, err := docRef.Get(opCtx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			if !isDel {
				_, err = docRef.Set(opCtx, map[string]interface{}{
					"e_mail_address": emailAddrInterface,
				})
				return err
			}
			return err
		}
		return err
	}

	if isDel {
		_, err := docRef.Update(opCtx, []firestore.Update{
			{
				Path:  "e_mail_address",
				Value: firestore.ArrayRemove(emailAddrInterface...),
			},
		})
		return err
	}
	_, err = docRef.Update(opCtx, []firestore.Update{
		{
			Path:  "e_mail_address",
			Value: firestore.ArrayUnion(emailAddrInterface...),
		},
	})

	return err
}
