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
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initInjectElemAction();
}


function bmailInfo() {
    console.log("------>>> bmail inbox")
    window.postMessage({ action: 'encryptMail' }, '*');
}
(window as any).bmailInfo = bmailInfo;