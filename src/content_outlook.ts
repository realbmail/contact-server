import {
    addCryptButtonForEveryBmailDiv, decryptMailInReading,
    encryptMailInComposing,
    observeForElement, parseBmailInboxBtn,
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
            console.log("------->>>start to populate outlook mail menu");
            appendBmailInboxMenuOutLook(template).then();
            monitorContactAction().then();
        });

    observeForElement(document.body, 800, () => {
        return document.getElementById("ReadingPaneContainerId")?.firstElementChild as HTMLElement;
    }, async () => {
        console.log("------->>>start to populate outlook mail area");
        monitorMailAreaOutLook(template).then();
    });
}

const __nameToEmailMap = new Map();

async function monitorContactAction() {
    const div = document.getElementById("fluent-default-layer-host") as HTMLElement;
    let oldDiv: HTMLElement | null = null;
    observeForElement(div, 0, () => {
        const ulElement = div.querySelector('ul.ms-FloatingSuggestionsList-container') as HTMLElement | null;
        if (oldDiv === ulElement) {
            return null;
        }
        oldDiv = ulElement;

        ulElement?.addEventListener('click', (event) => {
            const clickedLi = (event.target as HTMLElement).closest('li');
            if (!clickedLi) {
                return;
            }
            const emailName = clickedLi.querySelector('.MwdHX')?.textContent;
            const emailAddress = clickedLi.querySelector('.Umn8G.MwdHX')?.textContent;
            console.log('-------->>>name:', emailName, "------>>> address:", emailAddress);
            if (!emailName || !emailAddress) {
                return;
            }
            __nameToEmailMap.set(emailName, emailAddress);
        });

        return ulElement;
    }, async () => {
    }, true);
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

function monitorReceiverChanges(composeArea: HTMLElement) {
    const receiverTable = composeArea.querySelector(".___hhiv960.f22iagw.fly5x3f.f1fow5ox.f1l02sjl") as HTMLElement;
    if (!receiverTable) {
        console.log("----->>> this is not full page of mail composition");
        return
    }
    const validEmailDiv = new Map();
    let currentReceiverNo = 0;
    observeForElement(receiverTable, 600, () => {
        const receivers = receiverTable.querySelectorAll("._EType_RECIPIENT_ENTITY") as NodeListOf<HTMLElement>;
        for (let i = 0; i < receivers.length; i++) {
            const div = receivers[i];
            const emailAddr = extractEmail(div.textContent ?? "");
            if (emailAddr) {
                validEmailDiv.set(i, emailAddr);
            }
        }
        if (currentReceiverNo === receivers.length) {
            return null;
        }
        currentReceiverNo = receivers.length;
        return receivers[0];
    }, async () => {
        const receivers = receiverTable.querySelectorAll("._EType_RECIPIENT_ENTITY") as NodeListOf<HTMLElement>;
        console.log("----->>> all nodes:", receivers);
        for (let i = 0; i < receivers.length; i++) {
            const div = receivers[i];
            const divTxt = div.textContent ?? ""
            const emailAddr = extractEmail(divTxt);
            if (emailAddr) {
                continue;
            }
            const matchingSpans = div.querySelector('span[class^="textContainer-"], span[class^="individualText-"]') as HTMLElement;
            const emailName = matchingSpans.innerText.trim()
            console.log("------>>> receivers area found when compose mail=>", emailName, validEmailDiv.get(i));
            if (!__nameToEmailMap.get(emailName)) {
                __nameToEmailMap.set(emailName, validEmailDiv.get(i));
            }
        }
    }, true)
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

    monitorReceiverChanges(composeArea);

    const cryptoBtn = toolBarDiv.querySelector(".bmail-crypto-btn") as HTMLElement;
    if (cryptoBtn) {
        console.log("------>>> node already exists");
        return;
    }
    const sendDiv = toolBarDiv.querySelector('button.ms-Button.ms-Button--primary.ms-Button--hasMenu') as HTMLElement;
    const title = browser.i18n.getMessage('crypto_and_send');
    const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_48.png', ".bmail-crypto-btn",
        title, 'bmail_crypto_btn_in_compose_outlook', async btn => {
            await encryptMailAndSendOutLook(btn, composeArea, sendDiv);
        }
    ) as HTMLElement;
    toolBarDiv.insertBefore(cryptoBtnDiv, toolBarDiv.children[1] as HTMLElement);
}


