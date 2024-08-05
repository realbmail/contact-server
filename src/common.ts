export enum MsgType {
    PluginClicked = 'PluginClicked',
    WalletOpen = 'WalletOpen',
    WalletClose = 'WalletClose',
    EncryptMail = 'EncryptMail',
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

export enum HostArr{
    Google = 'mail.google.com',
    Mail163 = 'mail.163.com',
    Mail126 = 'mail.126.com',
    QQ = 'wx.mail.qq.com'
}
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
