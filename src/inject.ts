import browser from "webextension-polyfill";
import {MsgType} from "./common";

interface BMail {
    version: string;
    connect: () => void;
}

function createBmailObj() {
    (window as any).bmail = {
        version: '1.0.0',
        connect: function () {
            console.log('bmail connect function called');
        }
    };
    console.log("++++++>>>bmail initialized");
}

function bmailInfo() {
    browser.runtime.sendMessage({ action: MsgType.EncryptMail }).catch(console.error);
}

createBmailObj();
(window as any).bmailInfo = bmailInfo;

document.addEventListener('DOMContentLoaded', initInjectElemAction);

function initInjectElemAction() {
    console.log("++++++>>> injection init success")
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initInjectElemAction();
}