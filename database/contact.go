package database

import (
	"context"
	"encoding/json"
	"github.com/realbmail/contact-server/common"
)

type BMailContact struct {
	BMailAddress string `json:"b_mail_address" firestore:"b_mail_address"`
	EMailAddress string `json:"e_mail_address" firestore:"e_mail_address"`
}

func (bmc *BMailContact) MustJson() string {
	jsonData, _ := json.Marshal(bmc)
	return string(jsonData)
}

func (dm *DbManager) QueryContactByEmailAddr(emailAddr string) (*BMailContact, error) {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()
	query := dm.fileCli.Collection(DBTableContact).
		Where("prefixed_hash", "==", emailAddr)
	iter := query.Documents(opCtx)
	defer iter.Stop()
	doc, err := iter.Next()
	if err != nil {
		common.LogInst().Err(err).Str("email-address", emailAddr).Msg("no such contact")
		return nil, err
	}

	var obj BMailContact
	err = doc.DataTo(&obj)
	if err != nil {
		common.LogInst().Err(err).Msg("parse nj contact failed")
		return nil, err
	}

	return &obj, nil
}

func (dm *DbManager) QueryContactByBMailAddr(bmailAddr string) (*BMailContact, error) {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()
	contactDoc := dm.fileCli.Collection(DBTableContact).Doc(bmailAddr)

	docSnapshot, err := contactDoc.Get(opCtx)
	if err != nil {
		common.LogInst().Err(err).Str("bmail-address", bmailAddr).Msg("not found contact obj :")
		return nil, err
	}
	var imgRaw BMailContact
	err = docSnapshot.DataTo(&imgRaw)
	if err != nil {
		common.LogInst().Err(err).Str("bmail-address", bmailAddr).Msg("parse contact obj failed:")
		return nil, err
	}

	return &imgRaw, nil
}
