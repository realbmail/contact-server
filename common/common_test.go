package common

import (
	"crypto/ed25519"
	"crypto/rand"
	cryptorand "crypto/rand"
	"encoding/hex"
	"fmt"
	"golang.org/x/crypto/curve25519"
	"io"
	"testing"
)

func TestEdToCur(t *testing.T) {
	_, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		fmt.Println("Error generating Ed25519 key:", err)
		return
	}

	// 将Ed25519私钥转换为Curve25519私钥
	var curve25519PrivateKey [32]byte
	copy(curve25519PrivateKey[:], privateKey.Seed())
	curve25519PrivateKey[0] &= 248
	curve25519PrivateKey[31] &= 127
	curve25519PrivateKey[31] |= 64

	// 生成Curve25519公钥
	var curve25519PublicKey [32]byte
	curve25519.ScalarBaseMult(&curve25519PublicKey, &curve25519PrivateKey)

	fmt.Println("Curve25519 Private Key:", curve25519PrivateKey)
	fmt.Println("Curve25519 Public Key:", curve25519PublicKey)
}

func TestEd25519ToCurve25519(t *testing.T) {
	randReader := cryptorand.Reader
	seed := make([]byte, ed25519.SeedSize)
	if _, err := io.ReadFull(randReader, seed); err != nil {
		t.Fatal(err)
	}

	fmt.Println("seed:=>", hex.EncodeToString(seed))
	privateKey := ed25519.NewKeyFromSeed(seed)
	//publicKey := make([]byte, ed25519.PublicKeySize)
	var publicKey [32]byte

	copy(publicKey[:], privateKey[32:])
	fmt.Println("publicKey:=>", publicKey, hex.EncodeToString(publicKey[:]))
	var curvePub [32]byte

	Ed25519ToCurve25519(&curvePub, &publicKey)

	fmt.Println("Curve25519 publicKey:=>", curvePub, hex.EncodeToString(curvePub[:]))

}
