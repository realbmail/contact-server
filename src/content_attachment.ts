import {generateRandomKey} from "./wallet";
import {decodeHex, encodeHex} from "./common";
import nacl from "tweetnacl";
import {AttachmentFileSuffix} from "./consts";
import browser from "webextension-polyfill";
import {showCustomModal} from "./content_common";

export class AttachmentEncryptKey {
    id: string;
    key: Uint8Array;
    nonce: Uint8Array;

    constructor(id: string, key: Uint8Array, nonce: Uint8Array) {
        this.id = id;
        this.key = key;
        this.nonce = nonce;
    }

    static toJson(aek?: AttachmentEncryptKey): string {
        if (!aek) {
            return "";
        }

        const combinedLength = nacl.box.secretKeyLength + nacl.secretbox.nonceLength;
        const combined = new Uint8Array(combinedLength);

        combined.set(aek.key, 0);
        combined.set(aek.nonce, aek.key.length);

        return `${aek.id}_` + encodeHex(combined);
    }

    static fromJson(aekStr: string): AttachmentEncryptKey {
        const underscoreIndex = aekStr.indexOf('_');
        if (underscoreIndex === -1) {
            throw new Error('Invalid input string format.');
        }

        const id = aekStr.substring(0, underscoreIndex);
        const hexData = aekStr.substring(underscoreIndex + 1);

        const combined = decodeHex(hexData);

        const keyLength = nacl.box.secretKeyLength;
        const nonceLength = nacl.secretbox.nonceLength;

        const key = combined.slice(0, keyLength);
        const nonce = combined.slice(keyLength, keyLength + nonceLength);

        return new AttachmentEncryptKey(id, key, nonce);
    }

    cacheAKForCompose() {
        const keyStr = localStorage.getItem(this.id);
        if (keyStr) {
            return;
        }
        localStorage.setItem(this.id, AttachmentEncryptKey.toJson(this));
    }

    cacheAkForReading() {
        const keyStr = sessionStorage.getItem(this.id);
        if (keyStr) {
            return;
        }
        sessionStorage.setItem(this.id, AttachmentEncryptKey.toJson(this));
    }
}

function generateAttachmentKey(): AttachmentEncryptKey {
    const key = generateRandomKey();
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    return new AttachmentEncryptKey('' + Date.now(), key, nonce);
}

export function loadAKForCompose(aekId: string): string | undefined {
    try {
        const keyStr = localStorage.getItem(aekId);
        if (!keyStr) {
            return undefined;
        }
        return keyStr;
    } catch (err) {
        console.log("------->>> query attachment aes key error:", err);
        return undefined;
    }
}

export function loadAKForReading(aekId: string): AttachmentEncryptKey | undefined {
    try {
        const keyStr = sessionStorage.getItem(aekId);
        if (!keyStr) {
            return undefined;
        }
        return AttachmentEncryptKey.fromJson(keyStr);
    } catch (err) {
        console.log("------->>> parse attachment aes key error:", err);
        return undefined;
    }
}

export function removeAttachmentKey(aekID: string) {

    localStorage.removeItem(aekID);
    sessionStorage.removeItem(aekID);
}

export function checkAttachmentBtn(attachmentDiv: HTMLElement, fileInput: HTMLInputElement, overlayButton: HTMLElement, aekId?: string): void {
    fileInput.style.pointerEvents = 'none';
    fileInput.style.opacity = '0';

    if (getComputedStyle(attachmentDiv).position === 'static') {
        attachmentDiv.style.position = 'relative';
    }

    let attachmentKey: AttachmentEncryptKey
    if (aekId) {
        const attStr = localStorage.getItem(aekId);
        if (!attStr) {
            console.log("---->>> found attachment id but lost aes key");
            return;
        }

        attachmentKey = AttachmentEncryptKey.fromJson(attStr);
    } else {
        attachmentKey = generateAttachmentKey();
    }

    overlayButton.addEventListener('click', (event) => handleOverlayButtonClick(event, fileInput, attachmentKey, overlayButton));

    attachmentDiv.appendChild(overlayButton);
}

