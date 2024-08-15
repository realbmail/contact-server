package main

import (
	"crypto/ed25519"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"github.com/realbmail/contact-server/wallet"
	"golang.org/x/crypto/curve25519"
)

var (
	walletStr = `{
    "address": {
        "bmail_address": "BM6rL3F9gBh6x9aHAWn1MfiM25Y9TjCaxgEzdjWuPRRraT",
        "eth_address": "0xd7d1b7204a60af2600392af9a7d490deff12f120"
    },
    "cipher_data": {
        "cipher_txt": "eab9cd58568ce45212f88e1f8badaf443313eb9f33a6e3e3967f7ff463bfb21ba82f58478ab8dc8f53e35b992b3f6a73958db38378ea757154dc92e0c480328de8ad9182483153c1aa6cb29926bdbdc8",
        "iv": "9356eee7ac7d6477ea11121278ce9a09",
        "salt": "2c5b4c54d6a8d8425d63e7f14d0ed7f4",
        "key_size": 8,
        "iterations": 1024
    },
    "version": 1,
    "id": 1
}`
)

func main() {
	test7()
}
func testFour() {
	var alicePrivateKey, alicePublicKey [32]byte
	peerPri, err := hex.DecodeString("18f3e9e9ac0d9cd77d1b1eac1d71fdd99a038dbfb49a9cf642395fecdfa86971")
	if err != nil {
		panic(err)
	}
	copy(alicePrivateKey[:], peerPri)

	curve25519.ScalarBaseMult(&alicePublicKey, &alicePrivateKey)

	var bobPrivateKey, bobPublicKey [32]byte
	peerPri, err = hex.DecodeString("20501526f7c3b061da5d00fdf9b51acc6a856476c110cc7d2e5215e3d1984d76")
	if err != nil {
		panic(err)
	}
	copy(bobPrivateKey[:], peerPri)

	curve25519.ScalarBaseMult(&bobPublicKey, &bobPrivateKey)

	aliceSharedKey, err := curve25519.X25519(alicePrivateKey[:], bobPublicKey[:])
	if err != nil {
		panic(err)
	}
	fmt.Println("------>alice share key=>", hex.EncodeToString(aliceSharedKey))

	bobSharedKey, err := curve25519.X25519(bobPrivateKey[:], alicePublicKey[:])
	if err != nil {
		panic(err)
	}
	fmt.Println("------>bob share key=>", hex.EncodeToString(bobSharedKey))
}
func testThree() {
	seed, err := hex.DecodeString("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1")
	if err != nil {
		panic(err)
	}

	privateKey := ed25519.NewKeyFromSeed(seed)
	fmt.Println("self ed pri pub=>", hex.EncodeToString(privateKey))

	curvePri := wallet.Ed2CurvePriKey(privateKey)

	peerEdPub, err := hex.DecodeString("bff41bb9c9568f88c4a7f0fd98ab6a13c4e147c2a233f18be541b063736ef70e")
	if err != nil {
		panic(err)
	}

	curvePub := wallet.Ed2CurvePubKey(privateKey[32:])
	fmt.Println("self curve pub=>", hex.EncodeToString(curvePub), "self curve pri=>", hex.EncodeToString(curvePri))

	peerCurvePub := wallet.Ed2CurvePubKey(peerEdPub)
	fmt.Println("peer curve pub=>", hex.EncodeToString(peerCurvePub))

	aesKey, err := curve25519.X25519(curvePri, peerCurvePub)

	fmt.Println("aes key=>", hex.EncodeToString(aesKey))

	var alicePrivateKey, alicePublicKey [32]byte
	peerPri, err := hex.DecodeString("18f3e9e9ac0d9cd77d1b1eac1d71fdd99a038dbfb49a9cf642395fecdfa86971")
	if err != nil {
		panic(err)
	}
	copy(alicePrivateKey[:], peerPri)

	curve25519.ScalarBaseMult(&alicePublicKey, &alicePrivateKey)
	fmt.Println("peer curve pub by new way=>", hex.EncodeToString(alicePublicKey[:]))

	aliceSharedKey, err := curve25519.X25519(alicePrivateKey[:], curvePub)
	if err != nil {
		panic(err)
	}

	fmt.Println("peer aes key=>", hex.EncodeToString(alicePrivateKey[:]), hex.EncodeToString(curvePub), hex.EncodeToString(aliceSharedKey))
}

