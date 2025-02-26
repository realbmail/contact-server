package wallet

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"golang.org/x/crypto/curve25519"
	"os"
	"testing"
)

const (
	walletStr = `{
    "address": {
        "bmail_address": "BM6rL3F9gBh6x9aHAWn1MfiM25Y9TjCaxgEzdjWuPRRraT",
        "eth_address": "0xd7d1b7204a60af2600392af9a7d490deff12f120"
    },
    "cipher_data": {
        "cipher_txt": "865d31feccae25c5c68a99cb4c77169c37995621ac64a8f93080bf2b41fc0e0fd5dc4739113a71281a0484194e309b96c85f60cf3c765d93906467c9d94ae015d40bde3b14076b939dc3624aad3d545b",
        "iv": "a0dabe442bae24abeb1389ee4a9287fb",
        "salt": "1e46689e71119f68daeea9e077f355d4",
        "key_size": 8,
        "iterations": 1024
    },
    "version": 1,
    "id": 1
}`

	walletStr2 = `{
    "address": {
        "bmail_address": "BMosv9sni68L1TsKgeJTDmpB6vqccKRLMJEEgYZgXZDse",
        "eth_address": "0xbde97696c822ff18c1efb78a069cd05f51e7e94a"
    },
    "cipher_data": {
        "cipher_txt": "2d1c7b4f0c0fb91ca21efe0c60706a8babc2488cb9795bf3f33431e06ae6189974b20fb64dc44e39ffa2031ca84252c83e93f33d34867adb2f4e7980b862ec29f1ce07ee8deeb80d0d8a94581e562acc",
        "iv": "456ab1469b56943b7a429af70e8e5194",
        "salt": "1adbdaace1e4e749f471b2c12915899b",
        "key_size": 8,
        "iterations": 1024
    },
    "version": 1,
    "id": 1
}
`
)

var pwd string

func init() {
	flag.StringVar(&pwd, "pwd", "12345678", "pwd")
}
func TestNewWallet(t *testing.T) {
	key := NewMailKey()
	w, err := key.ToWallet(pwd)
	if err != nil {
		t.Fatal(err)
	}

	fmt.Println(w.String())
	_ = os.WriteFile("wallet.json", []byte(w.String()), 0644)
}

func TestParseWallet(t *testing.T) {
	w, err := ParseWallet(walletStr2, pwd)
	if err != nil {
		t.Fatal(err)
	}
	fmt.Println(w.Address)
}
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

func TestEncryptAdDecrypt(t *testing.T) {

	data, err := EncryptAes("hello, world", "123")
	if err != nil {
		t.Fatal(err)
	}
	bt, _ := json.Marshal(data)
	fmt.Println(string(bt))
	str, err := DecryptAes(data, "123")
	if err != nil {
		t.Fatal(err)
	}
	fmt.Println("result=>", str)
}

func TestDecryptOfTsEncode(t *testing.T) {
	var str = `
{"cipher_txt":"eab9cd58568ce45212f88e1f8badaf443313eb9f33a6e3e3967f7ff463bfb21ba82f58478ab8dc8f53e35b992b3f6a73958db38378ea757154dc92e0c480328de8ad9182483153c1aa6cb29926bdbdc8","iv":"9356eee7ac7d6477ea11121278ce9a09","salt":"2c5b4c54d6a8d8425d63e7f14d0ed7f4","key_size":8,"iterations":1024}
`
	var data = &CipherData{}
	err := json.Unmarshal([]byte(str), data)
	if err != nil {
		t.Fatal(err)
	}
	str, err = DecryptAes(data, pwd)
	if err != nil {
		t.Fatal(err)
	}
	fmt.Println("result=>", str)
}

func TestOpenWallet(t *testing.T) {
	w, err := LoadWallet(walletStr2)
	if err != nil {
		t.Fatal(err)
	}
	if !w.OpenWallet(pwd) {
		t.Fatal("open wallet failed")
	}
	fmt.Println("Open success:=>", w.Address)
}
