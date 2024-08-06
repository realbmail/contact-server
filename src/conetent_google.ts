import {parseBmailInboxBtn} from "./content_common";
import browser from "webextension-polyfill";
import {emailRegex} from "./common";

export function appendForGoogle(template: HTMLTemplateElement) {
    const clone = parseBmailInboxBtn(template, 'bmail_left_menu_btn_google');
    if (!clone) {
        console.warn("------>>> failed to parse bmail inbox button");
        return
    }

    observeForElement(
        () => {
            return document.querySelector('.TK') as HTMLElement;
        }, () => {
            console.log("------>>>start to populate google area");
            addBMailInboxToMenu(clone);
            addCryptoBtnToComposeDiv(template);
            addActionForComposeBtn(template);
        });
}

function addBMailInboxToMenu(clone: HTMLElement) {
    const googleMenu = document.querySelector('.TK') as HTMLElement;
    googleMenu.insertBefore(clone, googleMenu.children[1]);
    console.log("------>>> add bmail inbox button success=>")
}

export function queryEmailAddrGoogle() {
    const pageTitle = document.title;
    const match = pageTitle.match(emailRegex);
    if (match) {
        const email = match[1];
        console.log('----->>> google email found:', email);
        return email;
    }
    console.log('------>>>No email address found in the page title.');
    return null
}

function observeForElement(foundFunc: () => HTMLElement | null, callback: () => void) {
    const idleThreshold = 500; // 无变化的时间阈值（毫秒）
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const cb: MutationCallback = (mutationsList, observer) => {
        if (idleTimer) {
            clearTimeout(idleTimer);
        }
        const element = foundFunc();
        if (element) {
            idleTimer = setTimeout(() => {
                callback();
                console.log('---------->>> document body load finished');
                observer.disconnect();
            }, idleThreshold);
        }
    };

    const observer = new MutationObserver(cb);
    observer.observe(document.body, {childList: true, subtree: true});
}

function addCryptoBtnToComposeDiv(template: HTMLTemplateElement) {
    const allComposeDiv = document.querySelectorAll(".T-I.J-J5-Ji.aoO.v7.T-I-atl.L3");
    console.log("------>>> all compose div when loaded=>", allComposeDiv);
    allComposeDiv.forEach(sendBtn => {
        const parentNode = sendBtn.parentNode as HTMLElement;
        if (!parentNode) {
            console.log("-------->>>failed to find send button:=>");
            return
        }
        const clone = parseCryptoMailBtn(template,parentNode);
        if (!clone){
            return;
        }
        parentNode.insertAdjacentElement('afterend', clone);
    });
}

function parseCryptoMailBtn(template: HTMLTemplateElement,sendBtn: HTMLElement) {
    const cryptoBtnDiv = template.content.getElementById('bmail_crypto_btn_in_compose_google');
    if (!cryptoBtnDiv) {
        console.log("------>>>failed to find bmailElement");
        return null;
    }
    const img = cryptoBtnDiv.querySelector('img');
    if (img) {
        img.src = browser.runtime.getURL('file/logo_16.png');
    }
    const clone = cryptoBtnDiv.cloneNode(true) as HTMLElement;
    (clone.querySelector(".bmail-crypto-btn") as HTMLElement).addEventListener('click', ()=>{
        encryptMailContent(sendBtn);
    });
    return clone;
}

function encryptMailContent(sendBtn: HTMLElement) {
    console.log("------>>> crypto mail content")
}

function addActionForComposeBtn(template: HTMLTemplateElement) {
    const composBtn = document.querySelector(".T-I.T-I-KE.L3");
    if (!composBtn) {
        console.warn("------>>> compose button not found");
        return;
    }
    composBtn.addEventListener('click', () => {
        observeForElement(
            () => {
                const allComposeDiv = document.querySelectorAll(".T-I.J-J5-Ji.aoO.v7.T-I-atl.L3");
                if (allComposeDiv.length > 0) {
                    return allComposeDiv[allComposeDiv.length - 1] as HTMLElement;
                }
                return null;
            }, () => {
                addCryptoBtnToComposeDiv(template);
            });
    })
}