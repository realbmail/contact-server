import browser from "webextension-polyfill";
import {
    __decrypt_button_css_name,
    addDecryptButtonForBmailBody,
    checkFrameBody,
    decryptMailForEditionOfSentMail,
    encryptMailInComposing, extractAesKeyId,
    findAllTextNodesWithEncryptedDiv,
    MailAddressProvider,
    observeForElementDirect,
    parseBmailInboxBtn,
    parseContentHtml,
    parseCryptoMailBtn,
    processReceivers,
    replaceTextNodeWithDiv,
    showTipsDialog
} from "./content_common";
import {extractEmail, hideLoading, showLoading} from "./common";
import {checkAttachmentBtn, queryAttachmentKey, removeAttachmentKey} from "./content_attachment";

function appendForNetEase(template: HTMLTemplateElement) {
    const clone = parseBmailInboxBtn(template, "bmail_left_menu_btn_netEase");
    if (!clone) {
        console.warn("------>>> failed to parse bmail inbox button");
        return
    }

    appendBmailInboxMenu(clone);
    checkBmailInboxMenuAgain(clone);
    checkHasMailContent(template);

    const dvContainer = document.getElementById("dvContainer") as HTMLElement;
    observeForElementDirect(dvContainer, 500, () => {
        return document.querySelector("[id^='_dvModuleContainer_read.ReadModule']") as HTMLElement;
    }, async () => {
        checkHasMailContent(template);
    }, true);

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

    const homePageMenu = document.querySelector('li[id^="_mail_tabitem_0_"]');
    if (homePageMenu) {
        homePageMenu.addEventListener('click', checkBmailMenuAgain);
    }

    const inboxMenu = document.querySelector('li[id^="_mail_tabitem_8_"]');
    if (inboxMenu) {
        inboxMenu.addEventListener('click', checkBmailMenuAgain);
    }
}

function checkHasMailContent(template: HTMLTemplateElement) {
    let debounceTimer = setTimeout(() => {

        const composeDiv = document.querySelectorAll<HTMLElement>("[id^='_dvModuleContainer_compose.ComposeModule']");
        composeDiv.forEach(div => {
            prepareComposeEnv(div, template).then();
        });

        clearTimeout(debounceTimer);
        const readDiv = document.querySelectorAll<HTMLElement>("[id^='_dvModuleContainer_read.ReadModule']");
        readDiv.forEach(div => {
            addMailDecryptForReadingNetease(div, template);
            addEncryptBtnForQuickReply(div, template);
        });
    }, 1500);
}

