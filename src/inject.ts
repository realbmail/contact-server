import { MsgType} from "./common";
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
    console.log("++++++>>> injection init success",document.getElementById('bmail_left_menu_btn_google'));
    addBmailInbox().then();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initInjectElemAction();
}



async function addBmailInbox() {
}