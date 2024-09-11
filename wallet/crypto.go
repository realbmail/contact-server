package wallet

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"golang.org/x/crypto/pbkdf2"
)

const (
	CryptoKeyLen = 32 // 256 bits
	ScryptN      = 1024
)

type CipherData struct {
	CipherTxt  string `json:"cipher_txt"`
	Iv         string `json:"iv"`
	Salt       string `json:"salt"`
	KeySize    int    `json:"key_size"`
	Iterations int    `json:"iterations"`
}

func EncryptAes(plainTxt, password string) (*CipherData, error) {

	salt := make([]byte, 16)
	_, err := rand.Read(salt)
	if err != nil {
		return nil, err
	}

	key := pbkdf2.Key([]byte(password), salt, ScryptN, CryptoKeyLen, sha256.New)

	iv := make([]byte, aes.BlockSize)
	_, err = rand.Read(iv)
	if err != nil {
		return nil, err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	plainTextBytes := []byte(plainTxt)
	cipherText := make([]byte, len(plainTextBytes))
	stream := cipher.NewCFBEncrypter(block, iv)
	stream.XORKeyStream(cipherText, plainTextBytes)

	return &CipherData{
		CipherTxt:  hex.EncodeToString(cipherText),
		Iv:         hex.EncodeToString(iv),
		Salt:       hex.EncodeToString(salt),
		KeySize:    256 / CryptoKeyLen,
		Iterations: ScryptN,
	}, nil
}

func DecryptAes(data *CipherData, password string) (string, error) {
	salt, err := hex.DecodeString(data.Salt)
	if err != nil {
		return "", err
	}

	var keyLen = 256 / data.KeySize
	key := pbkdf2.Key([]byte(password), salt, data.Iterations, keyLen, sha256.New)

	iv, err := hex.DecodeString(data.Iv)
	if err != nil {
		return "", err
	}

	cipherText, err := hex.DecodeString(data.CipherTxt)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	plainText := make([]byte, len(cipherText))
	stream := cipher.NewCFBDecrypter(block, iv)
	stream.XORKeyStream(plainText, cipherText)

	paddingLen := int(plainText[len(plainText)-1])
	if paddingLen > 0 && paddingLen <= aes.BlockSize {
		plainText = plainText[:len(plainText)-paddingLen]
	}

	return string(plainText), nil
}

func EncryptByKey(plainTxt string, key []byte) (string, error) {
	iv := make([]byte, aes.BlockSize)
	_, err := rand.Read(iv)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	plainTextBytes := []byte(plainTxt)
	cipherText := make([]byte, aes.BlockSize+len(plainTextBytes))
	copy(cipherText[:aes.BlockSize], iv)
	stream := cipher.NewCFBEncrypter(block, iv)
	stream.XORKeyStream(cipherText[aes.BlockSize:], plainTextBytes)

	return hex.EncodeToString(cipherText), nil
}

func DecryptByKey(data string, key []byte) (string, error) {

	cipherText, err := hex.DecodeString(data)
	if err != nil {
		return "", err
	}

	if len(cipherText) < aes.BlockSize {
		return "", errors.New("cipher text too short")
	}

	iv := cipherText[:aes.BlockSize]
	cipherText = cipherText[aes.BlockSize:]

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	plainText := make([]byte, len(cipherText))
	stream := cipher.NewCFBDecrypter(block, iv)
	stream.XORKeyStream(plainText, cipherText)

	return string(plainText), nil
}
