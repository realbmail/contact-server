package main

import (
	"crypto/ed25519"
	"encoding/hex"
	"fmt"
	"github.com/realbmail/contact-server/common"
)

func main() {
	seed, err := hex.DecodeString("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1")
	if err != nil {
		panic(err)
	}

	fmt.Println("seed:=>", hex.EncodeToString(seed))
	privateKey := ed25519.NewKeyFromSeed(seed)
	//publicKey := make([]byte, ed25519.PublicKeySize)
	var publicKey [32]byte

	copy(publicKey[:], privateKey[32:])
	fmt.Println("publicKey:=>", publicKey, hex.EncodeToString(publicKey[:]))
	var curvePub [32]byte

	common.Ed25519ToCurve25519(&curvePub, &publicKey)

	fmt.Println("Curve25519 publicKey:=>", curvePub, hex.EncodeToString(curvePub[:]))

}
