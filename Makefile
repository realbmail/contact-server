SHELL=PATH='$(PATH)' /bin/sh

GOBUILD=CGO_ENABLED=0 go build -ldflags '-w -s'

PLATFORM := $(shell uname -o)

COMMIT := $(shell git rev-parse HEAD)
VERSION ?= $(shell git describe --tags ${COMMIT} 2> /dev/null || echo "$(COMMIT)")
BUILD_TIME := $(shell LANG=en_US date +"%F_%T_%z")
VersionRoot := github.com/realbmail/contact-server/common
LD_FLAGS := -X $(VersionRoot).Version=$(VERSION) -X $(VersionRoot).Commit=$(COMMIT) -X $(VersionRoot).BuildTime=$(BUILD_TIME)

NAME := contactSrv.exe
OS := windows

ifeq ($(PLATFORM), Msys)
    INCLUDE := ${shell echo "$(GOPATH)"|sed -e 's/\\/\//g'}
else ifeq ($(PLATFORM), Cygwin)
    INCLUDE := ${shell echo "$(GOPATH)"|sed -e 's/\\/\//g'}
else
	INCLUDE := $(GOPATH)
	NAME=contactSrv
	OS=linux
endif

# enable second expansion
.SECONDEXPANSION:

.PHONY: all
.PHONY: pbs
.PHONY: test
.PHONY: contract

BINDIR=./bin

all: pbs mac linux

pbs:
	cd proto/ && $(MAKE)

target:=mac

mac:
	GOOS=darwin go build -ldflags '-w -s' -o $(BINDIR)/$(NAME).mac  -ldflags="$(LD_FLAGS)"
	GOOS=darwin go build -ldflags '-w -s' -o $(BINDIR)/dbtool.mac ./db_tool/*.go

linux:
	GOOS=linux GOARCH=amd64 go build -ldflags '-w -s' -o $(BINDIR)/$(NAME).lnx  -ldflags="$(LD_FLAGS)"
	GOOS=linux GOARCH=amd64 go build -ldflags '-w -s' -o $(BINDIR)/$dbtool.lnx  ./db_tool/*.go

clean:
	rm $(BINDIR)/$(NAME)
