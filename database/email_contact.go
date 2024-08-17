package database

import (
	"cloud.google.com/go/firestore"
	"context"
	"github.com/realbmail/contact-server/common"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type EmailContact struct {
	BMailAddress string `json:"b_mail_address" firestore:"b_mail_address"`
	NickName     string `json:"nick_name,omitempty" firestore:"nick_name"`
	Remark       string `json:"remark,omitempty" firestore:"remark"`
}

func (dm *DbManager) QueryAccountsByEmails(emailAddrs []string) (map[string]EmailContact, error) {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut*10)
	defer cancel()

	var contacts = make(map[string]EmailContact)
	collection := dm.fileCli.Collection(DBTableEContact)

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

		var contact EmailContact
		err = docSnapshot.DataTo(&contact)
		if err != nil {
			common.LogInst().Err(err).Str("email-addr", emailAddr).Msg("Failed to parse contact object")
			continue
		}
		contacts[emailAddr] = contact
	}

	return contacts, nil
}

func (dm *DbManager) QueryAccountByOneEmail(emailAddr string) (*EmailContact, error) {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()
	contactDoc := dm.fileCli.Collection(DBTableEContact).Doc(emailAddr)

	docSnapshot, err := contactDoc.Get(opCtx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			common.LogInst().Info().Str("email-addr", emailAddr).Msg("not found for account querying by email address")
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

func (dm *DbManager) UpdateContactDetails(email, bmail, nick, remark string) error {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()

	docRef := dm.fileCli.Collection(DBTableEContact).Doc(email)
	contactData := map[string]interface{}{
		"b_mail_address": bmail,
		"nick_name":      nick,
		"remark":         remark,
	}

	_, err := docRef.Set(opCtx, contactData, firestore.MergeAll)
	if err != nil {
		common.LogInst().Err(err).Str("email-addr", email).Msg("Failed to update or create email contact")
		return err
	}

	common.LogInst().Info().Str("email-addr", email).Msg("Successfully updated email contact details")
	return nil
}
