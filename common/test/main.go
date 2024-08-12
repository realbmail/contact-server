package main

import (
	"crypto/ed25519"
	"encoding/hex"
	"fmt"
	"github.com/realbmail/contact-server/common"
	"golang.org/x/crypto/curve25519"
)

func main() {
	testFour()
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

	curvePri := common.Ed2CurvePriKey(privateKey)

	peerEdPub, err := hex.DecodeString("bff41bb9c9568f88c4a7f0fd98ab6a13c4e147c2a233f18be541b063736ef70e")
	if err != nil {
		panic(err)
	}

	curvePub := common.Ed2CurvePubKey(privateKey[32:])
	fmt.Println("self curve pub=>", hex.EncodeToString(curvePub), "self curve pri=>", hex.EncodeToString(curvePri))

	peerCurvePub := common.Ed2CurvePubKey(peerEdPub)
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
	curvePub := common.Ed2CurvePubKey(privateKey[32:])
	fmt.Println("self curve pub=>", hex.EncodeToString(curvePub))

	peerEdPub, err := hex.DecodeString("bff41bb9c9568f88c4a7f0fd98ab6a13c4e147c2a233f18be541b063736ef70e")
	if err != nil {
		panic(err)
	}
	peerCurvePub := common.Ed2CurvePubKey(peerEdPub)
	fmt.Println("peer curve pub=>", hex.EncodeToString(peerCurvePub))
}

func testOne() {
	seed, err := hex.DecodeString("65a3f3ccb71cb2e2177dbeffa923e527da56cc13172a7d060575e50c080c1f34")
	if err != nil {
		panic(err)
	}

	privateKey := ed25519.NewKeyFromSeed(seed)
	fmt.Println("self ed pub=>", privateKey[32:], hex.EncodeToString(privateKey[32:]))

	curvePub := common.Ed2CurvePubKey(privateKey[32:])
	fmt.Println("self curve pub=>", curvePub, hex.EncodeToString(curvePub))

	curvePri := common.Ed2CurvePriKey(privateKey)
	fmt.Println("self curve pri=>", curvePri, hex.EncodeToString(curvePri))

}

func testPri() {
	edPub, err := hex.DecodeString("bff41bb9c9568f88c4a7f0fd98ab6a13c4e147c2a233f18be541b063736ef70e")
	if err != nil {
		panic(err)
	}
	var curvePub = common.Ed2CurvePubKey(edPub)
	fmt.Println("peer curve pub=>", curvePub, hex.EncodeToString(curvePub[:]))

	seed, err := hex.DecodeString("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1")
	if err != nil {
		panic(err)
	}
	privateKey := ed25519.NewKeyFromSeed(seed)
	fmt.Println("self pub=>", privateKey[:32], hex.EncodeToString(privateKey[:32]))
	var curPri = common.Ed2CurvePriKey(privateKey)
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
	var curvePub = common.Ed2CurvePubKey(privateKey)
	fmt.Println("Curve25519 publicKey:=>", curvePub, hex.EncodeToString(curvePub[:]))
}
