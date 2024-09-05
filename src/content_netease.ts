import browser from "webextension-polyfill";
import {
    checkFrameBody,
    encryptMailInComposing,
    parseBmailInboxBtn,
    parseCryptoMailBtn,
    showTipsDialog,
    addDecryptButtonForBmailBody,
    processReceivers, observeForElement
} from "./content_common";
import {
    extractEmail,
    hideLoading,
    showLoading
} from "./common";

export function appendForNetEase(template: HTMLTemplateElement) {
    const clone = parseBmailInboxBtn(template, "bmail_left_menu_btn_netEase");
    if (!clone) {
        console.warn("------>>> failed to parse bmail inbox button");
        return
    }

    appendBmailInboxMenu(clone);
    checkBmailInboxMenuAgain(clone);
    checkHasMailContent(template);

    monitorTabMenu((isDelete: boolean) => {
        if (isDelete) {
            //TODO::
            return;
        }
        checkHasMailContent(template);
    });
}

function checkBmailInboxMenuAgain(clone: HTMLElement): void {

    const checkBmailMenuAgain = () => {
        const dynamicBtn = document.getElementById('bmail_left_menu_btn_netEase');
        if (!dynamicBtn) {
            appendBmailInboxMenu(clone)
        }
    }

    // const homePageMenu = document.querySelector('li[title="首页"]');
    const homePageMenu = document.querySelector('li[id^="_mail_tabitem_0_"]');
    if (homePageMenu) {
        homePageMenu.addEventListener('click', checkBmailMenuAgain);
    }

    // const inboxMenu = document.querySelector('li[title="收件箱"]');
    const inboxMenu = document.querySelector('li[id^="_mail_tabitem_8_"]');
    if (inboxMenu) {
        inboxMenu.addEventListener('click', checkBmailMenuAgain);
    }
}

function checkHasMailContent(template: HTMLTemplateElement) {
    let debounceTimer = setTimeout(() => {

        const composeDiv = document.querySelectorAll<HTMLElement>("[id^='_dvModuleContainer_compose.ComposeModule']");
        composeDiv.forEach(div => {
            addCryptoBtnToComposeDivNetease(div, template);
        });

        clearTimeout(debounceTimer);
        const readDiv = document.querySelectorAll<HTMLElement>("[id^='_dvModuleContainer_read.ReadModule']");
        readDiv.forEach(div => {
            addMailDecryptForReadingNetease(div, template);
            addEncryptBtnForQuickReply(div, template);
        });
    }, 1500);
}

function appendBmailInboxMenu(clone: HTMLElement) {
    // const ulElements = document.querySelectorAll('ul[aria-label="左侧导航"]');
    const ulElements = document.querySelectorAll('ul[id^="_mail_tree_0_"]');

    const targetElement = Array.from(ulElements).find((element) => {
        return window.getComputedStyle(element).display !== 'none';
    });
    if (!targetElement) {
        console.log("failed to find target element");
        return;
    }

    if (targetElement.children.length >= 2) {
        targetElement.insertBefore(clone, targetElement.children[1]);
    } else {
        targetElement.appendChild(clone);
    }
}

export function queryEmailAddrNetEase() {
    const mailAddr = document.getElementById('spnUid');
    if (!mailAddr) {
        return null;
    }
    console.log("------>>>mail address:", mailAddr.textContent);
    return mailAddr.textContent;
}

function parseMailBodyToCheckCryptoButtonStatus(composeDiv: HTMLElement, btn: HTMLElement) {
    const iframe = composeDiv.querySelector(".APP-editor-iframe") as HTMLIFrameElement;
    if (!iframe) {
        console.log('----->>> encrypt failed to find iframe:=>');
        return null;
    }
    const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDocument) {
        console.log("----->>> no frame body found:=>");
        return null;
    }

    const elmFromReply = iframeDocument.getElementById('isReplyContent') as HTMLQuoteElement | null;
    const elmForward = iframeDocument.getElementById('isForwardContent') as HTMLQuoteElement | null;
    const elmWhenReload = iframeDocument.querySelector('.cm_quote_msg') as HTMLQuoteElement | null;
    const isReplyOrForward = elmWhenReload || elmFromReply || elmForward;
    console.log("------>>> is this a reply div", isReplyOrForward, "div id:=>", composeDiv.id);
    if (!isReplyOrForward) {
        checkFrameBody(iframeDocument.body, btn);
        return;
    }
    iframeDocument.body.dataset.theDivIsReply = 'true';
    const div = iframeDocument.getElementById('spnEditorContent') as HTMLElement;
    checkFrameBody(div, btn);
}

