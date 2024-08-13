SHELL=PATH='$(PATH)' /bin/sh

.PHONY: all
all:
	protoc --go_out=paths=source_relative:. -I. bmail_srv.proto
