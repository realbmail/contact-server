package service

import (
	"errors"
	"fmt"
	pbs "github.com/realbmail/contact-server/proto"
)

type UserLevel uint8

const (
	UserLevelInActive UserLevel = iota
	UserLevelFree
	UserLevelNormalVip
	UserLevelPlusVip
	UserLevelEnterpriseVip
)
const (
	EmailAddrNoForFree   = 2
	EmailAddrNoForNormal = 4
	EmailAddrNoForPlus   = 8
)

var NoRightError = errors.New("no right to operate")

func checkRightsOfAction(address string) error {
	acc, err := __httpConf.database.QueryAccount(address)
	if err != nil {
		return err
	}
	resultSize := len(acc.EMailAddress) + 1
	switch UserLevel(acc.UserLel) {
	case UserLevelInActive:
	default:
		return fmt.Errorf("%w: user is inactive", NoRightError)

	case UserLevelFree:
		if resultSize > EmailAddrNoForFree {
			return fmt.Errorf("%w: free users can only bind %d email addresses", NoRightError, EmailAddrNoForFree)
		}
		return nil

	case UserLevelNormalVip:
		if resultSize > EmailAddrNoForNormal {
			return fmt.Errorf("%w: normal vip users can only bind %d email addresses", NoRightError, EmailAddrNoForNormal)
		}
		return nil

	case UserLevelPlusVip:
		if resultSize > EmailAddrNoForPlus {
			return fmt.Errorf("%w: plus vip users can only bind %d email addresses", NoRightError, EmailAddrNoForPlus)
		}
		return nil

	case UserLevelEnterpriseVip:
		return nil
	}
	return nil
}

func checkRightsOfAccount(operation *pbs.AccountOperation) error {
	acc, err := __httpConf.database.QueryAccount(operation.Address)
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

	case UserLevelNormalVip:
		if len(newEmailList) > EmailAddrNoForNormal {
			return NoRightError
		}
		return nil

	case UserLevelPlusVip:
		if len(newEmailList) > EmailAddrNoForPlus {
			return NoRightError
		}
		return nil

	case UserLevelEnterpriseVip:
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
