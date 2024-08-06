import browser from "webextension-polyfill";
import {HostArr, MsgType} from "./common";
import {queryEmailAddr126} from "./content_126";
import {queryEmailAddrGoogle} from "./conetent_google";


window.addEventListener('message', (event) => {
    if (event.source !== window) {
        return;
    }

    if (event.data && event.data.action === MsgType.EncryptMail) {
        browser.runtime.sendMessage({action: MsgType.EncryptMail}).catch(console.error);
    }
});

browser.runtime.onMessage.addListener((request, sender, sendResponse: (response: any) => void) => {
    console.log("------>>>on message:",request.action);
    if (request.action === MsgType.QueryCurEmail) {
        const emailAddr = readCurrentMailAddress();
        sendResponse({value: emailAddr});
    }
    return true; // Keep the message channel open for sendResponse
});

export function bmailInfo() {
    console.log("------>>> bmail inbox")
    browser.runtime.sendMessage({action: MsgType.EncryptMail}).catch(console.error);
}

function readCurrentMailAddress() {
    const hostname = window.location.hostname;
    switch (hostname) {
        case HostArr.Mail126:
            return queryEmailAddr126();
        case HostArr.Google:
            return queryEmailAddrGoogle();
        default:
            return null;
    }
}