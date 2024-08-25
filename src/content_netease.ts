import browser from "webextension-polyfill";
import {
    checkFrameBody, cryptMailBody, decryptMailInReading,
    parseBmailInboxBtn,
    parseCryptoMailBtn, showTipsDialog
} from "./content_common";
import {
    extractJsonString, hideLoading,
    MsgType, replaceTextInRange,
    sendMessageToBackground, showLoading
} from "./common";
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
            await encodeOrDecodeMailBody(composeDiv, btn);
        }
    ) as HTMLElement;

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

async function decryptMailInComposing(fElm: HTMLElement, mBody: string) {
    if (fElm.dataset.originalHtml) {
        fElm.innerHTML = fElm.dataset.originalHtml!;
        fElm.dataset.originalHtml = undefined;
        return;
    }
    const mailRsp = await browser.runtime.sendMessage({
        action: MsgType.DecryptData,
        data: mBody
    })

    if (mailRsp.success <= 0) {
        if (mailRsp.success === 0) {
            return;
        }
        showTipsDialog("Tips", mailRsp.message);
        return;
    }
    fElm.innerHTML = mailRsp.data;
    console.log("------>>>decrypt mail content success")
}

let __netEaseContactMap = new Map<string, string>();

async function processReceivers(composeDiv: HTMLElement): Promise<string[] | null> {
    const receiverArea = composeDiv.querySelectorAll(".js-component-emailblock") as NodeListOf<HTMLElement>;
    if (receiverArea.length <= 0) {
        showTipsDialog("Tips", browser.i18n.getMessage("encrypt_mail_receiver"));
        return null;
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

    if (emailDivs.size <= 0) {
        if (receiver.length <= 0) {
            showTipsDialog("Tips", browser.i18n.getMessage("encrypt_mail_receiver"));
            return null;
        }
        return receiver;
    }

    const emailKeysArray = Array.from(emailDivs.keys());
    const mailRsp = await sendMessageToBackground(emailKeysArray, MsgType.EmailAddrToBmailAddr);
    if (!mailRsp || mailRsp.success === 0) {
        return null;
    }

    if (mailRsp.success < 0) {
        showTipsDialog("Tips", mailRsp.message);
        return null;
    }

    const contacts = mailRsp.data as EmailReflects;
    for (const [email, div] of emailDivs) {
        const contact = contacts.reflects[email];
        if (!contact) {
            console.log("----->>>no address for email address:", email);
            div.classList.add("bmail_receiver_invalid");
        } else {
            __netEaseContactMap.set(email, contact.address);
            receiver.push(contact.address);
            div.classList.add("bmail_receiver_is_fine");
            console.log("----->>>from server email address:", email, "bmail address:", contact.address);
        }
    }
    return receiver;
}

async function encodeOrDecodeMailBody(composeDiv: HTMLElement, btn: HTMLElement) {
    showLoading();
    try {
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
        await cryptMailBody(mailBody, btn, receiver);
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

function addDecryptBtnToHeader(composeDiv: HTMLElement, template: HTMLTemplateElement, mailContent: HTMLElement, mailData: string) {
    const headerBtnList = composeDiv.querySelector(".js-component-toolbar.nui-toolbar")

    if (!headerBtnList) {
        console.log("------>>> header list not found for mail reading");
        return;
    }
    const title = browser.i18n.getMessage('decrypt_mail_body')
    const cryptoBtn = parseCryptoMailBtn(template, 'file/logo_16_out.png', ".bmail-decrypt-btn",
        title, 'bmail_decrypt_btn_in_compose_netEase', async btn => {
            await decryptMailInReading(mailContent, mailData, btn);
        }) as HTMLElement;
    headerBtnList.insertBefore(cryptoBtn, headerBtnList.children[1]);

    const mailQuoteDiv = mailContent.querySelector("blockquote.gmail_quote") as HTMLElement;
    if (mailQuoteDiv) {
        const quoteBody = mailQuoteDiv.firstChild as HTMLElement;
        cryptoBtn?.addEventListener('click', async () => {
            await decryptMailInReading(quoteBody, quoteBody.innerText.trim(), cryptoBtn.querySelector(".bmail-decrypt-btn") as HTMLElement);
        });
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

