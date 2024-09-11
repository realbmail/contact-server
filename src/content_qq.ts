import {
    __decrypt_button_css_name,
    __localContactMap,
    addDecryptButtonForBmailBody,
    checkFrameBody, decryptMailForEditionOfSentMail, decryptMailInReading,
    encryptMailInComposing, findAllTextNodesWithEncryptedDiv,
    observeForElement,
    observeFrame,
    parseBmailInboxBtn,
    parseCryptoMailBtn, processReceivers,
    queryContactFromSrv, replaceTextNodeWithDiv, showTipsDialog
} from "./content_common";
import {
    emailRegex,
    extractEmail, hideLoading,
    MsgType, sendMessageToBackground,
    showLoading,
} from "./common";
import browser from "webextension-polyfill";

export function appendForQQ(template: HTMLTemplateElement) {

    observeForElement(document.body, 1000,
        () => {
            return document.querySelector(".ui-float-scroll-body.sidebar-menus") as HTMLElement || document.getElementById("leftPanel") as HTMLElement;
        }, async () => {
            console.log("------->>>start to populate qq mail area",);
            monitorComposeActionQQ(template).then();
            appendBmailInboxMenuQQ(template).then();
            monitorQQMailReading(template).then();
            addCryptoBtnToReadingMailQQ(template).then();
            addCryptoBtnToComposeDivQQ(template).then();
            monitorQQMailReadingOldVersion(template).then();
        });
}

async function appendBmailInboxMenuQQ(template: HTMLTemplateElement) {
    const menuParentDiv1 = document.querySelector(".ui-float-scroll-body.sidebar-menus");
    const menuParentDiv2 = document.getElementById("SysFolderList")?.firstElementChild as HTMLElement;
    const menuParentDiv = menuParentDiv1 || menuParentDiv2;
    if (!menuParentDiv) {
        console.log("------>>> menu parent div not found");
        return;
    }
    let clone = parseBmailInboxBtn(template, "bmail_left_menu_btn_qq") as HTMLElement;
    if (!menuParentDiv1) {
        clone = parseBmailInboxBtn(template, "bmail_left_menu_btn_qq_old") as HTMLElement;
    }

    if (menuParentDiv.children.length >= 2) {
        menuParentDiv.insertBefore(clone, menuParentDiv.children[1]);
    } else {
        menuParentDiv.appendChild(clone);
    }
}