function addCryptoBtnToComposeDivNetease(composeDiv: HTMLElement, template: HTMLTemplateElement) {
    let cryptoBtn = composeDiv.querySelector('.bmail-crypto-btn') as HTMLElement;
    if (cryptoBtn) {
        console.log("------>>> crypto btn already been added before for mail composing");
        parseMailBodyToCheckCryptoButtonStatus(composeDiv, cryptoBtn);
        return;
    }
    const headerBtnList = composeDiv.querySelector(".js-component-toolbar.nui-toolbar");
    if (!headerBtnList) {
        console.log("------>>> header list not found for mail composition");
        return;
    }
    const title = browser.i18n.getMessage('crypto_and_send');
    const sendDiv = composeDiv.querySelector(".js-component-button.nui-mainBtn.nui-btn.nui-btn-hasIcon.nui-mainBtn-hasIcon") as HTMLElement;
    const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_48.png', ".bmail-crypto-btn",
        title, 'bmail_crypto_btn_in_compose_netEase', async btn => {
            await encryptDataAndSendNetEase(composeDiv, sendDiv);
        }
    ) as HTMLElement;

    parseMailBodyToCheckCryptoButtonStatus(composeDiv, cryptoBtnDiv.querySelector('.bmail-crypto-btn') as HTMLElement);

    if (headerBtnList.children.length > 1) {
        headerBtnList.insertBefore(cryptoBtnDiv, headerBtnList.children[1]);
    } else {
        headerBtnList.appendChild(cryptoBtnDiv);
    }
    console.log("------>>> encrypt button add success");
    checkAttachmentBtn(composeDiv);
}

function checkAttachmentBtn(composeDiv: HTMLElement) {
    const attachmentDiv = composeDiv.querySelector('div[id$="_attachBrowser"]');
    const fileInput = attachmentDiv?.querySelector('input[type="file"]');
    console.log("------>>> attachmentDivs not found for mail composing", fileInput);

    if (!fileInput) {
        console.log("----->>> attachment input file not found");
        return;
    }

    fileInput.addEventListener('change', async (event) => {
        console.log("----->>> file input change event triggered");

        const input = event.target as HTMLInputElement;
        const files = input.files;

        // 如果文件列表为空或者文件已经加密，直接返回，不处理
        if (!files || files.length === 0 || files[0].name.endsWith('.encrypted')) {
            console.log("----->>> No files found or file already encrypted.");
            return;
        }

        const file = files[0];
        console.log("----->>> processing file:", file.name);

        try {
            // 加密文件
            const encryptedFile = await encryptFile(file);
            console.log("----->>> file encrypted:", encryptedFile.name);

            // 创建一个新的 DataTransfer 对象，并添加加密后的文件
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(encryptedFile);

            // 替换 input 的文件列表为加密后的文件
            input.files = dataTransfer.files;
            console.log("----->>> input files replaced with encrypted file");

            // 手动触发新的 change 事件，通知系统文件已经被替换
            const newEvent = new Event('change', {
                bubbles: true,
                cancelable: true,
            });
            input.dispatchEvent(newEvent);

        } catch (error) {
            console.error('------>>> File encryption failed:', error);
        }
    }, {capture: true});
}

function encryptFile(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                const uint8Array = new Uint8Array(arrayBuffer);
                let binaryString = '';

                const chunkSize = 0x8000; // 32KB 每次处理的块大小
                for (let i = 0; i < uint8Array.length; i += chunkSize) {
                    const chunk = uint8Array.subarray(i, i + chunkSize);
                    binaryString += String.fromCharCode(...chunk);
                }

                const encryptedContent = btoa(binaryString);
                const encryptedBlob = new Blob([encryptedContent], {type: file.type});
                const encryptedFile = new File([encryptedBlob], `${file.name}.encrypted`, {type: file.type});
                console.log("----->>> encryption complete:", encryptedFile.name);
                resolve(encryptedFile);
            } catch (e) {
                reject(e);
            }
        };

        reader.onerror = function (error) {
            reject(error);
        };
        reader.readAsArrayBuffer(file); // 读取文件为二进制数据
    });
}


