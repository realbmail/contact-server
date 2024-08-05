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

    const checkInterval = 500; // 检查间隔时间（毫秒）
    const maxAttempts = 20; // 最大尝试次数
    let attempts = 0;

    const intervalId = setInterval(() => {
        const googleMenuButton = document.querySelector(".bmail-send-action");
        if (googleMenuButton) {
            console.log("------>>>bmail button Element found:", googleMenuButton, (window as any).bmail);
            clearInterval(intervalId);
        } else {
            attempts++;
            if (attempts >= maxAttempts) {
                console.warn("Element not found after maximum attempts.");
                clearInterval(intervalId);
            }
        }
    }, checkInterval);
}