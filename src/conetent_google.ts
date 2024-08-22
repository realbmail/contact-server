import {checkFrameBody, cryptMailBody, parseBmailInboxBtn, parseCryptoMailBtn, showTipsDialog} from "./content_common";
import {emailRegex, hideLoading, MsgType, sendMessageToBackground, showLoading} from "./common";
import browser from "webextension-polyfill";
import {EmailReflects} from "./proto/bmail_srv";

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


const _composeBtnParentClass = "td.I5"

function addCryptoBtnToComposeDiv(template: HTMLTemplateElement) {
    const allComposeDiv = document.querySelectorAll(_composeBtnParentClass);
    console.log("------>>> all compose div when loaded=>", allComposeDiv.length);
    allComposeDiv.forEach(tdDiv => {
        const node = tdDiv.querySelector(".bmail-crypto-btn");
        if (node) {
            console.log("------>>> node already exists");
            return;
        }

        const mailBodyDiv = tdDiv.querySelector(".Am.aiL.Al.editable.LW-avf.tS-tW") as HTMLElement;
        const titleForm = tdDiv.querySelector("form") as HTMLElement;
        const title = browser.i18n.getMessage('crypto_and_send');
        const clone = parseCryptoMailBtn(template, 'file/logo_16.png', ".bmail-crypto-btn", title,
            "bmail_crypto_btn_in_compose_google", async btn => {
                await enOrDecryptCompose(mailBodyDiv, btn, titleForm);
            });
        if (!clone) {
            console.log("------>>> node not found");
            return;
        }

        const newTd = document.createElement('td');
        newTd.append(clone);

        const toolBarTr = tdDiv.querySelector("tr.btC") as HTMLElement;
        const secondTd = toolBarTr.querySelector('td:nth-child(2)');
        if (secondTd) {
            toolBarTr.insertBefore(newTd, secondTd);
        }
    });
}

async function enOrDecryptCompose(mailBody: HTMLElement, btn: HTMLElement, titleForm: HTMLElement) {
    showLoading();
    try {
        const statusRsp = await sendMessageToBackground('', MsgType.CheckIfLogin)
        if (statusRsp.success < 0) {
            return;
        }

        let bodyTextContent = mailBody.innerText.trim();
        if (bodyTextContent.length <= 0) {
            showTipsDialog("Tips", browser.i18n.getMessage("encrypt_mail_body"));
            return;
        }

        if (mailBody.dataset.mailHasEncrypted === 'true') {
            resetEncryptMailBody(mailBody, bodyTextContent);
            checkFrameBody(mailBody, btn);
            return;
        }
        const receiver = await processReceivers(titleForm);
        await cryptMailBody(mailBody, btn, receiver);
    } catch (e) {
        console.log("------>>> decode or encode error:", e);
    } finally {
        hideLoading();
    }
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
                const allComposeDiv = document.querySelectorAll(_composeBtnParentClass);
                if (allComposeDiv.length > 0) {
                    return allComposeDiv[allComposeDiv.length - 1] as HTMLElement;
                }
                return null;
            }, () => {
                addCryptoBtnToComposeDiv(template);
            });
    })
}

function resetEncryptMailBody(mailBody: HTMLElement, mailContent: string) {

}

let __googleContactMap = new Map<string, string>();

async function processReceivers(titleForm: HTMLElement): Promise<string[] | null> {
    let receiver: string[] = [];
    let emailToQuery: string[] = [];
    const divsWithDataHoverCardId = titleForm.querySelectorAll('div[data-hovercard-id]');

    for (let i = 0; i < divsWithDataHoverCardId.length; i++) {
        const div = divsWithDataHoverCardId[i];
        const emailAddr = div.getAttribute('data-hovercard-id') as string;
        console.log("------>>> mail address found:=>", emailAddr);

        const address = __googleContactMap.get(emailAddr);
        if (address) {
            receiver.push(address);
            console.log("------>>> from cache:", emailAddr, " address:=>", address);
            continue;
        }
        emailToQuery.push(emailAddr);
    }

    if (emailToQuery.length <= 0) {
        if (receiver.length <= 0) {
            showTipsDialog("Tips", browser.i18n.getMessage("encrypt_mail_receiver"));
            return null;
        }
        return receiver;
    }

    const mailRsp = await sendMessageToBackground(emailToQuery, MsgType.EmailAddrToBmailAddr);
    if (!mailRsp || mailRsp.success === 0) {
        return null;
    }

    if (mailRsp.success < 0) {
        showTipsDialog("Tips", mailRsp.message);
        return null;
    }

    let invalidEmail = "";
    const contacts = mailRsp.data as EmailReflects;
    for (let i = 0; i < emailToQuery.length; i++) {
        const email = emailToQuery[i];
        const contact = contacts.reflects[email];
        if (!contact || !contact.address) {
            invalidEmail += email + " , ";
            continue;
        }
        __googleContactMap.set(email, contact.address);
        receiver.push(contact.address);
    }
    if (invalidEmail.length > 2) {
        showTipsDialog("Warning", "no blockchain address found for email:" + invalidEmail);
        return null;
    }

    return null;
}