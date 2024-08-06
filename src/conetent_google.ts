import {parseBmailInboxBtn} from "./content_common";

export function appendForGoogle(template: HTMLTemplateElement) {
    const clone = parseBmailInboxBtn(template, 'bmail_left_menu_btn_google');
    if (!clone) {
        console.warn("------>>> failed to parse bmail inbox button");
        return
    }

    observeForElement(() => {
        return document.querySelector('.TK') as HTMLElement;
    }, () => {
        addBMailInboxToMenu(clone);
    });
}

function addBMailInboxToMenu(clone: HTMLElement) {
    const googleMenu = document.querySelector('.TK') as HTMLElement;
    googleMenu.insertBefore(clone, googleMenu.children[1]);
}

export function queryEmailAddrGoogle() {
    const pageTitle = document.title;
    console.log('-------->>>Page Title:', pageTitle);
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const match = pageTitle.match(emailRegex);

    if (match) {
        const email = match[1];
        console.log('----->>> google email :', email);
        return email;
    }

    console.log('------>>>No email address found in the page title.');
    return null
}

function observeForElement(foundFunc: () => HTMLElement | null, callback: () => void) {
    const observerConfig = {
        childList: true, // 监听子节点的变化
        subtree: true    // 监听整个子树
    };

    const cb: MutationCallback = (mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const element = foundFunc();
                if (element) {
                    console.log('---------->>>google menu found:');
                    const targetObserver = new MutationObserver((targetMutations, targetObs) => {
                        targetObs.disconnect();
                        callback();
                    });
                    targetObserver.observe(element, {childList: true, subtree: true});
                    observer.disconnect();
                    break;
                }
            }
        }
    };
    const observer = new MutationObserver(cb);
    observer.observe(document.body, observerConfig);
}