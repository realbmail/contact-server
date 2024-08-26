import {
    checkFrameBody,
    encryptMailInComposing, decryptMailInReading,
    parseBmailInboxBtn,
    parseCryptoMailBtn, showTipsDialog, observeForElement, __localContactMap, queryContactFromSrv
} from "./content_common";
import {emailRegex, extractJsonString, hideLoading, MsgType, sendMessageToBackground, showLoading} from "./common";
import browser from "webextension-polyfill";
import {EmailReflects} from "./proto/bmail_srv";
import {showDialog} from "./main_common";

export function appendForGoogle(template: HTMLTemplateElement) {
    const clone = parseBmailInboxBtn(template, 'bmail_left_menu_btn_google');
    if (!clone) {
        console.warn("------>>> failed to parse bmail inbox button");
        return
    }

    observeForElement(
        () => {
            return document.querySelector('.TK') as HTMLElement;
        }, async () => {
            console.log("------>>>start to populate google area");
            monitorComposeBtnAction(template);
            monitorMainArea(template);
            addBMailInboxToMenu(clone);
            addCryptoBtnToComposeDiv(template);
            addCryptoBtnToReadingMail(template);
        });
}

function addBMailInboxToMenu(clone: HTMLElement) {
    const composBtn = document.querySelector(".T-I.T-I-KE.L3");
    if (!composBtn) {
        console.warn("------>>> compose button not found");
        return;
    }
    composBtn.parentNode!.appendChild(clone);
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


const _composeBtnParentClass = "td.I5"

function addCryptoBtnToComposeDiv(template: HTMLTemplateElement) {
    const allComposeDiv = document.querySelectorAll(_composeBtnParentClass);
    console.log("------>>> all compose div when loaded=>", allComposeDiv.length);
    allComposeDiv.forEach(tdDiv => {
        const mailBodyDiv = tdDiv.querySelector(".Am.aiL.Al.editable.LW-avf.tS-tW") as HTMLElement;
        const node = tdDiv.querySelector(".bmail-crypto-btn") as HTMLElement;
        if (node) {
            console.log("------>>> node already exists");
            checkFrameBody(mailBodyDiv, node);
            return;
        }

        const titleForm = tdDiv.querySelector("form") as HTMLElement;
        const title = browser.i18n.getMessage('crypto_and_send');

        const toolBarTr = tdDiv.querySelector("tr.btC") as HTMLElement;
        const sendDiv = toolBarTr.querySelector(".dC")?.firstChild as HTMLElement;
        const clone = parseCryptoMailBtn(template, 'file/logo_16.png', ".bmail-crypto-btn", title,
            "bmail_crypto_btn_in_compose_google", async btn => {
                await encryptMailAndSendGoogle(mailBodyDiv, btn, titleForm, sendDiv);
            });
        if (!clone) {
            console.log("------>>> node not found");
            return;
        }

        const newTd = document.createElement('td');
        newTd.append(clone);

        const secondTd = toolBarTr.querySelector('td:nth-child(2)');
        if (secondTd) {
            toolBarTr.insertBefore(newTd, secondTd);
        }
        checkFrameBody(mailBodyDiv, clone.querySelector(".bmail-crypto-btn") as HTMLElement);
    });
}

async function encryptMailAndSendGoogle(mailBody: HTMLElement, btn: HTMLElement, titleForm: HTMLElement, sendDiv: HTMLElement) {
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
            console.log("------>>> already encrypted data")
            return;
        }

        const receiver = await processReceivers(titleForm);
        const success = await encryptMailInComposing(mailBody, btn, receiver);
        if (!success) {
            return;
        }
        sendDiv.click();
    } catch (e) {
        console.log("------>>> decode or encode error:", e);
        showTipsDialog("error", "encrypt mail content failed");
    } finally {
        hideLoading();
    }
}

function monitorComposeBtnAction(template: HTMLTemplateElement) {
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
            }, async () => {
                addCryptoBtnToComposeDiv(template);
            });
    })
}


