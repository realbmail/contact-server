package db_redis

import (
	"encoding/json"
	"errors"
	"github.com/go-redis/redis/v8"
	"github.com/realbmail/contact-server/common"
)

func (rdm *DbManager) QueryReflectByOneEmail(emailAddr string) (*common.EmailReflect, error) {
	emailKeyStr := TableEmail + emailAddr

	data, err := rdm.cli.Get(rdm.ctx, emailKeyStr).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			common.LogInst().Warn().Str("email-addr", emailAddr).Msg("not found for account querying by email address")
			return &common.EmailReflect{}, nil
		}
		common.LogInst().Err(err).Str("email-addr", emailAddr).Msg("not found contact obj :")
		return nil, err
	}

	var contact common.EmailReflect
	err = json.Unmarshal([]byte(data), &contact)
	if err != nil {
		common.LogInst().Err(err).Str("email-addr", emailAddr).Msg("failed to unmarshal contact obj")
		return nil, err
	}

	return &contact, nil
}

func (rdm *DbManager) QueryReflectsByEmails(emailAddrs []string) (map[string]common.EmailReflect, error) {
	var keys []string
	emailAddrMap := make(map[string]string)
	for _, emailAddr := range emailAddrs {
		emailKeyStr := TableEmail + emailAddr
		keys = append(keys, emailKeyStr)
		emailAddrMap[emailKeyStr] = emailAddr
	}

	results, err := rdm.cli.MGet(rdm.ctx, keys...).Result()
	if err != nil {
		common.LogInst().Err(err).Msg("Failed to fetch documents")
		return nil, err
	}

	reflects := make(map[string]common.EmailReflect)
	for i, result := range results {
		emailKey := keys[i]
		emailAddr := emailAddrMap[emailKey]
		if result == nil {
			common.LogInst().Info().Str("email-addr", emailAddr).Msg("Email address not found")
			continue
		}

		var account common.EmailReflect
		dataStr, ok := result.(string)
		if !ok {
			common.LogInst().Err(errors.New("type assertion failed")).Str("email-addr", emailAddr).Msg("Failed to parse result")
			continue
		}
		err = json.Unmarshal([]byte(dataStr), &account)
		if err != nil {
			common.LogInst().Err(err).Str("email-addr", emailAddr).Msg("Failed to unmarshal contact object")
			continue
		}

		reflects[emailAddr] = account
	}

	return reflects, nil
}
