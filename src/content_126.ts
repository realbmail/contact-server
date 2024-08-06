import browser from "webextension-polyfill";
import {parseBmailInboxBtn} from "./content_common";

export function appendFor126(template: HTMLTemplateElement) {

    const clone = parseBmailInboxBtn(template, "bmail_left_menu_btn_126");
    if (!clone) {
        console.warn("------>>> failed to parse bmail inbox button");
        return
    }
    appendBtnToMenu(clone);
    addActionForHomePage(clone);
    addActionForComposeBtn(template);
}

function addActionForHomePage(clone: HTMLElement): void {
    const tabMenus = document.querySelectorAll('li[title="首页"]');
    if (tabMenus.length > 0) {
        tabMenus[0].addEventListener('click', () => {
            const dynamicBtn = document.getElementById('bmail_left_menu_btn_126');
            if (!dynamicBtn) {
                appendBtnToMenu(clone)
            }
        });
    }
}

function addActionForComposeBtn(template: HTMLTemplateElement) {
    const composeBtn = document.getElementById('_mail_component_94_94');
    if (!composeBtn) {
        console.log("------>>> compose button not found");
        return;
    }

    const composDivClass = 'div[aria-label="写信"]';
    composeBtn.addEventListener('click', () => {
        const composeDiv = document.querySelector(composDivClass) as HTMLElement | null;
        if (composeDiv) {
            addBmailBtnForComposition(composeDiv, template);
            return;
        }
        console.warn("------>>> can't find a compose div");
    });
    const composeDiv = document.querySelector(composDivClass) as HTMLElement | null;
    if (!composeDiv) {
        return;
    }
    addBmailBtnForComposition(composeDiv, template);
}

function appendBtnToMenu(clone: HTMLElement) {
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

export function queryEmailAddr126() {
    const mailAddr = document.getElementById('spnUid');
    if (!mailAddr) {
        return null;
    }
    console.log("------>>>mail address:", mailAddr.textContent);
    return mailAddr.textContent;
}

function addBmailBtnForComposition(composeDiv: HTMLElement, template: HTMLTemplateElement) {
    const cryptoBtnDiv = document.getElementById('bmail_crypto_btn_in_compose_126');
    if (cryptoBtnDiv) {
        console.log("------>>> crypto btn has been added");
        return;
    }
    const headerBtnList = composeDiv.querySelector(".js-component-toolbar.nui-toolbar");
    if (!headerBtnList) {
        console.log("------>>> header list not found for mail composition");
        return;
    }
    const cryptoBtn = parseCryptoMailBtn(template)
    if (!cryptoBtn) {
        return;
    }
    if (headerBtnList.children.length > 1) {
        headerBtnList.insertBefore(cryptoBtn, headerBtnList.children[1]);
    } else {
        headerBtnList.appendChild(cryptoBtn);
    }
}

function parseCryptoMailBtn(template: HTMLTemplateElement) {
    const cryptoBtnDiv = template.content.getElementById('bmail_crypto_btn_in_compose_126');
    if (!cryptoBtnDiv) {
        console.log("------>>>failed to find bmailElement");
        return null;
    }

    const img = cryptoBtnDiv.querySelector('img');
    if (img) {
        img.src = browser.runtime.getURL('file/logo_16.png');
    }
    const clone = cryptoBtnDiv.cloneNode(true) as HTMLElement;
    (clone.querySelector(".bmail-crypto-btn") as HTMLElement).addEventListener('click', encryptMailContent);
    return clone;
}

function encryptMailContent() {
    console.log('----->>> encryptMailContent()');
}