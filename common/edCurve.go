package common

import (
	"crypto/ed25519"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"errors"
	"github.com/btcsuite/btcutil/base58"
	"github.com/realbmail/contact-server/common/edwards25519"
	"strings"
)

const BMailAddrPrefix = "BM"

func Ed2CurvePriKey(privateKey []byte) []byte {
	h := sha512.New()
	h.Write(privateKey[:32])
	digest := h.Sum(nil)

	digest[0] &= 248
	digest[31] &= 127
	digest[31] |= 64

	var detKey = make([]byte, 32)
	copy(detKey, digest)
	return detKey
}

func Ed2CurvePubKey(edPub []byte) []byte {
	var A edwards25519.ExtendedGroupElement
	var srcKey [32]byte
	var dstKey [32]byte
	copy(srcKey[:], edPub)

	if !A.FromBytes(&srcKey) {
		return nil
	}

	var x edwards25519.FieldElement
	edwardsToMontgomeryX(&x, &A.Y)
	edwards25519.FeToBytes(&dstKey, &x)
	var curvePub = make([]byte, 32)
	copy(curvePub, dstKey[:])
	return curvePub
}

func edwardsToMontgomeryX(outX, y *edwards25519.FieldElement) {
	var oneMinusY edwards25519.FieldElement
	edwards25519.FeOne(&oneMinusY)
	edwards25519.FeSub(&oneMinusY, &oneMinusY, y)
	edwards25519.FeInvert(&oneMinusY, &oneMinusY)

	edwards25519.FeOne(outX)
	edwards25519.FeAdd(outX, outX, y)

	edwards25519.FeMul(outX, outX, &oneMinusY)
}

func VerifySig(obj any, sig, peerAddr string) error {
	peerPub, err := DecodePubKey(peerAddr)
	if err != nil {
		return err
	}
	sigBts, err := hex.DecodeString(sig)
	if err != nil {
		return err
	}
	objStr, err := json.Marshal(obj)
	if err != nil {
		return err
	}

	success := ed25519.Verify(peerPub, objStr, sigBts)
	if !success {
		return errors.New("ed25519 verify failed")
	}
	return nil
}

func DecodePubKey(pubKeyStr string) ([]byte, error) {
	if !strings.HasPrefix(pubKeyStr, BMailAddrPrefix) {
		return nil, errors.New("invalid public key prefix")
	}
	encodedAddress := strings.TrimPrefix(pubKeyStr, BMailAddrPrefix)
	decoded := base58.Decode(encodedAddress)
	return decoded, nil
}
