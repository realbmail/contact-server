// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.34.2
// 	protoc        v5.27.3
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

type Operation struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	IsDel   bool     `protobuf:"varint,1,opt,name=isDel,proto3" json:"isDel,omitempty"`
	Address string   `protobuf:"bytes,2,opt,name=address,proto3" json:"address,omitempty"`
	Emails  []string `protobuf:"bytes,3,rep,name=emails,proto3" json:"emails,omitempty"`
}

func (x *Operation) Reset() {
	*x = Operation{}
	if protoimpl.UnsafeEnabled {
		mi := &file_bmail_srv_proto_msgTypes[3]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Operation) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Operation) ProtoMessage() {}

func (x *Operation) ProtoReflect() protoreflect.Message {
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

// Deprecated: Use Operation.ProtoReflect.Descriptor instead.
func (*Operation) Descriptor() ([]byte, []int) {
	return file_bmail_srv_proto_rawDescGZIP(), []int{3}
}

func (x *Operation) GetIsDel() bool {
	if x != nil {
		return x.IsDel
	}
	return false
}

func (x *Operation) GetAddress() string {
	if x != nil {
		return x.Address
	}
	return ""
}

func (x *Operation) GetEmails() []string {
	if x != nil {
		return x.Emails
	}
	return nil
}

type BMailAccount struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Address string   `protobuf:"bytes,1,opt,name=address,proto3" json:"address,omitempty"`
	Level   int32    `protobuf:"varint,2,opt,name=level,proto3" json:"level,omitempty"`
	License []byte   `protobuf:"bytes,3,opt,name=license,proto3" json:"license,omitempty"`
	Emails  []string `protobuf:"bytes,4,rep,name=emails,proto3" json:"emails,omitempty"`
}

func (x *BMailAccount) Reset() {
	*x = BMailAccount{}
	if protoimpl.UnsafeEnabled {
		mi := &file_bmail_srv_proto_msgTypes[4]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *BMailAccount) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*BMailAccount) ProtoMessage() {}

