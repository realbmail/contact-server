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

export class MemWallet {
    address: string;

    constructor(address: string) {
        this.address = address;
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
        console.log("++++++>>>publicKeyArray and length:", publicKeyArray, publicKeyArray.length);
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

export async function queryCurWallet(): Promise<DbWallet | null> {
    const walletObj = await getMaxIdRecord(__tableNameWallet);
    if (!walletObj) {
        return null;
    }
    return walletObj;
}

export function hexStringToByteArray(hexString: string): Uint8Array {
    if (hexString.length % 2 !== 0) {
        throw new Error("Hex string must have an even length");
    }
    return new Uint8Array(Buffer.from(hexString, 'hex'));
}

export function castToMemWallet(pwd: string, wallet: DbWallet): MemWallet {
    const decryptedPri = decryptAes(wallet.cipherObj, pwd);
    const priArray = hexStringToByteArray(decryptedPri);
    const key = new MailKey(priArray);
    const address = key.GetPub();
    return new MemWallet(address);
}

export function decodePubKey(pubKeyStr: string): Uint8Array {
    if (!pubKeyStr.startsWith(BMailAddrPrefix)) {
        throw new Error("Invalid public key prefix");
    }

    const encodedAddress = pubKeyStr.slice(BMailAddrPrefix.length);
    const decodedBytes = base58.decode(encodedAddress);

    if (decodedBytes.length !== BMailAddrLen) {
        throw new Error("Invalid decoded public key length");
    }
    return decodedBytes;
}

export function testEnryptoData() {

// 初始化椭圆曲线
    const ec = new EC('secp256k1');

// 生成双方的密钥对
    const alice = ec.genKeyPair();
    const bob = ec.genKeyPair();
// Alice 的公钥
    const alicePublicKey = alice.getPublic();
    console.log("Alice's Public Key:", alicePublicKey.encode('hex', false));

// Bob 的公钥
    const bobPublicKey = bob.getPublic();
    console.log("Bob's Public Key:", bobPublicKey.encode('hex', false));

// Alice 使用自己的私钥和 Bob 的公钥生成共享密钥
    const aliceSharedKey = alice.derive(bobPublicKey).toString(16);
    console.log("Alice's Shared Key:", aliceSharedKey);

// Bob 使用自己的私钥和 Alice 的公钥生成共享密钥
    const bobSharedKey = bob.derive(alicePublicKey).toString(16);
    console.log("Bob's Shared Key:", bobSharedKey);

// 验证共享密钥是否相同
    console.log("Shared keys match:", aliceSharedKey === bobSharedKey);

    // 将共享密钥转换为适合 AES 加密的格式
    const sharedKeyBytes = Hex.parse(aliceSharedKey).toString();
    const sharedKey = PBKDF2(sharedKeyBytes, Hex.parse('salt'), {keySize: 256 / 32}).toString(Hex);

// AES 加密
    const plaintext = "Hello, this is a secret message!";
    const iv = WordArray.random(128 / 8).toString(Hex);
    const encrypted = AES.encrypt(plaintext, Hex.parse(sharedKey), {iv: Hex.parse(iv)}).toString();
    console.log("Encrypted:", encrypted);

// AES 解密
    const decrypted = AES.decrypt(encrypted, Hex.parse(sharedKey), {iv: Hex.parse(iv)}).toString(Utf8);
    console.log("Decrypted:", decrypted);
}