import {
    addCryptButtonForEveryBmailDiv, decryptMailInReading,
    encryptMailInComposing,
    observeForElement, observeForElementDirect,
    parseBmailInboxBtn,
    parseCryptoMailBtn,
    processReceivers,
    showTipsDialog
} from "./content_common";
import browser from "webextension-polyfill";
import {BMailDivQuery, extractEmail, hideLoading, showLoading} from "./common";
import {MailFlag} from "./bmail_body";

export function queryEmailAddrOutLook() {
    const element = document.getElementById("O365_AppName") as HTMLLinkElement | null;
    if (!element) return;
    console.log("-------->>> account info:", element.href);
    const url = element.href;
    const loginHintMatch = url.match(/login_hint=([^&]*)/);
    if (!loginHintMatch) {
        return;
    }
    const loginHint = decodeURIComponent(loginHintMatch[1]);
    console.log('----->>> email address found:', loginHint);
    return loginHint;
}

export function appendForOutLook(template: HTMLTemplateElement) {
    observeForElement(document.body, 800,
        () => {
            return document.querySelector(".DPg26 .xKrjQ");
        }, async () => {
            console.log("------->>>start to populate outlook mail area");
            appendBmailInboxMenuOutLook(template).then();
            monitorMailAreaOutLook(template).then()
        });
}

async function appendBmailInboxMenuOutLook(template: HTMLTemplateElement) {
    const leftMenuDiv = document.querySelector(".DPg26 .xKrjQ") as HTMLElement;
    let clone = parseBmailInboxBtn(template, "bmail_left_menu_btn_outlook") as HTMLElement;
    if (leftMenuDiv.children.length >= 2) {
        leftMenuDiv.insertBefore(clone, leftMenuDiv.children[1]);
    } else {
        leftMenuDiv.appendChild(clone);
    }
}

async function monitorMailAreaOutLook(template: HTMLTemplateElement) {
    const monitorArea = document.getElementById("ReadingPaneContainerId")?.firstElementChild as HTMLElement;
    if (!monitorArea) {
        console.log("------>>> mail area failed ");
        return;
    }

    let oldDiv: HTMLElement | null = null;
    observeForElement(monitorArea, 800,
        () => {
            const editArea = document.querySelector("[id^='docking_InitVisiblePart_']") as HTMLElement | null;
            const readArea = document.querySelector('.aVla3')?.firstChild as HTMLElement | null;
            // console.log("------>>> editArea area:", editArea, "readArea", readArea);
            const targetDiv = editArea || readArea;
            if (oldDiv === targetDiv) {
                return null;
            }
            oldDiv = targetDiv;
            console.log("------>>> targetDiv area:", targetDiv);
            return targetDiv;
        }, async () => {
            console.log("------->>>start to populate outlook mail area");
            addCryptButtonToComposeDivOutLook(template).then();
            addMailDecryptForReadingOutLook(template).then();
        }, true);
}

async function addCryptButtonToComposeDivOutLook(template: HTMLTemplateElement) {
    const composeArea = document.querySelector(".cBeRi.dMm6A") as HTMLElement;
    if (!composeArea) {
        console.log("------>>> no compose area found");
        return;
    }

    const toolBarDiv1 = composeArea.querySelector(".vBoqL.iLc1q.cc0pa.cF0pa.tblbU.SVWa1.dP5Z2");
    const toolBarDiv2 = composeArea.querySelector(".OTADH.xukFz")
    const toolBarDiv = toolBarDiv1 || toolBarDiv2;
    if (!toolBarDiv) {
        console.log("------>>> tool bar not found when compose mail");
        return;
    }

    const cryptoBtn = toolBarDiv.querySelector(".bmail-crypto-btn") as HTMLElement;
    if (cryptoBtn) {
        console.log("------>>> node already exists");
        return;
    }
    const mailContentDiv = document.querySelector("[id^='editorParent_']")?.firstChild as HTMLElement;
    const sendDiv = toolBarDiv.querySelector('div[aria-label="Send"]') as HTMLElement;
    const title = browser.i18n.getMessage('crypto_and_send');
    const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_48.png', ".bmail-crypto-btn",
        title, 'bmail_crypto_btn_in_compose_outlook', async btn => {
            await encryptMailAndSendOutLook(mailContentDiv, btn, composeArea, sendDiv);
        }
    ) as HTMLElement;
    toolBarDiv.insertBefore(cryptoBtnDiv, toolBarDiv.children[1] as HTMLElement);
}


