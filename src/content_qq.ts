import {observeForElement, parseBmailInboxBtn} from "./content_common";

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