function appendBmailInboxMenu(clone: HTMLElement) {
    // const ulElements = document.querySelectorAll('ul[aria-label="左侧导航"]');
    const ulElements = document.querySelectorAll('ul[id^="_mail_tree_0_"]');

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

function queryEmailAddrNetEase() {
    const mailAddr = document.getElementById('spnUid');
    if (!mailAddr) {
        return null;
    }
    console.log("------>>>mail address:", mailAddr.textContent);
    return mailAddr.textContent;
}

async function parseMailBodyToCheckCryptoButtonStatus(composeDiv: HTMLElement, btn: HTMLElement) {
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
    const nakedBmailTextDiv = findAllTextNodesWithEncryptedDiv(iframeDocument.body);
    nakedBmailTextDiv.forEach(wrappedDiv => {
        replaceTextNodeWithDiv(wrappedDiv as HTMLElement);
    })

    const mailEditAgainDiv = iframeDocument.querySelector('.bmail-encrypted-data-wrapper') as HTMLElement;
    if (mailEditAgainDiv) {
        const targetElement = mailEditAgainDiv.closest('#isReplyContent, #isForwardContent, .cm_quote_msg');
        if (!targetElement) {
            await decryptMailForEditionOfSentMail(mailEditAgainDiv);
            let nextSibling = mailEditAgainDiv.nextSibling;
            while (nextSibling && (nextSibling as HTMLElement).tagName === 'BR') {
                mailEditAgainDiv.appendChild(nextSibling);
                nextSibling = mailEditAgainDiv.nextSibling;
            }
            const editAreaDiv = document.createElement('div');
            editAreaDiv.id = 'spnEditorContent';
            editAreaDiv.append(mailEditAgainDiv);
            editAreaDiv.innerHTML += '<br><br><br>'
            iframeDocument.body.insertBefore(editAreaDiv, iframeDocument.body.firstChild);
        }
    }

    const replyOrForwardDiv = iframeDocument.querySelector('#isReplyContent, #isForwardContent, .cm_quote_msg') as HTMLQuoteElement | null;
    if (!replyOrForwardDiv) {
        checkFrameBody(iframeDocument.body, btn);
        return;
    }
    iframeDocument.body.dataset.theDivIsReply = 'true';
    let div = iframeDocument.getElementById('spnEditorContent') as HTMLElement;
    checkFrameBody(div, btn);
}

async function prepareComposeEnv(composeDiv: HTMLElement, template: HTMLTemplateElement) {
    let cryptoBtn = composeDiv.querySelector('.bmail-crypto-btn') as HTMLElement;
    if (cryptoBtn) {
        console.log("------>>> crypto btn already been added before for mail composing");
        await parseMailBodyToCheckCryptoButtonStatus(composeDiv, cryptoBtn);
        return;
    }
    const headerBtnList = composeDiv.querySelector(".js-component-toolbar.nui-toolbar");
    if (!headerBtnList) {
        console.log("------>>> header list not found for mail composition");
        return;
    }
    const title = browser.i18n.getMessage('crypto_and_send');
    const sendDiv = composeDiv.querySelector(".js-component-button.nui-mainBtn.nui-btn.nui-btn-hasIcon.nui-mainBtn-hasIcon") as HTMLElement;
    const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_48.png', ".bmail-crypto-btn",
        title, 'bmail_crypto_btn_in_compose_netEase', async _ => {
            await encryptDataAndSendNetEase(composeDiv, sendDiv);
        }
    ) as HTMLElement;

    await parseMailBodyToCheckCryptoButtonStatus(composeDiv, cryptoBtnDiv.querySelector('.bmail-crypto-btn') as HTMLElement);
    headerBtnList.insertBefore(cryptoBtnDiv, headerBtnList.children[1]);
    // console.log("------>>> encrypt button add success");

    const overlayButton = template.content.getElementById('attachmentOverlayButton') as HTMLButtonElement | null;
    if (!overlayButton) {
        console.log("----->>> overlayButton not found");
        return;
    }

    checkAttachmentBtn(composeDiv, overlayButton.cloneNode(true) as HTMLElement);
}

