package database

import (
	"cloud.google.com/go/firestore"
	"context"
	"fmt"
	"google.golang.org/api/option"
	"log"
	"testing"
)

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
