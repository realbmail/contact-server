package wallet

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"github.com/btcsuite/btcutil/base58"
	"io"
)

const (
	BMailPrefix = "BM"
)

type MailKey struct {
	priRaw  []byte
	Address string
	priKey  ed25519.PrivateKey
}

func NewMailKey() *MailKey {
	seed := make([]byte, ed25519.SeedSize)
	if _, err := io.ReadFull(rand.Reader, seed); err != nil {
		panic(err)
	}
	return keyFromSeed(seed)
}

func NewMailKeyFromSeed(seed []byte) *MailKey {
	return keyFromSeed(seed)
}

func keyFromSeed(seed []byte) *MailKey {
	privateKey := ed25519.NewKeyFromSeed(seed)
	publicKey := make([]byte, ed25519.PublicKeySize)
	copy(publicKey, privateKey[32:])
	address := BMailPrefix + base58.Encode(publicKey)
	key := &MailKey{
		priRaw:  seed,
		Address: address,
		priKey:  privateKey,
	}
	return key
}

func (mk *MailKey) SignMessage(msg []byte) string {
	bts := ed25519.Sign(mk.priKey, msg)
	return hex.EncodeToString(bts)
}

type Wallet struct {
	Address   string
	CipherTxt *CipherData
	Version   int
	key       *MailKey
}

func (mk *MailKey) ToWallet(pwd string) (*Wallet, error) {
	cipher, err := EncryptAes(hex.EncodeToString(mk.priRaw), pwd)
	if err != nil {
		return nil, err
	}
	w := &Wallet{
		Address:   mk.Address,
		CipherTxt: cipher,
		Version:   1,
	}
	return w, nil
}

func (w *Wallet) String() string {
	bts, _ := json.MarshalIndent(w, "", "\t")
	return string(bts)
}
func LoadWallet(jsonStr string) (*Wallet, error) {
	var w = &Wallet{}
	err := json.Unmarshal([]byte(jsonStr), w)
	if err != nil {
		return nil, err
	}
	return w, nil
}

func ParseWallet(jsonStr, pwd string) (*Wallet, error) {

	w, err := LoadWallet(jsonStr)
	if err != nil {
		return nil, err
	}

	priStr, err := DecryptAes(w.CipherTxt, pwd)
	if err != nil {
		return nil, err
	}

	w.key = NewMailKeyFromSeed([]byte(priStr))
	if w.key.Address != w.Address {
		return nil, errors.New("address invalid")
	}
	return w, nil
}

func (w *Wallet) OpenWallet(pwd string) bool {
	if w.key != nil {
		return true
	}
	priStr, err := DecryptAes(w.CipherTxt, pwd)
	if err != nil {
		return false
	}

	w.key = NewMailKeyFromSeed([]byte(priStr))
	if w.key.Address != w.Address {
		return false
	}

	return true
}