async function encryptMailAndSendOutLook(mailBody: HTMLElement, btn: HTMLElement, composeArea: HTMLElement, sendDiv: HTMLElement) {
    showLoading();
    try {
        const receiverTable = composeArea.querySelector(".___hhiv960.f22iagw.fly5x3f.f1fow5ox.f1l02sjl") as HTMLElement;
        const allEmailAddrDivs = receiverTable.querySelectorAll("._Entity._EType_RECIPIENT_ENTITY._EReadonly_1.Lbs4W") as NodeListOf<HTMLElement>;
        const receiver = await processReceivers(allEmailAddrDivs, (div) => {
            return extractEmail(div.textContent ?? "");
        });

        if (mailBody.innerHTML.includes(MailFlag)) {
            console.log("----->>> has encrypted and send directly");
            sendDiv.click();
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

function prepareOneMailInConversation(oneMail: HTMLElement, template: HTMLTemplateElement) {
    const toolBarDiv = oneMail.querySelector('div[aria-label="Message actions"]');
    if (!toolBarDiv) {
        console.log("------>>> tool bar not found");
        oneMail.querySelector(".jmmB7.Ts94W.allowTextSelection")?.addEventListener("click", () => {
            setTimeout(() => {
                prepareOneMailInConversation(oneMail, template);
            }, 1000);
        })
        return;
    }

    const decryptBtn = toolBarDiv.querySelector('.bmail-decrypt-btn') as HTMLElement;
    if (decryptBtn) {
        console.log("------>>> decrypt button already been added for reading");
        return;
    }

    const mailArea = oneMail.querySelector('div[aria-label="Email message"]') as HTMLElement
    if (!mailArea) {
        console.log("------>>> no reading mail body found");
        return;
    }

    const cryptoBtnDiv = addCryptButtonForEveryBmailDiv(template, mailArea, 'bmail_decrypt_btn_in_compose_outlook');
    if (!cryptoBtnDiv) {
        return;
    }

    mailArea.querySelector(".T_6Xj")?.addEventListener("click", async () => {
        setTimeout(() => {
            const quoteOrReply = mailArea.querySelector(".wnVEW")?.querySelector('div[aria-label="Message body"]');
            if (!quoteOrReply) {
                return;
            }
            const cryptoBtn = cryptoBtnDiv.querySelector(".bmail-decrypt-btn") as HTMLElement;

            const BMailDivs = BMailDivQuery(quoteOrReply as HTMLElement);
            BMailDivs.forEach((bmailBody: HTMLElement) => {
                if (cryptoBtn.dataset.encoded === 'false') {
                    decryptMailInReading(bmailBody, cryptoBtn).then();
                    return;
                }
                cryptoBtnDiv.addEventListener('click', async () => {
                    await decryptMailInReading(bmailBody, cryptoBtn);
                })
            })

        }, 500);
    })

    if (toolBarDiv.childNodes.length > 2) {
        toolBarDiv.insertBefore(cryptoBtnDiv, toolBarDiv.children[1]);
    } else {
        toolBarDiv.appendChild(cryptoBtnDiv);
    }
}

async function addMailDecryptForReadingOutLook(template: HTMLTemplateElement) {
    const readArea = document.querySelector('div[data-app-section="ConversationContainer"]');
    if (!readArea) {
        console.log("------>>> no reading area found");
        return;
    }

    const editArea = document.querySelector("[id^='docking_InitVisiblePart_']") as HTMLElement | null;
    if (editArea) {
        await addCryptButtonToComposeDivOutLook(template);
        return;
    }

    const allInboxMailDiv = readArea.querySelectorAll(".aVla3") as NodeListOf<HTMLElement>;
    console.log("------>>> reading area found", allInboxMailDiv.length);

    allInboxMailDiv.forEach((oneMail) => {
        prepareOneMailInConversation(oneMail, template)
    });

}

async function encryptReplyAndSendOutLook(composeArea: HTMLElement, mailBody: HTMLElement, btn: HTMLElement, sendDiv: HTMLElement) {
    showLoading();
    try {
        const spanElement = composeArea.querySelectorAll('.lpcWrapper.lpcCommonWeb-hoverTarget') as NodeListOf<HTMLElement>;
        const receiver = await processReceivers(spanElement, (div) => {
            return extractEmail(div.getAttribute('aria-label') ?? "");
        });
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
