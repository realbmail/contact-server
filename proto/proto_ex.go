package pbs

import (
	"crypto/ed25519"
	"encoding/hex"
	"errors"
	"github.com/realbmail/contact-server/wallet"
)

func VerifyProto(r *BMReq) error {
	peerPub, err := wallet.DecodePubKey(r.Address)
	if err != nil {
		return err
	}
	sigBts, err := hex.DecodeString(r.Signature)
	if err != nil {
		return err
	}

	success := ed25519.Verify(peerPub, r.Payload, sigBts)
	if !success {
		return errors.New("ed25519 verify failed")
	}
	return nil
}
