package common

import (
	"crypto/ed25519"
	cryptorand "crypto/rand"
	"encoding/hex"
	"fmt"
	"golang.org/x/crypto/curve25519"
	"testing"
)

func TestEdToCur(t *testing.T) {
	_, privateKey, err := ed25519.GenerateKey(cryptorand.Reader)
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
	//randReader := cryptorand.Reader
	//seed := make([]byte, ed25519.SeedSize)
	//if _, err := io.ReadFull(randReader, seed); err != nil {
	//	t.Fatal(err)
	//}

	seed, err := hex.DecodeString("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1")
	if err != nil {
		t.Fatal(err)
	}

	fmt.Println("seed:=>", hex.EncodeToString(seed))
	privateKey := ed25519.NewKeyFromSeed(seed)
	//publicKey := make([]byte, ed25519.PublicKeySize)
	var publicKey = privateKey[32:]

	fmt.Println("publicKey:=>", publicKey, hex.EncodeToString(publicKey[:]))

	var curvePub = Ed2CurvePubKey(publicKey)

	fmt.Println("Curve25519 publicKey:=>", curvePub, hex.EncodeToString(curvePub[:]))

}

func TestEncryptByEdPub(t *testing.T) {

	edPub, err := hex.DecodeString("0390f240edf801f4736e35850a581c08aa4c7d43e3555a6a39628283e80ab63e")
	if err != nil {
		t.Fatal(err)
	}

	var curvePub = Ed2CurvePubKey(edPub)
	if curvePub == nil {
		t.Fatal("convert ed to curve failed")
	}

	seed, err := hex.DecodeString("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1")
	if err != nil {
		t.Fatal(err)
	}
	privateKey := ed25519.NewKeyFromSeed(seed)

	var curPri = Ed2CurvePriKey(privateKey)
	if curPri == nil {
		t.Fatal("convert ed private to curve failed")
	}

	aesKey, err := curve25519.X25519(curPri[:], curvePub[:])
	if err != nil {
		t.Fatal(err)
	}
	fmt.Println("aesKey:=>", aesKey, hex.EncodeToString(aesKey))
}
