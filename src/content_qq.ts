import {checkFrameBody, observeForElement, parseBmailInboxBtn, parseCryptoMailBtn} from "./content_common";
import {emailRegex} from "./common";
import browser from "webextension-polyfill";

export function appendForQQ(template: HTMLTemplateElement) {
    const clone = parseBmailInboxBtn(template, "bmail_left_menu_btn_netEase");
    if (!clone) {
        console.warn("------>>> failed to parse bmail inbox button");
        return
    }

    observeForElement(
        () => {
            return document.querySelector(".ui-float-scroll-body.sidebar-menus") as HTMLElement;
        }, async () => {
            console.log("------>>>start to populate qq mail area");
            appendBmailInboxMenu(clone);
            monitorComposeBtnAction(template)
            addCryptoBtnToComposeDiv(template);
        });
}

function appendBmailInboxMenu(clone: HTMLElement) {
    const menuParentDiv = document.querySelector(".ui-float-scroll-body.sidebar-menus") as HTMLElement;
    if (!menuParentDiv) {
        console.log("------>>> menu parent div not found");
        return;
    }
    if (menuParentDiv.children.length >= 2) {
        menuParentDiv.insertBefore(clone, menuParentDiv.children[1]);
    } else {
        menuParentDiv.appendChild(clone);
    }
}

export function queryEmailAddrQQ() {
    const parentDiv = document.querySelector(".profile-user-info");
    const userEmailSpan = parentDiv?.querySelector('span.user-email');
    if (!userEmailSpan) {
        console.log("-------->>> failed to parse bmail inbox button");
        return null;
    }

    const mailAddress = userEmailSpan.textContent as string;
    const match = mailAddress.match(emailRegex);
    if (!match) {
        console.log("------>>> failed to parse bmail address");
        return null;
    }
    console.log("------>>> qq mail address success:", match[0]);
    return match[0];
}

function monitorComposeBtnAction(template: HTMLTemplateElement) {

    const composeBtnDiv = document.querySelector(".sidebar-header");
    if (!composeBtnDiv) {
        console.warn("------>>> compose button not found");
        return;
    }
    composeBtnDiv.addEventListener("click", () => {
        observeForElement(
            () => {
                return document.querySelector(".compose_body");
            }, async () => {
                addCryptoBtnToComposeDiv(template);
            });
    })
}

function addCryptoBtnToComposeDiv(template: HTMLTemplateElement) {
    const composeBodyDiv = document.querySelector(".compose_body");
    if (!composeBodyDiv) {
        console.log("------>>> no compose body found");
        return;
    }
    const iframe = composeBodyDiv.querySelector(".editor_iframe") as HTMLIFrameElement;
    if (!iframe) {
        console.log('----->>> encrypt failed to find iframe:=>');
        return null;
    }

    const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDocument) {
        console.log("----->>> no frame body found:=>");
        return null;
    }

    const mailContentDiv = iframeDocument.querySelector(".rooster-content-body") as HTMLElement;
    const cryptoBtn = composeBodyDiv.querySelector(".bmail-crypto-btn") as HTMLElement;
    if (cryptoBtn) {
        console.log("------>>> node already exists");
        checkFrameBody(mailContentDiv, cryptoBtn);
        return;
    }
    const toolBar = composeBodyDiv.querySelector(".main_options_container");
    if (!toolBar) {
        console.log("------>>> no tool bar found for mail composing");
        return;
    }

    const sendDiv = toolBar.querySelector(".xmail_sendmail_btn") as HTMLElement;
    const title = browser.i18n.getMessage('crypto_and_send');
    const receiverTable = composeBodyDiv.querySelector('table.compose_mailAddress_table.new') as HTMLElement;

    const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_16.png', ".bmail-crypto-btn",
        title, 'bmail_crypto_btn_in_compose_netEase', async btn => {
            await encryptMailAndSendQQ(mailContentDiv, btn, receiverTable, sendDiv);
        }
    ) as HTMLElement;

    if (toolBar.children.length > 1) {
        toolBar.insertBefore(cryptoBtnDiv, toolBar.children[1]);
    } else {
        toolBar.appendChild(cryptoBtnDiv);
    }
}

async function encryptMailAndSendQQ(mailBody: HTMLElement, btn: HTMLElement, receiverTable: HTMLElement, sendDiv: HTMLElement) {

}