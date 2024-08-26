import browser from "webextension-polyfill";
import {
    checkFrameBody, encryptMailInComposing, decryptMailInReading,
    parseBmailInboxBtn,
    parseCryptoMailBtn, showTipsDialog
} from "./content_common";
import {
    extractJsonString, hideLoading,
    MsgType, sendMessageToBackground, showLoading
} from "./common";
import {EmailReflects} from "./proto/bmail_srv";

export function appendForNetEase(template: HTMLTemplateElement) {
    const clone = parseBmailInboxBtn(template, "bmail_left_menu_btn_netEase");
    if (!clone) {
        console.warn("------>>> failed to parse bmail inbox button");
        return
    }

    appendBmailInboxMenu(clone);
    checkBmailInboxMenuAgain(clone);
    checkHasMailContent(template);

    monitorTabMenu((isDelete: boolean) => {
        if (isDelete) {
            //TODO::
            return;
        }
        checkHasMailContent(template);
    });

}

function checkBmailInboxMenuAgain(clone: HTMLElement): void {
    const checkBmailMenuAgain = () => {
        const dynamicBtn = document.getElementById('bmail_left_menu_btn_netEase');
        if (!dynamicBtn) {
            appendBmailInboxMenu(clone)
        }
    }
    const homePageMenu = document.querySelector('li[title="首页"]');
    if (homePageMenu) {
        homePageMenu.addEventListener('click', checkBmailMenuAgain);
    }

    const inboxMenu = document.querySelector('li[title="收件箱"]');
    if (inboxMenu) {
        inboxMenu.addEventListener('click', checkBmailMenuAgain);
    }
}

function checkHasMailContent(template: HTMLTemplateElement) {
    let debounceTimer = setTimeout(() => {

        const composeDiv = document.querySelectorAll<HTMLElement>("[id^='_dvModuleContainer_compose.ComposeModule']");
        composeDiv.forEach(div => {
            addMailEncryptLogicForComposition(div, template);
        });

        clearTimeout(debounceTimer);
        const readDiv = document.querySelectorAll<HTMLElement>("[id^='_dvModuleContainer_read.ReadModule']");
        readDiv.forEach(div => {
            addMailDecryptForReading(div, template);
        });
    }, 1500);
}

function appendBmailInboxMenu(clone: HTMLElement) {
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

function parseMailBodyToCheckCryptoButtonStatus(composeDiv: HTMLElement, btn: HTMLElement) {
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

    const elmFromReply = iframeDocument.getElementById('isReplyContent') as HTMLQuoteElement | null;
    const elmWhenReload = iframeDocument.querySelector('.cm_quote_msg') as HTMLQuoteElement | null;
    const isReplyComposing = elmWhenReload != null || elmFromReply != null;
    console.log("------>>> is this a reply div", isReplyComposing, "div id:=>", composeDiv.id);
    if (!isReplyComposing) {
        checkFrameBody(iframeDocument.body, btn);
        return;
    }
    iframeDocument.body.dataset.theDivIsReply = 'true';
    const div = iframeDocument.getElementById('spnEditorContent') as HTMLElement;
    checkFrameBody(div, btn);
}

function addMailEncryptLogicForComposition(composeDiv: HTMLElement, template: HTMLTemplateElement) {
    let cryptoBtn = composeDiv.querySelector('.bmail-crypto-btn') as HTMLElement;
    if (cryptoBtn) {
        console.log("------>>> crypto btn already been added before for mail composing");
        parseMailBodyToCheckCryptoButtonStatus(composeDiv, cryptoBtn);
        return;
    }
    const headerBtnList = composeDiv.querySelector(".js-component-toolbar.nui-toolbar");
    if (!headerBtnList) {
        console.log("------>>> header list not found for mail composition");
        return;
    }
    const title = browser.i18n.getMessage('crypto_and_send');
    const sendDiv = composeDiv.querySelector(".js-component-button.nui-mainBtn.nui-btn.nui-btn-hasIcon.nui-mainBtn-hasIcon") as HTMLElement;
    const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_16.png', ".bmail-crypto-btn",
        title, 'bmail_crypto_btn_in_compose_netEase', async btn => {
            await encryptDataAndSendNetEase(composeDiv, btn, sendDiv);
        }
    ) as HTMLElement;

    parseMailBodyToCheckCryptoButtonStatus(composeDiv, cryptoBtnDiv.querySelector('.bmail-crypto-btn') as HTMLElement);

    if (headerBtnList.children.length > 1) {
        headerBtnList.insertBefore(cryptoBtnDiv, headerBtnList.children[1]);
    } else {
        headerBtnList.appendChild(cryptoBtnDiv);
    }
    console.log("------>>> encrypt button add success")
}

