import browser from "webextension-polyfill";
import {
    appendTipDialog,
    parseBmailInboxBtn,
    parseCryptoMailBtn,
    sendMessage,
    showTipsDialog
} from "./content_common";
import {MsgType} from "./common";
import {MailFlag} from "./bmail_body";

export function appendForNetEase(template: HTMLTemplateElement) {
    const clone = parseBmailInboxBtn(template, "bmail_left_menu_btn_126");
    if (!clone) {
        console.warn("------>>> failed to parse bmail inbox button");
        return
    }

    appendBtnToMenu(clone);
    addActionForHomePage(clone);
    addActionForComposeBtn(template);
    checkIfComposing(template);
    appendTipDialog(template);
    monitorTabMenu();
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
    composeBtn.addEventListener('click', () => {
        checkIfComposing(template);
    });
}

function checkIfComposing(template: HTMLTemplateElement) {
    const composDivClass = 'div[aria-label="写信"]';
    const composeDiv = document.querySelectorAll(composDivClass) as NodeListOf<HTMLElement>;
    composeDiv.forEach(div => {
        addMailEncryptLogicForComposition(div, template);
    });
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

function mailBodyArea(composeDiv: HTMLElement) {
    const iframe = composeDiv.querySelector(".APP-editor-iframe") as HTMLIFrameElement;
    if (!iframe) {
        console.log('----->>> encrypt failed to find iframe:=>');
        return null;
    }

    const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDocument) {
        console.log("----->>> no frame body found:=>");
        return null;
    }

    let bodyTextContent = iframeDocument.body.innerText.trim();
    if (iframeDocument.body.dataset.mailHasEncrypted !== 'true' && bodyTextContent.includes(MailFlag)) {
        iframeDocument.body.dataset.mailHasEncrypted = 'true';
    }
    return {fElm: iframeDocument.body, mBody: bodyTextContent};
}

function addMailEncryptLogicForComposition(composeDiv: HTMLElement, template: HTMLTemplateElement) {
    const cryptoBtnDiv = composeDiv.querySelector('.bmail-crypto-btn') as HTMLElement;
    if (cryptoBtnDiv) {
        console.log("------>>> crypto btn has been added");
        hasEncryptedMailBody(composeDiv, cryptoBtnDiv);
        return;
    }
    const headerBtnList = composeDiv.querySelector(".js-component-toolbar.nui-toolbar");
    if (!headerBtnList) {
        console.log("------>>> header list not found for mail composition");
        return;
    }
    const cryptoBtn = parseCryptoMailBtn(template, 'bmail_crypto_btn_in_compose_126', async btn => {
        await encryptMailContent(btn, composeDiv);
    });

    if (!cryptoBtn) {
        console.log("------>>> no crypto button found in template!")
        return;
    }

    hasEncryptedMailBody(composeDiv, cryptoBtn.querySelector('.bmail-crypto-btn') as HTMLElement);

    if (headerBtnList.children.length > 1) {
        headerBtnList.insertBefore(cryptoBtn, headerBtnList.children[1]);
    } else {
        headerBtnList.appendChild(cryptoBtn);
    }
    console.log("------>>> encrypt button add success")
}

function hasEncryptedMailBody(composeDiv: HTMLElement, btn?: HTMLElement) {
    const iframeBody = mailBodyArea(composeDiv);
    if (!iframeBody || !iframeBody.fElm || !btn) {
        return;
    }
    setBtnStatus(iframeBody.fElm.dataset.mailHasEncrypted === 'true', btn);
}

function setBtnStatus(hasEncrypted: boolean, btn: HTMLElement) {
    const img = btn.parentNode!.querySelector('img');
    if (hasEncrypted) {
        btn.textContent = browser.i18n.getMessage('decrypt_mail_body');
        img!.src = browser.runtime.getURL('file/logo_16_out.png');
    } else {
        btn.textContent = browser.i18n.getMessage('crypto_and_send');
        img!.src = browser.runtime.getURL('file/logo_16.png');
    }
}

