package database

import (
	"cloud.google.com/go/firestore"
	"context"
	"flag"
	"fmt"
	"google.golang.org/api/option"
	"log"
	"testing"
)

var address string
var (
	userLevel = uint(UserLevelFree)
)

func init() {
	flag.StringVar(&address, "addr", "", "--addr")
	flag.UintVar(&userLevel, "level", uint(UserLevelFree), "--level")
}

func TestPingDB(t *testing.T) {
	ctx := context.Background()
	saPath := "../dessage-c3b5c95267fb.json"
	client, err := firestore.NewClientWithDatabase(ctx, "dessage",
		"bmail-contact", option.WithCredentialsFile(saPath))
	if err != nil {
		log.Fatalf("Failed to create Firestore client: %v", err)
	}
	defer client.Close()

	iter := client.Collection(DefaultDatabaseID).Documents(ctx)
	defer iter.Stop()

	count := 0
	for {
		_, err := iter.Next()
		if err != nil {
			fmt.Println(err)
			break
		}
		count++
	}

	fmt.Println("total count:", count)
}

func TestAddAccount(t *testing.T) {
	ctx := context.Background()
	saPath := "../dessage-c3b5c95267fb.json"
	client, err := firestore.NewClientWithDatabase(ctx, "dessage",
		"bmail-contact", option.WithCredentialsFile(saPath))
	if err != nil {
		log.Fatalf("Failed to create Firestore client: %v", err)
	}
	defer client.Close()
	opCtx, cancel := context.WithTimeout(ctx, DefaultDBTimeOut*10)
	defer cancel()
	docRef := client.Collection(DBTableAccount).Doc(address)
	var obj = BMailAccount{
		UserLel: UserLevel(userLevel),
	}
	_, err = docRef.Set(opCtx, obj)
	if err != nil {
		panic(err)
	}
	fmt.Println("create bmail account success")
}
