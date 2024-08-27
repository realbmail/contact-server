import {
    __localContactMap,
    addCryptButtonForEveryBmailDiv,
    checkFrameBody,
    encryptMailInComposing,
    observeForElement,
    parseBmailInboxBtn,
    parseCryptoMailBtn,
    queryContactFromSrv,
    showTipsDialog
} from "./content_common";
import {emailRegex, hideLoading, MsgType, sendMessageToBackground, showLoading} from "./common";
import browser from "webextension-polyfill";

export function appendForGoogle(template: HTMLTemplateElement) {
    const clone = parseBmailInboxBtn(template, 'bmail_left_menu_btn_google') as HTMLElement;

    console.log("------>>> start to append element to google mail");
    const viewAllMailDiv = document.querySelector(".bodycontainer");
    if (viewAllMailDiv) {
        console.log("------>>> this is view all mail content");
        addDecryptBtnToSimpleMailAllDiv(template, viewAllMailDiv as HTMLElement);
        return;
    }
    monitorComposeAction(template).then();

    observeForElement(document.body, 1000,
        () => {
            return document.querySelector('.TK') as HTMLElement;
        }, async () => {
            console.log("------>>>start to populate google area");
            // monitorComposeBtnAction(template).then();
            monitorGmailMainArea(template).then();
            addBMailInboxToMenu(clone).then();
            // addCryptoBtnToComposeDiv(template).then();
            addCryptoBtnToReadingMailGoogle(template).then();
        });
}

async function addBMailInboxToMenu(clone: HTMLElement) {
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

async function addCryptoBtnToComposeDivGoogle(template: HTMLTemplateElement) {
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

async function monitorComposeBtnAction(template: HTMLTemplateElement) {
    const composBtn = document.querySelector(".T-I.T-I-KE.L3");
    if (!composBtn) {
        console.warn("------>>> compose button not found");
        return;
    }

    composBtn.addEventListener('click', () => {
        observeForElement(document.body, 800,
            () => {
                const allComposeDiv = document.querySelectorAll(_composeBtnParentClass);
                if (allComposeDiv.length > 0) {
                    return allComposeDiv[allComposeDiv.length - 1] as HTMLElement;
                }
                return null;
            }, async () => {
                await addCryptoBtnToComposeDivGoogle(template);
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

async function monitorGmailMainArea(template: HTMLTemplateElement) {
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
            addCryptoBtnToComposeDivGoogle(template);
            addCryptoBtnToReadingMailGoogle(template, mainArea);
        }, 1000);

    });
}

async function addCryptoBtnToReadingMailGoogle(template: HTMLTemplateElement, mainArea?: HTMLElement) {
    let parentDiv = document.body;
    if (mainArea) {
        parentDiv = mainArea;
    }

    const mailBodyList = parentDiv.querySelectorAll(".adn.ads") as NodeListOf<HTMLElement>;
    console.log("------>>> all reading div found:", mailBodyList.length);
    mailBodyList.forEach((oneMail) => {
        const mailParentDiv = oneMail.querySelector(".a3s.aiL") as HTMLElement | null;
        if (!mailParentDiv) {
            console.log("------>>> no mail content parent div found");
            return;
        }
        const bmailBtn = oneMail.querySelector(".bmail-decrypt-btn") as HTMLElement;
        if (bmailBtn) {
            console.log("------>>> duplicate bmail button found for mail reading......")
            checkFrameBody(mailParentDiv, bmailBtn);
            return;
        }

        const cryptoBtnDiv = addCryptButtonForEveryBmailDiv(template, oneMail, 'bmail_decrypt_btn_in_compose_google');
        if (!cryptoBtnDiv) {
            return;
        }

        mailParentDiv.insertBefore(cryptoBtnDiv, mailParentDiv.firstChild);
    })
}

async function monitorComposeAction(template: HTMLTemplateElement) {
    let composeDivArray: HTMLElement[] = [];
    observeForElement(document.body, 800, () => {
        const newComposeArr = Array.from(document.querySelectorAll("div[role=dialog]") as NodeListOf<HTMLElement>);
        if (newComposeArr.length > composeDivArray.length) {
            composeDivArray = newComposeArr;
            return newComposeArr[0] as HTMLElement;
        }
        composeDivArray = newComposeArr;
        return null;
    }, async () => {
        const composeDialogs = document.querySelectorAll("div[role=dialog]") as NodeListOf<HTMLElement>;
        if (composeDialogs.length <= 0) {
            console.log("------>>> no dialog compose:");
            return;
        }
        await addCryptoBtnToComposeDivGoogle(template);
    }, true);
}


function addDecryptBtnToSimpleMailAllDiv(template: HTMLTemplateElement, viewAllMailDiv: HTMLElement) {
    const mainContent = viewAllMailDiv.querySelector(".maincontent") as HTMLElement;
    const bmailBtn = mainContent.querySelector(".bmail-decrypt-btn") as HTMLElement;
    if (bmailBtn) {
        console.log("------>>> duplicate bmail button found for mail reading......")
        checkFrameBody(viewAllMailDiv, bmailBtn);
        return;
    }

    const cryptoBtnDiv = addCryptButtonForEveryBmailDiv(template, mainContent, 'bmail_decrypt_btn_in_compose_google');
    if (!cryptoBtnDiv) {
        return;
    }

    mainContent.insertBefore(cryptoBtnDiv, mainContent.firstChild);
}
