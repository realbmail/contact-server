export enum MsgType {
    PluginClicked = 'PluginClicked',
    WalletCreate = 'WalletCreate',
    WalletOpen = 'WalletOpen',
    WalletClose = 'WalletClose',
    EncryptData = 'EncryptData',
    DecryptData = 'DecryptData',
    BMailInbox = 'BMailInbox',
    AddInboxBtn = 'AddInboxBtn',
    QueryCurEmail = 'QueryCurEmail',
    EmailAddrToBmailAddr = 'EmailAddrToBmailAddr',
    CheckIfLogin = 'CheckIfLogin',
    SignData = 'SignData',
    QueryAccountDetails = 'QueryAccountDetails',
    EmailBindOp = 'EmailBindOp',
    IfBindThisEmail = 'IfBindThisEmail',
    OpenPlugin = 'OpenPlugin',
    BindAction = 'BindAction',
    QueryCurBMail = 'QueryCurBMail',
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
    QQ = 'mail.qq.com',
    OutLook = 'outlook.live.com'
}

// const httpServerUrl = "https://sharp-happy-grouse.ngrok-free.app"
// const httpServerUrl = "http://bmail.simplenets.org:8001"
export const httpServerUrl = "https://bmail.simplenets.org:8443"
// const httpServerUrl = "http://127.0.0.1:8001"
export const Inject_Msg_Flag = "BMAIL_INJECTION_MSG_ORIGIN";
export const Plugin_Request_Timeout = 20_000;

export const ECWalletClosed = -1
export const ECEncryptedFailed = -3
export const ECDecryptFailed = -4
export const ECNoCallbackFound = -5
export const ECNoValidMailReceiver = -6
export const ECQueryBmailFailed = -7
export const ECInternalError = -1007
