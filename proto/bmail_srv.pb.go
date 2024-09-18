// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.34.2
// 	protoc        v5.28.1
// source: bmail_srv.proto

package pbs

import (
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	reflect "reflect"
	sync "sync"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type BMReq struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Address   string `protobuf:"bytes,1,opt,name=address,proto3" json:"address,omitempty"`
	Signature string `protobuf:"bytes,2,opt,name=signature,proto3" json:"signature,omitempty"`
	Payload   []byte `protobuf:"bytes,3,opt,name=payload,proto3" json:"payload,omitempty"`
}

func (x *BMReq) Reset() {
	*x = BMReq{}
	if protoimpl.UnsafeEnabled {
		mi := &file_bmail_srv_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *BMReq) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*BMReq) ProtoMessage() {}

func (x *BMReq) ProtoReflect() protoreflect.Message {
	mi := &file_bmail_srv_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use BMReq.ProtoReflect.Descriptor instead.
func (*BMReq) Descriptor() ([]byte, []int) {
	return file_bmail_srv_proto_rawDescGZIP(), []int{0}
}

func (x *BMReq) GetAddress() string {
	if x != nil {
		return x.Address
	}
	return ""
}

func (x *BMReq) GetSignature() string {
	if x != nil {
		return x.Signature
	}
	return ""
}

func (x *BMReq) GetPayload() []byte {
	if x != nil {
		return x.Payload
	}
	return nil
}

type BMRsp struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Success   bool   `protobuf:"varint,1,opt,name=success,proto3" json:"success,omitempty"`
	Msg       string `protobuf:"bytes,2,opt,name=msg,proto3" json:"msg,omitempty"`
	Signature string `protobuf:"bytes,3,opt,name=signature,proto3" json:"signature,omitempty"`
	Payload   []byte `protobuf:"bytes,4,opt,name=payload,proto3" json:"payload,omitempty"`
}

func (x *BMRsp) Reset() {
	*x = BMRsp{}
	if protoimpl.UnsafeEnabled {
		mi := &file_bmail_srv_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *BMRsp) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*BMRsp) ProtoMessage() {}

func (x *BMRsp) ProtoReflect() protoreflect.Message {
	mi := &file_bmail_srv_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use BMRsp.ProtoReflect.Descriptor instead.
func (*BMRsp) Descriptor() ([]byte, []int) {
	return file_bmail_srv_proto_rawDescGZIP(), []int{1}
}

func (x *BMRsp) GetSuccess() bool {
	if x != nil {
		return x.Success
	}
	return false
}

func (x *BMRsp) GetMsg() string {
	if x != nil {
		return x.Msg
	}
	return ""
}

func (x *BMRsp) GetSignature() string {
	if x != nil {
		return x.Signature
	}
	return ""
}

func (x *BMRsp) GetPayload() []byte {
	if x != nil {
		return x.Payload
	}
	return nil
}

type QueryReq struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Address      string   `protobuf:"bytes,1,opt,name=address,proto3" json:"address,omitempty"`
	OneEmailAddr string   `protobuf:"bytes,2,opt,name=oneEmailAddr,proto3" json:"oneEmailAddr,omitempty"`
	EmailList    []string `protobuf:"bytes,3,rep,name=emailList,proto3" json:"emailList,omitempty"`
	SignInTime   string   `protobuf:"bytes,4,opt,name=signInTime,proto3" json:"signInTime,omitempty"`
}

func (x *QueryReq) Reset() {
	*x = QueryReq{}
	if protoimpl.UnsafeEnabled {
		mi := &file_bmail_srv_proto_msgTypes[2]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *QueryReq) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*QueryReq) ProtoMessage() {}

