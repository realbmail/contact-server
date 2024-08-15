package wallet

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"golang.org/x/crypto/curve25519"
	"testing"
)

const (
	walletStr = `{
    "address": {
        "bmail_address": "BM6rL3F9gBh6x9aHAWn1MfiM25Y9TjCaxgEzdjWuPRRraT",
        "eth_address": "0xd7d1b7204a60af2600392af9a7d490deff12f120"
    },
    "cipher_data": {
        "cipher_txt": "CNSP9d/6IOszk3nz1mpkck5zzoeCloO634kkig70j3GZixcnE03CTHCDbyIcDzaY7hdFS6CVli7idtBoAoVwb3K5s6Vlnyk/26LvVldgJa0=",
        "iv": "f5f11187c50524ffca64818837b95723",
        "salt": "fd5ebf2b786d2005d0dfc851e310fa81"
    },
    "version": 1,
    "id": 1
}`
)

func TestCastToEthPri(t *testing.T) {
	seed, err := hex.DecodeString("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1")
	if err != nil {
		t.Fatal(err)
	}
	key := keyFromSeed(seed)
	fmt.Println(key.Address.String())
}

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