let __netEaseContactMap = new Map<string, string>();

async function processReceivers(composeDiv: HTMLElement): Promise<{ fine: string[]; invalid: string[] }> {
    const receiverArea = composeDiv.querySelectorAll(".js-component-emailblock") as NodeListOf<HTMLElement>;
    if (receiverArea.length <= 0) {
        showTipsDialog("Tips", browser.i18n.getMessage("encrypt_mail_receiver"));
        return {fine: [], invalid: []};
    }

    let receiver: string[] = [];
    let emailDivs = new Map<string, HTMLElement>();
    for (let i = 0; i < receiverArea.length; i++) {
        const emailElement = receiverArea[i].querySelector(".nui-addr-email");
        if (!emailElement) {
            receiverArea[i].classList.add("bmail_receiver_invalid");
            continue;
        }

        const email = emailElement.textContent!.replace(/[<>]/g, "");
        const address = __netEaseContactMap.get(email);
        if (address) {
            receiver.push(address);
            receiverArea[i].classList.add("bmail_receiver_is_fine");
            console.log("------>>> from cache:", email, " address:=>", address);
            continue;
        }
        emailDivs.set(email, receiverArea[i]);
    }
    const invalidReceiver: string[] = []
    if (emailDivs.size <= 0) {
        if (receiver.length <= 0) {
            showTipsDialog("Tips", browser.i18n.getMessage("encrypt_mail_receiver"));
            return {fine: [], invalid: []};
        }
        return {fine: receiver, invalid: invalidReceiver};
    }

    const emailKeysArray = Array.from(emailDivs.keys());
    const mailRsp = await sendMessageToBackground(emailKeysArray, MsgType.EmailAddrToBmailAddr);
    if (!mailRsp || mailRsp.success === 0) {
        return {fine: [], invalid: []};
    }

    if (mailRsp.success < 0) {
        showTipsDialog("Tips", mailRsp.message);
        return {fine: [], invalid: []};
    }

    const contacts = mailRsp.data as EmailReflects;
    for (const [email, div] of emailDivs) {
        const contact = contacts.reflects[email];
        if (!contact) {
            console.log("----->>>no address for email address:", email);
            div.classList.add("bmail_receiver_invalid");
            invalidReceiver.push(email);
        } else {
            __netEaseContactMap.set(email, contact.address);
            receiver.push(contact.address);
            div.classList.add("bmail_receiver_is_fine");
            console.log("----->>>from server email address:", email, "bmail address:", contact.address);
        }
    }

    return {fine: receiver, invalid: invalidReceiver};
}

async function encryptDataAndSendNetEase(composeDiv: HTMLElement, btn: HTMLElement, sendDiv: HTMLElement) {
    showLoading();
    try {
        const statusRsp = await sendMessageToBackground('', MsgType.CheckIfLogin)
        if (statusRsp.success < 0) {
            return;
        }

        const iframe = composeDiv.querySelector(".APP-editor-iframe") as HTMLIFrameElement | null;
        let mailBody = iframe?.contentDocument?.body || iframe?.contentWindow?.document.body;
        if (!mailBody) {
            console.log("----->>> no frame body found:=>");
            return null;
        }

        if (mailBody.dataset.theDivIsReply === 'true') {
            mailBody = iframe?.contentDocument?.getElementById('spnEditorContent') as HTMLElement;
        }

        let bodyTextContent = mailBody.innerText.trim();
        if (bodyTextContent.length <= 0) {
            showTipsDialog("Tips", browser.i18n.getMessage("encrypt_mail_body"));
            return;
        }

        if (mailBody.dataset.mailHasEncrypted === 'true') {
            return;
        }

        const receiver = await processReceivers(composeDiv);
        if (receiver.invalid.length > 0) {
            showTipsDialog("Warning", "no blockchain address for:" + receiver.invalid);
            return;
        }

        const success = await encryptMailInComposing(mailBody, btn, receiver.fine);
        if (!success) {
            return;
        }

        sendDiv.click();

    } catch (err) {
        console.log("------>>> mail crypto err:", err);
    } finally {
        hideLoading();
    }
}

