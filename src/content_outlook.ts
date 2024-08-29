import {
    encryptMailInComposing,
    observeForElement,
    parseBmailInboxBtn,
    parseCryptoMailBtn,
    processReceivers,
    showTipsDialog
} from "./content_common";
import browser from "webextension-polyfill";
import {hideLoading, MsgType, sendMessageToBackground, showLoading} from "./common";

export function queryEmailAddrOutLook() {
    const element = document.getElementById("O365_AppName") as HTMLLinkElement | null;
    if (!element) return;
    console.log("-------->>> account info:", element.href);
    const url = element.href;
    const loginHintMatch = url.match(/login_hint=([^&]*)/);
    if (!loginHintMatch) {
        return;
    }
    const loginHint = decodeURIComponent(loginHintMatch[1]);
    console.log('----->>> email address found:', loginHint);
    return loginHint;
}

export function appendForOutLook(template: HTMLTemplateElement) {
    observeForElement(document.body, 800,
        () => {
            return document.querySelector(".DPg26 .xKrjQ");
        }, async () => {
            console.log("------->>>start to populate qq mail area");
            appendBmailInboxMenuOutLook(template).then();
        });
}

async function appendBmailInboxMenuOutLook(template: HTMLTemplateElement) {
    const leftMenuDiv = document.querySelector(".DPg26 .xKrjQ") as HTMLElement;
    let clone = parseBmailInboxBtn(template, "bmail_left_menu_btn_outlook") as HTMLElement;
    if (leftMenuDiv.children.length >= 2) {
        leftMenuDiv.insertBefore(clone, leftMenuDiv.children[1]);
    } else {
        leftMenuDiv.appendChild(clone);
    }
}

async function monitorMailAreaOutLook(template: HTMLTemplateElement) {
    const monitorArea = document.getElementById("ReadingPaneContainerId") as HTMLElement;
    if (!monitorArea) {
        console.log("------>>> mail area failed ");
        return;
    }

    observeForElement(monitorArea, 800,
        () => {
            return document.getElementById("docking_InitVisiblePart_1");
        }, async () => {
            console.log("------->>>start to populate qq mail area");
            addCryptButtonToComposeDivOutLook(template).then();
        });
}

async function addCryptButtonToComposeDivOutLook(template: HTMLTemplateElement) {
    const composeArea = document.getElementById("docking_InitVisiblePart_1")?.querySelector(".cBeRi.dMm6A.AiSsJ");
    if (!composeArea) {
        console.log("------>>> no compose area found");
        return;
    }

    const toolBarDiv = composeArea.querySelector(".vBoqL.iLc1q.cc0pa.cF0pa.tblbU.SVWa1.dP5Z2");
    if (!toolBarDiv) {
        console.log("------>>> tool bar not found when compose mail");
        return;
    }

    const cryptoBtn = toolBarDiv.querySelector(".bmail-crypto-btn") as HTMLElement;
    if (cryptoBtn) {
        console.log("------>>> node already exists");
        return;
    }
    const mailContentDiv = document.getElementById("editorParent_2")?.firstChild as HTMLElement;
    const sendDiv = toolBarDiv.querySelector('div[data-testid="ComposeSendButton"]') as HTMLElement;
    const title = browser.i18n.getMessage('crypto_and_send');
    const receiverTable = composeArea.querySelector(".___hhiv960.f22iagw.fly5x3f.f1fow5ox.f1l02sjl") as HTMLElement;
    const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_48.png', ".bmail-crypto-btn",
        title, 'bmail_crypto_btn_in_compose_outlook', async btn => {
            await encryptMailAndSendOutLook(mailContentDiv, btn, receiverTable, sendDiv);
        }
    ) as HTMLElement;
    toolBarDiv.insertBefore(cryptoBtnDiv, toolBarDiv.lastChild as HTMLElement);
}


async function encryptMailAndSendOutLook(mailBody: HTMLElement, btn: HTMLElement, receiverTable: HTMLElement, sendDiv: HTMLElement) {
    showLoading();
    try {
        const allEmailAddrDivs = receiverTable.querySelectorAll(".textContainer-468.individualText-471") as NodeListOf<HTMLElement>;
        const receiver = await processReceivers(allEmailAddrDivs, (div) => {
            return div.textContent;
        });

        const success = await encryptMailInComposing(mailBody, btn, receiver);
        if (!success) {
            return;
        }
        sendDiv.click();
    } catch (e) {
        console.log("------>>> mail crypto err:", e);
        showTipsDialog("error", "encrypt mail content failed");
    } finally {
        hideLoading();
    }
}