import {
    __decrypt_button_css_name, addCustomStyles,
    addDecryptButtonForBmailBody,
    checkFrameBody,
    encryptMailInComposing, extractAesKeyId, ContentPageProvider,
    observeForElement,
    parseBmailInboxBtn, parseContentHtml,
    parseCryptoMailBtn, processInitialTextNodesForGoogle, processReceivers, showTipsDialog
} from "./content_common";
import {emailRegex, hideLoading, showLoading} from "./common";
import browser from "webextension-polyfill";
import {checkAttachmentBtn, decryptAttachment} from "./content_attachment";

function appendForGoogle(template: HTMLTemplateElement) {
    const clone = parseBmailInboxBtn(template, 'bmail_left_menu_btn_google') as HTMLElement;

    // console.log("------>>> start to append element to google mail");
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
            // console.log("------>>>start to populate google area");
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
    // console.log("------>>> add bmail inbox button success=>")
}

function queryEmailAddrGoogle() {
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

function _addCryptoBtnForComposeDiv(template: HTMLTemplateElement, composeDiv: HTMLElement) {

    const mailBodyDiv = composeDiv.querySelector(".Am.aiL.Al.editable.LW-avf.tS-tW") as HTMLElement;
    if (!mailBodyDiv) {
        composeDiv.dataset.tryTimes = composeDiv.dataset.tryTimes ?? "" + "1";
        if (composeDiv.dataset.tryTimes.length > 3) {
            console.log("------>>> failed to find mail body")
            return;
        }

        setTimeout(() => {
            _addCryptoBtnForComposeDiv(template, composeDiv);
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

    _prepareAttachmentForCompose(template, toolBarTr, composeDiv);

    const clone = parseCryptoMailBtn(template, 'file/logo_48.png', ".bmail-crypto-btn", title,
        "bmail_crypto_btn_in_compose_google", async _ => {
            const aekId = findAttachmentKeyID(composeDiv);
            await encryptMailAndSendGoogle(mailBodyDiv, titleForm, sendDiv, aekId);
            setTimeout(() => {
                addCryptoBtnToReadingMailGoogle(template).then();
            }, 1000);
        });
    if (!clone) {
        console.log("------>>> crypt button not found");
        return;
    }

    const newTd = document.createElement('td');
    newTd.append(clone);

    const secondTd = toolBarTr.querySelector('td:nth-child(2)');
    if (secondTd) {
        toolBarTr.insertBefore(newTd, secondTd);
    }
}

function findAttachmentKeyID(composeDiv: HTMLElement): string | undefined {
    const attachFileArea = composeDiv.querySelector(".bA3 .GM")?.querySelectorAll(".dL");
    if (!attachFileArea || attachFileArea.length === 0) {
        console.log("------>>> no attached filed found");
        return undefined;
    }
    let aekId = "";
    for (let i = 0; i < attachFileArea.length; i++) {
        const element = attachFileArea.item(i);
        const fileName = element.querySelector(".vI")?.textContent;
        const parsedId = extractAesKeyId(fileName);
        if (!parsedId) {
            continue;
        }
        aekId = parsedId.id;
        break;
    }
    return aekId;
}

function _prepareAttachmentForCompose(template: HTMLTemplateElement, toolBarTr: HTMLElement, composeDiv: HTMLElement) {
    const overlayButton = template.content.getElementById('attachmentOverlayButton') as HTMLButtonElement | null;
    if (!overlayButton) {
        console.log("----->>> overlayButton not found");
        return;
    }

    const multiToolArea = toolBarTr.querySelector(".a8X.gU .bAK") as HTMLElement;
    const fileInput = multiToolArea.querySelector('input[name="Filedata"]') as HTMLInputElement;
    const attachmentDiv = multiToolArea.querySelector('.a1.aaA.aMZ') as HTMLElement;
    if (!fileInput || !attachmentDiv) {
        console.log("----->>> file input not found", fileInput, attachmentDiv);
        return;
    }

    if (attachmentDiv.querySelector(".attachmentOverlayButton")) {
        console.log("----->>> overly button already added before for mail composing");
        return;
    }

    const aekId = findAttachmentKeyID(composeDiv);
    const overlyClone = overlayButton.cloneNode(true) as HTMLElement;
    checkAttachmentBtn(attachmentDiv, fileInput, overlyClone, aekId);
}


async function addCryptoBtnToComposeDivGoogle(template: HTMLTemplateElement) {
    const allComposeDiv = document.querySelectorAll(_composeBtnParentClass);
    console.log("------>>> all compose div when loaded=>", allComposeDiv.length);
    allComposeDiv.forEach(composeDiv => {
        _addCryptoBtnForComposeDiv(template, composeDiv as HTMLElement);
    });
}

async function encryptMailAndSendGoogle(mailBody: HTMLElement, titleForm: HTMLElement, sendDiv: HTMLElement, aekId?: string) {
    showLoading();
    try {
        const divsWithDataHoverCardId = titleForm.querySelectorAll('div[data-hovercard-id]') as NodeListOf<HTMLElement>;
        const receiver = await processReceivers(divsWithDataHoverCardId, (div) => {
            return div.getAttribute('data-hovercard-id') as string | null;
        });

        const success = await encryptMailInComposing(mailBody, receiver, aekId);
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
        // console.log("-------->>>div-------------------------------->>>", div)
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
        const bmailBtn = oneMail.querySelector(__decrypt_button_css_name) as HTMLElement;
        if (bmailBtn) {
            console.log("------>>> duplicate bmail button found for mail reading......")
            checkFrameBody(mailParentDiv, bmailBtn);
            return;
        }
        const mailBody = mailParentDiv.firstChild as HTMLElement;
        // console.log("------>>> mailBody.firstChild  ", mailBody.children, mailBody.firstChild?.nodeType, mailBody.textContent)
        processInitialTextNodesForGoogle(mailBody);

        const quotedDivs = mailBody.querySelectorAll("blockquote") as NodeListOf<HTMLElement>;
        quotedDivs.forEach(quotedDiv => {
            processInitialTextNodesForGoogle(quotedDiv);
        })

        const cryptoBtnDiv = addDecryptButtonForBmailBody(template, oneMail, 'bmail_decrypt_btn_in_compose_google');
        if (!cryptoBtnDiv) {
            return;
        }

        mailParentDiv.insertBefore(cryptoBtnDiv, mailParentDiv.firstChild);
        setTimeout(() => {
            addDecryptBtnForAttachment(oneMail, template);
        }, 1000);
    })
}

function parseBmailDecryptButton(template: HTMLTemplateElement, idx: number, url: string, parsedId: {
    id: string;
    originalFileName: string
}): HTMLElement {
    const cryptoBtnDiv = template.content.getElementById("attachmentDecryptGoogle") as HTMLElement;
    const clone = cryptoBtnDiv.cloneNode(true) as HTMLElement;
    clone.setAttribute('id', "");
    clone.addEventListener('click', async () => {
        // await decryptAttachment(parsedId.id, url, parsedId.originalFileName);
        await decryptAttachment(parsedId.id, url, parsedId.originalFileName);

        console.log("------>>> bmail decrypt download");
    });

    const id = "attachmentDecryptGoogle_tips_" + idx;
    clone.querySelector(".attachmentDecryptGoogle_tips")!.setAttribute('id', id);
    clone.querySelector("button")!.setAttribute('data-tooltip-id', id);

    return clone;
}

function addDecryptBtnForAttachment(oneMail: HTMLElement, template: HTMLTemplateElement) {
    const attachmentArea = oneMail.querySelector(".hq.gt")?.querySelector(".aQH")
    if (!attachmentArea) {
        console.log("------>>> no attachment list");
        return;
    }

    const attachmentDiv = attachmentArea.querySelectorAll("span.aZo.N5jrZb");
    if (!attachmentDiv || !attachmentDiv.length) {
        console.log("------>>>no attachment item found");
        return;
    }

    for (let i = 0; i < attachmentDiv.length; i++) {
        const attachmentItem = attachmentDiv[i] as HTMLElement;

        const urlLinkDiv = attachmentItem.querySelector("a.aQy.e") as HTMLLinkElement;
        const attachmentTool = attachmentItem.querySelector(".aQw");
        const fileName = attachmentItem.querySelector("span.aV3")?.textContent

        if (!attachmentTool || attachmentTool.childNodes.length < 2 || !fileName || !urlLinkDiv.href) {
            console.log("------>>> failed find the attachment tool or file name or url", attachmentTool, fileName, urlLinkDiv.href);
            return;
        }
        const parsedId = extractAesKeyId(fileName);
        if (!parsedId) {
            console.log("------>>> no need to add decrypt button to this attachment element");
            continue;
        }

        const clone = parseBmailDecryptButton(template, i, urlLinkDiv.href, parsedId);
        attachmentTool.insertBefore(clone, attachmentTool.firstChild);
    }
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
    const bmailBtn = mainContent.querySelector(__decrypt_button_css_name) as HTMLElement;
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

class Provider implements ContentPageProvider {
    readCurrentMailAddress(): string {
        return queryEmailAddrGoogle() ?? "";
    }
    async prepareContent(): Promise<void> {
        addCustomStyles('css/google.css');
        const template = await parseContentHtml('html/inject_google.html');
        appendForGoogle(template);
        console.log("------>>> google content init success");
    }

    async processDownloadFile(_: string): Promise<void> {
        return;
    }
}

(window as any).contentPageProvider = new Provider();