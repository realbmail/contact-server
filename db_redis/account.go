package db_redis

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/go-redis/redis/v8"
	"github.com/realbmail/contact-server/common"
	"strings"
)

func (rdm *DbManager) QueryAccount(bmailAddr string) (*common.BMailAccount, error) {
	accountKeyStr := TableAccount + bmailAddr

	data, err := rdm.cli.Get(rdm.ctx, accountKeyStr).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return &common.BMailAccount{}, nil
		}
		common.LogInst().Err(err).Str("bmail-address", bmailAddr).Msg("not found account obj :")
		return nil, err
	}

	var account common.BMailAccount
	err = json.Unmarshal([]byte(data), &account)
	if err != nil {
		common.LogInst().Err(err).Str("bmail-address", bmailAddr).Msg("failed to unmarshal account data")
		return nil, err
	}

	return &account, nil
}

func (rdm *DbManager) OperateAccount(bmailAddr string, emailAddr []string, isDel bool) error {
	panic("this api not support any more")
}

func (rdm *DbManager) UpdateAccountLevel(accountId string, level int8) error {
	accountKeyStr := TableAccount + accountId

	script := `
    local key = KEYS[1]
    local newLevel = tonumber(ARGV[1])

    local data = redis.call("GET", key)
    if not data then
        return {err="account not found"}
    end

    local account = cjson.decode(data)
    account.user_lel = newLevel

    local updatedData = cjson.encode(account)
    redis.call("SET", key, updatedData)
    return "OK"
    `

	_, err := rdm.cli.Eval(rdm.ctx, script, []string{accountKeyStr}, level).Result()
	if err != nil {
		if err.Error() == "account not found" {
			common.LogInst().Err(err).Str("address", accountId).Msg("account not found")
			return err
		}
		common.LogInst().Err(err).Str("address", accountId).Msg("failed to update account level")
		return err
	}

	return nil
}

func (rdm *DbManager) ActiveAccount(accountId string, level int8) error {
	accountKeyStr := TableAccount + accountId

	// 定义 Lua 脚本
	script := `
    local key = KEYS[1]
    local level = tonumber(ARGV[1])

    -- 检查账户是否存在
    local exists = redis.call("EXISTS", key)
    if exists == 1 then
        return {err="duplicate create action"}
    end

    -- 创建账户对象
    local accountJson = string.format(
        '{"user_lel":%d,"e_mail_address":[],"license":""}',
        level
    )

    -- 写入 Redis
    redis.call("SET", key, accountJson)
    return "OK"
    `

	// 执行 Lua 脚本
	result, err := rdm.cli.Eval(rdm.ctx, script, []string{accountKeyStr}, level).Result()
	if err != nil {
		if strings.Contains(err.Error(), "duplicate create action") {
			// 账户已存在，记录警告日志并返回 nil
			common.LogInst().Warn().Str("bmail-account", accountId).Msg("duplicate create action")
			return nil
		}
		// 其他错误，记录错误日志并返回错误
		common.LogInst().Err(err).Str("address", accountId).Msg("failed to activate account")
		return err
	}

	// 检查结果是否为 "OK"
	if result == "OK" {
		return nil
	} else {
		common.LogInst().Warn().Str("result", fmt.Sprintf("%v", result)).Msg("unexpected result")
		return fmt.Errorf("unexpected result: %v", result)
	}
}

