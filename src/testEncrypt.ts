import {ec as EC} from "elliptic";
import Hex from "crypto-js/enc-hex";
import PBKDF2 from "crypto-js/pbkdf2";
import WordArray from "crypto-js/lib-typedarrays";
import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";
import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";
import {encodeHex} from "./common";
import {decodePubKey, generateKeyPairFromSecretKey, generatePrivateKey, MailKey} from "./wallet";
import base58 from "bs58";
import {sha512} from "js-sha512";

export function testEncryptData() {

// 初始化椭圆曲线
    const ec = new EC('secp256k1');

// 生成双方的密钥对
    const alice = ec.genKeyPair();


// 获取私钥并转换为十六进制字符串
    const alicePrivateKeyHex = alice.getPrivate('hex');
    console.log("Alice's Private Key (hex):", alicePrivateKeyHex);

// 将私钥转换为 Uint8Array
    const alicePrivateKeyBytes = Uint8Array.from(Buffer.from(alicePrivateKeyHex, 'hex'));
    console.log("Alice's Private Key (Uint8Array):", alicePrivateKeyBytes);
// 输出私钥长度
    console.log("Alice's Private Key Length (bytes):", alicePrivateKeyBytes.length);

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


export function testCurve() {
    // 生成curve25519的密钥对
    const aliceKeyPair = nacl.box.keyPair();
    const bobSecretKey = generatePrivateKey();
    const bobKeyPair = generateKeyPairFromSecretKey(bobSecretKey);

    // Alice 的公钥
    const alicePublicKey = encodeHex(aliceKeyPair.publicKey);
    console.log("Alice's Public Key:", alicePublicKey);

    // Bob 的公钥
    const bobPublicKey = encodeHex(bobKeyPair.publicKey);
    console.log("Bob's Public Key:", bobPublicKey);

    // Alice 使用自己的私钥和 Bob 的公钥生成共享密钥
    const aliceSharedKey = nacl.box.before(bobKeyPair.publicKey, aliceKeyPair.secretKey);
    console.log("Alice's Shared Key:", encodeHex(aliceSharedKey));

    // Bob 使用自己的私钥和 Alice 的公钥生成共享密钥
    const bobSharedKey = nacl.box.before(aliceKeyPair.publicKey, bobKeyPair.secretKey);
    console.log("Bob's Shared Key:", encodeHex(bobSharedKey));

    // 验证共享密钥是否相同
    console.log("Shared keys match:", encodeHex(aliceSharedKey) === encodeHex(bobSharedKey));

    // AES 加密 (使用共享密钥)
    // 在此示例中，我们使用 nacl.secretbox 来实现对称加密，这里 nacl.secretbox 使用的是共享密钥的前 32 字节。
    const message = "Hello curve25519, this is a secret message!";
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const encrypted = nacl.secretbox(naclUtil.decodeUTF8(message), nonce, aliceSharedKey);
    console.log("Encrypted:", encodeHex(encrypted));

    // AES 解密
    const decrypted = nacl.secretbox.open(encrypted, nonce, bobSharedKey);
    if (decrypted) {
        console.log("Decrypted:", naclUtil.encodeUTF8(decrypted));
    } else {
        console.log("Failed to decrypt message");
    }
}

export function testBmailPub() {
    const secretKey = generatePrivateKey();
    const key = new MailKey(secretKey);
    const bobSecretKey = generatePrivateKey();
    const bobKeyPair = generateKeyPairFromSecretKey(bobSecretKey);

    console.log("------>>> uint8 array pub:", key.address, decodePubKey(key.address.bmailAddress),bobKeyPair.secretKey)
    const aliceSharedKey = nacl.box.before(bobKeyPair.publicKey, key.bmailKey.secretKey);
    console.log("Alice's Shared Key:", encodeHex(aliceSharedKey));

    // Bob 使用自己的私钥和 Alice 的公钥生成共享密钥
    const alicePub = decodePubKey(key.address.bmailAddress)
    const bobSharedKey = nacl.box.before(alicePub, bobKeyPair.secretKey);
    console.log("Bob's Shared Key:", encodeHex(bobSharedKey));

    console.log("Shared keys match:", encodeHex(aliceSharedKey) === encodeHex(bobSharedKey));


    const message = "Hello Bmail, this is a secret message!";
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const encrypted = nacl.secretbox(naclUtil.decodeUTF8(message), nonce, aliceSharedKey);
    console.log("Encrypted:", encodeHex(encrypted));

    // AES 解密
    const decrypted = nacl.secretbox.open(encrypted, nonce, bobSharedKey);
    if (decrypted) {
        console.log("Decrypted:", naclUtil.encodeUTF8(decrypted));
    } else {
        console.log("Failed to decrypt message");
    }
}
function privateKeyToCurve25519(privateKey: Uint8Array) {
    const curve25519Private = new Uint8Array(32); // 计算 SHA-512 哈希，只取前32字节作为私钥
    const digest = sha512.arrayBuffer(privateKey.slice(0, 32));

    const digestUint8 = new Uint8Array(digest);

    digestUint8[0] &= 248;
    digestUint8[31] &= 127;
    digestUint8[31] |= 64;

    curve25519Private.set(digestUint8.slice(0, 32));

    return curve25519Private;
}
export function testCurveEd(){
    const seed = generatePrivateKey();
    const keyPair = nacl.sign.keyPair.fromSeed(seed);
    const edPriPart = keyPair.secretKey.slice(0,32);
    console.log("------>>>",nacl.sign.secretKeyLength, keyPair.publicKey, keyPair.secretKey, edPriPart);

    const message = naclUtil.decodeUTF8('Hello, signature!');
    const signature = nacl.sign.detached(message, keyPair.secretKey);

    const signatureHex = encodeHex(signature);

    const keypair2 = nacl.box.keyPair.fromSecretKey(seed);

    const newSeed = privateKeyToCurve25519(keyPair.secretKey);
    const keypair3 = nacl.box.keyPair.fromSecretKey(newSeed);

    const publicKeyUint8Array = new Uint8Array(keypair2.publicKey);
    const encodedAddress = base58.encode(publicKeyUint8Array);
    const bmAddr = "BM" + encodedAddress;

    console.log('------------------->>>>',
        "\nmessage:\t",encodeHex(message),
        "\nSignature:\t",signatureHex,
        "\nseed:\t", encodeHex(seed),
        "\npub1\t",encodeHex(keyPair.publicKey),
        "\npri1\t",encodeHex(keyPair.secretKey),
        "\npub2:\t", encodeHex(keypair2.publicKey),
        "\npri2:\t", encodeHex(keypair2.secretKey),
        "\nbmAddr:\t", bmAddr,
        "\nnew seed:\t", encodeHex(newSeed),
        "\npub3:\t", encodeHex(keypair3.publicKey),
        "\npri3:\t", encodeHex(keypair3.secretKey),
        );

    const isValid = nacl.sign.detached.verify(message, signature, keyPair.publicKey);
    if (isValid) {
        console.log('Signature is valid!');
    } else {
        console.log('Signature is invalid!');
    }
}

export function testSignatureLength() {
    const keyPair = nacl.sign.keyPair();
    const longMessage = new Uint8Array(10000);  // 创建一个长度为10000的大消息
    for (let i = 0; i < longMessage.length; i++) {
        longMessage[i] = i % 256;  // 填充一些数据
    }

    const signature = nacl.sign(longMessage, keyPair.secretKey);

    console.log('------>>>>Signature length:', signature.length);  // 输出签名长度，应为 64

    // 验证签名
    const originalMessage = nacl.sign.open(signature, keyPair.publicKey);

    if (originalMessage) {
        console.log('------>>>>Signature valid, original message length:', originalMessage.length);
    } else {
        console.log('------>>>>Invalid signature');
    }
}