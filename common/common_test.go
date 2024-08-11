package common

import (
	"crypto/ed25519"
	"crypto/rand"
	"fmt"
	"github.com/GoKillers/libsodium-go/cryptosign"
	sodium "github.com/GoKillers/libsodium-go/sodium"
	"golang.org/x/crypto/curve25519"
	"testing"
)

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

func TestCurToEd(t *testing.T) {
	sodium.Init()

	// 生成Ed25519密钥对
	ed25519PrivKey, ed25519PubKey, err := cryptosign.CryptoSignKeyPair()
	if err < 0 {
		t.Fatalf("Error generating Ed25519 key pair: %d\n", err)
	}

	//// 检查密钥长度是否为64字节
	if len(ed25519PrivKey) != 64 {
		t.Fatalf("Expected 64 byte Ed25519 private key, got %d bytes", len(ed25519PrivKey))
	}

	// 将Ed25519私钥转换为Curve25519私钥
	curve25519PrivKey, err := cryptosign.CryptoSignEd25519SkToCurve25519(ed25519PrivKey)
	if err < 0 {
		t.Fatalf("Error converting Ed25519 private key to Curve25519: %d\n", err)
	}

	// 将Ed25519公钥转换为Curve25519公钥
	curve25519PubKey, err := cryptosign.CryptoSignEd25519PkToCurve25519(ed25519PubKey)
	if err < 0 {
		t.Fatalf("Error converting Ed25519 public key to Curve25519: %d\n", err)
	}

	fmt.Printf("Ed25519 Public Key: %x\n", ed25519PubKey)
	fmt.Printf("Curve25519 Public Key: %x\n", curve25519PubKey)
	fmt.Printf("Ed25519 Private Key: %x\n", ed25519PrivKey[:32]) // Ed25519 私钥的前32字节是种子
	fmt.Printf("Curve25519 Private Key: %x\n", curve25519PrivKey)
}
