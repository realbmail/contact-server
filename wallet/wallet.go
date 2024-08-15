package wallet

import (
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"github.com/btcsuite/btcutil/base58"
	cryptoEth "github.com/ethereum/go-ethereum/crypto"
	"io"
	"strings"
)

const (
	BMailPrefix = "BM"
)

type MailAddr struct {
	BmailAddress string `json:"bmail_address"`
	EthAddress   string `json:"eth_address"`
}

func (ma *MailAddr) String() string {
	bts, _ := json.Marshal(ma)
	return string(bts)
}

func (ma *MailAddr) Equal(ma2 *MailAddr) bool {
	return ma.BmailAddress == ma2.BmailAddress && strings.ToLower(ma.EthAddress) == strings.ToLower(ma2.EthAddress)
}

type MailKey struct {
	priRaw  []byte
	Address *MailAddr
	priKey  ed25519.PrivateKey
	ehtPri  *ecdsa.PrivateKey
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
	ethKey := cryptoEth.ToECDSAUnsafe(seed)
	ethPub := cryptoEth.PubkeyToAddress(ethKey.PublicKey).String()

	key := &MailKey{
		priRaw:  seed,
		Address: &MailAddr{BmailAddress: address, EthAddress: ethPub},
		priKey:  privateKey,
		ehtPri:  ethKey,
	}
	return key
}

func (mk *MailKey) SignMessage(msg []byte) string {
	bts := ed25519.Sign(mk.priKey, msg)
	return hex.EncodeToString(bts)
}

type Wallet struct {
	Address    *MailAddr   `json:"address"`
	CipherData *CipherData `json:"cipher_data"`
	Version    int         `json:"version"`
	key        *MailKey
}

func (mk *MailKey) ToWallet(pwd string) (*Wallet, error) {
	cipher, err := EncryptAes(hex.EncodeToString(mk.priRaw), pwd)
	if err != nil {
		return nil, err
	}
	w := &Wallet{
		Address:    mk.Address,
		CipherData: cipher,
		Version:    1,
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

	seedHex, err := DecryptAes(w.CipherData, pwd)
	if err != nil {
		return nil, err
	}

	seed, err := hex.DecodeString(seedHex)
	if err != nil {
		return nil, err
	}
	w.key = NewMailKeyFromSeed(seed)
	if !w.Address.Equal(w.key.Address) {
		return nil, errors.New("address invalid")
	}
	return w, nil
}

func (w *Wallet) OpenWallet(pwd string) bool {
	if w.key != nil {
		return true
	}
	priStr, err := DecryptAes(w.CipherData, pwd)
	if err != nil {
		return false
	}

	w.key = NewMailKeyFromSeed([]byte(priStr))
	if !w.Address.Equal(w.key.Address) {
		return false
	}

	return true
}
