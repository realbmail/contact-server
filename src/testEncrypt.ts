import {ec, ec as EC} from "elliptic";
import Hex from "crypto-js/enc-hex";
import PBKDF2 from "crypto-js/pbkdf2";
import WordArray from "crypto-js/lib-typedarrays";
import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";
import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";
import {decodeHex, encodeHex} from "./utils";
import {
    decodePubKey,
    decryptAes,
    encryptAes,
    generateKeyPairFromSecretKey,
    generateRandomKey,
    MailKey
} from "./wallet";
import base58 from "bs58";
import {ed2CurvePub, ed2CurvePri} from "./edwards25519";
import {AccountOperation} from "./proto/bmail_srv";
import {AttachmentEncryptKey} from "./content_attachment";

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
    const bobSecretKey = generateRandomKey();
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
    const secretKey = generateRandomKey();
    const key = new MailKey(secretKey);
    const bobSecretKey = generateRandomKey();
    const bobKeyPair = generateKeyPairFromSecretKey(bobSecretKey);

    console.log("------>>> uint8 array pub:", key.address, decodePubKey(key.address.bmail_address), bobKeyPair.secretKey)
    const aliceSharedKey = nacl.box.before(bobKeyPair.publicKey, key.bmailKey.secretKey);
    console.log("Alice's Shared Key:", encodeHex(aliceSharedKey));

    // Bob 使用自己的私钥和 Alice 的公钥生成共享密钥
    const alicePub = decodePubKey(key.address.bmail_address)
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


