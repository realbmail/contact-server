package db_firestore

import (
	"context"
	"github.com/realbmail/contact-server/common"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (dm *DbManager) CreateActiveLink(data *common.ActiveLinkData) error {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()
	activeDoc := dm.fileCli.Collection(DBActiveLink).Doc(data.Token)

	_, err := activeDoc.Get(opCtx)
	if err == nil {
		common.LogInst().Warn().Str("token", data.Token).Msg("active link data already exists")
		return common.NewBMError(common.BMErrDuplicate, "Active link data already exists")
	}
	if status.Code(err) != codes.NotFound {
		common.LogInst().Err(err).Str("token", data.Token).Msg("error checking active link data existence")
		return err
	}

	_, err = activeDoc.Set(opCtx, data)
	if err != nil {
		common.LogInst().Err(err).Str("token", data.Token).Msg("failed to save active link data")
		return err
	}

	common.LogInst().Info().Str("token", data.Token).Msg("active link data saved successfully")
	return nil
}

func (dm *DbManager) GetActiveLink(token string) (*common.ActiveLinkData, error) {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()
	contactDoc := dm.fileCli.Collection(DBActiveLink).Doc(token)

	docSnapshot, err := contactDoc.Get(opCtx)
	if err != nil {
		common.LogInst().Err(err).Str("token", token).Msg("active link data not found")
		return nil, err
	}

	var data common.ActiveLinkData
	err = docSnapshot.DataTo(&data)
	if err != nil {
		common.LogInst().Err(err).Str("bmail-address", token).Msg("parse active link failed")
		return nil, err
	}
	return &data, nil
}

func (dm *DbManager) RemoveActiveLink(token string) error {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()

	contactDoc := dm.fileCli.Collection(DBActiveLink).Doc(token)

	_, err := contactDoc.Delete(opCtx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			common.LogInst().Debug().Str("token", token).Msg("active link data not found for deletion")
			return nil
		}
		common.LogInst().Err(err).Str("token", token).Msg("failed to delete active link data")
		return err
	}

	common.LogInst().Debug().Str("token", token).Msg("active link data deleted successfully")
	return nil
}
