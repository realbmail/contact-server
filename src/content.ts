import browser from "webextension-polyfill";
import {appendForNetEase} from "./content_netease";
import {appendForGoogle} from "./content_google";
import {appendForQQ} from "./content_qq";
import {appendForOutLook} from "./content_outlook";
import {HostArr, Inject_Msg_Flag, MsgType} from "./consts";
import {readCurrentMailAddress} from "./content_common";
import {sendMessageToBackground} from "./common";

import {BmailError, EventData, InjectResult} from "./inject_msg";

function addBmailObject(jsFilePath: string): void {
    const script: HTMLScriptElement = document.createElement('script');
    script.src = browser.runtime.getURL(jsFilePath);
    script.onload = function () {
        script.remove();
    };
    (document.head || document.documentElement).appendChild(script);
}

function addCustomStyles(cssFilePath: string): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = browser.runtime.getURL(cssFilePath);
    document.head.appendChild(link);
}

async function addCustomElements(htmlFilePath: string, targetSelectorMap: {
    [key: string]: (target: HTMLTemplateElement) => void
}): Promise<void> {
    try {
        const response = await fetch(browser.runtime.getURL(htmlFilePath));
        if (!response.ok) {
            throw new Error(`Failed to fetch ${htmlFilePath}: ${response.statusText}`);
        }
        const htmlContent = await response.text();
        const template = document.createElement('template');
        template.innerHTML = htmlContent;

        const hostname = window.location.hostname;
        for (const [key, appendFun] of Object.entries(targetSelectorMap)) {
            if (hostname.includes(key)) {
                appendFun(template);
                break;
            }
        }
        appendTipDialog(template);
    } catch (error) {
        console.error('Error loading custom elements:', error);
    }
}

const targetSelectorMap = {
    [HostArr.Google]: appendForGoogle,
    [HostArr.Mail163]: appendForNetEase,
    [HostArr.Mail126]: appendForNetEase,
    [HostArr.QQ]: appendForQQ,
    [HostArr.OutLook]: appendForOutLook
};

function translateInjectedElm() {
    const bmailElement = document.getElementById("bmail-send-action-btn");
    if (bmailElement) {
        bmailElement.textContent = browser.i18n.getMessage('inject_mail_inbox');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    addBmailObject('js/inject.js');
    addCustomStyles('file/common.css');
    addCustomStyles('file/inject.css');
    addCustomElements('html/inject.html', targetSelectorMap).then(() => {
        console.log("++++++>>>content js run success");
        translateInjectedElm();
    });
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


window.addEventListener("message", async (event) => {
    if (event.source !== window || !event.data) return;

    const eventData = event.data as EventData;
    if (!eventData) return;
    if (eventData.flag !== Inject_Msg_Flag || !eventData.toPlugin) return;

    console.log("------>>>on message from injected js:", eventData.type);

    switch (eventData.type) {
        case MsgType.QueryCurBMail:
            const response = await sendMessageToBackground(eventData.params, eventData.type);
            const rspEvent = wrapResponse(eventData.id, eventData.type, response);
            window.postMessage(rspEvent, "*");
            break;
        default:
            console.log("------>>> unknown event type:", eventData);
            return;
    }
});

function wrapResponse(id: string, type: string, response: any): EventData {
    let result: InjectResult;
    if (response.success <= 0) {
        const error = new BmailError(response.success, response.data).toJSON();
        result = new InjectResult(false, null, error);
    } else {
        result = new InjectResult(true, response.data);
    }
    return new EventData(id, Inject_Msg_Flag, type, result);
}


browser.runtime.onMessage.addListener((request, sender, sendResponse: (response: any) => void) => {
    console.log("------>>>on message from background:", request.action);
    if (request.action === MsgType.QueryCurEmail) {
        const emailAddr = readCurrentMailAddress();
        sendResponse({value: emailAddr});
    }
    return true;
});
