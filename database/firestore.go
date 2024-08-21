package database

import (
	"cloud.google.com/go/firestore"
	"context"
	"errors"
	"fmt"
	pbs "github.com/realbmail/contact-server/proto"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
	"os"
	"sync"
	"time"
)

const (
	DefaultDBTimeOut = 10 * time.Second
	DBTableAccount   = "bmail-account"
	DBTableReflect   = "email-reflect"
	DBTableContact   = "bmail-contact"
)

var _dbInst *DbManager
var databaseOnce sync.Once

type DbManager struct {
	fileCli *firestore.Client
	ctx     context.Context
	cancel  context.CancelFunc
}

func DbInst() *DbManager {
	databaseOnce.Do(func() {
		_dbInst = newDb()
	})
	return _dbInst
}

func newDb() *DbManager {
	ctx, cancel := context.WithCancel(context.Background())
	var client *firestore.Client
	var err error
	if __dbConf.LocalRun {
		_ = os.Setenv("FIRESTORE_EMULATOR_HOST", "localhost:8080")
		client, err = firestore.NewClientWithDatabase(ctx, __dbConf.ProjectID, __dbConf.DatabaseID)
	} else {
		client, err = firestore.NewClientWithDatabase(ctx, __dbConf.ProjectID,
			__dbConf.DatabaseID, option.WithCredentialsFile(__dbConf.KeyFilePath))
	}
	if err != nil {
		panic(err)
	}
	var dbm = &DbManager{
		fileCli: client,
		ctx:     ctx,
		cancel:  cancel,
	}
	return dbm
}

type BMailContact struct {
	Email    string `json:"email"  firestore:"email"`
	Address  string `json:"address" firestore:"address"`
	NickName string `json:"nick_name,omitempty" firestore:"nick_name"`
	Remark   string `json:"remark,omitempty" firestore:"remark"`
}

func (dm *DbManager) UpdateContactDetails(address string, contacts []*pbs.ContactItem, isDel bool) error {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()

	docRef := dm.fileCli.Collection(DBTableContact).Doc(address)
	contactsCollectionRef := docRef.Collection("contacts")

	return dm.fileCli.RunTransaction(opCtx, func(ctx context.Context, tx *firestore.Transaction) error {
		for _, contact := range contacts {
			contactData := BMailContact{
				Email:    contact.Email,
				Address:  contact.Address,
				NickName: contact.NickName,
				Remark:   contact.Remark,
			}

			contactDocRef := contactsCollectionRef.Doc(contact.Email)

			if isDel {
				// 如果isDel为true，删除数据库中的数据
				if err := tx.Delete(contactDocRef); err != nil {
					return fmt.Errorf("failed to delete contact: %v", err)
				}
			} else {
				// 如果isDel为false，执行增加或更新操作
				if err := tx.Set(contactDocRef, contactData); err != nil {
					return fmt.Errorf("failed to set contact: %v", err)
				}
			}
		}
		return nil
	})
}

func (dm *DbManager) QueryContacts(address string, startAfterEmail string) ([]*pbs.ContactItem, error) {
	opCtx, cancel := context.WithTimeout(dm.ctx, DefaultDBTimeOut)
	defer cancel()

	docRef := dm.fileCli.Collection(DBTableContact).Doc(address)
	contactsCollectionRef := docRef.Collection("contacts")

	query := contactsCollectionRef.OrderBy("email", firestore.Asc).Limit(10)

	if startAfterEmail != "" {
		query = query.StartAfter(startAfterEmail)
	}

	iter := query.Documents(opCtx)
	defer iter.Stop()

	var contacts []*pbs.ContactItem
	for {
		doc, err := iter.Next()
		if errors.Is(err, iterator.Done) {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to query contacts: %v", err)
		}

		var contact BMailContact
		if err := doc.DataTo(&contact); err != nil {
			return nil, fmt.Errorf("failed to parse contact data: %v", err)
		}
		var obj = &pbs.ContactItem{
			Email:    contact.Email,
			Address:  contact.Address,
			NickName: contact.NickName,
			Remark:   contact.Remark,
		}
		contacts = append(contacts, obj)
	}

	return contacts, nil
}