func (x *QueryReq) ProtoReflect() protoreflect.Message {
	mi := &file_bmail_srv_proto_msgTypes[2]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use QueryReq.ProtoReflect.Descriptor instead.
func (*QueryReq) Descriptor() ([]byte, []int) {
	return file_bmail_srv_proto_rawDescGZIP(), []int{2}
}

func (x *QueryReq) GetAddress() string {
	if x != nil {
		return x.Address
	}
	return ""
}

func (x *QueryReq) GetOneEmailAddr() string {
	if x != nil {
		return x.OneEmailAddr
	}
	return ""
}

func (x *QueryReq) GetEmailList() []string {
	if x != nil {
		return x.EmailList
	}
	return nil
}

func (x *QueryReq) GetSignInTime() string {
	if x != nil {
		return x.SignInTime
	}
	return ""
}

type AccountOperation struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	IsDel   bool     `protobuf:"varint,1,opt,name=isDel,proto3" json:"isDel,omitempty"`
	Address string   `protobuf:"bytes,2,opt,name=address,proto3" json:"address,omitempty"`
	Emails  []string `protobuf:"bytes,3,rep,name=emails,proto3" json:"emails,omitempty"`
}

func (x *AccountOperation) Reset() {
	*x = AccountOperation{}
	if protoimpl.UnsafeEnabled {
		mi := &file_bmail_srv_proto_msgTypes[3]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *AccountOperation) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*AccountOperation) ProtoMessage() {}

func (x *AccountOperation) ProtoReflect() protoreflect.Message {
	mi := &file_bmail_srv_proto_msgTypes[3]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use AccountOperation.ProtoReflect.Descriptor instead.
func (*AccountOperation) Descriptor() ([]byte, []int) {
	return file_bmail_srv_proto_rawDescGZIP(), []int{3}
}

func (x *AccountOperation) GetIsDel() bool {
	if x != nil {
		return x.IsDel
	}
	return false
}

func (x *AccountOperation) GetAddress() string {
	if x != nil {
		return x.Address
	}
	return ""
}

func (x *AccountOperation) GetEmails() []string {
	if x != nil {
		return x.Emails
	}
	return nil
}

type BindAction struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Address string `protobuf:"bytes,1,opt,name=address,proto3" json:"address,omitempty"`
	Mail    string `protobuf:"bytes,2,opt,name=mail,proto3" json:"mail,omitempty"`
}

func (x *BindAction) Reset() {
	*x = BindAction{}
	if protoimpl.UnsafeEnabled {
		mi := &file_bmail_srv_proto_msgTypes[4]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *BindAction) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*BindAction) ProtoMessage() {}

func (x *BindAction) ProtoReflect() protoreflect.Message {
	mi := &file_bmail_srv_proto_msgTypes[4]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use BindAction.ProtoReflect.Descriptor instead.
func (*BindAction) Descriptor() ([]byte, []int) {
	return file_bmail_srv_proto_rawDescGZIP(), []int{4}
}

func (x *BindAction) GetAddress() string {
	if x != nil {
		return x.Address
	}
	return ""
}

func (x *BindAction) GetMail() string {
	if x != nil {
		return x.Mail
	}
	return ""
}

type ContactOperation struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	IsDel    bool           `protobuf:"varint,1,opt,name=isDel,proto3" json:"isDel,omitempty"`
	Contacts []*ContactItem `protobuf:"bytes,2,rep,name=contacts,proto3" json:"contacts,omitempty"`
}

func (x *ContactOperation) Reset() {
	*x = ContactOperation{}
	if protoimpl.UnsafeEnabled {
		mi := &file_bmail_srv_proto_msgTypes[5]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *ContactOperation) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ContactOperation) ProtoMessage() {}

func (x *ContactOperation) ProtoReflect() protoreflect.Message {
	mi := &file_bmail_srv_proto_msgTypes[5]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ContactOperation.ProtoReflect.Descriptor instead.
func (*ContactOperation) Descriptor() ([]byte, []int) {
	return file_bmail_srv_proto_rawDescGZIP(), []int{5}
}

func (x *ContactOperation) GetIsDel() bool {
	if x != nil {
		return x.IsDel
	}
	return false
}

func (x *ContactOperation) GetContacts() []*ContactItem {
	if x != nil {
		return x.Contacts
	}
	return nil
}

type EmailReflect struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Address string `protobuf:"bytes,1,opt,name=address,proto3" json:"address,omitempty"`
}

func (x *EmailReflect) Reset() {
	*x = EmailReflect{}
	if protoimpl.UnsafeEnabled {
		mi := &file_bmail_srv_proto_msgTypes[6]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *EmailReflect) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*EmailReflect) ProtoMessage() {}

