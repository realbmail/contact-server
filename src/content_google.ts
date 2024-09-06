import {
    addDecryptButtonForBmailBody,
    checkFrameBody,
    encryptMailInComposing,
    observeForElement,
    parseBmailInboxBtn,
    parseCryptoMailBtn, processInitialTextNodes, processReceivers, showTipsDialog
} from "./content_common";
import {emailRegex, hideLoading, showLoading} from "./common";
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
    monitorComposeActionGoogle(template).then();

    observeForElement(document.body, 1000,
        () => {
            return document.querySelector('.TK') as HTMLElement;
        }, async () => {
            console.log("------>>>start to populate google area");
            monitorReadingActionGoogle(template).then();
            addBMailInboxToMenu(clone).then();
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

function _addCryptoBtnForDiv(template: HTMLTemplateElement, composeDiv: HTMLElement) {

    const mailBodyDiv = composeDiv.querySelector(".Am.aiL.Al.editable.LW-avf.tS-tW") as HTMLElement;
    if (!mailBodyDiv) {
        composeDiv.dataset.tryTimes = composeDiv.dataset.tryTimes ?? "" + "1";
        if (composeDiv.dataset.tryTimes.length > 3) {
            console.log("------>>> failed to find mail body")
            return;
        }

        setTimeout(() => {
            _addCryptoBtnForDiv(template, composeDiv);
        }, 1000)
        return;
    }

    const node = composeDiv.querySelector(".bmail-crypto-btn") as HTMLElement;
    if (node) {
        console.log("------>>> node already exists");
        return;
    }

    const titleForm = composeDiv.querySelector("form") as HTMLElement;
    const title = browser.i18n.getMessage('crypto_and_send');

    const toolBarTr = composeDiv.querySelector("tr.btC") as HTMLElement;
    const sendDiv = toolBarTr.querySelector(".dC")?.firstChild as HTMLElement;
    const clone = parseCryptoMailBtn(template, 'file/logo_48.png', ".bmail-crypto-btn", title,
        "bmail_crypto_btn_in_compose_google", async btn => {
            await encryptMailAndSendGoogle(mailBodyDiv, titleForm, sendDiv);
            setTimeout(() => {
                addCryptoBtnToReadingMailGoogle(template).then();
            }, 1000);
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
}

async function addCryptoBtnToComposeDivGoogle(template: HTMLTemplateElement) {
    const allComposeDiv = document.querySelectorAll(_composeBtnParentClass);
    console.log("------>>> all compose div when loaded=>", allComposeDiv.length);
    allComposeDiv.forEach(composeDiv => {
        _addCryptoBtnForDiv(template, composeDiv as HTMLElement);
    });
}

async function encryptMailAndSendGoogle(mailBody: HTMLElement, titleForm: HTMLElement, sendDiv: HTMLElement) {
    showLoading();
    try {
        const divsWithDataHoverCardId = titleForm.querySelectorAll('div[data-hovercard-id]') as NodeListOf<HTMLElement>;
        const receiver = await processReceivers(divsWithDataHoverCardId, (div) => {
            return div.getAttribute('data-hovercard-id') as string | null;
        });

        const success = await encryptMailInComposing(mailBody, receiver);
        if (!success) {
            return;
        }
        sendDiv.click();
        console.log("------>>> send success");
    } catch (e) {
        console.log("------>>> decode or encode error:", e);
        showTipsDialog("error", "encrypt mail content failed");
    } finally {
        hideLoading();
    }
}

async function monitorReadingActionGoogle(template: HTMLTemplateElement) {
    const mainArea = document.querySelector(".nH.bkK") as HTMLElement;
    let oldDivNo = 0;
    observeForElement(mainArea, 1000, () => {
        const div = mainArea.querySelectorAll(".a3s.aiL");
        if (div.length === oldDivNo) {
            // console.log("-------->>>null-------------------------------->>>", div, oldDiv)
            return null;
        }
        oldDivNo = div.length;
        console.log("-------->>>div-------------------------------->>>", div)
        return div[0] as HTMLElement;
    }, async () => {
        addCryptoBtnToReadingMailGoogle(template, mainArea).then();
    }, true);
}

async function addCryptoBtnToReadingMailGoogle(template: HTMLTemplateElement, mainArea?: HTMLElement) {
    let parentDiv = document.body;
    if (mainArea) {
        parentDiv = mainArea;
    }

    const mailBodyList = parentDiv.querySelectorAll(".adn.ads") as NodeListOf<HTMLElement>;
    console.log("------>>> all reading div found:", mailBodyList.length);
    mailBodyList.forEach((oneMail) => {
        const mailParentDiv = oneMail.querySelector(".ii.gt") as HTMLElement | null;
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
        const mailBody = mailParentDiv.firstChild as HTMLElement;
        // console.log("------>>> mailBody.firstChild  ", mailBody.children, mailBody.firstChild?.nodeType, mailBody.textContent)
        processInitialTextNodes(mailBody);
        const cryptoBtnDiv = addDecryptButtonForBmailBody(template, oneMail, 'bmail_decrypt_btn_in_compose_google');
        if (!cryptoBtnDiv) {
            return;
        }

        mailParentDiv.insertBefore(cryptoBtnDiv, mailParentDiv.firstChild);
    })
}

async function monitorComposeActionGoogle(template: HTMLTemplateElement) {
    let composeDivArray: HTMLElement[] = [];
    observeForElement(document.body, 1000, () => {//
        const newComposeArr = Array.from(document.querySelectorAll('div[data-compose-id]') as NodeListOf<HTMLElement>);
        if (newComposeArr.length > composeDivArray.length) {
            composeDivArray = newComposeArr;
            return newComposeArr[0] as HTMLElement;
        }
        composeDivArray = newComposeArr;
        return null;
    }, async () => {
        const composeDialogs = document.querySelectorAll('div[data-compose-id]') as NodeListOf<HTMLElement>;
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

    const cryptoBtnDiv = addDecryptButtonForBmailBody(template, mainContent, 'bmail_decrypt_btn_in_compose_google');
    if (!cryptoBtnDiv) {
        return;
    }

    mainContent.insertBefore(cryptoBtnDiv, mainContent.firstChild);
}
