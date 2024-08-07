import naclUtil from "tweetnacl-util";
import nacl from "tweetnacl";
import {decodePubKey, generatePrivateKey, MailKey} from "./wallet";
import {decodeHex, encodeHex} from "./common";

export const MailBodyVersion = 1;

export class BMailBody {
    version: number;
    receivers: Map<string, string>;
    cryptoBody: string;
    nonce: Uint8Array;
    sender: string;

    constructor(version: number, secrets: Map<string, string>, body: string, nonce: Uint8Array, sender: string) {
        this.version = version;
        this.receivers = secrets;
        this.cryptoBody = body;
        this.nonce = nonce;
        this.sender = sender;
    }
}

export function encodeMail(peers: string[], data: string, key: MailKey) {
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const aesKey = generatePrivateKey();
    let secrets = new Map<string, string>();

    peers.forEach(peer => {
        const peerPub = decodePubKey(peer);
        const sharedKey = nacl.box.before(peerPub, key.bmailKey.secretKey);
        const encryptedKey = nacl.secretbox(aesKey, nonce, sharedKey);
        secrets.set(peer, encodeHex(encryptedKey));
    })

    const encryptedBody = nacl.secretbox(naclUtil.decodeUTF8(data), nonce, aesKey);
    return new BMailBody(MailBodyVersion, secrets, naclUtil.encodeBase64(encryptedBody), nonce, key.GetPub())
}

export function decodeMail(mailData: string, key: MailKey) {
    const mail = JSON.parse(mailData) as BMailBody;

    const address = key.GetPub();
    const encryptedKey = mail.receivers.get(address)
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