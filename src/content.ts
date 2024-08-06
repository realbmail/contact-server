import browser from "webextension-polyfill";
import {HostArr} from "./common";
import {appendForNetEase} from "./content_netease";
import {appendForGoogle} from "./conetent_google";
import {appendForQQ} from "./content_qq";

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
    } catch (error) {
        console.error('Error loading custom elements:', error);
    }
}

const targetSelectorMap = {
    [HostArr.Google]: appendForGoogle,
    [HostArr.Mail163]: appendForNetEase,
    [HostArr.Mail126]: appendForNetEase,
    [HostArr.QQ]: appendForQQ
};

function translateInjectedElm() {
    const bmailElement = document.getElementById("bmail-send-action-btn");
    if (bmailElement) {
        bmailElement.textContent = browser.i18n.getMessage('inject_mail_inbox');
    }

    const cryptoBtn = document.querySelector('.bmail-crypto-btn');
    if (cryptoBtn) {
        cryptoBtn.textContent = browser.i18n.getMessage('crypto_and_send');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    addCustomElements('html/inject.html', targetSelectorMap).then(() => {
        console.log("++++++>>>content js run success");
        translateInjectedElm();
    });
    addBmailObject('js/inject.js');
    addCustomStyles('file/inject.css');
});