export function testCurveEd() {
    const seed = generateRandomKey();
    const keyPair = nacl.sign.keyPair.fromSeed(seed);
    const edPriPart = keyPair.secretKey.slice(0, 32);
    console.log("------>>>", nacl.sign.secretKeyLength, keyPair.publicKey, keyPair.secretKey, edPriPart);

    const message = naclUtil.decodeUTF8('Hello, signature!');
    const signature = nacl.sign.detached(message, keyPair.secretKey);

    const signatureHex = encodeHex(signature);

    const keypair2 = nacl.box.keyPair.fromSecretKey(seed);

    const newSeed = ed2CurvePri(keyPair.secretKey);
    const keypair3 = nacl.box.keyPair.fromSecretKey(newSeed);

    const publicKeyUint8Array = new Uint8Array(keypair2.publicKey);
    const encodedAddress = base58.encode(publicKeyUint8Array);
    const bmAddr = "BM" + encodedAddress;

    console.log('------------------->>>>',
        "\nmessage:\t", encodeHex(message),
        "\nSignature:\t", signatureHex,
        "\nseed:\t", encodeHex(seed),
        "\npub1\t", encodeHex(keyPair.publicKey),
        "\npri1\t", encodeHex(keyPair.secretKey),
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

export function testEd2curve() {
    const seed = decodeHex('ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1');
    const keyPair = nacl.sign.keyPair.fromSeed(seed);
    console.log("------>>>publicKey:", keyPair.publicKey, encodeHex(keyPair.publicKey));

    const curvePub = ed2CurvePub(keyPair.publicKey)
    if (!curvePub) {
        console.log("------>>> failed to convert:");
        return;
    }
    console.log("------>>>publicKey:", curvePub, encodeHex(curvePub));

    const curvePri = ed2CurvePri(keyPair.secretKey.slice(0, 32))
    const keypairCurve = nacl.box.keyPair.fromSecretKey(curvePri);
    console.log("------>>>publicKey2:", keypairCurve.publicKey, encodeHex(keypairCurve.publicKey));
}

export function testEdCrypto() {
    const seed = generateRandomKey();
    console.log("----->>>>seed:", seed, encodeHex(seed));
    const edKeyPair = nacl.sign.keyPair.fromSeed(seed);
    console.log("----->>>>ed pub key:", edKeyPair.publicKey, encodeHex(edKeyPair.publicKey));
    const peerPubStr = "a7706d464d52c03a242a9875eab1d4a9c2af0459fa3b585fbcc29c0c0ee0ddec";
    const curvePri = ed2CurvePri(edKeyPair.secretKey.slice(0, 32))
    const sharedKey = nacl.box.before(decodeHex(peerPubStr), curvePri);
    console.log("------>>> shared Key:", sharedKey, encodeHex(sharedKey));
}

export function testEdCrypto2() {
    const seed = decodeHex("65a3f3ccb71cb2e2177dbeffa923e527da56cc13172a7d060575e50c080c1f34");
    const edKeyPair = nacl.sign.keyPair.fromSeed(seed);
    console.log("----->>>>ed pub key:", edKeyPair.publicKey, encodeHex(edKeyPair.publicKey));
    const peerEdPub = decodeHex("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1");
    const peerCurvePub = ed2CurvePub(peerEdPub);
    console.log("----->>>>peer curve pub:", peerCurvePub, encodeHex(peerCurvePub!));
    const curvePri = ed2CurvePri(edKeyPair.secretKey.slice(0, 32))
    const sharedKey = nacl.box.before(peerCurvePub!, curvePri);
    console.log("------>>> shared Key:", sharedKey, encodeHex(sharedKey));
}

export function testOne() {
    const seed = decodeHex("65a3f3ccb71cb2e2177dbeffa923e527da56cc13172a7d060575e50c080c1f34");
    const edKeyPair = nacl.sign.keyPair.fromSeed(seed);
    console.log("----->>>>self ed pub key:", edKeyPair.publicKey, encodeHex(edKeyPair.publicKey));
    const peerCurvePub = ed2CurvePub(edKeyPair.publicKey);
    console.log("----->>>>self curve pub:", peerCurvePub, encodeHex(peerCurvePub!));
    const curvePri = ed2CurvePri(edKeyPair.secretKey);
    console.log("----->>>>self curve pri:", curvePri, encodeHex(curvePri!));
}


export function testTwo() {
    const seed = decodeHex("65a3f3ccb71cb2e2177dbeffa923e527da56cc13172a7d060575e50c080c1f34");

    const edKeyPair = nacl.sign.keyPair.fromSeed(seed);
    console.log("----->>>>self ed pub key:", encodeHex(edKeyPair.publicKey));
    const curvePub = ed2CurvePub(edKeyPair.publicKey);
    const curvePri = ed2CurvePri(edKeyPair.secretKey)
    console.log("----->>>>self curve pub:", encodeHex(curvePub!), "self curve pri:", encodeHex(curvePri));

    const peerEdPub = decodeHex("a7706d464d52c03a242a9875eab1d4a9c2af0459fa3b585fbcc29c0c0ee0ddec");
    const peerCurvePub = ed2CurvePub(peerEdPub);
    console.log("----->>>>peer curve pub:", encodeHex(peerCurvePub!));

    const sharedKey = nacl.scalarMult(curvePri, peerCurvePub!);
    console.log("------>>> shared Key:", encodeHex(curvePri), encodeHex(peerCurvePub!), encodeHex(sharedKey));
}


export function testThree() {
    const selfPriArr = decodeHex("20501526f7c3b061da5d00fdf9b51acc6a856476c110cc7d2e5215e3d1984d76");
    const peerPriArr = decodeHex("18f3e9e9ac0d9cd77d1b1eac1d71fdd99a038dbfb49a9cf642395fecdfa86971");

    const aliceKeyPair = nacl.box.keyPair.fromSecretKey(selfPriArr);
    const bobKeyPair = nacl.box.keyPair.fromSecretKey(peerPriArr);

    // const aliceKeyPair = nacl.sign.keyPair.fromSeed(selfPriArr);
    // const bobKeyPair = nacl.sign.keyPair.fromSeed(selfPriArr);

    const aliceSharedKey = nacl.scalarMult(aliceKeyPair.secretKey, bobKeyPair.publicKey);
    const bobSharedKey = nacl.scalarMult(bobKeyPair.secretKey, aliceKeyPair.publicKey);

    console.log("----->>>>Alice's Shared Key:", Buffer.from(aliceSharedKey).toString('hex'));
    console.log("----->>>>Bob's Shared Key:", Buffer.from(bobSharedKey).toString('hex'));
}

export function testSignAndVerify() {
    const seed = decodeHex("65a3f3ccb71cb2e2177dbeffa923e527da56cc13172a7d060575e50c080c1f34");
    const payload: AccountOperation = AccountOperation.create({
        isDel: false,
        address: "BMBkWA7Mpq6VcTBMhLtmheTtuFGukazYVJjCJPTjbcQQXA"
    });

    const message = AccountOperation.encode(payload).finish()
    const signature = MailKey.signData(seed, message);

    const success = MailKey.verifySignature(seed, signature, message)
    console.log("------>>> sig:", signature, "success:", success)
}

export function testMailkey() {
    const seed = decodeHex("ef61522efc8e45bd69cd3a131bdec0e569f73a356eadd4f14a93f4912344cfb1");
    const key = new MailKey(seed);
    console.log("======>>>", key.address);
}

export function testAes() {
    const data = encryptAes("hello world", "123");
    console.log("------>>>", JSON.stringify(data));

    const message = decryptAes(data, "123");
    console.log("------>>>", message);
}

export function testAttachmentEncryptKey() {
    // 使用字符串类型的 id
    const id = '' + Date.now();
    const key = generateRandomKey();
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);

    const aek = new AttachmentEncryptKey(id, key, nonce);
    const jsonString = AttachmentEncryptKey.toJson(aek);

    console.log('Serialized string:', jsonString);

    const deserializedAek = AttachmentEncryptKey.fromJson(jsonString);

    console.log('Deserialized id:', deserializedAek.id);
    console.log('Deserialized key:', deserializedAek.key);
    console.log('Deserialized nonce:', deserializedAek.nonce);

    // 验证 id、key 和 nonce 是否一致
    const idEqual = id === deserializedAek.id;
    const keyEqual = nacl.verify(key, deserializedAek.key);
    const nonceEqual = nacl.verify(nonce, deserializedAek.nonce);

    console.log('ID equal:', idEqual);
    console.log('Key equal:', keyEqual);
    console.log('Nonce equal:', nonceEqual);
}


