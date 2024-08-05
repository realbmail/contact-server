import browser from "webextension-polyfill";
import {HostArr, MsgType} from "./common";

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

function appendForGoogle(template: HTMLTemplateElement) {
    // Implement append logic for Google Mail
}

function appendForQQ(template: HTMLTemplateElement) {
    // Implement append logic for QQ Mail
}
function appentBtnTo126menu(clone:HTMLElement){
    const ulElements = document.querySelectorAll('ul[aria-label="左侧导航"]');

// 过滤出 display 不是 none 的元素
    const targetElement = Array.from(ulElements).find((element) => {
        return window.getComputedStyle(element).display !== 'none';
    });
    if (!targetElement) {
        console.log("failed to find target element");
        return;
    }

    if (targetElement.children.length >= 2) {
        targetElement.insertBefore(clone, targetElement.children[1]);
    } else {
        targetElement.appendChild(clone);
    }
}
function appendFor126(template: HTMLTemplateElement) {

    const bmailInboxBtn = template.content.getElementById('bmail_left_menu_btn');
    if (!bmailInboxBtn) {
        console.log("failed to find bmailElement");
        return;
    }

    // Update image src to use browser.runtime.getURL
    const img = bmailInboxBtn.querySelector('img');
    if (img) {
        img.src = browser.runtime.getURL('file/logo_16.png');
    }
    const clone = bmailInboxBtn.cloneNode(true) as HTMLElement;
    appentBtnTo126menu(clone);
    const tabMenus = document.querySelectorAll('li[title="首页"]');
    console.log("======>>>tab menus:", tabMenus);
    if (tabMenus.length > 0) {
        tabMenus[0].addEventListener('click', () => {
            const dynamicBtn = document.getElementById('bmail_left_menu_btn');
            if(!dynamicBtn){
                appentBtnTo126menu(clone)
            }
        });
    }
}

function appendFor163(template: HTMLTemplateElement) {
    // Implement append logic for 163 Mail
}

const targetSelectorMap = {
    [HostArr.Google]: appendForGoogle,
    [HostArr.Mail163]: appendFor163,
    [HostArr.Mail126]: appendFor126,
    [HostArr.QQ]: appendForQQ
};

function translateInjectedElm() {
    const bmailElement = document.getElementById("bmail-send-action-btn");
    if (bmailElement) {
        bmailElement.textContent = browser.i18n.getMessage('inject_mail_inbox');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    addBmailObject('js/inject.js');
    addCustomStyles('file/inject.css');
    addCustomElements('html/inject.html', targetSelectorMap).then(() => {
        console.log("++++++>>>content js run success");
        translateInjectedElm();
    });
});


window.addEventListener('message', (event) => {
    if (event.source !== window) {
        return;
    }

    if (event.data && event.data.action === MsgType.EncryptMail) {
        browser.runtime.sendMessage({action: MsgType.EncryptMail}).catch(console.error);
    }
});

