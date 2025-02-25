package db_redis

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/go-redis/redis/v8"
	"github.com/realbmail/contact-server/common"
	"strconv"
)

func (rdm *DbManager) QueryAccount(accountId string) (*common.BMailAccount, error) {
	accountKeyStr := TableAccount + accountId

	// 获取所有字段
	data, err := rdm.cli.HGetAll(rdm.ctx, accountKeyStr).Result()
	if err != nil {
		common.LogInst().Err(err).Str("address", accountId).Msg("failed to fetch account data")
		return nil, fmt.Errorf("failed to fetch account: %w", err)
	}
	if len(data) == 0 {
		return nil, fmt.Errorf("account not found: %s", accountId)
	}

	// 构造对象
	account := &common.BMailAccount{}
	if level, ok := data["user_lel"]; ok {
		ul, _ := strconv.ParseInt(level, 10, 8) // 转换为 int8
		account.UserLel = int8(ul)
	}
	if emailStr, ok := data["e_mail_address"]; ok {
		_ = json.Unmarshal([]byte(emailStr), &account.EMailAddress)
	}
	if license, ok := data["license"]; ok {
		account.LicenseHex = license
	}

	return account, nil
}

func (rdm *DbManager) UpdateAccountLevel(accountId string, level int8) error {
	accountKeyStr := TableAccount + accountId

	// 检查账户是否存在
	exists, err := rdm.cli.Exists(rdm.ctx, accountKeyStr).Result()
	if err != nil {
		common.LogInst().Err(err).Str("address", accountId).Msg("failed to check account existence")
		return fmt.Errorf("failed to check account existence: %w", err)
	}
	if exists == 0 {
		common.LogInst().Err(err).Str("address", accountId).Msg("account not found")
		return fmt.Errorf("account not found: %s", accountId)
	}

	// 更新级别字段
	err = rdm.cli.HSet(rdm.ctx, accountKeyStr, "user_lel", level).Err()
	if err != nil {
		common.LogInst().Err(err).Str("address", accountId).Msg("failed to update account level")
		return fmt.Errorf("failed to update account level: %w", err)
	}

	return nil
}

func (rdm *DbManager) ActiveAccount(accountId string, level int8) error {
	accountKeyStr := TableAccount + accountId

	// 使用 HSet 存储为哈希结构
	err := rdm.cli.HSet(rdm.ctx, accountKeyStr, map[string]interface{}{
		"user_lel":       level,
		"e_mail_address": "[]",
		"license":        "",
	}).Err()
	if err != nil {
		return fmt.Errorf("failed to activate account: %w", err)
	}

	return nil
}

func (rdm *DbManager) UpdateBinding(bmailAddr string, emailAddr string) error {
	accountKey := TableAccount + bmailAddr
	emailKey := TableEmail + emailAddr

	// 检查账户是否存在
	exists, err := rdm.cli.Exists(rdm.ctx, accountKey).Result()
	if err != nil {
		return fmt.Errorf("failed to check account existence: %w", err)
	}
	if exists == 0 {
		return common.NewBMError(common.BMErrNoRight, "Activate your account first")
	}

	// 检查 Email 是否已绑定
	oldAccountId, err := rdm.cli.Get(rdm.ctx, emailKey).Result()
	if err != nil && !errors.Is(err, redis.Nil) {
		return fmt.Errorf("failed to fetch email mapping: %w", err)
	}

	// 如果 Email 已绑定到其他账户，移除旧绑定
	if oldAccountId != "" && oldAccountId != bmailAddr {
		oldAccountKey := TableAccount + oldAccountId
		if err := rdm.removeEmailFromAccount(oldAccountKey, emailAddr); err != nil {
			return fmt.Errorf("failed to remove email from old account: %w", err)
		}
	}

	// 更新 Email 的映射
	if err := rdm.cli.Set(rdm.ctx, emailKey, bmailAddr, 0).Err(); err != nil {
		return fmt.Errorf("failed to update email mapping: %w", err)
	}

	// 添加 Email 到当前账户
	if err := rdm.appendEmailToAccount(accountKey, emailAddr); err != nil {
		return fmt.Errorf("failed to add email to account: %w", err)
	}

	return nil
}

