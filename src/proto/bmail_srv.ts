// Code generated by protoc-gen-ts_proto. DO NOT EDIT.
// versions:
//   protoc-gen-ts_proto  v1.181.1
//   protoc               v5.27.3
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
}

export interface Operation {
  isDel: boolean;
  address: string;
  emails: string[];
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
  return { address: "", oneEmailAddr: "", emailList: [] };
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
    return message;
  },
};

function createBaseOperation(): Operation {
  return { isDel: false, address: "", emails: [] };
}

export const Operation = {
  encode(message: Operation, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
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

  decode(input: _m0.Reader | Uint8Array, length?: number): Operation {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseOperation();
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

  fromJSON(object: any): Operation {
    return {
      isDel: isSet(object.isDel) ? globalThis.Boolean(object.isDel) : false,
      address: isSet(object.address) ? globalThis.String(object.address) : "",
      emails: globalThis.Array.isArray(object?.emails) ? object.emails.map((e: any) => globalThis.String(e)) : [],
    };
  },

  toJSON(message: Operation): unknown {
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

  create<I extends Exact<DeepPartial<Operation>, I>>(base?: I): Operation {
    return Operation.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<Operation>, I>>(object: I): Operation {
    const message = createBaseOperation();
    message.isDel = object.isDel ?? false;
    message.address = object.address ?? "";
    message.emails = object.emails?.map((e) => e) || [];
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

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
