import {observeForElement, parseBmailInboxBtn} from "./content_common";
import {emailRegex} from "./common";

export function appendForQQ(template: HTMLTemplateElement) {
    const clone = parseBmailInboxBtn(template, "bmail_left_menu_btn_netEase");
    if (!clone) {
        console.warn("------>>> failed to parse bmail inbox button");
        return
    }

    observeForElement(
        () => {
            return document.querySelector(".ui-float-scroll-body.sidebar-menus") as HTMLElement;
        }, async () => {
            console.log("------>>>start to populate qq mail area");
            appendBmailInboxMenu(clone);
            monitorComposeBtnAction(template)
        });
}

function appendBmailInboxMenu(clone: HTMLElement) {
    const menuParentDiv = document.querySelector(".ui-float-scroll-body.sidebar-menus") as HTMLElement;
    if (!menuParentDiv) {
        console.log("------>>> menu parent div not found");
        return;
    }
    if (menuParentDiv.children.length >= 2) {
        menuParentDiv.insertBefore(clone, menuParentDiv.children[1]);
    } else {
        menuParentDiv.appendChild(clone);
    }
}

export function queryEmailAddrQQ() {
    const parentDiv = document.querySelector(".profile-user-info");
    const userEmailSpan = parentDiv?.querySelector('span.user-email');
    if (!userEmailSpan) {
        console.log("-------->>> failed to parse bmail inbox button");
        return null;
    }

    const mailAddress = userEmailSpan.textContent as string;
    const match = mailAddress.match(emailRegex);
    if (!match) {
        console.log("------>>> failed to parse bmail address");
        return null;
    }
    console.log("------>>> qq mail address success:", match[0]);
    return match[0];
}

function monitorComposeBtnAction(template: HTMLTemplateElement) {

    const composeBtnDiv = document.querySelector(".sidebar-header");
    if (!composeBtnDiv) {
        console.warn("------>>> compose button not found");
        return;
    }
    composeBtnDiv.addEventListener("click", () => {

    })
}