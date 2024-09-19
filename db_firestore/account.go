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
	return &contact, nil
}

func (dm *DbManager) ActiveAccount(accountId string, level int8) error {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut*10)
	defer cancel()
	docRef := dm.fileCli.Collection(DBTableAccount).Doc(accountId)
	var obj = common.BMailAccount{
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

		var contact common.BMailAccount
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

func (dm *DbManager) UpdateBinding(bmailAddr string, emailAddr string) error {
	// 设置上下文和超时时间
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut*20)
	defer cancel()

	// 运行 Firestore 事务
	err := dm.fileCli.RunTransaction(opCtx, func(ctx context.Context, tx *firestore.Transaction) error {
		// 获取账户文档引用
		docRef := dm.fileCli.Collection(DBTableAccount).Doc(bmailAddr)
		accountSnapShot, err := tx.Get(docRef)
		if err != nil {
			return common.NewBMError(common.BMErrNoRight, "Active your account first")
		}

		// 将快照数据映射到 BMailAccount 结构体
		var contact common.BMailAccount
		err = accountSnapShot.DataTo(&contact)
		if err != nil {
			return err
		}

		// 更新 EmailReflect 表
		oldBMailAddress, err := dm.updateEmailReflectOnly(tx, bmailAddr, emailAddr)
		if err != nil {
			return err
		}

		// 更新账户的 e_mail_address 字段，添加新的邮箱地址
		err = tx.Update(docRef, []firestore.Update{
			{
				Path:  "e_mail_address",
				Value: firestore.ArrayUnion(emailAddr),
			},
		})
		if err != nil {
			return err
		}

		// 如果有旧的账户需要更新，移除其 e_mail_address 中的邮箱地址
		if oldBMailAddress != "" {
			oldDocRef := dm.fileCli.Collection(DBTableAccount).Doc(oldBMailAddress)
			err = tx.Update(oldDocRef, []firestore.Update{
				{
					Path:  "e_mail_address",
					Value: firestore.ArrayRemove(emailAddr),
				},
			})
			if err != nil {
				// 这里可以选择记录日志或进行错误处理
				return err
			}
		}

		return nil
	})

	return err
}

func (dm *DbManager) DeleteBinding(bmailAddr string, emailAddr string) error {
	// 设置上下文和超时时间
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut*20)
	defer cancel()

	// 运行 Firestore 事务
	err := dm.fileCli.RunTransaction(opCtx, func(ctx context.Context, tx *firestore.Transaction) error {
		// 获取账户文档引用
		docRef := dm.fileCli.Collection(DBTableAccount).Doc(bmailAddr)
		accountSnapShot, err := tx.Get(docRef)
		if err != nil {
			return common.NewBMError(common.BMErrNoRight, "Active your account first")
		}

		// 将快照数据映射到 BMailAccount 结构体
		var contact common.BMailAccount
		err = accountSnapShot.DataTo(&contact)
		if err != nil {
			return err
		}

		// 将 emailAddr 转换为接口类型的切片
		emailAddrInterface := []interface{}{emailAddr}

		// 删除 EmailReflect 表中的对应记录
		err = dm.deleteEmailReflect(tx, emailAddr)
		if err != nil {
			return err
		}

		// 更新账户的 e_mail_address 字段，移除指定的邮箱地址
		err = tx.Update(docRef, []firestore.Update{
			{
				Path:  "e_mail_address",
				Value: firestore.ArrayRemove(emailAddrInterface...),
			},
		})
		if err != nil {
			return err
		}

		return nil
	})

	return err
}
