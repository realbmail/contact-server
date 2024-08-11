import * as QRCode from 'qrcode';

export enum MsgType {
    PluginClicked = 'PluginClicked',
    WalletOpen = 'WalletOpen',
    WalletClose = 'WalletClose',
    EncryptData = 'EncryptData',
    DecryptData = 'DecryptData',
    BMailInbox = 'BMailInbox',
    AddInboxBtn = 'AddInboxBtn',
    QueryCurEmail = 'QueryCurEmail',
    EmailAddrToBmailAddr = 'EmailAddrToBmailAddr',
    CheckIfLogin = 'CheckIfLogin',
}

export enum WalletStatus {
    Init = 'Init',
    NoWallet = 'NoWallet',
    Locked = 'Locked',
    Unlocked = 'Unlocked',
    Expired = 'Expired',
    Error = 'error',
    InvalidTarget = 'InvalidTarget'
}

export enum HostArr {
    Google = 'mail.google.com',
    Mail163 = 'mail.163.com',
    Mail126 = 'mail.126.com',
    QQ = 'mail.qq.com'
}

export const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

export function showView(hash: string, callback: (hash: string) => void): void {
    const views = document.querySelectorAll<HTMLElement>('.page_view');
    views.forEach(view => view.style.display = 'none');

    const id = hash.replace('#onboarding/', 'view-');
    const targetView = document.getElementById(id);
    if (targetView) {
        targetView.style.display = 'block';
    }
    callback(hash);
}

const checkInterval = 500; // 检查间隔时间（毫秒）
const maxAttempts = 20; // 最大尝试次数

export function waitForElement(callback: () => boolean) {
    let attempts = 0;
    const intervalId = setInterval(() => {
        if (callback()) {
            console.log("------>>> timer found!")
            clearInterval(intervalId);
        } else {
            attempts++;
            if (attempts >= maxAttempts) {
                console.log("------>>> time out after maximum attempts.");
                clearInterval(intervalId);
            }
        }
    }, checkInterval);
}

export function encodeHex(array: Uint8Array): string {
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function decodeHex(hexString: string): Uint8Array {
    if (hexString.length % 2 !== 0) {
        throw new Error("Hex string must have an even length");
    }
    return new Uint8Array(Buffer.from(hexString, 'hex'));
}

export async function createQRCodeImg(data: string) {
    try {
        const url = await QRCode.toDataURL(data, {errorCorrectionLevel: 'H'});
        console.log('Generated QR Code:', url);
        return url;
    } catch (error) {
        console.error('Error generating QR Code:', error);
        return null
    }
}

const httpServerUrl = "https://sharp-happy-grouse.ngrok-free.app"

export async function httpApi(path: string, param: any) {
    try {
        const response = await fetch(httpServerUrl + path, {
            method: 'POST', // 设置方法为POST
            headers: {
                'Content-Type': 'application/json' // 指定内容类型为JSON
            },
            body: JSON.stringify(param) // 将数据转换为JSON字符串
        });
        return await response.json();
    } catch (error) {
        const e = error as Error;
        console.log("------->>>fetch failed:=>", e.message);
        throw e;
    }
}