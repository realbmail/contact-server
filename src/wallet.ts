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
import nacl from 'tweetnacl';
import {decodeHex} from "./common";

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
    address: MailAddress;
    cipherObj: CipherData;

    constructor(address: MailAddress, cipherObj: CipherData) {
        this.address = address;
        this.cipherObj = cipherObj;
    }
}

export class MailAddress {
    public bmailAddress: string;
    public ethAddress: string;

    constructor(address: string, ethAddress: string) {
        this.bmailAddress = address;
        this.ethAddress = ethAddress;
    }
}

export class MailKey {
    private readonly priRaw: Uint8Array;
    private readonly ecKey: EC.KeyPair;
    readonly bmailKey: nacl.BoxKeyPair;
    public address: MailAddress;

    constructor(priRaw: Uint8Array) {
        this.priRaw = priRaw;
        const ec = new EC('secp256k1');
        this.ecKey = ec.keyFromPrivate(priRaw);
        this.bmailKey = generateKeyPairFromSecretKey(priRaw);
        this.address = new MailAddress(this.getPub(), this.getEthPub());
    }

    private getPub(): string {
        const publicKeyArray = this.bmailKey.publicKey;
        const publicKeyUint8Array = new Uint8Array(publicKeyArray);
        const encodedAddress = base58.encode(publicKeyUint8Array);
        return BMailAddrPrefix + encodedAddress;
    }

    private getEthPub(): string {
        const publicKey = this.ecKey.getPublic();
        const publicKeyBytes = Buffer.from(publicKey.encode('array', false).slice(1));
        const hashedPublicKey = keccak256(publicKeyBytes);
        return '0x' + hashedPublicKey.slice(-40);
    }

    rawPriKey(): Uint8Array {
        return this.priRaw;
    }
}

export function newWallet(mnemonic: string, password: string): DbWallet {
    const seedBuffer = mnemonicToSeedSync(mnemonic);
    const first32Bytes = seedBuffer.subarray(0, 32);
    const hexPri = first32Bytes.toString('hex');
    const seedUint8Array: Uint8Array = new Uint8Array(first32Bytes);
    const key = new MailKey(seedUint8Array);
    const data = encryptAes(hexPri, password);
    return new DbWallet(key.address, data);
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

export async function queryCurWallet(): Promise<DbWallet | null> {
    const walletObj = await getMaxIdRecord(__tableNameWallet);
    if (!walletObj) {
        return null;
    }
    return walletObj;
}

export function castToMemWallet(pwd: string, wallet: DbWallet): MailKey {
    const decryptedPri = decryptAes(wallet.cipherObj, pwd);
    const priArray = decodeHex(decryptedPri);
    return new MailKey(priArray);
}

export function decodePubKey(pubKeyStr: string): Uint8Array {
    if (!pubKeyStr.startsWith(BMailAddrPrefix)) {
        throw new Error("Invalid public key prefix");
    }
    const encodedAddress = pubKeyStr.slice(BMailAddrPrefix.length);
    return base58.decode(encodedAddress);
}


export function generatePrivateKey(): Uint8Array {
    return nacl.randomBytes(nacl.box.secretKeyLength);
}


export function generateKeyPairFromSecretKey(secretKey: Uint8Array): nacl.BoxKeyPair {
    return nacl.box.keyPair.fromSecretKey(secretKey);
}