func (x *EmailReflect) ProtoReflect() protoreflect.Message {
	mi := &file_bmail_srv_proto_msgTypes[6]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use EmailReflect.ProtoReflect.Descriptor instead.
func (*EmailReflect) Descriptor() ([]byte, []int) {
	return file_bmail_srv_proto_rawDescGZIP(), []int{6}
}

func (x *EmailReflect) GetAddress() string {
	if x != nil {
		return x.Address
	}
	return ""
}

type BMailAccount struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Address string   `protobuf:"bytes,1,opt,name=address,proto3" json:"address,omitempty"`
	Level   int32    `protobuf:"varint,2,opt,name=level,proto3" json:"level,omitempty"`
	License string   `protobuf:"bytes,3,opt,name=license,proto3" json:"license,omitempty"`
	Emails  []string `protobuf:"bytes,4,rep,name=emails,proto3" json:"emails,omitempty"`
}

func (x *BMailAccount) Reset() {
	*x = BMailAccount{}
	if protoimpl.UnsafeEnabled {
		mi := &file_bmail_srv_proto_msgTypes[7]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *BMailAccount) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*BMailAccount) ProtoMessage() {}

func (x *BMailAccount) ProtoReflect() protoreflect.Message {
	mi := &file_bmail_srv_proto_msgTypes[7]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use BMailAccount.ProtoReflect.Descriptor instead.
func (*BMailAccount) Descriptor() ([]byte, []int) {
	return file_bmail_srv_proto_rawDescGZIP(), []int{7}
}

func (x *BMailAccount) GetAddress() string {
	if x != nil {
		return x.Address
	}
	return ""
}

func (x *BMailAccount) GetLevel() int32 {
	if x != nil {
		return x.Level
	}
	return 0
}

func (x *BMailAccount) GetLicense() string {
	if x != nil {
		return x.License
	}
	return ""
}

func (x *BMailAccount) GetEmails() []string {
	if x != nil {
		return x.Emails
	}
	return nil
}

type ContactItem struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Email    string `protobuf:"bytes,1,opt,name=email,proto3" json:"email,omitempty"`
	Address  string `protobuf:"bytes,2,opt,name=address,proto3" json:"address,omitempty"`
	NickName string `protobuf:"bytes,3,opt,name=nickName,proto3" json:"nickName,omitempty"`
	Remark   string `protobuf:"bytes,4,opt,name=remark,proto3" json:"remark,omitempty"`
}

func (x *ContactItem) Reset() {
	*x = ContactItem{}
	if protoimpl.UnsafeEnabled {
		mi := &file_bmail_srv_proto_msgTypes[8]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *ContactItem) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ContactItem) ProtoMessage() {}

func (x *ContactItem) ProtoReflect() protoreflect.Message {
	mi := &file_bmail_srv_proto_msgTypes[8]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ContactItem.ProtoReflect.Descriptor instead.
func (*ContactItem) Descriptor() ([]byte, []int) {
	return file_bmail_srv_proto_rawDescGZIP(), []int{8}
}

func (x *ContactItem) GetEmail() string {
	if x != nil {
		return x.Email
	}
	return ""
}

func (x *ContactItem) GetAddress() string {
	if x != nil {
		return x.Address
	}
	return ""
}

func (x *ContactItem) GetNickName() string {
	if x != nil {
		return x.NickName
	}
	return ""
}

func (x *ContactItem) GetRemark() string {
	if x != nil {
		return x.Remark
	}
	return ""
}

type EmailReflects struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Reflects map[string]*EmailReflect `protobuf:"bytes,1,rep,name=reflects,proto3" json:"reflects,omitempty" protobuf_key:"bytes,1,opt,name=key,proto3" protobuf_val:"bytes,2,opt,name=value,proto3"`
}

func (x *EmailReflects) Reset() {
	*x = EmailReflects{}
	if protoimpl.UnsafeEnabled {
		mi := &file_bmail_srv_proto_msgTypes[9]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *EmailReflects) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*EmailReflects) ProtoMessage() {}