async function decryptMailContent(fElm: HTMLElement, mBody: string, btn: HTMLElement) {
    if (fElm.dataset.originalHtml) {
        setBtnStatus(false, btn);
        fElm.innerHTML = fElm.dataset.originalHtml!;
        fElm.dataset.mailHasEncrypted = 'false';
        fElm.dataset.originalHtml = undefined;
        return;
    }
    const mailRsp = await browser.runtime.sendMessage({
        action: MsgType.DecryptData,
        data: mBody
    })
    if (mailRsp.success === 0) {
        return;
    }
    if (mailRsp.success < 0) {
        showTipsDialog(browser.i18n.getMessage("Tips"),
            browser.i18n.getMessage("decrypt_mail_body_failed"));
        return;
    }
    setBtnStatus(false, btn);
    fElm.textContent = mailRsp.data;
    fElm.dataset.mailHasEncrypted = 'false';
}

async function processReceivers(composeDiv: HTMLElement) {
    const receiverArea = composeDiv.querySelectorAll(".js-component-emailblock");
    if (receiverArea.length <= 0) {
        showTipsDialog(browser.i18n.getMessage("Tips"),
            browser.i18n.getMessage("encrypt_mail_receiver"));
        return;
    }

    let receiver: string[] = [];
    for (let i = 0; i < receiverArea.length; i++) {
        const emailElement = receiverArea[i].querySelector(".nui-addr-email");
        if (!emailElement) {
            continue;
        }
        const email = emailElement.textContent!.replace(/[<>]/g, "");
        const bmailAddr = await sendMessage(email, MsgType.EmailAddrToBmailAddr);
        if (!bmailAddr || bmailAddr.success === 0) {
            return;
        }
        if (bmailAddr.success < 0) {
            showTipsDialog(browser.i18n.getMessage("Tips"),
                email + browser.i18n.getMessage("invalid_bmail_account"));
            receiverArea[i].classList.add("bmail_receiver_invalid");
            return;
        }
        console.log("----->>>email address:", email, "bmail address:", bmailAddr);
        receiver.push(bmailAddr.data);
        receiverArea[i].classList.add("bmail_receiver_is_fine");
    }
    return receiver;
}

async function encryptMailContent(btn: HTMLElement, composeDiv: HTMLElement) {
    const result = mailBodyArea(composeDiv);
    if (!result) {
        return;
    }
    const {fElm, mBody} = result;
    if (mBody.length <= 0) {
        showTipsDialog(browser.i18n.getMessage("Tips"),
            browser.i18n.getMessage("encrypt_mail_body"));
        return;
    }

    if (fElm.dataset.mailHasEncrypted === 'true') {
        await decryptMailContent(fElm, mBody, btn);
        return;
    }

    const receiver = await processReceivers(composeDiv);
    if (!receiver) {
        return;
    }

    const mailRsp = await browser.runtime.sendMessage({
        action: MsgType.EncryptData,
        receivers: receiver,
        data: mBody
    })

    if (mailRsp.success <= 0) {
        if (mailRsp.success === 0) {
            return;
        }
        showTipsDialog(browser.i18n.getMessage("Tips"), mailRsp.message);
        return;
    }

    fElm.dataset.originalHtml = fElm.innerHTML;
    fElm.innerText = mailRsp.data;
    fElm.dataset.mailHasEncrypted = 'true';
    setBtnStatus(true, btn);
}

function monitorTabMenu() {
    const ul = document.querySelector('.js-component-tab.tz0.nui-tabs');
    if (!ul) {
        console.log("------>>>no tab menu found")
        return;
    }
    let lastChildCount = ul.children.length;
    const observer = new MutationObserver((mutationsList) => {
        const currentChildCount = ul.children.length;
        if (currentChildCount !== lastChildCount) {
            if (currentChildCount > lastChildCount) {
                const lastAdded = ul.children[ul.children.length - 2];
                console.log(`------>>>Added li: ${lastAdded?.innerHTML}`);
            } else {
                mutationsList.forEach(mutation => {
                    mutation.removedNodes.forEach(node => {
                        if (node.nodeName === 'LI') {
                            console.log(`------>>>Removed li: ${(node as HTMLElement).innerHTML}`);
                        }
                    });
                });
            }
            lastChildCount = currentChildCount;
        }
    });
    observer.observe(ul, {childList: true});
}