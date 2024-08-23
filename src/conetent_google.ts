import {
    checkFrameBody,
    cryptMailBody, decryptMailInReading,
    parseBmailInboxBtn,
    parseCryptoMailBtn, showTipsDialog
} from "./content_common";
import {emailRegex, extractJsonString, hideLoading, MsgType, sendMessageToBackground, showLoading} from "./common";
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

function observeForElement(foundFunc: () => HTMLElement | null, callback: () => Promise<void>) {
    const idleThreshold = 300;
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
        checkFrameBody(mailBodyDiv, clone.querySelector(".bmail-crypto-btn") as HTMLElement);
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
            await resetEncryptMailBody(mailBody, bodyTextContent);
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

async function resetEncryptMailBody(mailBody: HTMLElement, mailContent: string) {
    if (mailBody.dataset.originalHtml) {
        mailBody.innerHTML = mailBody.dataset.originalHtml!;
        mailBody.dataset.originalHtml = undefined;
        return;
    }

    const mailRsp = await browser.runtime.sendMessage({
        action: MsgType.DecryptData,
        data: mailContent
    })

    if (mailRsp.success <= 0) {
        if (mailRsp.success === 0) {
            return;
        }
        showTipsDialog("Tips", mailRsp.message);
        return;
    }
    mailBody.innerHTML = mailRsp.data;
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

    return receiver;
}

function monitorMainArea(template: HTMLTemplateElement) {
    const mainArea = document.querySelector(".nH.bkK") as HTMLElement;
    mainArea.addEventListener('click', (event) => {
        console.log('-------->>>> click found in main area.');
        const targetElement = event.target as HTMLElement;
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
        const mailContentDiv = mailParentDiv?.children[0] as HTMLElement | null;
        if (!mailParentDiv || !mailContentDiv) {
            console.log("------>>> mail div not found:");
            return;
        }

        const bmailBtn = oneMail.querySelector(".bmail-crypto-btn-div") as HTMLElement;
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

        const title = browser.i18n.getMessage('decrypt_mail_body')
        const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_16_out.png', ".bmail-decrypt-btn",
            title, 'bmail_decrypt_btn_in_compose_google', async btn => {
                await decryptMailInReading(mailContentDiv, mailData.json, btn);
            });

        mailParentDiv.append(cryptoBtnDiv!);
        const blockquote = mailParentDiv!.querySelector('blockquote.gmail_quote');
        if (blockquote) {
            const quoteBody = blockquote.firstChild as HTMLElement;
            const cryptoBtnDivQuote = parseCryptoMailBtn(template, 'file/logo_16_out.png', ".bmail-decrypt-btn",
                title, 'bmail_decrypt_btn_in_compose_google', async btn => {
                    await decryptMailInReading(quoteBody, quoteBody.innerText.trim(), btn);
                });
            blockquote.insertBefore(cryptoBtnDivQuote!, quoteBody);
        }
        console.log("------>>> add decrypt button to reading mail success......")
    })
}
