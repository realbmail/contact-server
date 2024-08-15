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

	// Generate a random salt
	salt := make([]byte, 16)
	_, err := rand.Read(salt)
	if err != nil {
		return nil, err
	}

	// Derive the key using PBKDF2
	key := pbkdf2.Key([]byte(password), salt, ScryptN, CryptoKeyLen, sha256.New)

	// Generate a random IV
	iv := make([]byte, aes.BlockSize)
	_, err = rand.Read(iv)
	if err != nil {
		return nil, err
	}

	// Create AES cipher block
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
	// Decode salt
	salt, err := hex.DecodeString(data.Salt)
	if err != nil {
		return "", err
	}

	// Derive the key using PBKDF2
	var keyLen = 256 / data.KeySize
	key := pbkdf2.Key([]byte(password), salt, data.Iterations, keyLen, sha256.New)

	// Decode IV
	iv, err := hex.DecodeString(data.Iv)
	if err != nil {
		return "", err
	}

	// Decode ciphertext
	cipherText, err := hex.DecodeString(data.CipherTxt)
	if err != nil {
		return "", err
	}

	// Create AES cipher block
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	// Decrypt ciphertext
	plainText := make([]byte, len(cipherText))
	stream := cipher.NewCFBDecrypter(block, iv)
	stream.XORKeyStream(plainText, cipherText)

	return string(plainText), nil
}

func EncryptAes2(plainTxt, password string) (*CipherData, error) {
	// Generate a random salt
	salt := make([]byte, 16)
	_, err := rand.Read(salt)
	if err != nil {
		return nil, err
	}

	// Derive the key using PBKDF2
	key := pbkdf2.Key([]byte(password), salt, ScryptN, CryptoKeyLen, sha256.New)

	// 生成一个随机的 IV
	iv := make([]byte, aes.BlockSize)
	_, err = rand.Read(iv)
	if err != nil {
		return nil, err
	}

	// 创建 AES 密码块
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}

	plainTextBytes := []byte(plainTxt)
	cipherText := make([]byte, aes.BlockSize+len(plainTextBytes))
	copy(cipherText[:aes.BlockSize], iv) // 将 IV 复制到密文的前面
	stream := cipher.NewCFBEncrypter(block, iv)
	stream.XORKeyStream(cipherText[aes.BlockSize:], plainTextBytes)

	return &CipherData{
		CipherTxt: hex.EncodeToString(cipherText),
		Iv:        hex.EncodeToString(iv),
		Salt:      hex.EncodeToString(salt),
	}, nil
}

func DecryptAes2(data *CipherData, password string) (string, error) {
	// 解码盐
	salt, err := hex.DecodeString(data.Salt)
	if err != nil {
		return "", err
	}

	// 使用 PBKDF2 从密码和盐中导出密钥
	key := pbkdf2.Key([]byte(password), salt, ScryptN, CryptoKeyLen, sha256.New)

	// 解码密文
	cipherText, err := hex.DecodeString(data.CipherTxt)
	if err != nil {
		return "", err
	}

	if len(cipherText) < aes.BlockSize {
		return "", errors.New("cipher text too short")
	}

	// 从密文的开头提取 IV
	iv := cipherText[:aes.BlockSize]
	cipherText = cipherText[aes.BlockSize:]

	// 创建 AES 密码块
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	// 解密密文
	plainText := make([]byte, len(cipherText))
	stream := cipher.NewCFBDecrypter(block, iv)
	stream.XORKeyStream(plainText, cipherText)

	return string(plainText), nil
}