async function handleOverlayButtonClick(
    event: MouseEvent,
    fileInput: HTMLInputElement,
    aesKey: AttachmentEncryptKey,
    overlayButton: HTMLElement
): Promise<void> {
    event.stopPropagation();
    event.preventDefault();

    const okFun = () => {
        const tempInput = document.createElement('input');
        tempInput.type = 'file';
        tempInput.multiple = true;

        tempInput.addEventListener('change', (event) => handleTempInputChange(event, fileInput, aesKey));
        tempInput.click();
    };

    const noFun = () => {
        fileInput.style.pointerEvents = 'auto';
        fileInput.style.opacity = '1';

        overlayButton.style.pointerEvents = 'none';
        fileInput.click();

        setTimeout(() => {
            fileInput.style.pointerEvents = 'none';
            fileInput.style.opacity = '0';
            overlayButton.style.pointerEvents = 'auto';
        }, 2);
    };

    showCustomModal(
        browser.i18n.getMessage('tips_for_attachment_encryption'),
        browser.i18n.getMessage('encrypted_upload'),
        browser.i18n.getMessage('direct_upload'),
        okFun,
        noFun
    );
}

async function handleTempInputChange(event: Event, fileInput: HTMLInputElement, aesKey: AttachmentEncryptKey): Promise<void> {
    const tempInput = event.target as HTMLInputElement;
    const files = tempInput.files;
    if (!files || files.length === 0) {
        console.log("----->>> No files selected.");
        return;
    }

    const fileArray = Array.from(files);

    try {
        const encryptedFiles = await Promise.all(
            fileArray.map(async (file) => {
                console.log("----->>> processing file:", file.name);
                const encryptedFile = await encryptFile(file, aesKey);
                console.log("----->>> file encrypted:", encryptedFile.name);
                return encryptedFile;
            })
        );

        const dataTransfer = new DataTransfer();
        encryptedFiles.forEach((file) => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;

        const newEvent = new Event('change', {bubbles: true, cancelable: true});
        fileInput.dispatchEvent(newEvent);
    } catch (error) {
        console.error("------>>> File encryption failed:", error);
    }
}

function encryptFile(file: File, aesKey: AttachmentEncryptKey): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function (event) {
            try {
                const encryptedFile = processFileData(event, file, aesKey);
                resolve(encryptedFile);
            } catch (e) {
                reject(e);
            }
        };

        reader.onerror = function (error) {
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
}

function processFileData(event: ProgressEvent<FileReader>, originalFile: File, aesKey: AttachmentEncryptKey): File {

    const data = new Uint8Array(event.target?.result as ArrayBuffer);

    const encryptedBody = nacl.secretbox(data, aesKey.nonce, aesKey.key);

    const encryptedBlob = new Blob([encryptedBody], {type: 'application/octet-stream'});

    aesKey.cacheAKForCompose();

    return new File([encryptedBlob], `${originalFile.name}.${aesKey.id + "_" + AttachmentFileSuffix}`, {
        type: 'application/octet-stream',
    });
}

export async function downloadAndDecryptFile(url: string, aesKey: AttachmentEncryptKey, fileName: string) {
    const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // 如果需要携带 Cookie
    });

    if (!response.ok) {
        throw new Error(`网络响应失败，状态码：${response.status}`);
    }

    const encryptedDataBuffer = await response.arrayBuffer();
    const encryptedData = new Uint8Array(encryptedDataBuffer);

    decryptData(encryptedData, aesKey, fileName);
}

function decryptData(encryptedData: Uint8Array, aesKey: AttachmentEncryptKey, fileName: string) {
    const decryptedData = nacl.secretbox.open(encryptedData, aesKey.nonce, aesKey.key);
    if (!decryptedData) {
        throw new Error('解密失败，可能是密钥不正确或数据已损坏');
    }

    // 创建 Blob 对象
    const blob = new Blob([decryptedData], {type: 'application/octet-stream'});

    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(downloadUrl);
    console.log('------>>> 文件下载并解密成功');
}
