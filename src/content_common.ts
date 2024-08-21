import browser from "webextension-polyfill";
import {HostArr, MsgType} from "./common";
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
        console.log("------>>>failed to find bmailElement");
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

export function parseCryptoMailBtn(template: HTMLTemplateElement, imgSrc:string, btnClass: string,
                                   title:string, elmId: string, action: (btn: HTMLElement) => Promise<void>) {
    const cryptoBtnDiv = template.content.getElementById(elmId);
    if (!cryptoBtnDiv) {
        console.log("------>>>failed to find bmailElement");
        return null;
    }
    const img = cryptoBtnDiv.querySelector('img');
    if (img) {
        img.src = browser.runtime.getURL(imgSrc);
    }
    const clone = cryptoBtnDiv.cloneNode(true) as HTMLElement;
    const cryptoBtn = clone.querySelector(btnClass) as HTMLElement;
    cryptoBtn.textContent = title;
    clone.addEventListener('click', async () => {
        await action(cryptoBtn);
    });
    return clone;
}

export function showTipsDialog(title: string, message: string) {
    const dialog = document.getElementById("bmail_dialog_container");
    if (!dialog) {
        return;
    }
    dialog.querySelector(".bmail_dialog_title")!.textContent = title;
    dialog.querySelector(".bmail_dialog_message")!.textContent = message;
    dialog.style.display = "block";
}