async function encryptMailAndSendOutLook(btn: HTMLElement, composeArea: HTMLElement, sendDiv: HTMLElement) {
    showLoading();
    try {
        const mailBody = document.querySelector("[id^='editorParent_']")?.firstChild as HTMLElement;
        let receiver: string[] | null
        const receiverTable = composeArea.querySelector(".___hhiv960.f22iagw.fly5x3f.f1fow5ox.f1l02sjl") as HTMLElement;
        if (!receiverTable) {
            const spanElement = composeArea.querySelectorAll('.lpcWrapper.lpcCommonWeb-hoverTarget') as NodeListOf<HTMLElement>;
            receiver = await processReceivers(spanElement, (div) => {
                return extractEmail(div.getAttribute('aria-label') ?? "");
            });
        } else {
            const allEmailAddrDivs = receiverTable.querySelectorAll("._Entity._EType_RECIPIENT_ENTITY._EReadonly_1.Lbs4W") as NodeListOf<HTMLElement>;
            receiver = await processReceivers(allEmailAddrDivs, (div) => {
                const matchingSpans = div.querySelector('span[class^="textContainer-"], span[class^="individualText-"]') as HTMLElement;

                let emailAddr = extractEmail(matchingSpans.innerText.trim() ?? "");
                if (!emailAddr) {
                    emailAddr = __nameToEmailMap.get(matchingSpans.innerText.trim());
                    console.log("-------->>>>>>name:", matchingSpans.innerText.trim(), "email:", emailAddr);
                }
                return emailAddr;
            });
        }

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
    // const toolBarDiv = oneMail.querySelector('div[aria-label="Message actions"]');
    const toolBarDiv = oneMail.querySelector('div[role="toolbar"]');
    if (!toolBarDiv) {
        console.log("------>>> tool bar not found");
        const moreMailDataBar = oneMail.querySelector(".jmmB7.Ts94W.allowTextSelection") as HTMLElement;
        if (moreMailDataBar) {
            moreMailDataBar.addEventListener("click", () => {
                setTimeout(() => {
                    prepareOneMailInConversation(oneMail, template);
                }, 1000);
            })
        } else {
            const element = oneMail.querySelector('div[class="AL_OM l8Tnu"]');
            if (element) {
                setTimeout(() => {
                    addMailDecryptForReadingOutLook(template).then();
                }, 1000);
            }
        }
        return;
    }

    const decryptBtn = toolBarDiv.querySelector('.bmail-decrypt-btn') as HTMLElement;
    if (decryptBtn) {
        console.log("------>>> decrypt button already been added for reading");
        return;
    }

    const mailArea = oneMail.querySelector('div[id^="UniqueMessageBody_"]') as HTMLElement
    if (!mailArea) {
        console.log("------>>> no reading mail body found");
        return;
    }

    const cryptoBtnDiv = addCryptButtonForEveryBmailDiv(template, mailArea, 'bmail_decrypt_btn_in_compose_outlook');
    if (!cryptoBtnDiv) {
        return;
    }
    const moreMailContentBtn = oneMail.querySelector(".T_6Xj");
    console.log("----->>> more mail content btn:=>", moreMailContentBtn);
    moreMailContentBtn?.addEventListener("click", async () => {
        setTimeout(() => {
            const quoteOrReply = oneMail.querySelector(".wnVEW")?.querySelector('div[role="document"]');
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