function checkAttachmentKey(composeDiv: HTMLElement): string | undefined {
    const attachArea = composeDiv.querySelector('div[id$="_attachContent"]') as HTMLInputElement;
    const allAttachDivs = attachArea.querySelectorAll(".G0");
    if (allAttachDivs.length === 0) {
        return undefined;
    }

    let aekId = "";
    for (let i = 0; i < allAttachDivs.length; i++) {
        const element = allAttachDivs[i];
        const fileName = element.querySelector(".o0")?.textContent;
        aekId = extractAesKeyId(fileName);
        if (!aekId) {
            continue;
        }
        break;
    }

    if (!aekId) {
        return undefined;
    }

    return queryAttachmentKey(aekId);
}
async function encryptDataAndSendNetEase(composeDiv: HTMLElement, sendDiv: HTMLElement) {

    showLoading();
    try {
        const iframe = composeDiv.querySelector(".APP-editor-iframe") as HTMLIFrameElement | null;
        let mailBody = iframe?.contentDocument?.body || iframe?.contentWindow?.document.body;
        if (!mailBody) {
            console.log("----->>> no frame body found:=>");
            return null;
        }

        if (mailBody.dataset.theDivIsReply === 'true') {
            mailBody = iframe?.contentDocument?.getElementById('spnEditorContent') as HTMLElement;
        }

        const receiverArea = composeDiv.querySelectorAll(".js-component-emailblock") as NodeListOf<HTMLElement>;
        const receiver = await processReceivers(receiverArea, (div) => {
            const emailElement = div.querySelector(".nui-addr-email");
            if (!emailElement) {
                return null;
            }
            return extractEmail(div.textContent ?? "");
        });

        const attachmentDiv = composeDiv.querySelector('div[id$="_attachBrowser"]') as HTMLInputElement;
        const composId = attachmentDiv.getAttribute('id') as string;

        const attachment = checkAttachmentKey(composeDiv);
        const success = await encryptMailInComposing(mailBody, receiver, attachment);
        if (!success) {
            return;
        }

        sendDiv.click();

        if (attachment) {
            removeAttachmentKey(composId)
        }
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

function addMailDecryptForReadingNetease(composeDiv: HTMLElement, template: HTMLTemplateElement) {

    const decryptBtn = composeDiv.querySelector(__decrypt_button_css_name) as HTMLElement;
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

    const headerBtnList = composeDiv.querySelector(".js-component-toolbar.nui-toolbar") as HTMLElement | null;
    if (!headerBtnList) {
        console.log("------>>> header list not found for netease mail reading");
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

    const nakedBmailTextDiv = findAllTextNodesWithEncryptedDiv(iframeDocument.body);
    nakedBmailTextDiv.forEach(wrappedDiv => {
        replaceTextNodeWithDiv(wrappedDiv as HTMLElement);
    })

    const cryptoBtnDiv = addDecryptButtonForBmailBody(template, mailArea, 'bmail_decrypt_btn_in_compose_netEase');
    if (!cryptoBtnDiv) {
        return;
    }

    headerBtnList.insertBefore(cryptoBtnDiv, headerBtnList.children[1]);
}

function addEncryptBtnForQuickReply(mailArea: HTMLElement, template: HTMLTemplateElement) {

    const quickReply = mailArea.querySelector('div[id$="_dvAttach_reply"]')
    if (!quickReply) {
        console.log("----->>> quick reply area not found");
        return;
    }

    const toolBarDiv = quickReply.querySelector('div[id$="_dvReplyBts"]') as HTMLElement
    if (!toolBarDiv) {
        console.log("----->>> tool bar in quick reply area not found");
        return;
    }
    const title = browser.i18n.getMessage('crypto_and_send');
    const mailBody = mailArea.querySelector('textarea[id$="_replyInput_inputId"]') as HTMLTextAreaElement;
    mailBody?.addEventListener('click', () => {
        let cryptoBtn = toolBarDiv.querySelector('.bmail-crypto-btn') as HTMLElement;
        if (cryptoBtn) {
            console.log("----->>> crypto button already been added for quick reply area");
            return;
        }

        const sendDiv = toolBarDiv.querySelector('div[role="button"]') as HTMLElement;
        const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_48.png', ".bmail-crypto-btn",
            title, 'bmail_crypto_btn_in_compose_netEase', async _ => {
                const emailDiv = mailArea.querySelectorAll('.nui-addr-email') as NodeListOf<HTMLElement>;
                const receiver = await processReceivers(emailDiv, (div) => {
                    return extractEmail(div?.textContent ?? "")
                });
                const success = await encryptDataAndSendForQuickReplyNetEase(mailBody, receiver, sendDiv);
                if (success) {
                    cryptoBtnDiv.parentNode?.removeChild(cryptoBtnDiv);
                }
            }
        ) as HTMLElement;

        toolBarDiv.insertBefore(cryptoBtnDiv, sendDiv);
    });
}

async function encryptDataAndSendForQuickReplyNetEase(mailBody: HTMLTextAreaElement, receiver: string[] | null, sendDiv: HTMLElement): Promise<boolean> {
    showLoading();
    try {
        mailBody.textContent = mailBody.value;
        const success = await encryptMailInComposing(mailBody, receiver);
        if (!success) {
            return false;
        }
        mailBody.value = mailBody.defaultValue;
        sendDiv.click();
        return true;
    } catch (e) {
        let err = e as Error;
        showTipsDialog("Warning", err.message);
        return false
    } finally {
        hideLoading();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const template = await parseContentHtml('html/inject_netease.html');
    appendForNetEase(template);
    console.log("------>>> netease content init success");
});

class DomainBMailProvider implements MailAddressProvider {
    readCurrentMailAddress(): string {
        return queryEmailAddrNetEase() ?? "";
    }
}

(window as any).mailAddressProvider = new DomainBMailProvider();


