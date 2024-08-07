import browser from "webextension-polyfill";
import {encryptMailByWallet, parseBmailInboxBtn, parseCryptoMailBtn} from "./content_common";

export function appendForNetEase(template: HTMLTemplateElement) {

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

export function queryEmailAddrNetEase() {
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
    const cryptoBtn = parseCryptoMailBtn(template, 'bmail_crypto_btn_in_compose_126', encryptMailContent);
    if (!cryptoBtn) {
        return;
    }
    if (headerBtnList.children.length > 1) {
        headerBtnList.insertBefore(cryptoBtn, headerBtnList.children[1]);
    } else {
        headerBtnList.appendChild(cryptoBtn);
    }
}

async function encryptMailContent(btn: HTMLElement) {
    const iframe = document.querySelector(".APP-editor-iframe") as HTMLIFrameElement;
    if (!iframe) {
        console.log('----->>> encrypt failed to find iframe:=>');
        return;
    }
    const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDocument) {
        console.log("----->>> no frame body found:=>");
        return;
    }

    const iframeBody = iframeDocument.body;
    const hasEncrypted = iframeBody.dataset.mailHasEncrypted === 'true';
    if (hasEncrypted && iframeBody.dataset.originalHtml) {
        iframeBody.innerHTML = iframeBody.dataset.originalHtml;
        iframeBody.dataset.mailHasEncrypted = 'false';
        btn.innerText = browser.i18n.getMessage('crypto_and_send');
        return;
    }

    let bodyTextContent = iframeBody.innerText;
    bodyTextContent = bodyTextContent.trim();
    if (!bodyTextContent || bodyTextContent.length <= 0) {
        console.log("----->>> no body text content");
        return;
    }

    let receiver: string[] = [];
    receiver.push('BM7PkXCywW3pooVJNcZRnKcnZk8bkKku2rMyr9zp8jKo9M');
    receiver.push('BMCjb9vVp9DpBSZNUs5c7hvhL1BPUZdesCVh38YPDbVMaq');
    const encryptedData = await encryptMailByWallet(receiver, bodyTextContent);
    if (!encryptedData) {
        return;
    }
    iframeBody.dataset.originalHtml = iframeBody.innerHTML;
    iframeBody.innerText = encryptedData;
    iframeBody.dataset.mailHasEncrypted = 'true';
    btn.innerText = browser.i18n.getMessage('decrypt_mail_body');
}