// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.181.2
//   protoc               v5.28.1
// source: src/proto/bmail_srv.proto

/* eslint-disable */
import * as _m0 from "protobufjs/minimal";

export const protobufPackage = "";

export interface BMReq {
  address: string;
  signature: string;
  payload: Uint8Array;
}

export interface BMRsp {
  success: boolean;
  msg: string;
  signature: string;
  payload: Uint8Array;
}

export interface QueryReq {
  address: string;
  oneEmailAddr: string;
  emailList: string[];
  signInTime: string;
}

export interface AccountOperation {
  isDel: boolean;
  address: string;
  emails: string[];
}

export interface BindAction {
  address: string;
  mail: string;
}

export interface ContactOperation {
  isDel: boolean;
  contacts: ContactItem[];
}

export interface EmailReflect {
  address: string;
}

export interface BMailAccount {
  address: string;
  level: number;
  license: string;
  emails: string[];
}

export interface ContactItem {
  email: string;
  address: string;
  nickName: string;
  remark: string;
}

export interface EmailReflects {
  reflects: { [key: string]: EmailReflect };
}

export interface EmailReflects_ReflectsEntry {
  key: string;
  value: EmailReflect | undefined;
}

function createBaseBMReq(): BMReq {
  return { address: "", signature: "", payload: new Uint8Array(0) };
}