func (rdm *DbManager) UpdateBinding(bmailAddr string, emailAddr string) error {
	accountKey := TableAccount + bmailAddr
	emailKey := TableEmail + emailAddr

	// Lua 脚本
	script := `
    local accountKey = KEYS[1]
    local emailKey = KEYS[2]
    local newEmail = ARGV[1]
    local newAccount = ARGV[2]

    -- 检查账户是否存在
    local accountData = redis.call("GET", accountKey)
    if not accountData then
        return {err="Account does not exist"}
    end

    -- 检查 Email 的旧绑定
    local oldAccount = redis.call("GET", emailKey)

    -- 如果 Email 已绑定到其他账户，需要移除旧绑定
    if oldAccount and oldAccount ~= newAccount then
        local oldAccountKey =  "` + TableAccount + `" .. oldAccount
        local oldAccountData = redis.call("GET", oldAccountKey)
        if oldAccountData then
            local oldAccountObj = cjson.decode(oldAccountData)

	    -- 检查 e_mail_address 是否为表
	    if type(oldAccountObj.e_mail_address) ~= "table" then
		oldAccountObj.e_mail_address = {} -- 初始化为空表
	    end

            for i, email in ipairs(oldAccountObj.e_mail_address) do
                if email == newEmail then
                    table.remove(oldAccountObj.e_mail_address, i)
                    break
                end
            end
            redis.call("SET", oldAccountKey, cjson.encode(oldAccountObj))
        end
    end

    -- 更新 Email 的映射
    redis.call("SET", emailKey, newAccount)

    -- 检查当前账户是否已绑定该 Email
    local accountObj = cjson.decode(accountData)

    -- 检查 e_mail_address 是否为表
    if type(accountObj.e_mail_address) ~= "table" then
        accountObj.e_mail_address = {} -- 初始化为空表
    end

    for _, email in ipairs(accountObj.e_mail_address) do
        if email == newEmail then
            return "OK" -- 已绑定，无需重复添加
        end
    end

    -- 添加 Email 到账户的 Email 列表
    table.insert(accountObj.e_mail_address, newEmail)
    redis.call("SET", accountKey, cjson.encode(accountObj))

    return "OK"
    `

	// 执行 Lua 脚本
	result, err := rdm.cli.Eval(rdm.ctx, script, []string{accountKey, emailKey}, emailAddr, bmailAddr).Result()
	if err != nil {
		if strings.Contains(err.Error(), "Account does not exist") {
			return common.NewBMError(common.BMErrNoRight, "Activate your account first")
		}
		return err
	}

	if result == "OK" {
		return nil
	}

	return fmt.Errorf("unexpected result: %v", result)
}

func (rdm *DbManager) DeleteBinding(bmailAddr string, emailAddr string) error {
	accountKey := TableAccount + bmailAddr
	emailKey := TableEmail + emailAddr

	// Lua 脚本
	script := `
    local accountKey = KEYS[1]
    local emailKey = KEYS[2]
    local email = ARGV[1]

    -- 检查账户是否存在
    local accountData = redis.call("GET", accountKey)
    if not accountData then
        return {err="Account does not exist"}
    end

    -- 检查 Email 映射是否存在
    local emailMapping = redis.call("GET", emailKey)
    if not emailMapping then
        return {err="Email mapping does not exist"}
    end

    -- 删除 Email 映射
    redis.call("DEL", emailKey)

    -- 更新账户的 Email 列表
    local accountObj = cjson.decode(accountData)

    -- 检查 e_mail_address 是否为表
    if type(accountObj.e_mail_address) ~= "table" then
        accountObj.e_mail_address = {} -- 初始化为空表
    end

    for i, addr in ipairs(accountObj.e_mail_address) do
        if addr == email then
            table.remove(accountObj.e_mail_address, i)
            break
        end
    end

    -- 写回更新后的账户数据
    redis.call("SET", accountKey, cjson.encode(accountObj))

    return "OK"
    `

	// 执行 Lua 脚本
	result, err := rdm.cli.Eval(rdm.ctx, script, []string{accountKey, emailKey}, emailAddr).Result()
	if err != nil {
		if strings.Contains(err.Error(), "Account does not exist") {
			return common.NewBMError(common.BMErrNoRight, "Activate your account first")
		}
		if strings.Contains(err.Error(), "Email mapping does not exist") {
			common.LogInst().Warn().Str("bmail-address", bmailAddr).Str("email", emailAddr).Msg("email mapping does not exist")
			return nil
		}
		return err
	}

	if result == "OK" {
		return nil
	}

	return fmt.Errorf("unexpected result: %v", result)
}

func (rdm *DbManager) DeleteAccount(accountId string) error {
	accountKey := TableAccount + accountId

	script := `
    local accountKey = KEYS[1]

    -- 检查账户是否存在
    local accountData = redis.call("GET", accountKey)
    if not accountData then
        return {err="Account does not exist"}
    end

    -- 解码账户数据
    local accountObj = cjson.decode(accountData)

    -- 检查 e_mail_address 是否为表
    if type(accountObj.e_mail_address) ~= "table" then
        accountObj.e_mail_address = {} -- 初始化为空表
    end

    -- 删除账户相关的 Email 映射
    for _, email in ipairs(accountObj.e_mail_address) do
        local emailKey = "` + TableEmail + `" .. email
        redis.call("DEL", emailKey)
    end

    -- 删除账户数据
    redis.call("DEL", accountKey)

    return "OK"
    `

	// 执行 Lua 脚本
	result, err := rdm.cli.Eval(rdm.ctx, script, []string{accountKey}).Result()
	if err != nil {
		if strings.Contains(err.Error(), "Account does not exist") {
			return fmt.Errorf("account does not exist: %s", accountId)
		}
		return fmt.Errorf("failed to delete account: %w", err)
	}

	if result == "OK" {
		return nil
	}

	return fmt.Errorf("unexpected result: %v", result)
}
