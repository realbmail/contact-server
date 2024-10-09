import {generateRandomKey} from "./wallet";
import {decodeHex, encodeHex} from "./common";
import nacl from "tweetnacl";
import {AttachmentFileSuffix} from "./consts";

export class AttachmentEncryptKey {
    key: Uint8Array;
    nonce: Uint8Array;

    constructor(key: Uint8Array, nonce: Uint8Array) {
        this.key = key;
        this.nonce = nonce;
    }

    static toJson(aek?: AttachmentEncryptKey): string {
        if (!aek) {
            return "";
        }
        const combinedLength = nacl.box.secretKeyLength + nacl.secretbox.nonceLength;
        const combined = new Uint8Array(combinedLength);

        console.log('aek.key.length:', aek.key.length);
        console.log('aek.nonce.length:', aek.nonce.length);

        combined.set(aek.key, 0);
        combined.set(aek.nonce, aek.key.length);

        return encodeHex(combined);
    }

    static fromJson(aekStr: string): AttachmentEncryptKey {
        const combined = decodeHex(aekStr);

        const keyLength = nacl.box.secretKeyLength;
        const nonceLength = nacl.secretbox.nonceLength;

        const key = combined.slice(0, keyLength);
        const nonce = combined.slice(keyLength, keyLength + nonceLength);

        return new AttachmentEncryptKey(key, nonce);
    }
}

const keySuffix = "_attachment_key";

function generateAttachmentKey(composeId: string): AttachmentEncryptKey {
    const key = generateRandomKey();
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const obj = new AttachmentEncryptKey(key, nonce);
    localStorage.setItem(composeId + keySuffix, AttachmentEncryptKey.toJson(obj));
    return obj
}

export function queryAttachmentKey(composeId: string): string | undefined {

    try {
        const keyStr = localStorage.getItem(composeId + keySuffix);
        if (!keyStr) {
            return undefined;
        }
        return keyStr;
    } catch (err) {
        return undefined;
    }
}

export function removeAttachmentKey(composeId: string) {
    localStorage.removeItem(composeId + keySuffix);
}

export function checkAttachmentBtn(composeDiv: HTMLElement, overlayButton: HTMLElement): void {
    const attachmentDiv = composeDiv.querySelector('div[id$="_attachBrowser"]') as HTMLInputElement;
    const fileInput = attachmentDiv?.querySelector('input[type="file"]') as HTMLInputElement | null;
    if (!fileInput) {
        console.log("----->>> file input not found");
        return;
    }

    fileInput.style.pointerEvents = 'none';
    fileInput.style.opacity = '0';

    if (getComputedStyle(attachmentDiv).position === 'static') {
        attachmentDiv.style.position = 'relative';
    }

    const attachmentKey = generateAttachmentKey(attachmentDiv.getAttribute('id')!);
    overlayButton.addEventListener('click', (event) => handleOverlayButtonClick(event, fileInput, attachmentKey));
    attachmentDiv.appendChild(overlayButton);
}

async function handleOverlayButtonClick(event: MouseEvent, fileInput: HTMLInputElement, aesKey: AttachmentEncryptKey): Promise<void> {
    event.stopPropagation();
    event.preventDefault();

    const tempInput = document.createElement('input');
    tempInput.type = 'file';
    tempInput.multiple = true;

    tempInput.addEventListener('change', (event) => handleTempInputChange(event, fileInput, aesKey));
    tempInput.click();
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
                console.log("----->>> encryption complete:", encryptedFile.name);
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

    const encrypted = encodeHex(encryptedBody);

    const encryptedBlob = new Blob([encrypted], {type: 'application/octet-stream'});

    const encryptedFile = new File([encryptedBlob], `${originalFile.name}.${AttachmentFileSuffix}`, {
        type: 'application/octet-stream',
    });

    return encryptedFile;
}
