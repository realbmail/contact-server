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
    const bmailInboxBtn = template.content.getElementById('bmail_left_menu_btn_google');
    if (!bmailInboxBtn) {
        console.log("failed to find bmailElement");
        return;
    }

    const img = bmailInboxBtn.querySelector('img');
    if (img) {
        img.src = browser.runtime.getURL('file/logo_16.png');
    }
    const clone = bmailInboxBtn.cloneNode(true) as HTMLElement;
    (clone.querySelector(".bmail-send-action") as HTMLElement).addEventListener('click', bmailInfo);
    const observerConfig = {
        childList: true, // 监听子节点的变化
        subtree: true    // 监听整个子树
    };

    const callback: MutationCallback = (mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                // 尝试查找目标元素
                const googleMenu = document.querySelector('.TK') as HTMLElement;
                if (googleMenu) {
                    console.log('---------->>>Element found:', googleMenu, clone);
                    const targetObserver = new MutationObserver((targetMutations, targetObs) => {
                        targetObs.disconnect();
                        googleMenu.insertBefore(clone, googleMenu.children[1]);
                    });
                    targetObserver.observe(googleMenu, {childList: true, subtree: true});
                    observer.disconnect();
                    break;
                }
            }
        }
    };
    const observer = new MutationObserver(callback);
    observer.observe(document.body, observerConfig);
}

function appendForQQ(template: HTMLTemplateElement) {
    // Implement append logic for QQ Mail
}

function appendBtnTo126menu(clone: HTMLElement) {
    const ulElements = document.querySelectorAll('ul[aria-label="左侧导航"]');

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

    const bmailInboxBtn = template.content.getElementById('bmail_left_menu_btn_126');
    if (!bmailInboxBtn) {
        console.log("failed to find bmailElement");
        return;
    }

    const img = bmailInboxBtn.querySelector('img');
    if (img) {
        img.src = browser.runtime.getURL('file/logo_16.png');
    }
    const clone = bmailInboxBtn.cloneNode(true) as HTMLElement;
    (clone.querySelector(".bmail-send-action") as HTMLElement).addEventListener('click', bmailInfo);
    appendBtnTo126menu(clone);
    const tabMenus = document.querySelectorAll('li[title="首页"]');
    if (tabMenus.length > 0) {
        tabMenus[0].addEventListener('click', () => {
            const dynamicBtn = document.getElementById('bmail_left_menu_btn_126');
            if (!dynamicBtn) {
                appendBtnTo126menu(clone)
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

function readCurrentMailAddress() {
    const hostname = window.location.hostname;
    if (hostname === HostArr.Mail126) {
        const mailAddr = document.getElementById('spnUid');
        if (!mailAddr) {
            console.log('mail address missing for domain:', hostname);
            return null;
        }
        console.log("------>>>mail address:", mailAddr.textContent);
        return mailAddr.textContent;
    }
    if (hostname === HostArr.Google) {
        const account = document.querySelector(".account-message .hiver-loginUser-id");
        if (!account) {
            return null;
        }
        return account.textContent;
    }
    return null;
}

browser.runtime.onMessage.addListener((request, sender, sendResponse: (response: any) => void) => {
    console.log("----------------------browser.runtime.onMessage.addListener active");
    if (request.action === MsgType.QueryCurEmail) {
        const emailAddr = readCurrentMailAddress();
        sendResponse({value: emailAddr});
    }
    return true; // Keep the message channel open for sendResponse
});

function bmailInfo() {
    console.log("------>>> bmail inbox")
    browser.runtime.sendMessage({action: MsgType.EncryptMail}).catch(console.error);
}