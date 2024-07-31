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

class DbWallet {
    address: string;
    cipherObj: CipherData;
    rawPri?: Uint8Array;

    constructor(address: string, cipherObj: CipherData) {
        this.address = address;
        this.cipherObj = cipherObj;
    }
}