function monitorTabMenu(callback?: (isDelete: boolean) => void) {
    const ul = document.querySelector('.js-component-tab.tz0.nui-tabs');
    if (!ul) {
        console.log("------>>>no tab menu found")
        return;
    }
    let lastChildCount = ul.children.length;
    const observer = new MutationObserver((mutationsList) => {
        const currentChildCount = ul.children.length;
        let isDelete = true;
        if (currentChildCount !== lastChildCount) {
            if (currentChildCount > lastChildCount) {
                console.log(`------>>>Added li: `);
                isDelete = false;
            } else {
                mutationsList.forEach(mutation => {
                    mutation.removedNodes.forEach(node => {
                        if (node.nodeName === 'LI') {
                            console.log(`------>>>Removed li:`);
                        }
                    });
                });
            }
            lastChildCount = currentChildCount;
            if (callback) {
                callback(isDelete);
            }
        }
    });
    observer.observe(ul, {childList: true});
}

function addMailDecryptForReading(composeDiv: HTMLElement, template: HTMLTemplateElement) {

    const decryptBtn = composeDiv.querySelector('.bmail-decrypt-btn') as HTMLElement;
    if (decryptBtn) {
        console.log("------>>> decrypt button already been added for reading");
        return;
    }

    const iframe = composeDiv.querySelector("iframe") as HTMLIFrameElement | null;
    const mailBody = iframe?.contentDocument?.body || iframe?.contentWindow?.document.body;
    if (!mailBody) {
        console.log("----->>> no mail body found:=>");
        return;
    }

    const mailArea = mailBody.querySelector(".netease_mail_readhtml.netease_mail_readhtml_webmail") as HTMLElement;
    const blockquotes = mailArea.querySelectorAll('blockquote');
    let firstMailBody = mailArea.children[0] as HTMLElement;
    const mailData = extractJsonString(firstMailBody.innerText.trim());
    if (!mailData) {
        console.log("----->>> no encrypted mail body found:=>");
        return;
    }

    const headerBtnList = composeDiv.querySelector(".js-component-toolbar.nui-toolbar")
    if (!headerBtnList) {
        console.log("------>>> header list not found for mail reading");
        return;
    }

    const title = browser.i18n.getMessage('decrypt_mail_body')
    const cryptoBtn = parseCryptoMailBtn(template, 'file/logo_16_out.png', ".bmail-decrypt-btn",
        title, 'bmail_decrypt_btn_in_compose_netEase', async btn => {
            await decryptMailInReading(firstMailBody, mailData.json, btn);
        }) as HTMLElement;
    headerBtnList.insertBefore(cryptoBtn, headerBtnList.children[1]);
    console.log("------>>> decrypt button add success")

    if (!blockquotes) {
        console.log("------>>> no quoted mail body found!")
        return;
    }
    blockquotes.forEach((mailQuoteDiv) => {
        const quoteBody = mailQuoteDiv.firstChild as HTMLElement;
        const quotedMailData = extractJsonString(quoteBody.innerText.trim());
        if (!quotedMailData) {
            return;
        }
        cryptoBtn?.addEventListener('click', async () => {
            await decryptMailInReading(quoteBody, quotedMailData.json, cryptoBtn.querySelector(".bmail-decrypt-btn") as HTMLElement);
        });
    });
}

