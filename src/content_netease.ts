import browser from "webextension-polyfill";
import {
    parseBmailInboxBtn,
    parseCryptoMailBtn,
    showTipsDialog
} from "./content_common";
import {
    extractJsonString, hideLoading,
    MsgType, replaceTextInRange,
    sendMessageToBackground, showLoading
} from "./common";
import {MailFlag} from "./bmail_body";
import {EmailReflects} from "./proto/bmail_srv";

const staticNetEaseHtmlForReply = `
<div id="spnEditorContent"><p style="margin: 0;"><br></p><p style="margin: 0;"><br></p><p style="margin: 0;"><br></p><p style="margin: 0;"><br></p><p style="margin: 0;"><br></p></div>
`

export function appendForNetEase(template: HTMLTemplateElement) {
    const clone = parseBmailInboxBtn(template, "bmail_left_menu_btn_netEase");
    if (!clone) {
        console.warn("------>>> failed to parse bmail inbox button");
        return
    }

    appendBtnToMenu(clone);
    addActionForHomePage(clone);
    checkHasMailContent(template);

    monitorTabMenu((isDelete: boolean) => {
        if (isDelete) {
            //TODO::
            return;
        }
        checkHasMailContent(template);
    });

}

function addActionForHomePage(clone: HTMLElement): void {
    const tabMenus = document.querySelectorAll('li[title="首页"]');
    if (tabMenus.length > 0) {
        tabMenus[0].addEventListener('click', () => {
            const dynamicBtn = document.getElementById('bmail_left_menu_btn_netEase');
            if (!dynamicBtn) {
                appendBtnToMenu(clone)
            }
        });
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
    }, 1000);
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

function checkFrameBody(fBody: HTMLElement, btn: HTMLElement) {
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

function addMailBodyListener(composeDiv: HTMLElement, btn: HTMLElement) {
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
    if (isReplyComposing) {
        iframeDocument.body.dataset.theDivIsReply = 'true';
    }
    checkFrameBody(iframeDocument.body, btn);
}

function addMailEncryptLogicForComposition(composeDiv: HTMLElement, template: HTMLTemplateElement) {
    let cryptoBtn = composeDiv.querySelector('.bmail-crypto-btn') as HTMLElement;
    if (cryptoBtn) {
        console.log("------>>> crypto btn already been added before for mail composing");
        addMailBodyListener(composeDiv, cryptoBtn);
        return;
    }
    const headerBtnList = composeDiv.querySelector(".js-component-toolbar.nui-toolbar");
    if (!headerBtnList) {
        console.log("------>>> header list not found for mail composition");
        return;
    }
    const title = browser.i18n.getMessage('crypto_and_send');
    const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_16.png', ".bmail-crypto-btn",
        title, 'bmail_crypto_btn_in_compose_netEase', async btn => {
            showLoading();
            try {
                await encodeOrDecodeMailBody(composeDiv, btn);
            } catch (err) {
                //TODO::
                console.log("------>>> mail crypto err:", err);
            } finally {
                hideLoading();
            }
        }) as HTMLElement;

    if (!cryptoBtnDiv) {
        console.log("------>>> no crypto button found in template!")
        return;
    }

    addMailBodyListener(composeDiv, cryptoBtnDiv.querySelector('.bmail-crypto-btn') as HTMLElement);

    if (headerBtnList.children.length > 1) {
        headerBtnList.insertBefore(cryptoBtnDiv, headerBtnList.children[1]);
    } else {
        headerBtnList.appendChild(cryptoBtnDiv);
    }
    console.log("------>>> encrypt button add success")
}

