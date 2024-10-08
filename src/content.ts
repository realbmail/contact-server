import browser from "webextension-polyfill";
import {
    ECDecryptFailed,
    ECEncryptedFailed, ECInternalError,
    ECWalletClosed,
    Inject_Msg_Flag,
    MsgType
} from "./consts";
import {
    parseContentHtml,
    parseEmailToBmail, readCurrentMailAddress,
    setupEmailAddressByInjection
} from "./content_common";
import {sendMessageToBackground} from "./common";

import {BmailError, EventData, wrapResponse} from "./inject_msg";


export function addBmailObject(jsFilePath: string): void {
    const script: HTMLScriptElement = document.createElement('script');
    script.src = browser.runtime.getURL(jsFilePath);
    script.onload = function () {
        script.remove();
    };
    (document.head || document.documentElement).appendChild(script);
}

export function addCustomStyles(cssFilePath: string): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = browser.runtime.getURL(cssFilePath);
    document.head.appendChild(link);
}

function translateInjectedElm() {
    const bmailElement = document.getElementById("bmail-send-action-btn");
    if (bmailElement) {
        bmailElement.textContent = browser.i18n.getMessage('inject_mail_inbox');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    addBmailObject('js/inject.js');
    addCustomStyles('file/common.css');
    addCustomStyles('file/inject.css');

    const template = await parseContentHtml('html/inject.html');
    appendTipDialog(template);
    translateInjectedElm();

    console.log("------>>> shared content init success");
});


export function appendTipDialog(template: HTMLTemplateElement) {
    const dialog = template.content.getElementById("bmail_dialog_container");
    if (!dialog) {
        console.log("------>>>failed to find tip dialog");
        return;
    }

    const clone = dialog.cloneNode(true) as HTMLElement;
    const okBtn = clone.querySelector(".bmail_dialog_button") as HTMLElement;
    okBtn.textContent = browser.i18n.getMessage('OK');
    okBtn.addEventListener('click', async () => {
        clone.style.display = "none";
    });
    document.body.appendChild(clone);

    const waitingDiv = template.content.getElementById("dialog-waiting-overlay") as HTMLDivElement;
    const waitClone = waitingDiv.cloneNode(true) as HTMLElement;
    document.body.appendChild(waitClone);
}

const loginFirstTip = wrapResponse('', '', {
    success: ECWalletClosed,
    data: "open your wallet first please!"
}, false);

window.addEventListener("message", async (event) => {
    if (event.source !== window || !event.data) return;

    const eventData = event.data as EventData;
    if (!eventData) return;
    if (eventData.flag !== Inject_Msg_Flag || !eventData.toPlugin) return;

    console.log("------>>>on message from injected js:", eventData.type);

    let rspEvent: EventData;
    switch (eventData.type) {
        case MsgType.QueryCurBMail:
            const response = await sendMessageToBackground(eventData.params, eventData.type);
            rspEvent = wrapResponse(eventData.id, eventData.type, response, false);
            window.postMessage(rspEvent, "*");
            break;

        case MsgType.SetEmailByInjection:
            rspEvent = setupEmailAddressByInjection(eventData)
            window.postMessage(rspEvent, "*");
            break;

        case MsgType.EncryptData:
            rspEvent = await encryptData(eventData)
            window.postMessage(rspEvent, "*");
            break;

        case MsgType.DecryptData:
            rspEvent = await decryptData(eventData);
            window.postMessage(rspEvent, "*");
            break;

        default:
            console.log("------>>> unknown event type:", eventData);
            return;
    }
});

async function enOrDecryptForInject(eventData: EventData, request: any, errorType: number): Promise<EventData> {
    let rspEvent: EventData
    const mailRsp = await browser.runtime.sendMessage(request)
    if (mailRsp.success <= 0) {
        if (mailRsp.success === 0) {
            return loginFirstTip;
        } else {
            rspEvent = wrapResponse(eventData.id, eventData.type, {
                success: errorType,
                data: mailRsp.message
            }, false);
        }
    } else {
        rspEvent = wrapResponse(eventData.id, eventData.type, {success: 1, data: mailRsp.data}, false);
    }
    return rspEvent;
}

async function encryptData(eventData: EventData) {
    try {
        const statusRsp = await sendMessageToBackground('', MsgType.CheckIfLogin)
        if (statusRsp.success < 0) {
            loginFirstTip.id = eventData.id;
            return loginFirstTip;
        }

        const data = eventData.params;
        const receiver = await parseEmailToBmail(data.emails);
        const request = {
            action: MsgType.EncryptData,
            receivers: receiver,
            data: data.data
        }

        return await enOrDecryptForInject(eventData, request, ECEncryptedFailed)

    } catch (err) {
        return parseAsBmailError(eventData.id, err)
    }
}

function parseAsBmailError(id: string, err: any): EventData {
    if (err instanceof BmailError) {
        return wrapResponse(id, 'error', {
            success: err.code,
            data: err.message
        }, false);
    } else {
        return wrapResponse(id, 'error', {
            success: ECInternalError,
            data: err
        }, false);
    }
}

async function decryptData(eventData: EventData) {
    try {
        const statusRsp = await sendMessageToBackground('', MsgType.CheckIfLogin)
        if (statusRsp.success < 0) {
            loginFirstTip.id = eventData.id;
            return loginFirstTip;
        }

        const data = eventData.params;
        const request = {
            action: MsgType.DecryptData,
            data: data.data
        }
        return await enOrDecryptForInject(eventData, request, ECDecryptFailed)
    } catch (e) {
        return parseAsBmailError(eventData.id, e);
    }
}

browser.runtime.onMessage.addListener((request, _sender, sendResponse: (response: any) => void) => {
    console.log("------>>>on message from background:", request.action);
    if (request.action === MsgType.QueryCurEmail) {
        const emailAddr = readCurrentMailAddress();
        sendResponse({value: emailAddr ?? ""});
    }
    return true;
});