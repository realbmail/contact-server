import browser from "webextension-polyfill";
import {HostArr} from "./common";
import {appendForNetEase} from "./content_netease";
import {appendForGoogle} from "./content_google";
import {appendForQQ} from "./content_qq";
import {appendForOutLook} from "./content_outlook";

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