function setBtnStatus(hasEncrypted: boolean, btn: HTMLElement) {
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

async function decryptMailInComposing(fElm: HTMLElement, mBody: string) {
    if (fElm.dataset.originalHtml) {
        fElm.innerHTML = fElm.dataset.originalHtml!;
        fElm.dataset.originalHtml = undefined;
        return;
    }
    const isReply = fElm.dataset.theDivIsReply === 'true';
    let result = null;
    let realData = mBody;
    if (isReply) {
        result = extractJsonString(mBody);
        console.log(result);
        if (!result) {
            console.log("----->>>extract json string failed!")
            return;
        }
        realData = result.json;
    }

    const mailRsp = await browser.runtime.sendMessage({
        action: MsgType.DecryptData,
        data: realData
    })

    if (mailRsp.success <= 0) {
        if (mailRsp.success === 0) {
            return;
        }
        showTipsDialog("Tips", mailRsp.message);
        return;
    }

    if (isReply) {
        fElm.innerHTML = staticNetEaseHtmlForReply + replaceTextInRange(mBody, result!.offset, result!.endOffset, mailRsp.data);
    } else {
        fElm.innerHTML = mailRsp.data;
    }
    console.log("------>>>decrypt mail content success")
}

let __tmpContactMap = new Map<string, string>();

async function processReceivers(composeDiv: HTMLElement) {
    const receiverArea = composeDiv.querySelectorAll(".js-component-emailblock") as NodeListOf<HTMLElement>;
    if (receiverArea.length <= 0) {
        showTipsDialog("Tips", browser.i18n.getMessage("encrypt_mail_receiver"));
        return;
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
        const address = __tmpContactMap.get(email);
        if (address) {
            receiver.push(address);
            receiverArea[i].classList.add("bmail_receiver_is_fine");
            console.log("------>>> from cache:", email, " address:=>", address);
            continue;
        }
        emailDivs.set(email, receiverArea[i]);
    }

    if (emailDivs.size <= 0) {
        if (receiver.length <= 0) {
            showTipsDialog("Tips", browser.i18n.getMessage("encrypt_mail_receiver"));
            return;
        }
        return receiver;
    }

    const emailKeysArray = Array.from(emailDivs.keys());
    const mailRsp = await sendMessageToBackground(emailKeysArray, MsgType.EmailAddrToBmailAddr);
    if (!mailRsp || mailRsp.success === 0) {
        return;
    }

    if (mailRsp.success < 0) {
        showTipsDialog("Tips", mailRsp.message);
        return;
    }

    const contacts = mailRsp.data as EmailReflects;
    for (const [email, div] of emailDivs) {
        const contact = contacts.reflects[email];
        if (!contact) {
            console.log("----->>>no address for email address:", email);
            div.classList.add("bmail_receiver_invalid");
        } else {
            __tmpContactMap.set(email, contact.address);
            receiver.push(contact.address);
            div.classList.add("bmail_receiver_is_fine");
            console.log("----->>>from server email address:", email, "bmail address:", contact.address);
        }
    }
    return receiver;
}

async function encodeOrDecodeMailBody(composeDiv: HTMLElement, btn: HTMLElement) {

    const statusRsp = await sendMessageToBackground('', MsgType.CheckIfLogin)
    if (statusRsp.success < 0) {
        return;
    }

    const iframe = composeDiv.querySelector(".APP-editor-iframe") as HTMLIFrameElement | null;
    const mailBody = iframe?.contentDocument?.body || iframe?.contentWindow?.document.body;
    if (!mailBody) {
        console.log("----->>> no frame body found:=>");
        return null;
    }
    let bodyTextContent = mailBody.innerText.trim();
    if (bodyTextContent.length <= 0) {
        showTipsDialog("Tips", browser.i18n.getMessage("encrypt_mail_body"));
        return;
    }

    if (mailBody.dataset.mailHasEncrypted === 'true') {
        await decryptMailInComposing(mailBody, bodyTextContent);
        checkFrameBody(mailBody, btn);
        return;
    }

    const receiver = await processReceivers(composeDiv);
    if (!receiver) {
        return;
    }

    const mailRsp = await browser.runtime.sendMessage({
        action: MsgType.EncryptData,
        receivers: receiver,
        data: mailBody.innerHTML
    })

    if (mailRsp.success <= 0) {
        if (mailRsp.success === 0) {
            return;
        }
        showTipsDialog("Tips", mailRsp.message);
        return;
    }

    mailBody.dataset.originalHtml = mailBody.innerHTML;
    mailBody.innerText = mailRsp.data;
    checkFrameBody(mailBody, btn);
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

function addDecryptBtnToHeader(composeDiv: HTMLElement, template: HTMLTemplateElement, mailContent: HTMLElement, mailData: string) {
    const headerBtnList = composeDiv.querySelector(".js-component-toolbar.nui-toolbar")

    if (!headerBtnList) {
        console.log("------>>> header list not found for mail reading");
        return;
    }
    const title = browser.i18n.getMessage('decrypt_mail_body')
    const cryptoBtn = parseCryptoMailBtn(template, 'file/logo_16_out.png', ".bmail-decrypt-btn",
        title, 'bmail_decrypt_btn_in_compose_netEase', async btn => {
            showLoading();
            try {
                await decryptMailInReading(mailContent, mailData, btn);
            } catch (e) {
                console.log("------>>> crypto in mail reading err:=>", e)
            } finally {
                hideLoading();
            }
        });

    if (!cryptoBtn) {
        console.log("------>>> no decrypt button found in template!")
        return;
    }
    if (headerBtnList.children.length > 1) {
        headerBtnList.insertBefore(cryptoBtn, headerBtnList.children[1]);
    } else {
        headerBtnList.appendChild(cryptoBtn);
    }
    console.log("------>>> decrypt button add success")
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
    const mailContent = mailBody.querySelector(".netease_mail_readhtml.netease_mail_readhtml_webmail") as HTMLElement;
    const mailData = extractJsonString(mailContent.innerText);
    if (!mailData) {
        console.log("----->>> no encrypted mail body found:=>");
        return;
    }
    addDecryptBtnToHeader(composeDiv, template, mailContent, mailData.json)
}

async function decryptMailInReading(mailContent: HTMLElement, mailData: string, cryptoBtn?: HTMLElement | undefined | null) {
    const statusRsp = await sendMessageToBackground('', MsgType.CheckIfLogin)
    if (statusRsp.success < 0 || !mailContent || !cryptoBtn) {
        return;
    }

    if (mailContent.dataset.hasDecrypted === 'true') {
        mailContent.innerHTML = mailContent.dataset.orignCrpted!;
        mailContent.dataset.hasDecrypted = "false";
        setBtnStatus(true, cryptoBtn);
        return;
    }

    const mailRsp = await browser.runtime.sendMessage({
        action: MsgType.DecryptData,
        data: mailData
    })

    if (mailRsp.success <= 0) {
        if (mailRsp.success === 0) {
            return;
        }
        showTipsDialog("Tips", mailRsp.message);
        return;
    }

    console.log("------>>> decrypt mail body success");
    mailContent.innerHTML = mailRsp.data;
    mailContent.dataset.orignCrpted = mailData;
    mailContent.dataset.hasDecrypted = "true";
    setBtnStatus(false, cryptoBtn);
}

