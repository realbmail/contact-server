import browser from "webextension-polyfill";
import {hideLoading, HostArr, MsgType, sendMessageToBackground, showLoading} from "./common";
import {queryEmailAddrNetEase} from "./content_netease";
import {queryEmailAddrGoogle} from "./conetent_google";
import {MailFlag} from "./bmail_body";
import {queryEmailAddrQQ} from "./content_qq";
import {EmailReflects} from "./proto/bmail_srv";


window.addEventListener('message', (event) => {
    if (event.source !== window) {
        return;
    }

    if (event.data && event.data.action === MsgType.EncryptData) {
        browser.runtime.sendMessage({action: MsgType.EncryptData}).catch((error: any) => {
            console.warn('------>>>error sending message:', error);
        });
    }
});

browser.runtime.onMessage.addListener((request, sender, sendResponse: (response: any) => void) => {
    console.log("------>>>on message:", request.action);
    if (request.action === MsgType.QueryCurEmail) {
        const emailAddr = readCurrentMailAddress();
        sendResponse({value: emailAddr});
    }
    return true;
});

function bmailInboxAction() {
    console.log("------>>> bmail inbox")
    browser.runtime.sendMessage({action: MsgType.BMailInbox}).catch((error: any) => {
        console.warn('------>>>error sending message:', error);
    });
}

function readCurrentMailAddress() {
    const hostname = window.location.hostname;
    if (hostname.includes(HostArr.Mail126) || hostname.includes(HostArr.Mail163)) {
        return queryEmailAddrNetEase();
    }
    if (hostname.includes(HostArr.Google)) {
        return queryEmailAddrGoogle();
    }

    if (hostname.includes(HostArr.QQ)) {
        return queryEmailAddrQQ();
    }
}

export function parseBmailInboxBtn(template: HTMLTemplateElement, inboxDivStr: string) {
    const bmailInboxBtn = template.content.getElementById(inboxDivStr);
    if (!bmailInboxBtn) {
        console.log("------>>>failed to find bmailElement");
        return null;
    }

    const img = bmailInboxBtn.querySelector('img');
    if (img) {
        img.src = browser.runtime.getURL('file/logo_16.png');
    }
    const clone = bmailInboxBtn.cloneNode(true) as HTMLElement;
    clone.addEventListener('click', bmailInboxAction);
    return clone;
}

export function parseCryptoMailBtn(template: HTMLTemplateElement, imgSrc: string, btnClass: string,
                                   title: string, elmId: string, action: (btn: HTMLElement) => Promise<void>) {
    const cryptoBtnDiv = template.content.getElementById(elmId);
    if (!cryptoBtnDiv) {
        console.log("------>>>failed to find bmailElement");
        return null;
    }
    const img = cryptoBtnDiv.querySelector('img');
    if (img) {
        img.src = browser.runtime.getURL(imgSrc);
    }
    const clone = cryptoBtnDiv.cloneNode(true) as HTMLElement;
    const cryptoBtn = clone.querySelector(btnClass) as HTMLElement;
    cryptoBtn.textContent = title;
    clone.addEventListener('click', async (event) => {
        event.stopPropagation();
        await action(cryptoBtn);
    });
    return clone;
}

export function showTipsDialog(title: string, message: string) {
    const dialog = document.getElementById("bmail_dialog_container");
    if (!dialog) {
        return;
    }
    dialog.querySelector(".bmail_dialog_title")!.textContent = title;
    dialog.querySelector(".bmail_dialog_message")!.textContent = message;
    dialog.style.display = "block";
}


export function checkFrameBody(fBody: HTMLElement, btn: HTMLElement) {
    let textContent = fBody.innerText.trim();
    if (textContent.length <= 0) {
        console.log("------>>> no mail content to judge");
        return;
    }

    if (textContent.includes(MailFlag)) {
        fBody.dataset.mailHasEncrypted = 'true';
        setBtnStatus(true, btn);
        fBody.contentEditable = 'false';
        console.log("change to decrypt model....")
    } else {
        fBody.dataset.mailHasEncrypted = 'false';
        setBtnStatus(false, btn);
        fBody.contentEditable = 'true';
        console.log("change to encrypt model....")
    }
}

export function setBtnStatus(hasEncrypted: boolean, btn: HTMLElement) {
    let img = (btn.parentNode as HTMLImageElement | null)?.querySelector('img') as HTMLImageElement | null;
    if (!img) {
        console.log("------>>>logo element not found");
        return;
    }
    if (hasEncrypted) {
        btn.textContent = browser.i18n.getMessage('decrypt_mail_body');
        img!.src = browser.runtime.getURL('file/logo_16_out.png');
    } else {
        btn.textContent = browser.i18n.getMessage('crypto_and_send');
        img!.src = browser.runtime.getURL('file/logo_16.png');
    }
}

