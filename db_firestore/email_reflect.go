package db_firestore

import (
	"cloud.google.com/go/firestore"
	"context"
	"github.com/realbmail/contact-server/common"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (dm *DbManager) QueryReflectsByEmails(emailAddrs []string) (map[string]common.EmailReflect, error) {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut*10)
	defer cancel()

	var contacts = make(map[string]common.EmailReflect)
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

		var contact common.EmailReflect
		err = docSnapshot.DataTo(&contact)
		if err != nil {
			common.LogInst().Err(err).Str("email-addr", emailAddr).Msg("Failed to parse contact object")
			continue
		}
		contacts[emailAddr] = contact
	}

	return contacts, nil
}

func (dm *DbManager) QueryReflectByOneEmail(emailAddr string) (*common.EmailReflect, error) {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()
	contactDoc := dm.fileCli.Collection(DBTableReflect).Doc(emailAddr)

	docSnapshot, err := contactDoc.Get(opCtx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			common.LogInst().Info().Str("email-addr", emailAddr).Msg("not found for account querying by email address")
			return &common.EmailReflect{}, nil
		}
		common.LogInst().Err(err).Str("bmail-address", emailAddr).Msg("not found contact obj :")
		return nil, err
	}
	var contact common.EmailReflect
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

			var obj common.EmailReflect
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
				obj = common.EmailReflect{
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

func (dm *DbManager) deleteEmailReflect(tx *firestore.Transaction, email string) error {
	docRef := dm.fileCli.Collection(DBTableReflect).Doc(email)
	err := tx.Delete(docRef)
	if err != nil && status.Code(err) != codes.NotFound {
		return err
	}
	return nil
}

func (dm *DbManager) updateEmailReflectOnly(tx *firestore.Transaction, accountAddr string, email string) (string, error) {
	var oldBMailAddress string
	docRef := dm.fileCli.Collection(DBTableReflect).Doc(email)
	docSnap, err := tx.Get(docRef)
	if err != nil && status.Code(err) != codes.NotFound {
		return "", err
	}

	var obj common.EmailReflect
	if docSnap.Exists() {
		if err := docSnap.DataTo(&obj); err != nil {
			return "", err
		}
		if obj.BMailAddress != accountAddr {
			oldBMailAddress = obj.BMailAddress
			obj.BMailAddress = accountAddr
		} else {
			// 如果 BMailAddress 已经是当前的 accountAddr，跳过更新
			return "", nil
		}
	} else {
		obj = common.EmailReflect{
			BMailAddress: accountAddr,
		}
	}
	if err := tx.Set(docRef, obj); err != nil {
		return "", err
	}
	return oldBMailAddress, nil
}
