import {observeForElement} from "./content_common";

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
    observeForElement(document.body, 1000,
        () => {
            return document.querySelector(".ui-float-scroll-body.sidebar-menus") as HTMLElement || document.getElementById("leftPanel") as HTMLElement;
        }, async () => {
            console.log("------->>>start to populate qq mail area",);
        });

}