async function processReceivers(titleForm: HTMLElement): Promise<string[] | null> {
    let receiver: string[] = [];
    let emailToQuery: string[] = [];
    const divsWithDataHoverCardId = titleForm.querySelectorAll('div[data-hovercard-id]');

    for (let i = 0; i < divsWithDataHoverCardId.length; i++) {
        const div = divsWithDataHoverCardId[i];
        const emailAddr = div.getAttribute('data-hovercard-id') as string;
        console.log("------>>> mail address found:=>", emailAddr);

        const address = __localContactMap.get(emailAddr);
        if (address) {
            receiver.push(address);
            console.log("------>>> from cache:", emailAddr, " address:=>", address);
            continue;
        }
        emailToQuery.push(emailAddr);
    }

    return queryContactFromSrv(emailToQuery, receiver);
}

function monitorMainArea(template: HTMLTemplateElement) {
    const mainArea = document.querySelector(".nH.bkK") as HTMLElement;
    mainArea.addEventListener('click', (event) => {
        console.log('-------->>>> click found in main area.');
        const targetElement = event.target as HTMLElement;
        console.log("------>>>target element", targetElement)
        const trDiv = targetElement.closest('tr') as HTMLElement | null;
        const isCollapseMail = targetElement.className === "gE hI" || targetElement.querySelector('.gE.hI') != null;
        if (!trDiv && !isCollapseMail) {
            console.log("------>>> no target element to check", targetElement);
            return;
        }

        if (trDiv) {
            const className = trDiv!.className as string;
            const collapseTitle = trDiv!.querySelector(".iA.g6")
            const replayOrForwardDiv = trDiv!.querySelector(".amn") as HTMLElement | null;

            if (className != "zA yO aqw" && className != "zA zE aqw" && collapseTitle === null && replayOrForwardDiv === null) {
                console.log("------>>> not target tr", trDiv);
                return;
            }
        }

        let idleTimer = setTimeout(() => {
            console.log("------>>> target hint, check elements and add bmail buttons");
            clearTimeout(idleTimer);
            addCryptoBtnToComposeDiv(template);
            addCryptoBtnToReadingMail(template, mainArea);
        }, 1000);

    });
}

function addCryptoBtnToReadingMail(template: HTMLTemplateElement, mainArea?: HTMLElement) {
    let parentDiv = document.body;
    if (mainArea) {
        parentDiv = mainArea;
    }

    const mailBodyList = parentDiv.querySelectorAll(".adn.ads") as NodeListOf<HTMLElement>;
    console.log("------>>> all reading div found:", mailBodyList.length);
    mailBodyList.forEach((oneMail) => {
        const mailParentDiv = oneMail.querySelector(".a3s.aiL") as HTMLElement | null;
        let mailContentDiv = mailParentDiv?.firstChild as HTMLElement | null;
        if (!mailParentDiv || !mailContentDiv) {
            console.log("------>>> mail div not found:");
            return;
        }

        if (mailContentDiv.querySelector(".adm")) {
            mailContentDiv = mailContentDiv.children[0] as HTMLElement;
            if (!mailContentDiv) {
                console.log("------>>> unknown html architecture!")
                return;
            }
        }

        const bmailBtn = oneMail.querySelector(".bmail-decrypt-btn") as HTMLElement;
        if (bmailBtn) {
            console.log("------>>> duplicate bmail button found for mail reading......")
            checkFrameBody(mailContentDiv, bmailBtn);
            return;
        }

        const mailData = extractJsonString(mailContentDiv.innerText as string);
        if (!mailData) {
            console.log("------->>> this is not a bmail body......[", mailData, "]mailContentDiv=>", mailContentDiv)
            return;
        }
        console.log("------>>>first body =>", mailContentDiv);
        const title = browser.i18n.getMessage('decrypt_mail_body')
        const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_16_out.png', ".bmail-decrypt-btn",
            title, 'bmail_decrypt_btn_in_compose_google', async btn => {
                await decryptMailInReading(mailContentDiv, mailData.json, btn);
            });

        mailParentDiv.insertBefore(cryptoBtnDiv!, mailParentDiv.firstChild);

        const blockquotes = mailParentDiv.querySelectorAll('blockquote');
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
            console.log("------>>>quoted body =>", quoteBody);
            cryptoBtnDiv?.addEventListener('click', async () => {
                await decryptMailInReading(quoteBody, quotedMailData.json, cryptoBtnDiv.querySelector(".bmail-decrypt-btn") as HTMLElement);
            });
        });
        console.log("------>>> add decrypt button to reading mail success......")
    })
}
