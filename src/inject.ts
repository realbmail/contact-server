import {waitForElement} from "./common";

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
    console.log("++++++>>> injection init success");
    addBmailInbox().then();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initInjectElemAction();
}

async function addBmailInbox() {
    // waitForElement(() => {
    //     const bmailInboxBtn = document.querySelector(".bmail-send-action");
    //     return bmailInboxBtn !== undefined && bmailInboxBtn !== null;
    // })
}