export async function encryptMailInComposing(mailBody: HTMLElement, btn: HTMLElement, receiver: string[] | null): Promise<boolean> {
    if (!receiver || receiver.length === 0) {
        return false;
    }
    const mailRsp = await browser.runtime.sendMessage({
        action: MsgType.EncryptData,
        receivers: receiver,
        data: mailBody.innerHTML
    })

    if (mailRsp.success <= 0) {
        if (mailRsp.success === 0) {
            return false;
        }
        showTipsDialog("Tips", mailRsp.message);
        return false;
    }
    mailBody.innerText = mailRsp.data;
    checkFrameBody(mailBody, btn);
    return true;
}


export async function decryptMailInReading(mailContent: HTMLElement, content: string, cryptoBtn: HTMLElement): Promise<void> {
    showLoading();
    try {
        const statusRsp = await sendMessageToBackground('', MsgType.CheckIfLogin)
        if (statusRsp.success < 0) {
            return;
        }
        if (mailContent.dataset && mailContent.dataset.hasDecrypted === 'true') {
            mailContent.innerHTML = mailContent.dataset.orignCrpted!;
            mailContent.dataset.hasDecrypted = "false";
            setBtnStatus(true, cryptoBtn);
            mailContent.dataset.orignCrpted = '';
            return;
        }

        const mailRsp = await browser.runtime.sendMessage({
            action: MsgType.DecryptData,
            data: content
        })

        if (mailRsp.success <= 0) {
            if (mailRsp.success === 0) {
                return;
            }
            showTipsDialog("Tips", mailRsp.message);
            return;
        }
        console.log("------>>> decrypt mail body success");
        mailContent.dataset.orignCrpted = mailContent.innerHTML;
        mailContent.innerHTML = mailRsp.data;
        mailContent.dataset.hasDecrypted = "true";
        setBtnStatus(false, cryptoBtn);

    } catch (error) {
        console.log("------>>>failed to decrypt mail data in reading:=>", error);
    } finally {
        hideLoading();
    }
}

export function observeForElement(foundFunc: () => HTMLElement | null, callback: () => Promise<void>) {
    const idleThreshold = 1000;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const cb: MutationCallback = (mutationsList, observer) => {
        if (idleTimer) {
            clearTimeout(idleTimer);
        }
        const element = foundFunc();
        if (element) {
            idleTimer = setTimeout(() => {
                console.log('---------->>> document body load finished');
                callback().then();
                observer.disconnect();
            }, idleThreshold);
        }
    };

    const observer = new MutationObserver(cb);
    observer.observe(document.body, {childList: true, subtree: true});
}

export let __localContactMap = new Map<string, string>();

export async function queryContactFromSrv(emailToQuery: string[], receiver: string[]): Promise<string[] | null> {

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
        showTipsDialog("Warning", "no blockchain address for:" + emailToQuery);
        return null;
    }

    const invalidReceiver: string[] = []
    const contacts = mailRsp.data as EmailReflects;
    for (let i = 0; i < emailToQuery.length; i++) {
        const email = emailToQuery[i];
        const contact = contacts.reflects[email];
        if (!contact || !contact.address) {
            invalidReceiver.push(email);
            continue;
        }
        __localContactMap.set(email, contact.address);
        receiver.push(contact.address);
        console.log("----->>>from server email address:", email, "bmail address:", contact.address);
    }
    if (invalidReceiver.length > 0) {
        showTipsDialog("Warning", "no blockchain address found for email:" + invalidReceiver);
        return null;
    }

    return receiver;
}

export function addCryptButtonForEveryBmailDiv(template: HTMLTemplateElement, btnParent: HTMLElement, BMailDivs: HTMLElement[]) {
    const title = browser.i18n.getMessage('decrypt_mail_body')
    const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_16_out.png', ".bmail-decrypt-btn",
        title, 'bmail_decrypt_btn_in_compose_netEase', async btn => {
        }) as HTMLElement;

    const cryptoBtn = cryptoBtnDiv.querySelector(".bmail-decrypt-btn") as HTMLElement;

    btnParent.insertBefore(cryptoBtnDiv, btnParent.children[1]);
    console.log("------>>> decrypt button add success");

    BMailDivs.forEach(bmailBody => {
        cryptoBtnDiv!.addEventListener('click', async () => {
            await decryptMailInReading(bmailBody, bmailBody.textContent!.trim(), cryptoBtn);
        });
    });
}