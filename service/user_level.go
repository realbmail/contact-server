package service

import (
	"errors"
	"github.com/realbmail/contact-server/db_firestore"
	pbs "github.com/realbmail/contact-server/proto"
)

type UserLevel uint8

const (
	UserLevelInActive UserLevel = iota
	UserLevelFree
	UserLevelBronze
	UserLevelSilver
	UserLevelGold
)
const (
	EmailAddrNoForFree   = 1
	EmailAddrNoForBronze = 3
	EmailAddrNoForSilver = 5
)

var NoRightError = errors.New("no right to operate")

func checkRightsOfAction(operation *pbs.BindAction) error {
	acc, err := db_firestore.DbInst().QueryAccount(operation.Address)
	if err != nil {
		return err
	}
	resultSize := len(acc.EMailAddress) + 1
	switch UserLevel(acc.UserLel) {
	case UserLevelInActive:
	default:
		return NoRightError

	case UserLevelFree:
		if resultSize > EmailAddrNoForFree {
			return NoRightError
		}
		return nil

	case UserLevelBronze:
		if resultSize > EmailAddrNoForBronze {
			return NoRightError
		}
		return nil

	case UserLevelSilver:
		if resultSize > EmailAddrNoForSilver {
			return NoRightError
		}
		return nil

	case UserLevelGold:
		return nil
	}
	return nil
}

func checkRightsOfAccount(operation *pbs.AccountOperation) error {
	acc, err := db_firestore.DbInst().QueryAccount(operation.Address)
	if err != nil {
		return err
	}
	if operation.IsDel {
		return nil
	}
	newEmailList := uniqueCombine(acc.EMailAddress, operation.Emails)
	switch UserLevel(acc.UserLel) {
	case UserLevelInActive:
	default:
		return NoRightError

	case UserLevelFree:
		if len(newEmailList) > EmailAddrNoForFree {
			return NoRightError
		}
		return nil

	case UserLevelBronze:
		if len(newEmailList) > EmailAddrNoForBronze {
			return NoRightError
		}
		return nil

	case UserLevelSilver:
		if len(newEmailList) > EmailAddrNoForSilver {
			return NoRightError
		}
		return nil

	case UserLevelGold:
		return nil
	}

	return nil
}

func uniqueCombine(slice1, slice2 []string) []string {
	seen := make(map[string]bool)
	var result []string
	addIfNotSeen := func(s []string) {
		for _, item := range s {
			if !seen[item] {
				seen[item] = true
				result = append(result, item)
			}
		}
	}
	addIfNotSeen(slice1)
	addIfNotSeen(slice2)
	return result
}