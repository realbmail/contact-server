import {HostArr, MsgType} from "./common";
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

createBmailObj();

document.addEventListener('DOMContentLoaded', initInjectElemAction);

function initInjectElemAction() {
    console.log("++++++>>> injection init success")
    readCurrentMailAddress();
    addBmailInbox().then();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initInjectElemAction();
}


function bmailInfo() {
    console.log("------>>> bmail inbox")
    window.postMessage({action: MsgType.EncryptMail}, '*');
}

(window as any).bmailInfo = bmailInfo;

function readCurrentMailAddress() {
    const hostname = window.location.hostname;
    if (hostname === HostArr.Mail126) {
        const mailAddr = document.getElementById('spnUid');
        if (!mailAddr) {
            console.log('mail address missing for domain:', hostname);
            return;
        }

        console.log("------>>>mail address:", mailAddr.textContent);
    }
}

async function addBmailInbox() {

}