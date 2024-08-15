package wallet

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"flag"
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

	walletStr2 = `{
        "address": {
                "bmail_address": "BM95mkc8xpkbEkX58i6wdLWJ2XM8j4NMcbhWx7KLjWBaTd",
                "eth_address": "0xb4cff8aaCe0Ca29074857A2DCa4164fd0E039677"
        },
        "cipher_data": {
                "cipher_txt": "8e02889bba6e806fc452e6a75f047d9b0a71ae3fc2a41c0bc5a4708d11bbfcfa0f74a86cfc8c8e50901c8d5340d6767d25bd9c0233b9e52f1386a7271d9b7117b30b610830a4d30a8f28323c0f28d299",
                "iv": "8e02889bba6e806fc452e6a75f047d9b",
                "salt": "4573c52c4ca65ff56e6a75544f6f96f5"
        },
        "version": 1
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
}

func TestParseWallet(t *testing.T) {
	w, err := ParseWallet(walletStr, pwd)
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
	var str = `{"cipher_txt":"9d97cd81e6ce67620b21f1597b92a960","iv":"75893604498fbba66518602c28cf026c","salt":"b526a27ddc274452b6737d209c35c775","key_size":8,"iterations":1024}`
	var data = &CipherData{}
	err := json.Unmarshal([]byte(str), data)
	if err != nil {
		t.Fatal(err)
	}
	str, err = DecryptAes(data, "123")
	if err != nil {
		t.Fatal(err)
	}
	fmt.Println("result=>", str)
}