func (x *BMailAccount) ProtoReflect() protoreflect.Message {
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

// Deprecated: Use BMailAccount.ProtoReflect.Descriptor instead.
func (*BMailAccount) Descriptor() ([]byte, []int) {
	return file_bmail_srv_proto_rawDescGZIP(), []int{4}
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

func (x *BMailAccount) GetLicense() []byte {
	if x != nil {
		return x.License
	}
	return nil
}

func (x *BMailAccount) GetEmails() []string {
	if x != nil {
		return x.Emails
	}
	return nil
}

type EmailContact struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Address string `protobuf:"bytes,1,opt,name=address,proto3" json:"address,omitempty"`
}

func (x *EmailContact) Reset() {
	*x = EmailContact{}
	if protoimpl.UnsafeEnabled {
		mi := &file_bmail_srv_proto_msgTypes[5]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *EmailContact) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*EmailContact) ProtoMessage() {}

func (x *EmailContact) ProtoReflect() protoreflect.Message {
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

// Deprecated: Use EmailContact.ProtoReflect.Descriptor instead.
func (*EmailContact) Descriptor() ([]byte, []int) {
	return file_bmail_srv_proto_rawDescGZIP(), []int{5}
}

func (x *EmailContact) GetAddress() string {
	if x != nil {
		return x.Address
	}
	return ""
}

type EmailContacts struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Contacts map[string]*EmailContact `protobuf:"bytes,1,rep,name=contacts,proto3" json:"contacts,omitempty" protobuf_key:"bytes,1,opt,name=key,proto3" protobuf_val:"bytes,2,opt,name=value,proto3"`
}

func (x *EmailContacts) Reset() {
	*x = EmailContacts{}
	if protoimpl.UnsafeEnabled {
		mi := &file_bmail_srv_proto_msgTypes[6]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *EmailContacts) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*EmailContacts) ProtoMessage() {}

func (x *EmailContacts) ProtoReflect() protoreflect.Message {
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

// Deprecated: Use EmailContacts.ProtoReflect.Descriptor instead.
func (*EmailContacts) Descriptor() ([]byte, []int) {
	return file_bmail_srv_proto_rawDescGZIP(), []int{6}
}

func (x *EmailContacts) GetContacts() map[string]*EmailContact {
	if x != nil {
		return x.Contacts
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
	0x52, 0x07, 0x70, 0x61, 0x79, 0x6c, 0x6f, 0x61, 0x64, 0x22, 0x66, 0x0a, 0x08, 0x51, 0x75, 0x65,
	0x72, 0x79, 0x52, 0x65, 0x71, 0x12, 0x18, 0x0a, 0x07, 0x61, 0x64, 0x64, 0x72, 0x65, 0x73, 0x73,
	0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x61, 0x64, 0x64, 0x72, 0x65, 0x73, 0x73, 0x12,
	0x22, 0x0a, 0x0c, 0x6f, 0x6e, 0x65, 0x45, 0x6d, 0x61, 0x69, 0x6c, 0x41, 0x64, 0x64, 0x72, 0x18,
	0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0c, 0x6f, 0x6e, 0x65, 0x45, 0x6d, 0x61, 0x69, 0x6c, 0x41,
	0x64, 0x64, 0x72, 0x12, 0x1c, 0x0a, 0x09, 0x65, 0x6d, 0x61, 0x69, 0x6c, 0x4c, 0x69, 0x73, 0x74,
	0x18, 0x03, 0x20, 0x03, 0x28, 0x09, 0x52, 0x09, 0x65, 0x6d, 0x61, 0x69, 0x6c, 0x4c, 0x69, 0x73,
	0x74, 0x22, 0x53, 0x0a, 0x09, 0x4f, 0x70, 0x65, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x12, 0x14,
	0x0a, 0x05, 0x69, 0x73, 0x44, 0x65, 0x6c, 0x18, 0x01, 0x20, 0x01, 0x28, 0x08, 0x52, 0x05, 0x69,
	0x73, 0x44, 0x65, 0x6c, 0x12, 0x18, 0x0a, 0x07, 0x61, 0x64, 0x64, 0x72, 0x65, 0x73, 0x73, 0x18,
	0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x61, 0x64, 0x64, 0x72, 0x65, 0x73, 0x73, 0x12, 0x16,
	0x0a, 0x06, 0x65, 0x6d, 0x61, 0x69, 0x6c, 0x73, 0x18, 0x03, 0x20, 0x03, 0x28, 0x09, 0x52, 0x06,
	0x65, 0x6d, 0x61, 0x69, 0x6c, 0x73, 0x22, 0x70, 0x0a, 0x0c, 0x42, 0x4d, 0x61, 0x69, 0x6c, 0x41,
	0x63, 0x63, 0x6f, 0x75, 0x6e, 0x74, 0x12, 0x18, 0x0a, 0x07, 0x61, 0x64, 0x64, 0x72, 0x65, 0x73,
	0x73, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x61, 0x64, 0x64, 0x72, 0x65, 0x73, 0x73,
	0x12, 0x14, 0x0a, 0x05, 0x6c, 0x65, 0x76, 0x65, 0x6c, 0x18, 0x02, 0x20, 0x01, 0x28, 0x05, 0x52,
	0x05, 0x6c, 0x65, 0x76, 0x65, 0x6c, 0x12, 0x18, 0x0a, 0x07, 0x6c, 0x69, 0x63, 0x65, 0x6e, 0x73,
	0x65, 0x18, 0x03, 0x20, 0x01, 0x28, 0x0c, 0x52, 0x07, 0x6c, 0x69, 0x63, 0x65, 0x6e, 0x73, 0x65,
	0x12, 0x16, 0x0a, 0x06, 0x65, 0x6d, 0x61, 0x69, 0x6c, 0x73, 0x18, 0x04, 0x20, 0x03, 0x28, 0x09,
	0x52, 0x06, 0x65, 0x6d, 0x61, 0x69, 0x6c, 0x73, 0x22, 0x28, 0x0a, 0x0c, 0x45, 0x6d, 0x61, 0x69,
	0x6c, 0x43, 0x6f, 0x6e, 0x74, 0x61, 0x63, 0x74, 0x12, 0x18, 0x0a, 0x07, 0x61, 0x64, 0x64, 0x72,
	0x65, 0x73, 0x73, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x61, 0x64, 0x64, 0x72, 0x65,
	0x73, 0x73, 0x22, 0x95, 0x01, 0x0a, 0x0d, 0x45, 0x6d, 0x61, 0x69, 0x6c, 0x43, 0x6f, 0x6e, 0x74,
	0x61, 0x63, 0x74, 0x73, 0x12, 0x38, 0x0a, 0x08, 0x63, 0x6f, 0x6e, 0x74, 0x61, 0x63, 0x74, 0x73,
	0x18, 0x01, 0x20, 0x03, 0x28, 0x0b, 0x32, 0x1c, 0x2e, 0x45, 0x6d, 0x61, 0x69, 0x6c, 0x43, 0x6f,
	0x6e, 0x74, 0x61, 0x63, 0x74, 0x73, 0x2e, 0x43, 0x6f, 0x6e, 0x74, 0x61, 0x63, 0x74, 0x73, 0x45,
	0x6e, 0x74, 0x72, 0x79, 0x52, 0x08, 0x63, 0x6f, 0x6e, 0x74, 0x61, 0x63, 0x74, 0x73, 0x1a, 0x4a,
	0x0a, 0x0d, 0x43, 0x6f, 0x6e, 0x74, 0x61, 0x63, 0x74, 0x73, 0x45, 0x6e, 0x74, 0x72, 0x79, 0x12,
	0x10, 0x0a, 0x03, 0x6b, 0x65, 0x79, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x03, 0x6b, 0x65,
	0x79, 0x12, 0x23, 0x0a, 0x05, 0x76, 0x61, 0x6c, 0x75, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x0b,
	0x32, 0x0d, 0x2e, 0x45, 0x6d, 0x61, 0x69, 0x6c, 0x43, 0x6f, 0x6e, 0x74, 0x61, 0x63, 0x74, 0x52,
	0x05, 0x76, 0x61, 0x6c, 0x75, 0x65, 0x3a, 0x02, 0x38, 0x01, 0x42, 0x2d, 0x5a, 0x2b, 0x67, 0x69,
	0x74, 0x68, 0x75, 0x62, 0x2e, 0x63, 0x6f, 0x6d, 0x2f, 0x72, 0x65, 0x61, 0x6c, 0x62, 0x6d, 0x61,
	0x69, 0x6c, 0x2f, 0x63, 0x6f, 0x6e, 0x74, 0x61, 0x63, 0x74, 0x2d, 0x73, 0x65, 0x72, 0x76, 0x65,
	0x72, 0x2f, 0x70, 0x62, 0x73, 0x3b, 0x70, 0x62, 0x73, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f,
	0x33,
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

var file_bmail_srv_proto_msgTypes = make([]protoimpl.MessageInfo, 8)
var file_bmail_srv_proto_goTypes = []any{
	(*BMReq)(nil),         // 0: BMReq
	(*BMRsp)(nil),         // 1: BMRsp
	(*QueryReq)(nil),      // 2: QueryReq
	(*Operation)(nil),     // 3: Operation
	(*BMailAccount)(nil),  // 4: BMailAccount
	(*EmailContact)(nil),  // 5: EmailContact
	(*EmailContacts)(nil), // 6: EmailContacts
	nil,                   // 7: EmailContacts.ContactsEntry
}
var file_bmail_srv_proto_depIdxs = []int32{
	7, // 0: EmailContacts.contacts:type_name -> EmailContacts.ContactsEntry
	5, // 1: EmailContacts.ContactsEntry.value:type_name -> EmailContact
	2, // [2:2] is the sub-list for method output_type
	2, // [2:2] is the sub-list for method input_type
	2, // [2:2] is the sub-list for extension type_name
	2, // [2:2] is the sub-list for extension extendee
	0, // [0:2] is the sub-list for field type_name
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
			switch v := v.(*Operation); i {
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
		file_bmail_srv_proto_msgTypes[5].Exporter = func(v any, i int) any {
			switch v := v.(*EmailContact); i {
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
			switch v := v.(*EmailContacts); i {
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
			NumMessages:   8,
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