export function queryEmailAddrQQ() {
    const parentDiv = document.querySelector(".profile-user-info");
    const userEmailSpan1 = parentDiv?.querySelector('span.user-email');
    const userEmailSpan2 = document.getElementById("useraddr");
    const userEmailSpan = userEmailSpan1 || userEmailSpan2;
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

async function addCryptoBtnToComposeDivQQ(template: HTMLTemplateElement) {
    const composeBodyDiv = document.querySelector(".compose_body");
    if (!composeBodyDiv) {
        console.log("------>>> no compose body found for new version");
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

    let mailContentDiv = iframeDocument.querySelector(".rooster-content-body") as HTMLElement;
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

    mailContentDiv = await checkMailContent(mailContentDiv);

    const sendDiv = toolBar.querySelector(".xmail_sendmail_btn") as HTMLElement;
    const title = browser.i18n.getMessage('crypto_and_send');
    const receiverTable = composeBodyDiv.querySelector('div.compose_mail_wrapper') as HTMLElement;
    const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_48.png', ".bmail-crypto-btn",
        title, 'bmail_crypto_btn_in_compose_qq', async btn => {
            await encryptMailAndSendQQ(mailContentDiv, receiverTable, sendDiv);
        }
    ) as HTMLElement;

    if (toolBar.children.length > 1) {
        toolBar.insertBefore(cryptoBtnDiv, toolBar.children[1]);
    } else {
        toolBar.appendChild(cryptoBtnDiv);
    }
}

async function checkMailContent(mailContentDiv: HTMLElement): Promise<HTMLElement> {

    const firstChild = mailContentDiv.firstChild as HTMLElement;
    if (firstChild && firstChild.classList.contains('qmbox')) {
        const div = document.createElement("div");
        div.id = __bmailComposeDivId;
        mailContentDiv.insertBefore(div, mailContentDiv.firstChild);
        const originalTxtDiv = firstChild.querySelector(".bmail-encrypted-data-wrapper") as HTMLElement
        if (!originalTxtDiv) {
            return mailContentDiv;
        }

        await decryptMailForEditionOfSentMail(originalTxtDiv);
        div.append(originalTxtDiv);
        div.innerHTML += '<br><br>'
        return div;
    }

    const replyOrQuoteDiv = mailContentDiv.querySelector(".xm_compose_origin_mail_container") as HTMLElement | null;
    if (!replyOrQuoteDiv) {
        return mailContentDiv
    }
    const div = document.createElement("div");
    div.id = __bmailComposeDivId;

    const childrenArray = Array.from(mailContentDiv.children) as HTMLElement[];
    childrenArray.forEach((subNode) => {
        if (subNode !== replyOrQuoteDiv) {
            div.appendChild(subNode);
        }
    });

    mailContentDiv.insertBefore(div, replyOrQuoteDiv);
    return div;
}

async function encryptMailAndSendQQ(mailBody: HTMLElement, receiverTable: HTMLElement, sendDiv: HTMLElement) {
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
        const allEmailAddressDiv = receiverTable?.querySelectorAll(".new_compose_mailAddress_item") as NodeListOf<HTMLElement>;
        const receiver = await processReceivers(allEmailAddressDiv, (div) => {
            return extractEmail(div.title);
        });
        if (!receiver || receiver.length <= 0) {
            return;
        }

        const success = await encryptMailInComposing(mailBody, receiver);
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

async function monitorQQMailReading(template: HTMLTemplateElement) {
    const mainArea = document.querySelector(".frame-main") as HTMLElement | null;
    if (!mainArea) {
        console.log("------>>> no mail reading area found");
        return;
    }

    let messageTipDiv = document.querySelectorAll(".xm_mailPushTip_contatinerBox")
    messageTipDiv.forEach(message => {
        message.addEventListener("click", async () => {
            setTimeout(async () => {
                await addCryptoBtnToReadingMailQQ(template, mainArea);
            }, 1500);
        })
    });

    mainArea.addEventListener("click", (event) => {
        const targetElement = event.target as HTMLElement;
        console.log("------>>>target element", targetElement)
        const mailItemDiv = targetElement.closest('div.mail-list-page-item') as HTMLElement | null;
        const nextOrPreviousMailBtn = targetElement.closest(".mail-list-page-toolbar.toolbar-only-reader")
        if (!mailItemDiv && !nextOrPreviousMailBtn) {
            console.log("------>>> this is not a mail reading action");
            return;
        }

        let idleTimer = setTimeout(() => {
            console.log("------>>> target hint, check elements and add bmail buttons");
            clearTimeout(idleTimer);
            addCryptoBtnToReadingMailQQ(template, mainArea);
        }, 800);
    });
}

async function addCryptoBtnToReadingMailQQ(template: HTMLTemplateElement, mainArea?: HTMLElement) {
    console.log("------>>> try to add button to mail reading div");
    let parentDiv = document.body;
    if (mainArea) {
        parentDiv = mainArea;
    }
    const toolBar = parentDiv.querySelector(".basic-body-item .mail-detail-basic-action-bar") as HTMLElement | null;
    if (!toolBar) {
        console.log("------>>> tool bar for crypt button not found");
        return;
    }

    const decryptBtn = toolBar.querySelector(__decrypt_button_css_name) as HTMLElement;
    if (decryptBtn) {
        console.log("------>>> decrypt button already been added for reading");
        return;
    }

    const mailArea = parentDiv.querySelector(".xmail-ui-float-scroll .mail-detail-content") as HTMLElement | null;
    if (!mailArea) {
        console.log("------>>> no reading mail body found");
        return;
    }

    const nakedBmailTextDiv = findAllTextNodesWithEncryptedDiv(mailArea);
    nakedBmailTextDiv.forEach(wrappedDiv => {
        replaceTextNodeWithDiv(wrappedDiv as HTMLElement);
    })

    const cryptoBtnDiv = addDecryptButtonForBmailBody(template, mailArea, 'bmail_decrypt_btn_in_compose_qq');
    if (!cryptoBtnDiv) {
        return;
    }

    toolBar.insertBefore(cryptoBtnDiv, toolBar.firstChild);

    const replayBar = parentDiv.querySelector(".mail-detail-reply") as HTMLElement | null;
    if (replayBar) {
        replayBar.addEventListener("click", () => {
            let idleTimer = setTimeout(() => {
                clearTimeout(idleTimer);
                addCryptoBtnToSimpleReply(template, replayBar).then();
            }, 1000);
        })
    }
}

async function addCryptoBtnToSimpleReply(template: HTMLTemplateElement, replayBar: HTMLElement) {

    const mailBody = replayBar.querySelector(".reply-editor") as HTMLElement | null;
    if (!mailBody) {
        console.log("------>>> no simple reply content found");
        return;
    }

    let iframe = mailBody.querySelector(".editor_iframe") as HTMLIFrameElement | null;
    const iframeDocument = iframe?.contentDocument || iframe?.contentWindow?.document;
    if (!iframeDocument) {
        console.log("----->>> no frame body found in simple replay area:=>");
        return null;
    }

    const toolbar = replayBar.querySelector(".mail-reader-page-reply-footer");
    const sendDiv = toolbar?.children[0] as HTMLElement | null;
    if (!sendDiv) {
        console.log("------>>> send button not found for simple reply area");
        return;
    }

    const title = browser.i18n.getMessage('crypto_and_send');
    const mailContentDiv = iframeDocument.querySelector(".rooster-content-body") as HTMLElement;
    const receiverDiv = replayBar.querySelector('.cmp-account-email') as HTMLElement;
    const email = extractEmail(receiverDiv.textContent ?? "");
    if (!email) {
        console.log("------>>> no receiver in simple reply");
        return;
    }

    const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_48.png', ".bmail-crypto-btn",
        title, 'bmail_crypto_btn_in_compose_qq_simple', async btn => {
            await encryptSimpleMailReplyQQ(mailContentDiv, email, sendDiv);
        }
    ) as HTMLElement;
    toolbar?.insertBefore(cryptoBtnDiv, toolbar?.children[1]);
}

async function encryptSimpleMailReplyQQ(mailBody: HTMLElement, email: string, sendDiv: HTMLElement) {
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

        let address = __localContactMap.get(email);
        if (!address) {
            const receiver = await queryContactFromSrv([email], []);
            if (!receiver || receiver.length <= 0) {
                showTipsDialog("Warning", "no blockchain address found for email:" + email);
                return;
            }
            address = receiver[0];
        }
        const success = await encryptMailInComposing(mailBody, [address]);
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

async function monitorComposeActionQQ(template: HTMLTemplateElement) {
    let frameMainDiv = document.querySelector(".frame-main") as HTMLElement;

    if (frameMainDiv) {
        let iframe = frameMainDiv.querySelector(".editor_iframe") as HTMLElement | null;

        observeForElement(frameMainDiv, 800, () => {

            const newFrame = frameMainDiv.querySelector(".editor_iframe") as HTMLElement | null;
            if (iframe === newFrame) {
                return null;
            }
            iframe = newFrame;
            return newFrame;

        }, async () => {
            addCryptoBtnToComposeDivQQ(template).then()
        }, true);

        return;
    }

    const monitorDiv = document.getElementById("resize") as HTMLElement;
    let oldElement: HTMLElement | null = null;
    observeForElement(monitorDiv, 800, () => {
        const iframe = document.getElementById("mainFrameContainer")?.querySelector('iframe[name="mainFrame"]') as HTMLIFrameElement | null;
        const iframeDocument = iframe?.contentDocument;
        const formInFrame = iframeDocument?.getElementById("frm") as HTMLIFrameElement | null;
        if (formInFrame == oldElement) {
            return null;
        }
        oldElement = formInFrame;
        return formInFrame;
    }, async () => {
        console.log("------>>> old qq mail query iframe");
        await addCryptoBtnToComposeDivQQ(template).then()
        await addCryptoBtnToComposeDivQQOldVersion(template);

    }, true);
}

async function addCryptoBtnToComposeDivQQOldVersion(template: HTMLTemplateElement) {
    const iframe = document.getElementById("mainFrameContainer")?.querySelector('iframe[name="mainFrame"]') as HTMLIFrameElement | null;
    const iframeDocument = iframe?.contentDocument || iframe?.contentWindow?.document;
    const composeForm = iframeDocument?.getElementById("frm") as HTMLIFrameElement | null;
    if (!composeForm) {
        console.log("------>>> no compose form found for qq mail of old version")
        return;
    }
    const mailContentIframe = composeForm.querySelector('iframe.qmEditorIfrmEditArea') as HTMLIFrameElement | null;
    const composeDocument = mailContentIframe?.contentDocument || mailContentIframe?.contentWindow?.document;
    if (!composeDocument) {
        console.log("----->>>  mail content frame not found for qq mail of old version");
        return;
    }

    const toolBarDiv = composeForm.querySelector(".toolbg.toolbgline");
    if (!toolBarDiv) {
        console.log("------>>> tool bar not found when compose mail");
        return;
    }
    const cryptoBtn = toolBarDiv.querySelector(".bmail-crypto-btn") as HTMLElement;
    if (cryptoBtn) {
        console.log("------>>> node already exists");
        return;
    }

    const sendDiv = toolBarDiv.querySelector('a[name="sendbtn"]') as HTMLElement;
    const title = browser.i18n.getMessage('crypto_and_send');
    const receiverTable = iframeDocument!.getElementById('addrsDiv') as HTMLElement;

    const mailContentDiv = await checkMailContentOldVersion(composeDocument.body);

    const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_48.png', ".bmail-crypto-btn",
        title, 'bmail_crypto_btn_in_compose_qq_old', async btn => {
            await encryptMailAndSendQQOldVersion(mailContentDiv, receiverTable, sendDiv);
        }
    ) as HTMLElement;

    toolBarDiv.insertBefore(cryptoBtnDiv, toolBarDiv.children[2]);
}

const __bmailComposeDivId = "bmail-mail-body-for-qq";

async function checkMailContentOldVersion(docBody: HTMLElement): Promise<HTMLElement> {
    const replyOrQuoteDiv = docBody.querySelector("includetail") as HTMLElement | null;
    if (!replyOrQuoteDiv) {
        const div = document.createElement("div");
        div.id = __bmailComposeDivId;
        docBody.insertBefore(div, docBody.firstChild);
        const originalTxtDiv = docBody.querySelector(".bmail-encrypted-data-wrapper") as HTMLElement
        if (!originalTxtDiv) {
            return docBody;
        }
        await decryptMailForEditionOfSentMail(originalTxtDiv);
        div.append(originalTxtDiv);
        div.innerHTML += '<br><br>';
        return div;
    }

    const bmailContentDiv = document.getElementById(__bmailComposeDivId) as HTMLElement;
    if (bmailContentDiv) {
        return bmailContentDiv;
    }

    const div = document.createElement("div");
    div.id = __bmailComposeDivId;

    const targetDiv = replyOrQuoteDiv.querySelector('div[style="font-size: 12px;font-family: Arial Narrow;padding:2px 0 2px 0;"]');
    if (!targetDiv) {
        console.log("----->>> reply flag not found [old version]");
        return docBody;
    }

    let sibling = targetDiv.previousElementSibling;
    while (sibling) {
        div.insertBefore(sibling.cloneNode(true), div.lastElementChild as HTMLElement);
        const previousSibling = sibling.previousElementSibling;
        sibling.remove();
        sibling = previousSibling;
    }

    div.insertBefore(docBody.firstChild as HTMLElement, div.firstChild as HTMLElement);
    docBody.insertBefore(div, docBody.firstChild);
    return div;
}

async function encryptMailAndSendQQOldVersion(mailBody: HTMLElement, receiverTable: HTMLElement, sendDiv: HTMLElement) {
    showLoading();
    try {
        const allEmailAddrDivs = receiverTable.querySelectorAll(".addr_base.addr_normal") as NodeListOf<HTMLElement>;
        const receiver = await processReceivers(allEmailAddrDivs, (div) => {
            return div.getAttribute('addr')?.trim() as string | null;
        });

        const success = await encryptMailInComposing(mailBody, receiver);
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

async function monitorQQMailReadingOldVersion(template: HTMLTemplateElement) {
    let frameMainDiv = document.querySelector(".frame-main") as HTMLElement;
    if (frameMainDiv) {
        console.log("------>> this is new qq mail");
        return;
    }

    const div = document.getElementById("mainFrameContainer") as HTMLElement;
    let iframe = div.querySelector('iframe[name="mainFrame"]') as HTMLIFrameElement | null;
    if (!iframe) {
        return;
    }

    observeFrame(iframe, async (doc) => {
        await addCryptoBtnToReadingMailQQOldVersion(template, doc);
        addListenerForQuickReplyOldVersion(template, doc);
    });
}

function addListenerForQuickReplyOldVersion(template: HTMLTemplateElement, doc: Document) {
    const replyArea = doc.getElementById("QuickReplyPart");
    if (!replyArea) {
        console.log("------>>> reply area not found");
        return;
    }

    observeForElement(replyArea, 1000, () => {
        return doc.getElementById("rteContainer")?.querySelector("iframe") as HTMLIFrameElement
    }, async () => {
        console.log("------>>> quick reply area found");

        const iframe = doc.getElementById("rteContainer")?.querySelector("iframe") as HTMLIFrameElement
        const toolBarDiv = doc.getElementById("qmQuickReplyButtonContainer") as HTMLElement;
        const cryptoBtn = toolBarDiv.querySelector('.bmail-crypto-btn') as HTMLElement;

        if (cryptoBtn) {
            console.log("------>>> decrypt button already been added for quick reply frame");
            return;
        }

        const sendDiv = toolBarDiv.firstChild as HTMLElement;
        const title = browser.i18n.getMessage('crypto_and_send');
        const mailContentDiv = (iframe.contentDocument as Document).body as HTMLElement;

        const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_48.png', ".bmail-crypto-btn",
            title, 'bmail_crypto_btn_in_compose_qq_old', async btn => {
                const spansWithEAttribute = doc.querySelectorAll('span[e]') as NodeListOf<HTMLElement>; // 查询包含 e 属性的所有 span 元素

                const receiver = await processReceivers(spansWithEAttribute, (span) => {
                    return extractEmail(span.getAttribute('e') ?? "");
                });

                const elements = doc.querySelectorAll('div[data-has-decrypted="true"]') as NodeListOf<HTMLElement>;

                elements.forEach(bmailBody => {
                    decryptMailInReading(bmailBody, cryptoBtn).then();
                })

                const success = await encryptMailInComposing(mailContentDiv, receiver);
                if (!success) {
                    return;
                }

                sendDiv.click();

                const parentCryptoBtn = doc.querySelector(".bmail-decrypt-btn.bmail-decrypt-btn-qq_old") as HTMLElement;
                const mailArea = doc.getElementById("mailContentContainer") as HTMLElement;
                checkFrameBody(mailArea, parentCryptoBtn)
            }
        ) as HTMLElement;

        toolBarDiv.insertBefore(cryptoBtnDiv, sendDiv);
    })
}

async function addCryptoBtnToReadingMailQQOldVersion(template: HTMLTemplateElement, doc: Document) {

    const parentDiv = doc.getElementById("mainmail") as HTMLElement;
    if (!parentDiv) {
        console.log("------>>> mail area not found [old version]");
        return
    }

    const toolBarDiv = doc.getElementById("toolbgline_top")?.querySelector(".nowrap.qm_left");
    if (!toolBarDiv) {
        console.log("------>>> tool bar not found [old version]");
        return
    }

    const decryptBtn = toolBarDiv.querySelector(__decrypt_button_css_name) as HTMLElement;
    if (decryptBtn) {
        console.log("------>>> decrypt button already been added for reading");
        return;
    }

    const mailArea = doc.getElementById("mailContentContainer");
    if (!mailArea) {
        console.log("------>>> no reading mail body found [old version]");
        return;
    }

    const nakedBmailTextDiv = findAllTextNodesWithEncryptedDiv(mailArea);
    nakedBmailTextDiv.forEach(wrappedDiv => {
        replaceTextNodeWithDiv(wrappedDiv as HTMLElement);
    })

    const cryptoBtnDiv = addDecryptButtonForBmailBody(template, mailArea, 'bmail_decrypt_btn_in_compose_qq_old') as HTMLElement;
    if (!cryptoBtnDiv) {
        return;
    }

    toolBarDiv.insertBefore(cryptoBtnDiv, toolBarDiv.children[1]);
}