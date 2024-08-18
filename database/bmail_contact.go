package database

import (
	"cloud.google.com/go/firestore"
	"context"
	"errors"
	"fmt"
	pbs "github.com/realbmail/contact-server/proto"
	"google.golang.org/api/iterator"
)

type BMailContact struct {
	Email    string `json:"email"  firestore:"email"`
	Address  string `json:"address" firestore:"address"`
	NickName string `json:"nick_name,omitempty" firestore:"nick_name"`
	Remark   string `json:"remark,omitempty" firestore:"remark"`
}

func (dm *DbManager) ContactUpdate(address string, contacts []*pbs.ContactItem, isDel bool) error {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()

	docRef := dm.fileCli.Collection(DBTableAccount).Doc(address)
	collectionRef := docRef.Collection("contacts")

	return dm.fileCli.RunTransaction(opCtx, func(ctx context.Context, tx *firestore.Transaction) error {
		for _, contact := range contacts {
			// 查询是否存在相同 email 的记录
			query := collectionRef.Where("email", "==", contact.Email).Limit(1)
			iter := tx.Documents(query)

			docSnapshot, err := iter.Next()
			if err != nil && !errors.Is(err, iterator.Done) {
				return fmt.Errorf("failed to check existing contact: %v", err)
			}

			if isDel {
				// 如果isDel为true，删除数据库中的数据
				if docSnapshot.Exists() {
					if err := tx.Delete(docSnapshot.Ref); err != nil {
						return fmt.Errorf("failed to delete contact: %v", err)
					}
				} else {
					// 如果记录不存在，不执行任何操作
					continue
				}
			} else {
				// 如果isDel为false，执行增加或更新操作
				contactData := BMailContact{
					Email:    contact.Email,
					Address:  contact.Address,
					NickName: contact.NickName,
					Remark:   contact.Remark,
				}

				if docSnapshot.Exists() {
					// 如果记录存在，更新该记录
					if err := tx.Set(docSnapshot.Ref, contactData); err != nil {
						return fmt.Errorf("failed to update contact: %v", err)
					}
				} else {
					// 如果记录不存在，添加新记录
					newDocRef := collectionRef.NewDoc()
					if err := tx.Set(newDocRef, contactData); err != nil {
						return fmt.Errorf("failed to create new contact: %v", err)
					}
				}
			}
		}
		return nil
	})
}
