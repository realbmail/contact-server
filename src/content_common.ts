import browser from "webextension-polyfill";
import {HostArr, MsgType, WalletStatus} from "./common";
import {queryEmailAddrNetEase} from "./content_netease";
import {queryEmailAddrGoogle} from "./conetent_google";


window.addEventListener('message', (event) => {
    if (event.source !== window) {
        return;
    }

    if (event.data && event.data.action === MsgType.EncryptData) {
        browser.runtime.sendMessage({action: MsgType.EncryptData}).catch((error: any) => {
            console.warn('------>>>error sending message:', error);
        });
    }
});

browser.runtime.onMessage.addListener((request, sender, sendResponse: (response: any) => void) => {
    console.log("------>>>on message:", request.action);
    if (request.action === MsgType.QueryCurEmail) {
        const emailAddr = readCurrentMailAddress();
        sendResponse({value: emailAddr});
    }
    return true; // Keep the message channel open for sendResponse
});

function bmailInboxAction() {
    console.log("------>>> bmail inbox")
    browser.runtime.sendMessage({action: MsgType.BMailInbox}).catch((error: any) => {
        console.warn('------>>>error sending message:', error);
    });
}

function readCurrentMailAddress() {
    const hostname = window.location.hostname;
    if (hostname.includes(HostArr.Mail126) || hostname.includes(HostArr.Mail163)) {
        return queryEmailAddrNetEase();
    }
    if (hostname.includes(HostArr.Google)) {
        return queryEmailAddrGoogle();
    }
}

export function parseBmailInboxBtn(template: HTMLTemplateElement, inboxDivStr: string) {
    const bmailInboxBtn = template.content.getElementById(inboxDivStr);
    if (!bmailInboxBtn) {
        console.log("failed to find bmailElement");
        return null;
    }

    const img = bmailInboxBtn.querySelector('img');
    if (img) {
        img.src = browser.runtime.getURL('file/logo_16.png');
    }
    const clone = bmailInboxBtn.cloneNode(true) as HTMLElement;
    (clone.querySelector(".bmail-send-action") as HTMLElement).addEventListener('click', bmailInboxAction);
    return clone;
}

export async function encryptMailByWallet(tos: string[], mailBody: string): Promise<string | null> {
    try {
        const response = await browser.runtime.sendMessage({
            action: MsgType.EncryptData,
            receivers: tos,
            data: mailBody
        })

        if (!response) {
            console.warn('------>>>error: response is undefined or null.');
            return null;
        }
        if (!response.success) {
            console.warn("------>>>error reading response:", response.message);
            return null;
        }
        return response.data;
    } catch (e) {
        console.error(e);
        return null
    }
}