export const BMReq = {
  encode(message: BMReq, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address !== "") {
      writer.uint32(10).string(message.address);
    }
    if (message.signature !== "") {
      writer.uint32(18).string(message.signature);
    }
    if (message.payload.length !== 0) {
      writer.uint32(26).bytes(message.payload);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BMReq {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBMReq();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.address = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.signature = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.payload = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BMReq {
    return {
      address: isSet(object.address) ? globalThis.String(object.address) : "",
      signature: isSet(object.signature) ? globalThis.String(object.signature) : "",
      payload: isSet(object.payload) ? bytesFromBase64(object.payload) : new Uint8Array(0),
    };
  },

  toJSON(message: BMReq): unknown {
    const obj: any = {};
    if (message.address !== "") {
      obj.address = message.address;
    }
    if (message.signature !== "") {
      obj.signature = message.signature;
    }
    if (message.payload.length !== 0) {
      obj.payload = base64FromBytes(message.payload);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BMReq>, I>>(base?: I): BMReq {
    return BMReq.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BMReq>, I>>(object: I): BMReq {
    const message = createBaseBMReq();
    message.address = object.address ?? "";
    message.signature = object.signature ?? "";
    message.payload = object.payload ?? new Uint8Array(0);
    return message;
  },
};

function createBaseBMRsp(): BMRsp {
  return { success: false, msg: "", signature: "", payload: new Uint8Array(0) };
}

export const BMRsp = {
  encode(message: BMRsp, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.success !== false) {
      writer.uint32(8).bool(message.success);
    }
    if (message.msg !== "") {
      writer.uint32(18).string(message.msg);
    }
    if (message.signature !== "") {
      writer.uint32(26).string(message.signature);
    }
    if (message.payload.length !== 0) {
      writer.uint32(34).bytes(message.payload);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BMRsp {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBMRsp();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.success = reader.bool();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.msg = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.signature = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.payload = reader.bytes();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BMRsp {
    return {
      success: isSet(object.success) ? globalThis.Boolean(object.success) : false,
      msg: isSet(object.msg) ? globalThis.String(object.msg) : "",
      signature: isSet(object.signature) ? globalThis.String(object.signature) : "",
      payload: isSet(object.payload) ? bytesFromBase64(object.payload) : new Uint8Array(0),
    };
  },

  toJSON(message: BMRsp): unknown {
    const obj: any = {};
    if (message.success !== false) {
      obj.success = message.success;
    }
    if (message.msg !== "") {
      obj.msg = message.msg;
    }
    if (message.signature !== "") {
      obj.signature = message.signature;
    }
    if (message.payload.length !== 0) {
      obj.payload = base64FromBytes(message.payload);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BMRsp>, I>>(base?: I): BMRsp {
    return BMRsp.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BMRsp>, I>>(object: I): BMRsp {
    const message = createBaseBMRsp();
    message.success = object.success ?? false;
    message.msg = object.msg ?? "";
    message.signature = object.signature ?? "";
    message.payload = object.payload ?? new Uint8Array(0);
    return message;
  },
};

function createBaseQueryReq(): QueryReq {
  return {address: "", oneEmailAddr: "", emailList: [], signInTime: ""};
}

export const QueryReq = {
  encode(message: QueryReq, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address !== "") {
      writer.uint32(10).string(message.address);
    }
    if (message.oneEmailAddr !== "") {
      writer.uint32(18).string(message.oneEmailAddr);
    }
    for (const v of message.emailList) {
      writer.uint32(26).string(v!);
    }
    if (message.signInTime !== "") {
      writer.uint32(34).string(message.signInTime);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): QueryReq {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseQueryReq();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.address = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.oneEmailAddr = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.emailList.push(reader.string());
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.signInTime = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): QueryReq {
    return {
      address: isSet(object.address) ? globalThis.String(object.address) : "",
      oneEmailAddr: isSet(object.oneEmailAddr) ? globalThis.String(object.oneEmailAddr) : "",
      emailList: globalThis.Array.isArray(object?.emailList)
        ? object.emailList.map((e: any) => globalThis.String(e))
        : [],
      signInTime: isSet(object.signInTime) ? globalThis.String(object.signInTime) : "",
    };
  },

  toJSON(message: QueryReq): unknown {
    const obj: any = {};
    if (message.address !== "") {
      obj.address = message.address;
    }
    if (message.oneEmailAddr !== "") {
      obj.oneEmailAddr = message.oneEmailAddr;
    }
    if (message.emailList?.length) {
      obj.emailList = message.emailList;
    }
    if (message.signInTime !== "") {
      obj.signInTime = message.signInTime;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<QueryReq>, I>>(base?: I): QueryReq {
    return QueryReq.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<QueryReq>, I>>(object: I): QueryReq {
    const message = createBaseQueryReq();
    message.address = object.address ?? "";
    message.oneEmailAddr = object.oneEmailAddr ?? "";
    message.emailList = object.emailList?.map((e) => e) || [];
    message.signInTime = object.signInTime ?? "";
    return message;
  },
};

function createBaseAccountOperation(): AccountOperation {
  return { isDel: false, address: "", emails: [] };
}

export const AccountOperation = {
  encode(message: AccountOperation, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.isDel !== false) {
      writer.uint32(8).bool(message.isDel);
    }
    if (message.address !== "") {
      writer.uint32(18).string(message.address);
    }
    for (const v of message.emails) {
      writer.uint32(26).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): AccountOperation {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAccountOperation();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.isDel = reader.bool();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.address = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.emails.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): AccountOperation {
    return {
      isDel: isSet(object.isDel) ? globalThis.Boolean(object.isDel) : false,
      address: isSet(object.address) ? globalThis.String(object.address) : "",
      emails: globalThis.Array.isArray(object?.emails) ? object.emails.map((e: any) => globalThis.String(e)) : [],
    };
  },

  toJSON(message: AccountOperation): unknown {
    const obj: any = {};
    if (message.isDel !== false) {
      obj.isDel = message.isDel;
    }
    if (message.address !== "") {
      obj.address = message.address;
    }
    if (message.emails?.length) {
      obj.emails = message.emails;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<AccountOperation>, I>>(base?: I): AccountOperation {
    return AccountOperation.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<AccountOperation>, I>>(object: I): AccountOperation {
    const message = createBaseAccountOperation();
    message.isDel = object.isDel ?? false;
    message.address = object.address ?? "";
    message.emails = object.emails?.map((e) => e) || [];
    return message;
  },
};

function createBaseBindAction(): BindAction {
  return {address: "", mail: ""};
}

export const BindAction = {
  encode(message: BindAction, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address !== "") {
      writer.uint32(10).string(message.address);
    }
    if (message.mail !== "") {
      writer.uint32(18).string(message.mail);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BindAction {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBindAction();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.address = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.mail = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BindAction {
    return {
      address: isSet(object.address) ? globalThis.String(object.address) : "",
      mail: isSet(object.mail) ? globalThis.String(object.mail) : "",
    };
  },

  toJSON(message: BindAction): unknown {
    const obj: any = {};
    if (message.address !== "") {
      obj.address = message.address;
    }
    if (message.mail !== "") {
      obj.mail = message.mail;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BindAction>, I>>(base?: I): BindAction {
    return BindAction.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BindAction>, I>>(object: I): BindAction {
    const message = createBaseBindAction();
    message.address = object.address ?? "";
    message.mail = object.mail ?? "";
    return message;
  },
};

function createBaseContactOperation(): ContactOperation {
  return { isDel: false, contacts: [] };
}

export const ContactOperation = {
  encode(message: ContactOperation, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.isDel !== false) {
      writer.uint32(8).bool(message.isDel);
    }
    for (const v of message.contacts) {
      ContactItem.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ContactOperation {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseContactOperation();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.isDel = reader.bool();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.contacts.push(ContactItem.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ContactOperation {
    return {
      isDel: isSet(object.isDel) ? globalThis.Boolean(object.isDel) : false,
      contacts: globalThis.Array.isArray(object?.contacts)
        ? object.contacts.map((e: any) => ContactItem.fromJSON(e))
        : [],
    };
  },

  toJSON(message: ContactOperation): unknown {
    const obj: any = {};
    if (message.isDel !== false) {
      obj.isDel = message.isDel;
    }
    if (message.contacts?.length) {
      obj.contacts = message.contacts.map((e) => ContactItem.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ContactOperation>, I>>(base?: I): ContactOperation {
    return ContactOperation.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ContactOperation>, I>>(object: I): ContactOperation {
    const message = createBaseContactOperation();
    message.isDel = object.isDel ?? false;
    message.contacts = object.contacts?.map((e) => ContactItem.fromPartial(e)) || [];
    return message;
  },
};

function createBaseEmailReflect(): EmailReflect {
  return { address: "" };
}

export const EmailReflect = {
  encode(message: EmailReflect, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address !== "") {
      writer.uint32(10).string(message.address);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EmailReflect {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEmailReflect();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.address = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EmailReflect {
    return { address: isSet(object.address) ? globalThis.String(object.address) : "" };
  },

  toJSON(message: EmailReflect): unknown {
    const obj: any = {};
    if (message.address !== "") {
      obj.address = message.address;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<EmailReflect>, I>>(base?: I): EmailReflect {
    return EmailReflect.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<EmailReflect>, I>>(object: I): EmailReflect {
    const message = createBaseEmailReflect();
    message.address = object.address ?? "";
    return message;
  },
};

function createBaseBMailAccount(): BMailAccount {
  return { address: "", level: 0, license: "", emails: [] };
}

export const BMailAccount = {
  encode(message: BMailAccount, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address !== "") {
      writer.uint32(10).string(message.address);
    }
    if (message.level !== 0) {
      writer.uint32(16).int32(message.level);
    }
    if (message.license !== "") {
      writer.uint32(26).string(message.license);
    }
    for (const v of message.emails) {
      writer.uint32(34).string(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): BMailAccount {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseBMailAccount();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.address = reader.string();
          continue;
        case 2:
          if (tag !== 16) {
            break;
          }

          message.level = reader.int32();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.license = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.emails.push(reader.string());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): BMailAccount {
    return {
      address: isSet(object.address) ? globalThis.String(object.address) : "",
      level: isSet(object.level) ? globalThis.Number(object.level) : 0,
      license: isSet(object.license) ? globalThis.String(object.license) : "",
      emails: globalThis.Array.isArray(object?.emails) ? object.emails.map((e: any) => globalThis.String(e)) : [],
    };
  },

  toJSON(message: BMailAccount): unknown {
    const obj: any = {};
    if (message.address !== "") {
      obj.address = message.address;
    }
    if (message.level !== 0) {
      obj.level = Math.round(message.level);
    }
    if (message.license !== "") {
      obj.license = message.license;
    }
    if (message.emails?.length) {
      obj.emails = message.emails;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<BMailAccount>, I>>(base?: I): BMailAccount {
    return BMailAccount.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<BMailAccount>, I>>(object: I): BMailAccount {
    const message = createBaseBMailAccount();
    message.address = object.address ?? "";
    message.level = object.level ?? 0;
    message.license = object.license ?? "";
    message.emails = object.emails?.map((e) => e) || [];
    return message;
  },
};

function createBaseContactItem(): ContactItem {
  return { email: "", address: "", nickName: "", remark: "" };
}

export const ContactItem = {
  encode(message: ContactItem, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.email !== "") {
      writer.uint32(10).string(message.email);
    }
    if (message.address !== "") {
      writer.uint32(18).string(message.address);
    }
    if (message.nickName !== "") {
      writer.uint32(26).string(message.nickName);
    }
    if (message.remark !== "") {
      writer.uint32(34).string(message.remark);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ContactItem {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseContactItem();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.email = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.address = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.nickName = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.remark = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): ContactItem {
    return {
      email: isSet(object.email) ? globalThis.String(object.email) : "",
      address: isSet(object.address) ? globalThis.String(object.address) : "",
      nickName: isSet(object.nickName) ? globalThis.String(object.nickName) : "",
      remark: isSet(object.remark) ? globalThis.String(object.remark) : "",
    };
  },

  toJSON(message: ContactItem): unknown {
    const obj: any = {};
    if (message.email !== "") {
      obj.email = message.email;
    }
    if (message.address !== "") {
      obj.address = message.address;
    }
    if (message.nickName !== "") {
      obj.nickName = message.nickName;
    }
    if (message.remark !== "") {
      obj.remark = message.remark;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<ContactItem>, I>>(base?: I): ContactItem {
    return ContactItem.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<ContactItem>, I>>(object: I): ContactItem {
    const message = createBaseContactItem();
    message.email = object.email ?? "";
    message.address = object.address ?? "";
    message.nickName = object.nickName ?? "";
    message.remark = object.remark ?? "";
    return message;
  },
};

function createBaseEmailReflects(): EmailReflects {
  return { reflects: {} };
}

export const EmailReflects = {
  encode(message: EmailReflects, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    Object.entries(message.reflects).forEach(([key, value]) => {
      EmailReflects_ReflectsEntry.encode({ key: key as any, value }, writer.uint32(10).fork()).ldelim();
    });
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EmailReflects {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEmailReflects();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          const entry1 = EmailReflects_ReflectsEntry.decode(reader, reader.uint32());
          if (entry1.value !== undefined) {
            message.reflects[entry1.key] = entry1.value;
          }
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EmailReflects {
    return {
      reflects: isObject(object.reflects)
        ? Object.entries(object.reflects).reduce<{ [key: string]: EmailReflect }>((acc, [key, value]) => {
          acc[key] = EmailReflect.fromJSON(value);
          return acc;
        }, {})
        : {},
    };
  },

  toJSON(message: EmailReflects): unknown {
    const obj: any = {};
    if (message.reflects) {
      const entries = Object.entries(message.reflects);
      if (entries.length > 0) {
        obj.reflects = {};
        entries.forEach(([k, v]) => {
          obj.reflects[k] = EmailReflect.toJSON(v);
        });
      }
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<EmailReflects>, I>>(base?: I): EmailReflects {
    return EmailReflects.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<EmailReflects>, I>>(object: I): EmailReflects {
    const message = createBaseEmailReflects();
    message.reflects = Object.entries(object.reflects ?? {}).reduce<{ [key: string]: EmailReflect }>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = EmailReflect.fromPartial(value);
        }
        return acc;
      },
      {},
    );
    return message;
  },
};

function createBaseEmailReflects_ReflectsEntry(): EmailReflects_ReflectsEntry {
  return { key: "", value: undefined };
}

export const EmailReflects_ReflectsEntry = {
  encode(message: EmailReflects_ReflectsEntry, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.key !== "") {
      writer.uint32(10).string(message.key);
    }
    if (message.value !== undefined) {
      EmailReflect.encode(message.value, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EmailReflects_ReflectsEntry {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEmailReflects_ReflectsEntry();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.key = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.value = EmailReflect.decode(reader, reader.uint32());
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): EmailReflects_ReflectsEntry {
    return {
      key: isSet(object.key) ? globalThis.String(object.key) : "",
      value: isSet(object.value) ? EmailReflect.fromJSON(object.value) : undefined,
    };
  },

  toJSON(message: EmailReflects_ReflectsEntry): unknown {
    const obj: any = {};
    if (message.key !== "") {
      obj.key = message.key;
    }
    if (message.value !== undefined) {
      obj.value = EmailReflect.toJSON(message.value);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<EmailReflects_ReflectsEntry>, I>>(base?: I): EmailReflects_ReflectsEntry {
    return EmailReflects_ReflectsEntry.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<EmailReflects_ReflectsEntry>, I>>(object: I): EmailReflects_ReflectsEntry {
    const message = createBaseEmailReflects_ReflectsEntry();
    message.key = object.key ?? "";
    message.value = (object.value !== undefined && object.value !== null)
      ? EmailReflect.fromPartial(object.value)
      : undefined;
    return message;
  },
};

function bytesFromBase64(b64: string): Uint8Array {
  if ((globalThis as any).Buffer) {
    return Uint8Array.from(globalThis.Buffer.from(b64, "base64"));
  } else {
    const bin = globalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if ((globalThis as any).Buffer) {
    return globalThis.Buffer.from(arr).toString("base64");
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(globalThis.String.fromCharCode(byte));
    });
    return globalThis.btoa(bin.join(""));
  }
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isObject(value: any): boolean {
  return typeof value === "object" && value !== null;
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
