import * as QRCode from 'qrcode';
import browser from "webextension-polyfill";
import {BMReq, BMRsp} from "./proto/bmail_srv";
import {MailFlag} from "./bmail_body";

export enum MsgType {
    PluginClicked = 'PluginClicked',
    WalletCreate = 'WalletCreate',
    WalletOpen = 'WalletOpen',
    WalletClose = 'WalletClose',
    EncryptData = 'EncryptData',
    DecryptData = 'DecryptData',
    BMailInbox = 'BMailInbox',
    AddInboxBtn = 'AddInboxBtn',
    QueryCurEmail = 'QueryCurEmail',
    EmailAddrToBmailAddr = 'EmailAddrToBmailAddr',
    CheckIfLogin = 'CheckIfLogin',
    SignData = 'SignData',
    QueryAccountDetails = 'QueryAccountDetails',
    EmailBindOp = 'EmailBindOp',
    IfBindThisEmail = 'IfBindThisEmail',
    OpenPlugin = 'OpenPlugin',
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
    QQ = 'mail.qq.com',
    OutLook = 'outlook.live.com'
}

export const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

export function showView(hash: string, callback?: (hash: string) => void): void {
    const views = document.querySelectorAll<HTMLElement>('.page_view');
    views.forEach(view => view.style.display = 'none');

    const id = hash.replace('#onboarding/', 'view-');
    const targetView = document.getElementById(id);
    if (targetView) {
        targetView.style.display = 'block';
    }
    if (callback) {
        callback(hash);
    }
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

// const httpServerUrl = "https://sharp-happy-grouse.ngrok-free.app"
// const httpServerUrl = "http://bmail.simplenets.org:8001"
const httpServerUrl = "https://bmail.simplenets.org:8443"


export async function httpApi(path: string, param: any) {
    const response = await fetch(httpServerUrl + path, {
        method: 'POST', // 设置方法为POST
        headers: {
            'Content-Type': 'application/x-protobuf'
        },
        body: param,
    });
    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    const decodedResponse = BMRsp.decode(uint8Array) as BMRsp;
    if (decodedResponse.success) {
        console.log("------>>>httpApi success")
        return decodedResponse.payload;
    } else {
        throw new Error(decodedResponse.msg);
    }
}

export async function sendMessageToBackground(data: any, actTyp: string): Promise<any> {
    try {
        return await browser.runtime.sendMessage({
            action: actTyp,
            data: data,
        });
    } catch (e) {
        const error = e as Error;
        console.warn("------>>>send message error", error);
        return {success: -1, data: error.message}
    }
}

export async function signDataByMessage(data: any, password?: string): Promise<string | null> {
    const reqData = {
        dataToSign: data,
        password: password,
    }

    const rsp = await sendMessageToBackground(reqData, MsgType.SignData);
    if (rsp.success < 0) {
        return null;
    }

    return rsp.data;
}

export async function BMRequestToSrv(url: string, address: string, message: Uint8Array, signature: string): Promise<any> {

    const postData = BMReq.create({
        address: address,
        signature: signature,
        payload: message,
    });

    const rawData = BMReq.encode(postData).finish();
    return await httpApi(url, rawData);
}

export function isValidEmail(email: string): boolean {
    // 正则表达式用于验证邮件地址
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function extractEmail(input: string): string | null {
    // 正则表达式用于匹配电子邮件地址
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = input.match(emailRegex);
    // 如果找到匹配项，返回匹配的电子邮件地址，否则返回 null
    return match ? match[0] : null;
}

export function extractJsonString(input: string): { json: string, offset: number, endOffset: number } | null {
    const jsonRegex = /{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*}/g;
    let match;

    while ((match = jsonRegex.exec(input)) !== null) {
        const jsonString = match[0];

        if (jsonString.includes(MailFlag)) {
            const offset = match.index;
            const endOffset = offset + jsonString.length;
            return {json: jsonString, offset, endOffset};
        }
    }
    return null;
}


export function replaceTextInRange(input: string, offset: number, end: number, newText: string): string {
    if (offset < 0 || end < offset || end > input.length) {
        throw new Error("Offset or end is out of bounds");
    }

    const beforeOffset = input.substring(0, offset);
    const afterEnd = input.substring(end);

    return beforeOffset + newText + afterEnd;
}

export function showLoading(): void {
    document.body.classList.add('loading');
    document.getElementById("dialog-waiting-overlay")!.style.display = 'flex';
}

export function hideLoading(): void {
    document.body.classList.remove('loading');
    document.getElementById("dialog-waiting-overlay")!.style.display = 'none';
}

export function BMailDivQuery(mailArea: HTMLElement): HTMLElement[] {
    const closestJsonElements: HTMLElement[] = [];
    const allElements = Array.from(mailArea.querySelectorAll('div, blockquote')) as HTMLElement[];
    allElements.push(mailArea);
    allElements.forEach((element) => {
        const textContent = element.textContent?.trim();
        if (!textContent) {
            return;
        }
        if (!textContent.includes(MailFlag)) {
            return;
        }
        const hasJsonChild = Array.from(element.children).some((childElement) => {
            const childText = childElement.textContent?.trim();
            return childText && childText.includes(MailFlag);
        });
        if (!hasJsonChild) {
            closestJsonElements.push(element);
        }
    });

    console.log("------------------>>matchingElements size:=>", closestJsonElements.length);
    return closestJsonElements;
}

export function wrapJsonStrings(input: string): string {
    const jsonRegex = /{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*}/g;
    let result = input;
    let match;

    // 创建一个索引偏移量，用于调整多次替换后的位置
    let offsetAdjustment = 0;

    while ((match = jsonRegex.exec(input)) !== null) {
        const jsonString = match[0];

        // 创建新的 div 包裹的 JSON 字符串
        const wrappedJsonString = `<div class="json-wrapper">${jsonString}</div>`;

        // 计算新的位置
        const start = match.index + offsetAdjustment;
        const end = start + jsonString.length;

        // 替换原有的 JSON 字符串为包裹后的字符串
        result = result.slice(0, start) + wrappedJsonString + result.slice(end);

        // 调整偏移量，考虑新字符串的长度变化
        offsetAdjustment += wrappedJsonString.length - jsonString.length;
    }

    return result;
}