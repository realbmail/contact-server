import naclUtil from "tweetnacl-util";
import nacl from "tweetnacl";
import {decodePubKey, generatePrivateKey, MailKey} from "./wallet";
import {decodeHex, encodeHex} from "./common";

export const MailBodyVersion = 1;
export const MailFlag = "0be465716ad37c9119253196f921e677";

export class BMailBody {
    version: number;
    receivers: Map<string, string>;
    cryptoBody: string;
    nonce: Uint8Array;
    sender: string;
    mailFlag: string

    constructor(version: number, secrets: Map<string, string>, body: string, nonce: Uint8Array, sender: string) {
        this.version = version;
        this.receivers = secrets;
        this.cryptoBody = body;
        this.nonce = nonce;
        this.sender = sender;
        this.mailFlag = MailFlag;
    }

    toJSON() {
        return {
            version: this.version,
            receivers: Array.from(this.receivers.entries()),
            cryptoBody: this.cryptoBody,
            nonce: Array.from(this.nonce),
            sender: this.sender,
            mailFlag: this.mailFlag
        };
    }

    static fromJSON(jsonStr: string): BMailBody {
        const json = JSON.parse(jsonStr);
        const version = json.version;
        const receivers = new Map<string, string>(json.receivers); // 将二维数组转换回 Map
        const cryptoBody = json.cryptoBody;
        const nonce = new Uint8Array(json.nonce); // 将普通数组转换回 Uint8Array
        const sender = json.sender;
        return new BMailBody(version, receivers, cryptoBody, nonce, sender);
    }
}

export function encodeMail(peers: string[], data: string, key: MailKey): BMailBody {
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const aesKey = generatePrivateKey();
    let secrets = new Map<string, string>();

    peers.push(key.address.bmailAddress);//add self for decrypt.

    peers.forEach(peer => {
        const peerPub = decodePubKey(peer);
        const sharedKey = nacl.box.before(peerPub, key.bmailKey.secretKey);
        const encryptedKey = nacl.secretbox(aesKey, nonce, sharedKey);
        secrets.set(peer, encodeHex(encryptedKey));
    })

    const encryptedBody = nacl.secretbox(naclUtil.decodeUTF8(data), nonce, aesKey);
    return new BMailBody(MailBodyVersion, secrets, naclUtil.encodeBase64(encryptedBody), nonce, key.address.bmailAddress)
}

export function decodeMail(mailData: string, key: MailKey) {

    const mail = BMailBody.fromJSON(mailData);
    const address = key.address;
    const encryptedKey = mail.receivers.get(address.bmailAddress)
    if (!encryptedKey) {
        throw new Error("address isn't in receiver list");
    }

    const peerPub = decodePubKey(mail.sender);
    const sharedKey = nacl.box.before(peerPub, key.bmailKey.secretKey);
    const aesKey = nacl.secretbox.open(decodeHex(encryptedKey), mail.nonce, sharedKey);
    if (!aesKey) {
        throw new Error("no aes key valid.");
    }

    const bodyBin = nacl.secretbox.open(naclUtil.decodeBase64(mail.cryptoBody), mail.nonce, aesKey);
    if (!bodyBin) {
        throw new Error("decrypt mail body failed");
    }

    return naclUtil.encodeUTF8(bodyBin)
}