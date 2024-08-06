import browser from "webextension-polyfill";
import {bmailInfo} from "./content_common";

export function appendForGoogle(template: HTMLTemplateElement) {
    const bmailInboxBtn = template.content.getElementById('bmail_left_menu_btn_google');
    if (!bmailInboxBtn) {
        console.log("failed to find bmailElement");
        return;
    }

    const img = bmailInboxBtn.querySelector('img');
    if (img) {
        img.src = browser.runtime.getURL('file/logo_16.png');
    }
    const clone = bmailInboxBtn.cloneNode(true) as HTMLElement;
    (clone.querySelector(".bmail-send-action") as HTMLElement).addEventListener('click', bmailInfo);
    const observerConfig = {
        childList: true, // 监听子节点的变化
        subtree: true    // 监听整个子树
    };

    const callback: MutationCallback = (mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                // 尝试查找目标元素
                const googleMenu = document.querySelector('.TK') as HTMLElement;
                if (googleMenu) {
                    console.log('---------->>>google menu found:');
                    const targetObserver = new MutationObserver((targetMutations, targetObs) => {
                        targetObs.disconnect();
                        googleMenu.insertBefore(clone, googleMenu.children[1]);
                    });
                    targetObserver.observe(googleMenu, {childList: true, subtree: true});
                    observer.disconnect();
                    break;
                }
            }
        }
    };
    const observer = new MutationObserver(callback);
    observer.observe(document.body, observerConfig);
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