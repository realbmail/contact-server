import {
    __localContactMap, addCryptButtonForEveryBmailDiv,
    checkFrameBody, encryptMailInComposing,
    observeForElement, observeFrame,
    parseBmailInboxBtn,
    parseCryptoMailBtn, processReceivers, queryContactFromSrv,
    showTipsDialog
} from "./content_common";
import {emailRegex, extractEmail, hideLoading, MsgType, sendMessageToBackground, showLoading} from "./common";
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

    const sendDiv = toolBar.querySelector(".xmail_sendmail_btn") as HTMLElement;
    const title = browser.i18n.getMessage('crypto_and_send');
    const receiverTable = composeBodyDiv.querySelector('div.compose_mailInfo_item.new:not(.hide)') as HTMLElement;
    const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_16.png', ".bmail-crypto-btn",
        title, 'bmail_crypto_btn_in_compose_qq', async btn => {
            mailContentDiv = checkMailContent(mailContentDiv);
            await encryptMailAndSendQQ(mailContentDiv, btn, receiverTable, sendDiv);
        }
    ) as HTMLElement;

    if (toolBar.children.length > 1) {
        toolBar.insertBefore(cryptoBtnDiv, toolBar.children[1]);
    } else {
        toolBar.appendChild(cryptoBtnDiv);
    }
}

function checkMailContent(mailContentDiv: HTMLElement): HTMLElement {
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

async function encryptMailAndSendQQ(mailBody: HTMLElement, btn: HTMLElement, receiverTable: HTMLElement, sendDiv: HTMLElement) {
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

async function monitorQQMailReading(template: HTMLTemplateElement) {
    const mainArea = document.querySelector(".frame-main") as HTMLElement | null;
    if (!mainArea) {
        console.log("------>>> no mail reading area found");
        return;
    }
    mainArea.addEventListener("click", (event) => {
        console.log('-------->>>> click found in main area.');
        const targetElement = event.target as HTMLElement;
        console.log("------>>>target element", targetElement)
        const mailItemDiv = targetElement.closest('div.mail-list-page-item') as HTMLElement | null;
        if (!mailItemDiv) {
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

    const decryptBtn = toolBar.querySelector('.bmail-decrypt-btn') as HTMLElement;
    if (decryptBtn) {
        console.log("------>>> decrypt button already been added for reading");
        return;
    }

    const mailArea = parentDiv.querySelector(".xmail-ui-float-scroll .mail-detail-content") as HTMLElement | null;
    if (!mailArea) {
        console.log("------>>> no reading mail body found");
        return;
    }

    const cryptoBtnDiv = addCryptButtonForEveryBmailDiv(template, mailArea, 'bmail_decrypt_btn_in_compose_qq');
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

    const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_16.png', ".bmail-crypto-btn",
        title, 'bmail_crypto_btn_in_compose_qq_simple', async btn => {
            await encryptSimpleMailReplyQQ(mailContentDiv, email, btn, sendDiv);
        }
    ) as HTMLElement;
    toolbar?.insertBefore(cryptoBtnDiv, toolbar?.children[1]);
}

async function encryptSimpleMailReplyQQ(mailBody: HTMLElement, email: string, btn: HTMLElement, sendDiv: HTMLElement) {
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
        const success = await encryptMailInComposing(mailBody, btn, [address]);
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
        const iframeDocument = iframe?.contentDocument || iframe?.contentWindow?.document;
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
    const receiverTable = iframeDocument!.getElementById('toAreaCtrl') as HTMLElement;
    const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_16.png', ".bmail-crypto-btn",
        title, 'bmail_crypto_btn_in_compose_qq_old', async btn => {
            const mailContentDiv = checkMailContentOldVersion(composeDocument.body);
            await encryptMailAndSendQQOldVersion(mailContentDiv, btn, receiverTable, sendDiv);
        }
    ) as HTMLElement;

    if (toolBarDiv.children.length > 2) {
        toolBarDiv.insertBefore(cryptoBtnDiv, toolBarDiv.children[2]);
    } else {
        toolBarDiv.appendChild(cryptoBtnDiv);
    }
}

const __bmailComposeDivId = "bmail-mail-body-for-qq";

function checkMailContentOldVersion(docBody: HTMLElement): HTMLElement {
    const replyOrQuoteDiv = docBody.querySelector("includetail") as HTMLElement | null;
    if (!replyOrQuoteDiv) {
        return docBody;
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
        // div.appendChild(sibling.cloneNode(true));
        const previousSibling = sibling.previousElementSibling;
        sibling.remove();
        sibling = previousSibling;
    }

    div.insertBefore(docBody.firstChild as HTMLElement, div.firstChild as HTMLElement);
    docBody.insertBefore(div, docBody.firstChild);
    return div;
}

async function encryptMailAndSendQQOldVersion(mailBody: HTMLElement, btn: HTMLElement, receiverTable: HTMLElement, sendDiv: HTMLElement) {
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
        const allEmailAddrDivs = receiverTable.querySelectorAll(".addr_base.addr_normal") as NodeListOf<HTMLElement>;
        const receiver = await processReceivers(allEmailAddrDivs, (div) => {
            return div.getAttribute('addr')?.trim() as string | null;
        });

        if (!receiver || receiver.length <= 0) {
            return;
        }
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

    let oldArea: HTMLElement;
    observeFrame(iframe, (doc) => {
        const newArea = doc.getElementById("mainmail") as HTMLElement;
        if (oldArea == newArea) {
            return null;
        }
        oldArea = newArea;
        return newArea;
    }, async (doc) => {
        console.log("--------------------->>> frame document", doc.getElementById("mainmail"));
        await addCryptoBtnToReadingMailQQOldVersion(template, doc);
    });
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

    const decryptBtn = toolBarDiv.querySelector('.bmail-decrypt-btn') as HTMLElement;
    if (decryptBtn) {
        console.log("------>>> decrypt button already been added for reading");
        return;
    }

    const mailArea = doc.getElementById("contentDiv");
    if (!mailArea) {
        console.log("------>>> no reading mail body found [old version]");
        return;
    }

    const cryptoBtnDiv = addCryptButtonForEveryBmailDiv(template, mailArea, 'bmail_decrypt_btn_in_compose_qq_old');
    if (!cryptoBtnDiv) {
        return;
    }

    if (toolBarDiv.childNodes.length > 2) {
        toolBarDiv.insertBefore(cryptoBtnDiv, toolBarDiv.children[1]);
    } else {
        toolBarDiv.appendChild(cryptoBtnDiv);
    }
}