async function encryptDataAndSendNetEase(composeDiv: HTMLElement, sendDiv: HTMLElement) {

    showLoading();
    try {
        const iframe = composeDiv.querySelector(".APP-editor-iframe") as HTMLIFrameElement | null;
        let mailBody = iframe?.contentDocument?.body || iframe?.contentWindow?.document.body;
        if (!mailBody) {
            console.log("----->>> no frame body found:=>");
            return null;
        }

        if (mailBody.dataset.theDivIsReply === 'true') {
            mailBody = iframe?.contentDocument?.getElementById('spnEditorContent') as HTMLElement;
        }

        const receiverArea = composeDiv.querySelectorAll(".js-component-emailblock") as NodeListOf<HTMLElement>;
        const receiver = await processReceivers(receiverArea, (div) => {
            const emailElement = div.querySelector(".nui-addr-email");
            if (!emailElement) {
                return null;
            }
            return extractEmail(div.textContent ?? "");
        });

        const success = await encryptMailInComposing(mailBody, receiver);
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

function monitorTabMenu(callback?: (isDelete: boolean) => void) {
    const ul = document.querySelector('.js-component-tab.tz0.nui-tabs');
    if (!ul) {
        console.log("------>>>no tab menu found")
        return;
    }
    let lastChildCount = ul.children.length;
    const observer = new MutationObserver((mutationsList) => {
        const currentChildCount = ul.children.length;
        let isDelete = true;
        if (currentChildCount !== lastChildCount) {
            if (currentChildCount > lastChildCount) {
                console.log(`------>>>Added li: `);
                isDelete = false;
            } else {
                mutationsList.forEach(mutation => {
                    mutation.removedNodes.forEach(node => {
                        if (node.nodeName === 'LI') {
                            console.log(`------>>>Removed li:`);
                        }
                    });
                });
            }
            lastChildCount = currentChildCount;
            if (callback) {
                callback(isDelete);
            }
        }
    });
    observer.observe(ul, {childList: true});
}

function addMailDecryptForReadingNetease(composeDiv: HTMLElement, template: HTMLTemplateElement) {

    const decryptBtn = composeDiv.querySelector('.bmail-decrypt-btn') as HTMLElement;
    if (decryptBtn) {
        console.log("------>>> decrypt button already been added for reading");
        return;
    }

    const iframe = composeDiv.querySelector("iframe") as HTMLIFrameElement | null;
    const iframeDocument = iframe?.contentDocument || iframe?.contentWindow?.document;
    if (!iframeDocument) {
        console.log("----->>> no mail body found:=>");
        return;
    }

    const headerBtnList = composeDiv.querySelector(".js-component-toolbar.nui-toolbar") as HTMLElement | null;
    if (!headerBtnList) {
        console.log("------>>> header list not found for netease mail reading");
        return;
    }

    const mailArea = iframeDocument.querySelector(".netease_mail_readhtml.netease_mail_readhtml_webmail") as HTMLElement | null;
    if (!mailArea) {
        let debounceTimer = setTimeout(() => {
            checkHasMailContent(template);
            clearTimeout(debounceTimer);
        }, 1500);
        return;
    }

    const cryptoBtnDiv = addDecryptButtonForBmailBody(template, mailArea, 'bmail_decrypt_btn_in_compose_netEase');
    if (!cryptoBtnDiv) {
        return;
    }

    headerBtnList.insertBefore(cryptoBtnDiv, headerBtnList.children[1]);
    console.log("------>>> decrypt button add success");
}

function addEncryptBtnForQuickReply(mailArea: HTMLElement, template: HTMLTemplateElement) {
    console.log("------------------>>>> checking reply area");

    const quickReply = mailArea.querySelector('div[id$="_dvAttach_reply"]')
    if (!quickReply) {
        console.log("----->>> quick reply area not found");
        return;
    }

    const toolBarDiv = quickReply.querySelector('div[id$="_dvReplyBts"]')
    if (!toolBarDiv) {
        console.log("----->>> tool bar in quick reply area not found");
        return;
    }
    let cryptoBtn = toolBarDiv.querySelector('.bmail-crypto-btn') as HTMLElement;
    if (cryptoBtn) {
        console.log("----->>> crypto button already been added for quick reply area");
        return;
    }

    const title = browser.i18n.getMessage('crypto_and_send');
    const sendDiv = toolBarDiv.querySelector(".js-component-button.nui-mainBtn.nui-btn") as HTMLElement;
    const mailBody = mailArea.querySelector('textarea[id$="_replyInput_inputId"]') as HTMLTextAreaElement;
    const cryptoBtnDiv = parseCryptoMailBtn(template, 'file/logo_48.png', ".bmail-crypto-btn",
        title, 'bmail_crypto_btn_in_compose_netEase', async btn => {
            await encryptDataAndSendForQuickReplyNetEase(mailBody, btn, sendDiv);
        }
    ) as HTMLElement;

    if (toolBarDiv.children.length > 1) {
        toolBarDiv.insertBefore(cryptoBtnDiv, toolBarDiv.children[1]);
    } else {
        toolBarDiv.appendChild(cryptoBtnDiv);
    }
}

async function encryptDataAndSendForQuickReplyNetEase(mailBody: HTMLTextAreaElement, btn: HTMLElement, sendDiv: HTMLElement) {
    console.log("------------>>>>>> mail body text:=>", mailBody.value)
    console.log("------------>>>>>> mail body html:=>", mailBody.outerHTML)
}