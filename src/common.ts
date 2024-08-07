export enum MsgType {
    PluginClicked = 'PluginClicked',
    WalletOpen = 'WalletOpen',
    WalletClose = 'WalletClose',
    EncryptMail = 'EncryptMail',
    BMailInbox = 'BMailInbox',
    AddInboxBtn = 'AddInboxBtn',
    QueryCurEmail = 'QueryCurEmail',
}

export enum WalletStatus {
    Init = 'Init',
    NoWallet = 'NoWallet',
    Locked = 'Locked',
    Unlocked = 'Unlocked',
    Expired = 'Expired',
    Error = 'error',
    InvalidTarget = 'InvalidTarget'
}

export enum HostArr {
    Google = 'mail.google.com',
    Mail163 = 'mail.163.com',
    Mail126 = 'mail.126.com',
    QQ = 'mail.qq.com'
}

export const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

export function showView(hash: string, callback: (hash: string) => void): void {
    const views = document.querySelectorAll<HTMLElement>('.page_view');
    views.forEach(view => view.style.display = 'none');

    const id = hash.replace('#onboarding/', 'view-');
    const targetView = document.getElementById(id);
    if (targetView) {
        targetView.style.display = 'block';
    }
    callback(hash);
}

const checkInterval = 500; // 检查间隔时间（毫秒）
const maxAttempts = 20; // 最大尝试次数

export function waitForElement(callback: () => boolean) {
    let attempts = 0;
    const intervalId = setInterval(() => {
        if (callback()) {
            console.log("------>>> timer found!")
            clearInterval(intervalId);
        } else {
            attempts++;
            if (attempts >= maxAttempts) {
                console.log("------>>> time out after maximum attempts.");
                clearInterval(intervalId);
            }
        }
    }, checkInterval);
}