func (x *EmailReflects) ProtoReflect() protoreflect.Message {
	mi := &file_bmail_srv_proto_msgTypes[9]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use EmailReflects.ProtoReflect.Descriptor instead.
func (*EmailReflects) Descriptor() ([]byte, []int) {
	return file_bmail_srv_proto_rawDescGZIP(), []int{9}
}

func (x *EmailReflects) GetReflects() map[string]*EmailReflect {
	if x != nil {
		return x.Reflects
	}
	return nil
}

var File_bmail_srv_proto protoreflect.FileDescriptor

var file_bmail_srv_proto_rawDesc = []byte{
	0x0a, 0x0f, 0x62, 0x6d, 0x61, 0x69, 0x6c, 0x5f, 0x73, 0x72, 0x76, 0x2e, 0x70, 0x72, 0x6f, 0x74,
	0x6f, 0x22, 0x59, 0x0a, 0x05, 0x42, 0x4d, 0x52, 0x65, 0x71, 0x12, 0x18, 0x0a, 0x07, 0x61, 0x64,
	0x64, 0x72, 0x65, 0x73, 0x73, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x61, 0x64, 0x64,
	0x72, 0x65, 0x73, 0x73, 0x12, 0x1c, 0x0a, 0x09, 0x73, 0x69, 0x67, 0x6e, 0x61, 0x74, 0x75, 0x72,
	0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x09, 0x73, 0x69, 0x67, 0x6e, 0x61, 0x74, 0x75,
	0x72, 0x65, 0x12, 0x18, 0x0a, 0x07, 0x70, 0x61, 0x79, 0x6c, 0x6f, 0x61, 0x64, 0x18, 0x03, 0x20,
	0x01, 0x28, 0x0c, 0x52, 0x07, 0x70, 0x61, 0x79, 0x6c, 0x6f, 0x61, 0x64, 0x22, 0x6b, 0x0a, 0x05,
	0x42, 0x4d, 0x52, 0x73, 0x70, 0x12, 0x18, 0x0a, 0x07, 0x73, 0x75, 0x63, 0x63, 0x65, 0x73, 0x73,
	0x18, 0x01, 0x20, 0x01, 0x28, 0x08, 0x52, 0x07, 0x73, 0x75, 0x63, 0x63, 0x65, 0x73, 0x73, 0x12,
	0x10, 0x0a, 0x03, 0x6d, 0x73, 0x67, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x03, 0x6d, 0x73,
	0x67, 0x12, 0x1c, 0x0a, 0x09, 0x73, 0x69, 0x67, 0x6e, 0x61, 0x74, 0x75, 0x72, 0x65, 0x18, 0x03,
	0x20, 0x01, 0x28, 0x09, 0x52, 0x09, 0x73, 0x69, 0x67, 0x6e, 0x61, 0x74, 0x75, 0x72, 0x65, 0x12,
	0x18, 0x0a, 0x07, 0x70, 0x61, 0x79, 0x6c, 0x6f, 0x61, 0x64, 0x18, 0x04, 0x20, 0x01, 0x28, 0x0c,
	0x52, 0x07, 0x70, 0x61, 0x79, 0x6c, 0x6f, 0x61, 0x64, 0x22, 0x86, 0x01, 0x0a, 0x08, 0x51, 0x75,
	0x65, 0x72, 0x79, 0x52, 0x65, 0x71, 0x12, 0x18, 0x0a, 0x07, 0x61, 0x64, 0x64, 0x72, 0x65, 0x73,
	0x73, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x61, 0x64, 0x64, 0x72, 0x65, 0x73, 0x73,
	0x12, 0x22, 0x0a, 0x0c, 0x6f, 0x6e, 0x65, 0x45, 0x6d, 0x61, 0x69, 0x6c, 0x41, 0x64, 0x64, 0x72,
	0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0c, 0x6f, 0x6e, 0x65, 0x45, 0x6d, 0x61, 0x69, 0x6c,
	0x41, 0x64, 0x64, 0x72, 0x12, 0x1c, 0x0a, 0x09, 0x65, 0x6d, 0x61, 0x69, 0x6c, 0x4c, 0x69, 0x73,
	0x74, 0x18, 0x03, 0x20, 0x03, 0x28, 0x09, 0x52, 0x09, 0x65, 0x6d, 0x61, 0x69, 0x6c, 0x4c, 0x69,
	0x73, 0x74, 0x12, 0x1e, 0x0a, 0x0a, 0x73, 0x69, 0x67, 0x6e, 0x49, 0x6e, 0x54, 0x69, 0x6d, 0x65,
	0x18, 0x04, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0a, 0x73, 0x69, 0x67, 0x6e, 0x49, 0x6e, 0x54, 0x69,
	0x6d, 0x65, 0x22, 0x5a, 0x0a, 0x10, 0x41, 0x63, 0x63, 0x6f, 0x75, 0x6e, 0x74, 0x4f, 0x70, 0x65,
	0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x12, 0x14, 0x0a, 0x05, 0x69, 0x73, 0x44, 0x65, 0x6c, 0x18,
	0x01, 0x20, 0x01, 0x28, 0x08, 0x52, 0x05, 0x69, 0x73, 0x44, 0x65, 0x6c, 0x12, 0x18, 0x0a, 0x07,
	0x61, 0x64, 0x64, 0x72, 0x65, 0x73, 0x73, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x61,
	0x64, 0x64, 0x72, 0x65, 0x73, 0x73, 0x12, 0x16, 0x0a, 0x06, 0x65, 0x6d, 0x61, 0x69, 0x6c, 0x73,
	0x18, 0x03, 0x20, 0x03, 0x28, 0x09, 0x52, 0x06, 0x65, 0x6d, 0x61, 0x69, 0x6c, 0x73, 0x22, 0x3a,
	0x0a, 0x0a, 0x42, 0x69, 0x6e, 0x64, 0x41, 0x63, 0x74, 0x69, 0x6f, 0x6e, 0x12, 0x18, 0x0a, 0x07,
	0x61, 0x64, 0x64, 0x72, 0x65, 0x73, 0x73, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x61,
	0x64, 0x64, 0x72, 0x65, 0x73, 0x73, 0x12, 0x12, 0x0a, 0x04, 0x6d, 0x61, 0x69, 0x6c, 0x18, 0x02,
	0x20, 0x01, 0x28, 0x09, 0x52, 0x04, 0x6d, 0x61, 0x69, 0x6c, 0x22, 0x52, 0x0a, 0x10, 0x43, 0x6f,
	0x6e, 0x74, 0x61, 0x63, 0x74, 0x4f, 0x70, 0x65, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x12, 0x14,
	0x0a, 0x05, 0x69, 0x73, 0x44, 0x65, 0x6c, 0x18, 0x01, 0x20, 0x01, 0x28, 0x08, 0x52, 0x05, 0x69,
	0x73, 0x44, 0x65, 0x6c, 0x12, 0x28, 0x0a, 0x08, 0x63, 0x6f, 0x6e, 0x74, 0x61, 0x63, 0x74, 0x73,
	0x18, 0x02, 0x20, 0x03, 0x28, 0x0b, 0x32, 0x0c, 0x2e, 0x43, 0x6f, 0x6e, 0x74, 0x61, 0x63, 0x74,
	0x49, 0x74, 0x65, 0x6d, 0x52, 0x08, 0x63, 0x6f, 0x6e, 0x74, 0x61, 0x63, 0x74, 0x73, 0x22, 0x28,
	0x0a, 0x0c, 0x45, 0x6d, 0x61, 0x69, 0x6c, 0x52, 0x65, 0x66, 0x6c, 0x65, 0x63, 0x74, 0x12, 0x18,
	0x0a, 0x07, 0x61, 0x64, 0x64, 0x72, 0x65, 0x73, 0x73, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52,
	0x07, 0x61, 0x64, 0x64, 0x72, 0x65, 0x73, 0x73, 0x22, 0x70, 0x0a, 0x0c, 0x42, 0x4d, 0x61, 0x69,
	0x6c, 0x41, 0x63, 0x63, 0x6f, 0x75, 0x6e, 0x74, 0x12, 0x18, 0x0a, 0x07, 0x61, 0x64, 0x64, 0x72,
	0x65, 0x73, 0x73, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x61, 0x64, 0x64, 0x72, 0x65,
	0x73, 0x73, 0x12, 0x14, 0x0a, 0x05, 0x6c, 0x65, 0x76, 0x65, 0x6c, 0x18, 0x02, 0x20, 0x01, 0x28,
	0x05, 0x52, 0x05, 0x6c, 0x65, 0x76, 0x65, 0x6c, 0x12, 0x18, 0x0a, 0x07, 0x6c, 0x69, 0x63, 0x65,
	0x6e, 0x73, 0x65, 0x18, 0x03, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x6c, 0x69, 0x63, 0x65, 0x6e,
	0x73, 0x65, 0x12, 0x16, 0x0a, 0x06, 0x65, 0x6d, 0x61, 0x69, 0x6c, 0x73, 0x18, 0x04, 0x20, 0x03,
	0x28, 0x09, 0x52, 0x06, 0x65, 0x6d, 0x61, 0x69, 0x6c, 0x73, 0x22, 0x71, 0x0a, 0x0b, 0x43, 0x6f,
	0x6e, 0x74, 0x61, 0x63, 0x74, 0x49, 0x74, 0x65, 0x6d, 0x12, 0x14, 0x0a, 0x05, 0x65, 0x6d, 0x61,
	0x69, 0x6c, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x05, 0x65, 0x6d, 0x61, 0x69, 0x6c, 0x12,
	0x18, 0x0a, 0x07, 0x61, 0x64, 0x64, 0x72, 0x65, 0x73, 0x73, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09,
	0x52, 0x07, 0x61, 0x64, 0x64, 0x72, 0x65, 0x73, 0x73, 0x12, 0x1a, 0x0a, 0x08, 0x6e, 0x69, 0x63,
	0x6b, 0x4e, 0x61, 0x6d, 0x65, 0x18, 0x03, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08, 0x6e, 0x69, 0x63,
	0x6b, 0x4e, 0x61, 0x6d, 0x65, 0x12, 0x16, 0x0a, 0x06, 0x72, 0x65, 0x6d, 0x61, 0x72, 0x6b, 0x18,
	0x04, 0x20, 0x01, 0x28, 0x09, 0x52, 0x06, 0x72, 0x65, 0x6d, 0x61, 0x72, 0x6b, 0x22, 0x95, 0x01,
	0x0a, 0x0d, 0x45, 0x6d, 0x61, 0x69, 0x6c, 0x52, 0x65, 0x66, 0x6c, 0x65, 0x63, 0x74, 0x73, 0x12,
	0x38, 0x0a, 0x08, 0x72, 0x65, 0x66, 0x6c, 0x65, 0x63, 0x74, 0x73, 0x18, 0x01, 0x20, 0x03, 0x28,
	0x0b, 0x32, 0x1c, 0x2e, 0x45, 0x6d, 0x61, 0x69, 0x6c, 0x52, 0x65, 0x66, 0x6c, 0x65, 0x63, 0x74,
	0x73, 0x2e, 0x52, 0x65, 0x66, 0x6c, 0x65, 0x63, 0x74, 0x73, 0x45, 0x6e, 0x74, 0x72, 0x79, 0x52,
	0x08, 0x72, 0x65, 0x66, 0x6c, 0x65, 0x63, 0x74, 0x73, 0x1a, 0x4a, 0x0a, 0x0d, 0x52, 0x65, 0x66,
	0x6c, 0x65, 0x63, 0x74, 0x73, 0x45, 0x6e, 0x74, 0x72, 0x79, 0x12, 0x10, 0x0a, 0x03, 0x6b, 0x65,
	0x79, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x03, 0x6b, 0x65, 0x79, 0x12, 0x23, 0x0a, 0x05,
	0x76, 0x61, 0x6c, 0x75, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x0d, 0x2e, 0x45, 0x6d,
	0x61, 0x69, 0x6c, 0x52, 0x65, 0x66, 0x6c, 0x65, 0x63, 0x74, 0x52, 0x05, 0x76, 0x61, 0x6c, 0x75,
	0x65, 0x3a, 0x02, 0x38, 0x01, 0x42, 0x2d, 0x5a, 0x2b, 0x67, 0x69, 0x74, 0x68, 0x75, 0x62, 0x2e,
	0x63, 0x6f, 0x6d, 0x2f, 0x72, 0x65, 0x61, 0x6c, 0x62, 0x6d, 0x61, 0x69, 0x6c, 0x2f, 0x63, 0x6f,
	0x6e, 0x74, 0x61, 0x63, 0x74, 0x2d, 0x73, 0x65, 0x72, 0x76, 0x65, 0x72, 0x2f, 0x70, 0x62, 0x73,
	0x3b, 0x70, 0x62, 0x73, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_bmail_srv_proto_rawDescOnce sync.Once
	file_bmail_srv_proto_rawDescData = file_bmail_srv_proto_rawDesc
)

func file_bmail_srv_proto_rawDescGZIP() []byte {
	file_bmail_srv_proto_rawDescOnce.Do(func() {
		file_bmail_srv_proto_rawDescData = protoimpl.X.CompressGZIP(file_bmail_srv_proto_rawDescData)
	})
	return file_bmail_srv_proto_rawDescData
}

var file_bmail_srv_proto_msgTypes = make([]protoimpl.MessageInfo, 11)
var file_bmail_srv_proto_goTypes = []any{
	(*BMReq)(nil),            // 0: BMReq
	(*BMRsp)(nil),            // 1: BMRsp
	(*QueryReq)(nil),         // 2: QueryReq
	(*AccountOperation)(nil), // 3: AccountOperation
	(*BindAction)(nil),       // 4: BindAction
	(*ContactOperation)(nil), // 5: ContactOperation
	(*EmailReflect)(nil),     // 6: EmailReflect
	(*BMailAccount)(nil),     // 7: BMailAccount
	(*ContactItem)(nil),      // 8: ContactItem
	(*EmailReflects)(nil),    // 9: EmailReflects
	nil,                      // 10: EmailReflects.ReflectsEntry
}
var file_bmail_srv_proto_depIdxs = []int32{
	8,  // 0: ContactOperation.contacts:type_name -> ContactItem
	10, // 1: EmailReflects.reflects:type_name -> EmailReflects.ReflectsEntry
	6,  // 2: EmailReflects.ReflectsEntry.value:type_name -> EmailReflect
	3,  // [3:3] is the sub-list for method output_type
	3,  // [3:3] is the sub-list for method input_type
	3,  // [3:3] is the sub-list for extension type_name
	3,  // [3:3] is the sub-list for extension extendee
	0,  // [0:3] is the sub-list for field type_name
}

func init() { file_bmail_srv_proto_init() }
func file_bmail_srv_proto_init() {
	if File_bmail_srv_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_bmail_srv_proto_msgTypes[0].Exporter = func(v any, i int) any {
			switch v := v.(*BMReq); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_bmail_srv_proto_msgTypes[1].Exporter = func(v any, i int) any {
			switch v := v.(*BMRsp); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_bmail_srv_proto_msgTypes[2].Exporter = func(v any, i int) any {
			switch v := v.(*QueryReq); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_bmail_srv_proto_msgTypes[3].Exporter = func(v any, i int) any {
			switch v := v.(*AccountOperation); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_bmail_srv_proto_msgTypes[4].Exporter = func(v any, i int) any {
			switch v := v.(*BindAction); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_bmail_srv_proto_msgTypes[5].Exporter = func(v any, i int) any {
			switch v := v.(*ContactOperation); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_bmail_srv_proto_msgTypes[6].Exporter = func(v any, i int) any {
			switch v := v.(*EmailReflect); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_bmail_srv_proto_msgTypes[7].Exporter = func(v any, i int) any {
			switch v := v.(*BMailAccount); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_bmail_srv_proto_msgTypes[8].Exporter = func(v any, i int) any {
			switch v := v.(*ContactItem); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_bmail_srv_proto_msgTypes[9].Exporter = func(v any, i int) any {
			switch v := v.(*EmailReflects); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_bmail_srv_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   11,
			NumExtensions: 0,
			NumServices:   0,
		},
		GoTypes:           file_bmail_srv_proto_goTypes,
		DependencyIndexes: file_bmail_srv_proto_depIdxs,
		MessageInfos:      file_bmail_srv_proto_msgTypes,
	}.Build()
	File_bmail_srv_proto = out.File
	file_bmail_srv_proto_rawDesc = nil
	file_bmail_srv_proto_goTypes = nil
	file_bmail_srv_proto_depIdxs = nil
}