func (rdm *DbManager) DeleteBinding(bmailAddr string, emailAddr string) error {
	accountKey := TableAccount + bmailAddr
	emailKey := TableEmail + emailAddr

	// 检查账户是否存在
	exists, err := rdm.cli.Exists(rdm.ctx, accountKey).Result()
	if err != nil {
		return fmt.Errorf("failed to check account existence: %w", err)
	}
	if exists == 0 {
		return common.NewBMError(common.BMErrNoRight, "Activate your account first")
	}

	// 检查 Email 映射是否存在
	emailMapping, err := rdm.cli.Get(rdm.ctx, emailKey).Result()
	if err != nil && !errors.Is(err, redis.Nil) {
		return fmt.Errorf("failed to fetch email mapping: %w", err)
	}
	if emailMapping == "" {
		common.LogInst().Warn().Str("bmail-address", bmailAddr).Str("email", emailAddr).Msg("email mapping does not exist")
		return nil
	}

	// 删除 Email 映射
	if err := rdm.cli.Del(rdm.ctx, emailKey).Err(); err != nil {
		return fmt.Errorf("failed to delete email mapping: %w", err)
	}

	// 从账户的 Email 列表中移除
	if err := rdm.removeEmailFromAccount(accountKey, emailAddr); err != nil {
		return fmt.Errorf("failed to remove email from account: %w", err)
	}

	return nil
}

func (rdm *DbManager) UninstallByUser(bmailAddr string) error {
	return nil
}

// 添加 Email 到账户的 Helper 函数
func (rdm *DbManager) appendEmailToAccount(accountKey, emailAddr string) error {
	// 获取现有 Email 列表
	emailListStr, err := rdm.cli.HGet(rdm.ctx, accountKey, "e_mail_address").Result()
	if err != nil && !errors.Is(err, redis.Nil) {
		return fmt.Errorf("failed to fetch email list: %w", err)
	}

	// 将 Email 列表解析为切片
	var emailList []string
	if emailListStr != "" {
		if err := json.Unmarshal([]byte(emailListStr), &emailList); err != nil {
			return fmt.Errorf("failed to parse email list: %w", err)
		}
	}

	// 检查是否已存在
	for _, email := range emailList {
		if email == emailAddr {
			return nil // 已存在，无需重复添加
		}
	}

	// 添加新的 Email
	emailList = append(emailList, emailAddr)
	updatedEmailList, err := json.Marshal(emailList)
	if err != nil {
		return fmt.Errorf("failed to serialize email list: %w", err)
	}

	// 写回 Redis
	return rdm.cli.HSet(rdm.ctx, accountKey, "e_mail_address", updatedEmailList).Err()
}

// 从账户中移除 Email 的 Helper 函数
func (rdm *DbManager) removeEmailFromAccount(accountKey, emailAddr string) error {
	// 获取现有 Email 列表
	emailListStr, err := rdm.cli.HGet(rdm.ctx, accountKey, "e_mail_address").Result()
	if err != nil && !errors.Is(err, redis.Nil) {
		return fmt.Errorf("failed to fetch email list: %w", err)
	}

	// 将 Email 列表解析为切片
	var emailList []string
	if emailListStr != "" {
		if err := json.Unmarshal([]byte(emailListStr), &emailList); err != nil {
			return fmt.Errorf("failed to parse email list: %w", err)
		}
	}

	// 移除指定的 Email
	updatedList := make([]string, 0)
	for _, email := range emailList {
		if email != emailAddr {
			updatedList = append(updatedList, email)
		}
	}

	// 写回更新后的列表
	updatedEmailList, err := json.Marshal(updatedList)
	if err != nil {
		return fmt.Errorf("failed to serialize email list: %w", err)
	}
	return rdm.cli.HSet(rdm.ctx, accountKey, "e_mail_address", updatedEmailList).Err()
}

func (rdm *DbManager) DeleteAccount(accountId string) error {
	accountKey := TableAccount + accountId

	// 检查账户是否存在
	exists, err := rdm.cli.Exists(rdm.ctx, accountKey).Result()
	if err != nil {
		return fmt.Errorf("failed to check account existence: %w", err)
	}
	if exists == 0 {
		return fmt.Errorf("account does not exist: %s", accountId)
	}

	// 获取账户的 Email 地址列表
	emailAddresses, err := rdm.cli.HGet(rdm.ctx, accountKey, "e_mail_address").Result()
	if err != nil {
		return fmt.Errorf("failed to get email addresses: %w", err)
	}

	// 解析 Email 地址列表
	var emails []string
	if err := json.Unmarshal([]byte(emailAddresses), &emails); err != nil {
		return fmt.Errorf("failed to parse email addresses: %w", err)
	}

	// 删除所有相关的 Email 映射
	for _, email := range emails {
		emailKey := TableEmail + email
		if err := rdm.cli.Del(rdm.ctx, emailKey).Err(); err != nil {
			return fmt.Errorf("failed to delete email mapping for %s: %w", email, err)
		}
	}

	// 删除账户哈希表
	if err := rdm.cli.Del(rdm.ctx, accountKey).Err(); err != nil {
		return fmt.Errorf("failed to delete account: %w", err)
	}

	return nil
}
