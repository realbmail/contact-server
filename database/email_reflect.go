package database

import (
	"cloud.google.com/go/firestore"
	"context"
	"github.com/realbmail/contact-server/common"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type EmailReflect struct {
	BMailAddress string `json:"b_mail_address" firestore:"b_mail_address"`
}

func (dm *DbManager) QueryReflectsByEmails(emailAddrs []string) (map[string]EmailReflect, error) {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut*10)
	defer cancel()

	var contacts = make(map[string]EmailReflect)
	collection := dm.fileCli.Collection(DBTableReflect)

	for _, emailAddr := range emailAddrs {
		docRef := collection.Doc(emailAddr)
		docSnapshot, err := docRef.Get(opCtx)
		if err != nil {
			if status.Code(err) == codes.NotFound {
				common.LogInst().Info().Str("email-addr", emailAddr).Msg("Email address not found")
				continue
			}
			common.LogInst().Err(err).Str("email-addr", emailAddr).Msg("Failed to fetch document")
			return nil, err
		}

		var contact EmailReflect
		err = docSnapshot.DataTo(&contact)
		if err != nil {
			common.LogInst().Err(err).Str("email-addr", emailAddr).Msg("Failed to parse contact object")
			continue
		}
		contacts[emailAddr] = contact
	}

	return contacts, nil
}

func (dm *DbManager) QueryReflectByOneEmail(emailAddr string) (*EmailReflect, error) {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()
	contactDoc := dm.fileCli.Collection(DBTableReflect).Doc(emailAddr)

	docSnapshot, err := contactDoc.Get(opCtx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			common.LogInst().Info().Str("email-addr", emailAddr).Msg("not found for account querying by email address")
			return &EmailReflect{}, nil
		}
		common.LogInst().Err(err).Str("bmail-address", emailAddr).Msg("not found contact obj :")
		return nil, err
	}
	var contact EmailReflect
	err = docSnapshot.DataTo(&contact)
	if err != nil {
		common.LogInst().Err(err).Str("bmail-address", emailAddr).Msg("parse contact obj failed:")
		return nil, err
	}

	return &contact, nil
}

func (dm *DbManager) updateEmailReflect(tx *firestore.Transaction, accountAddr string, email []string, isDel bool) (map[string]string, error) {
	var oldAccountToUpdate = make(map[string]string)
	for _, emailAddr := range email {
		docRef := dm.fileCli.Collection(DBTableReflect).Doc(emailAddr)
		if isDel {
			err := tx.Delete(docRef)
			if err != nil && status.Code(err) != codes.NotFound {
				return oldAccountToUpdate, err
			}
		} else {
			docSnap, err := tx.Get(docRef)
			if err != nil && status.Code(err) != codes.NotFound {
				return oldAccountToUpdate, err
			}

			var obj EmailReflect
			if docSnap.Exists() {
				if err := docSnap.DataTo(&obj); err != nil {
					return oldAccountToUpdate, err
				}
				if obj.BMailAddress != accountAddr {
					oldAccountToUpdate[emailAddr] = obj.BMailAddress
					obj.BMailAddress = accountAddr
				} else {
					continue
				}
			} else {
				obj = EmailReflect{
					BMailAddress: accountAddr,
				}
			}
			if err := tx.Set(docRef, obj); err != nil {
				return oldAccountToUpdate, err
			}
		}
	}

	return oldAccountToUpdate, nil
}
