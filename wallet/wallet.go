package wallet

import (
	"crypto/ecdsa"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/btcsuite/btcutil/base58"
	cryptoEth "github.com/ethereum/go-ethereum/crypto"
	"golang.org/x/crypto/curve25519"
	"io"
	"os"
	"strings"
)

const (
	BMailPrefix = "BM"
)

var (
	SigErr = fmt.Errorf("signature verify failed")
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

func OpenWalletFromPath(path, pwd string) (*Wallet, error) {
	bts, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return ParseWallet(string(bts), pwd)
}

func (w *Wallet) OpenWallet(pwd string) bool {
	if w.key != nil {
		return true
	}
	seedHex, err := DecryptAes(w.CipherData, pwd)
	if err != nil {
		return false
	}

	seed, err := hex.DecodeString(seedHex)
	if err != nil {
		return false
	}

	w.key = NewMailKeyFromSeed(seed)
	if !w.Address.Equal(w.key.Address) {
		return false
	}

	return true
}

func (w *Wallet) SignMessage(msg []byte) (string, error) {
	if w.key == nil {
		return "", errors.New("open wallet first")
	}
	bts := ed25519.Sign(w.key.priKey, msg)
	return hex.EncodeToString(bts), nil
}

func (w *Wallet) EncryptData(peerAddr, msg string) (string, error) {
	aesKey, err := w.KeyFromPeerAddr(peerAddr)
	if err != nil {
		return "", err
	}
	return DecryptByKey(msg, aesKey)
}

func (w *Wallet) KeyFromPeerAddr(addr string) ([]byte, error) {
	if w.key == nil {
		return nil, errors.New("open wallet first")
	}
	peerPub, err := DecodePubKey(addr)
	if err != nil {
		return nil, err
	}
	var curvePub = Ed2CurvePubKey(peerPub)

	var curPri = Ed2CurvePriKey(w.key.priKey)
	if curPri == nil {
		return nil, errors.New("convert ed private to curve failed")
	}

	return curve25519.X25519(curPri[:], curvePub[:])
}

func (w *Wallet) DecryptData(peerAddr, msg string) (string, error) {
	aesKey, err := w.KeyFromPeerAddr(peerAddr)
	if err != nil {
		return "", err
	}
	return EncryptByKey(msg, aesKey)
}

func DecodePubKey(pubKeyStr string) ([]byte, error) {
	if !strings.HasPrefix(pubKeyStr, BMailAddrPrefix) {
		return nil, errors.New("invalid public key prefix")
	}
	encodedAddress := strings.TrimPrefix(pubKeyStr, BMailAddrPrefix)
	decoded := base58.Decode(encodedAddress)
	return decoded, nil
}

func VerifyMessage(address, signature string, message []byte) error {
	peerPub, err := DecodePubKey(address)
	if err != nil {
		return err
	}
	sigBts, err := hex.DecodeString(signature)
	if err != nil {
		return err
	}

	success := ed25519.Verify(peerPub, message, sigBts)
	if !success {
		return SigErr
	}
	return nil
}