func testTwo() {
	seed, err := hex.DecodeString("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1")
	if err != nil {
		panic(err)
	}

	privateKey := ed25519.NewKeyFromSeed(seed)
	fmt.Println("self ed pub=>", hex.EncodeToString(privateKey[32:]))
	curvePub := wallet.Ed2CurvePubKey(privateKey[32:])
	fmt.Println("self curve pub=>", hex.EncodeToString(curvePub))

	peerEdPub, err := hex.DecodeString("bff41bb9c9568f88c4a7f0fd98ab6a13c4e147c2a233f18be541b063736ef70e")
	if err != nil {
		panic(err)
	}
	peerCurvePub := wallet.Ed2CurvePubKey(peerEdPub)
	fmt.Println("peer curve pub=>", hex.EncodeToString(peerCurvePub))
}

func testOne() {
	seed, err := hex.DecodeString("65a3f3ccb71cb2e2177dbeffa923e527da56cc13172a7d060575e50c080c1f34")
	if err != nil {
		panic(err)
	}

	privateKey := ed25519.NewKeyFromSeed(seed)
	fmt.Println("self ed pub=>", privateKey[32:], hex.EncodeToString(privateKey[32:]))

	curvePub := wallet.Ed2CurvePubKey(privateKey[32:])
	fmt.Println("self curve pub=>", curvePub, hex.EncodeToString(curvePub))

	curvePri := wallet.Ed2CurvePriKey(privateKey)
	fmt.Println("self curve pri=>", curvePri, hex.EncodeToString(curvePri))

}

func testPri() {
	edPub, err := hex.DecodeString("bff41bb9c9568f88c4a7f0fd98ab6a13c4e147c2a233f18be541b063736ef70e")
	if err != nil {
		panic(err)
	}
	var curvePub = wallet.Ed2CurvePubKey(edPub)
	fmt.Println("peer curve pub=>", curvePub, hex.EncodeToString(curvePub[:]))

	seed, err := hex.DecodeString("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1")
	if err != nil {
		panic(err)
	}
	privateKey := ed25519.NewKeyFromSeed(seed)
	fmt.Println("self pub=>", privateKey[:32], hex.EncodeToString(privateKey[:32]))
	var curPri = wallet.Ed2CurvePriKey(privateKey)
	aesKey, err := curve25519.X25519(curPri[:], curvePub[:])
	if err != nil {
		panic(err)
	}
	fmt.Println("aesKey:=>", aesKey, hex.EncodeToString(aesKey))
}

func testPub() {
	seed, err := hex.DecodeString("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1")
	if err != nil {
		panic(err)
	}

	fmt.Println("seed:=>", hex.EncodeToString(seed))
	privateKey := ed25519.NewKeyFromSeed(seed)
	//publicKey := make([]byte, ed25519.PublicKeySize)
	var publicKey = privateKey[32:]
	fmt.Println("publicKey:=>", publicKey, hex.EncodeToString(publicKey[:]))
	var curvePub = wallet.Ed2CurvePubKey(privateKey)
	fmt.Println("Curve25519 publicKey:=>", curvePub, hex.EncodeToString(curvePub[:]))
}

const (
	CryptoKeySize = 32 // 256 bits
	ScryptN       = 1024
)

func test5() {
	// Example usage
	plainText := "Hello, World!"
	password := "my_secure_password"

	encryptedData, err := wallet.EncryptAes(plainText, password)
	if err != nil {
		fmt.Println("Error encrypting:", err)
		return
	}

	fmt.Println("Encrypted:", encryptedData)

	decryptedText, err := wallet.DecryptAes(encryptedData, password)
	if err != nil {
		fmt.Println("Error decrypting:", err)
		return
	}

	fmt.Println("Decrypted:", decryptedText)
}

func test6() {
	w, err := wallet.ParseWallet(walletStr, "12345678")
	if err != nil {
		panic(err)
	}
	fmt.Println(w.Address)
}
func test7() {
	var str = `
{"cipher_txt":"eab9cd58568ce45212f88e1f8badaf443313eb9f33a6e3e3967f7ff463bfb21ba82f58478ab8dc8f53e35b992b3f6a73958db38378ea757154dc92e0c480328de8ad9182483153c1aa6cb29926bdbdc8","iv":"9356eee7ac7d6477ea11121278ce9a09","salt":"2c5b4c54d6a8d8425d63e7f14d0ed7f4","key_size":8,"iterations":1024}
`
	var data = &wallet.CipherData{}
	err := json.Unmarshal([]byte(str), data)
	if err != nil {
		panic(err)
	}
	str, err = wallet.DecryptAes(data, "12345678")
	if err != nil {
		panic(err)
	}
	fmt.Println("result=>", str)
}
