import {
    addCryptButtonForEveryBmailDiv,
    checkFrameBody,
    encryptMailInComposing,
    observeForElement,
    parseBmailInboxBtn,
    parseCryptoMailBtn, processReceivers,
    showTipsDialog
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
            monitorGmailMainArea(template).then();
            addBMailInboxToMenu(clone).then();
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
            await encryptMailAndSendGoogle(mailBodyDiv, btn, titleForm, sendDiv);
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

async function encryptMailAndSendGoogle(mailBody: HTMLElement, btn: HTMLElement, titleForm: HTMLElement, sendDiv: HTMLElement) {
    showLoading();
    try {
        const divsWithDataHoverCardId = titleForm.querySelectorAll('div[data-hovercard-id]') as NodeListOf<HTMLElement>;
        const receiver = await processReceivers(divsWithDataHoverCardId, (div) => {
            return div.getAttribute('data-hovercard-id') as string | null;
        });

        const success = await encryptMailInComposing(mailBody, btn, receiver);
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

async function monitorGmailMainArea(template: HTMLTemplateElement) {
    const mainArea = document.querySelector(".nH.bkK") as HTMLElement;
    mainArea.addEventListener('click', (event) => {
        // console.log('-------->>>> click found in main area.');
        const targetElement = event.target as HTMLElement;
        // console.log("------>>>target element", targetElement)
        const trDiv = targetElement.closest('tr') as HTMLElement | null;
        const isCollapseMail = targetElement.className === "gE hI" || targetElement.querySelector('.gE.hI') != null;
        if (!trDiv && !isCollapseMail) {
            // console.log("------>>> no target element to check", targetElement);
            return;
        }

        if (trDiv) {
            const className = trDiv!.className as string;
            const collapseTitle = trDiv!.querySelector(".iA.g6")
            const replayOrForwardDiv = trDiv!.querySelector(".amn") as HTMLElement | null;

            if (className != "zA yO aqw" && className != "zA zE aqw" && collapseTitle === null && replayOrForwardDiv === null) {
                // console.log("------>>> not target tr", trDiv);
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
        // const mailParentDiv = oneMail.querySelector(".a3s.aiL") as HTMLElement | null;
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

        const cryptoBtnDiv = addCryptButtonForEveryBmailDiv(template, oneMail, 'bmail_decrypt_btn_in_compose_google');
        if (!cryptoBtnDiv) {
            return;
        }

        mailParentDiv.insertBefore(cryptoBtnDiv, mailParentDiv.firstChild);
    })
}

async function monitorComposeActionGoogle(template: HTMLTemplateElement) {
    let composeDivArray: HTMLElement[] = [];
    observeForElement(document.body, 1200, () => {//
        // const newComposeArr = Array.from(document.querySelectorAll("div[role=dialog]") as NodeListOf<HTMLElement>);
        const newComposeArr = Array.from(document.querySelectorAll('div[data-compose-id]') as NodeListOf<HTMLElement>);
        // console.log("----------->>>>>> body changed:=>", newComposeArr);
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

    const cryptoBtnDiv = addCryptButtonForEveryBmailDiv(template, mainContent, 'bmail_decrypt_btn_in_compose_google');
    if (!cryptoBtnDiv) {
        return;
    }

    mainContent.insertBefore(cryptoBtnDiv, mainContent.firstChild);
}
