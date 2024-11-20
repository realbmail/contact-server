package common

import (
	"fmt"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/diode"
	"gopkg.in/natefinch/lumberjack.v2"
	"io"
	"os"
	"sync"
	"time"
)

var _logInstance *zerolog.Logger
var logOnce sync.Once
var logLevel = "debug"
var LogFileName = "server.log"

func LogInst() *zerolog.Logger {
	logOnce.Do(func() {
		fmt.Println("\nlog file name:" + LogFileName)
		logFile := &lumberjack.Logger{
			Filename:   LogFileName, // 日志文件路径
			MaxSize:    100,         // 文件最大大小（MB）
			MaxBackups: 5,           // 保留旧文件的最大个数
			MaxAge:     128,         // 保留旧文件的最大天数
			Compress:   true,        // 是否压缩/归档旧文件
		}

		writer := diode.NewWriter(os.Stderr, 1000, 10*time.Millisecond, func(missed int) {
			fmt.Printf("Logger Dropped %d messages", missed)
		})

		multi := io.MultiWriter(writer, logFile)
		out := zerolog.ConsoleWriter{Out: multi}
		out.TimeFormat = time.StampMilli
		logLvl, err := zerolog.ParseLevel(logLevel)
		if err != nil {
			logLvl = zerolog.DebugLevel
		}
		logger := zerolog.New(out).
			Level(logLvl).
			With().
			Caller().
			Timestamp().
			Logger()
		_logInstance = &logger
	})

	return _logInstance
}

func SetLogLevel(ll, file string) {
	logLevel = ll
	if len(file) > 0 {
		LogFileName = file
	}

	_ = LogInst()

	logLvl, err := zerolog.ParseLevel(logLevel)
	if err != nil {
		fmt.Println("set log level err:", err)
		return
	}
	zerolog.SetGlobalLevel(logLvl)
	fmt.Println("set log level success:", ll)
}
