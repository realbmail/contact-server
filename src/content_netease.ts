import browser from "webextension-polyfill";
import {
    checkFrameBody, encryptMailInComposing, decryptMailInReading,
    parseBmailInboxBtn,
    parseCryptoMailBtn, showTipsDialog, queryContactFromSrv, __localContactMap
} from "./content_common";
import {
    extractEmail,
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
    const elmForward = iframeDocument.getElementById('isForwardContent') as HTMLQuoteElement | null;
    const elmWhenReload = iframeDocument.querySelector('.cm_quote_msg') as HTMLQuoteElement | null;
    const isReplyOrForward = elmWhenReload || elmFromReply || elmForward;
    console.log("------>>> is this a reply div", isReplyOrForward, "div id:=>", composeDiv.id);
    if (!isReplyOrForward) {
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

async function processReceivers(composeDiv: HTMLElement): Promise<string[] | null> {
    const receiverArea = composeDiv.querySelectorAll(".js-component-emailblock") as NodeListOf<HTMLElement>;
    if (!receiverArea || receiverArea.length <= 0) {
        showTipsDialog("Tips", browser.i18n.getMessage("encrypt_mail_receiver"));
        return null;
    }

    let receiver: string[] = [];
    let emailToQuery: string[] = [];

    for (let i = 0; i < receiverArea.length; i++) {
        const emailElement = receiverArea[i].querySelector(".nui-addr-email");
        if (!emailElement) {
            continue;
        }
        const email = extractEmail(emailElement.textContent ?? "");
        if (!email) {
            continue;
        }

        const address = __localContactMap.get(email);
        if (address) {
            receiver.push(address);
            console.log("------>>> from cache:", email, " address:=>", address);
            continue;
        }
        emailToQuery.push(email);
    }

    return queryContactFromSrv(emailToQuery, receiver);
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
        if (!receiver) {
            return;
        }

        const success = await encryptMailInComposing(mailBody, btn, receiver);
        if (!success) {
            return;
        }

        sendDiv.click();

    } catch (err) {
        console.log("------>>> mail crypto err:", err);
        showTipsDialog("error", "encrypt mail content failed");
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
    const iframeDocument = iframe?.contentDocument || iframe?.contentWindow?.document;
    if (!iframeDocument) {
        console.log("----->>> no mail body found:=>");
        return;
    }

    const mailArea = iframeDocument.querySelector(".netease_mail_readhtml.netease_mail_readhtml_webmail") as HTMLElement | null;
    if (!mailArea) {
        let debounceTimer = setTimeout(() => {
            checkHasMailContent(template);
            clearTimeout(debounceTimer);
        }, 1500);
        return;
    }

    let firstMailBody = mailArea.querySelector('div[data-ntes="ntes_mail_body_root"]') as HTMLElement;
    const blockquotes = firstMailBody.querySelectorAll('blockquote');
    const subContent = firstMailBody.querySelector('div[id$="spnEditorContent"]')
    if (subContent) {
        firstMailBody = subContent as HTMLElement;
    }

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
    const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_16_out.png', ".bmail-decrypt-btn",
        title, 'bmail_decrypt_btn_in_compose_netEase', async btn => {
            await decryptMailInReading(firstMailBody, mailData.json, btn);
        }) as HTMLElement;
    headerBtnList.insertBefore(cryptoBtnDiv, headerBtnList.children[1]);
    console.log("------>>> decrypt button add success")

    const forwardDivs = iframeDocument.querySelectorAll('div[id$="isForwardContent"]')

    if ((!blockquotes || blockquotes.length <= 0) && (!forwardDivs || forwardDivs.length <= 0)) {
        console.log("------>>> no quoted or forward mail body found!")
        return;
    }

    const cryptoBtn = cryptoBtnDiv.querySelector(".bmail-decrypt-btn") as HTMLElement;
    blockquotes.forEach((mailQuoteDiv) => {
        const quoteBody1 = mailQuoteDiv.querySelector('div[dir="ltr"]') as HTMLElement | null;
        const quoteBody2 = mailQuoteDiv.querySelector('div[id$="spnEditorContent"]') as HTMLElement | null;
        const quoteBody = quoteBody1 || quoteBody2
        if (!quoteBody) {
            console.log("----->>> quote body not found.");
            return;
        }

        const quotedMailData = extractJsonString(quoteBody.innerText.trim());
        if (!quotedMailData) {
            console.log("------>>>no crypto mail content in quote div")
            return;
        }
        cryptoBtnDiv?.addEventListener('click', async () => {
            await decryptMailInReading(quoteBody, quotedMailData.json, cryptoBtn);
        });
    });
    forwardDivs.forEach((forwardDiv) => {
        let forwardContentDiv = forwardDiv.querySelector('div[data-ntes="ntes_mail_body_root"]') as HTMLElement | null;
        if (!forwardContentDiv) {
            console.log("----->>> forwardContentDiv not found.");
            return;
        }

        const subForwardContent = forwardContentDiv.querySelector('div[id$="spnEditorContent"]')
        if (subForwardContent) {
            forwardContentDiv = subForwardContent as HTMLElement;
        }

        const quotedMailData = extractJsonString(forwardContentDiv.innerText.trim());
        if (!quotedMailData) {
            console.log("------>>>no crypto mail content in forward div")
            return;
        }
        cryptoBtnDiv?.addEventListener('click', async () => {
            await decryptMailInReading(forwardContentDiv, quotedMailData.json, cryptoBtn);
        });
    });
}

