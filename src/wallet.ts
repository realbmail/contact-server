import Hex from "crypto-js/enc-hex";
import PBKDF2 from "crypto-js/pbkdf2";
import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";
import WordArray from "crypto-js/lib-typedarrays";
import {mnemonicToSeedSync} from "bip39";
import {ec as EC} from "elliptic";
import base58 from "bs58";
import {keccak256} from "js-sha3";
import {__tableNameWallet, getMaxIdRecord} from "./database";

const BMailAddrLen = 32;
const BMailAddrPrefix = "BM";

class CipherData {
    cipherTxt: string;
    iv: string;
    salt: string;

    constructor(cipherTxt: string, iv: string, salt: string) {
        this.cipherTxt = cipherTxt;
        this.iv = iv;
        this.salt = salt;
    }
}

export class DbWallet {
    address: string;
    ethAddress: string;
    cipherObj: CipherData;

    constructor(address: string, ethAddr: string, cipherObj: CipherData) {
        this.address = address;
        this.ethAddress = ethAddr;
        this.cipherObj = cipherObj;
    }
}

class MailKey {
    priRaw: Uint8Array;
    ecKey: EC.KeyPair;

    constructor(priRaw: Uint8Array) {
        this.priRaw = priRaw;
        const ec = new EC('secp256k1');
        this.ecKey = ec.keyFromPrivate(priRaw);
    }

    GetPub(): string {
        const publicKeyArray = this.ecKey.getPublic(true, 'array');
        const subAddr = new Uint8Array(BMailAddrLen);
        const publicKeyUint8Array = new Uint8Array(publicKeyArray);
        subAddr.set(publicKeyUint8Array.slice(0, BMailAddrLen));
        const encodedAddress = base58.encode(subAddr);
        return BMailAddrPrefix + encodedAddress;
    }

    GetEthPub(): string {
        const publicKey = this.ecKey.getPublic();
        const publicKeyBytes = Buffer.from(publicKey.encode('array', false).slice(1));
        const hashedPublicKey = keccak256(publicKeyBytes);
        return '0x' + hashedPublicKey.slice(-40);
    }
}

export function newWallet(mnemonic: string, password: string): DbWallet {
    const seedBuffer = mnemonicToSeedSync(mnemonic);
    const first32Bytes = seedBuffer.subarray(0, 32);
    const hexPri = first32Bytes.toString('hex');
    const seedUint8Array: Uint8Array = new Uint8Array(first32Bytes);
    const key = new MailKey(seedUint8Array);
    const data = encryptAes(hexPri, password);
    const address = key.GetPub();
    const ethAddr = key.GetEthPub();
    return new DbWallet(address, ethAddr, data);

}

export function decryptAes(data: CipherData, password: string): string {
    const salt = Hex.parse(data.salt);
    const iv = Hex.parse(data.iv);
    const key = PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 1000
    });
    const decrypted = AES.decrypt(data.cipherTxt, key, {iv: iv});

    return decrypted.toString(Utf8);
}

export function encryptAes(plainTxt: string, password: string): CipherData {
    const salt = WordArray.random(128 / 8);
    const key = PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 1000
    });
    const iv = WordArray.random(128 / 8);
    const encrypted = AES.encrypt(plainTxt, key, {iv: iv});

    return new CipherData(encrypted.toString(), iv.toString(Hex), salt.toString(Hex));
}

export async function queryCurWallet(): Promise<DbWallet|null> {
    const walletObj = await getMaxIdRecord(__tableNameWallet);
    if (!walletObj) {
        return null;
    }
    return walletObj;
}