/// <reference lib="webworker" />
import browser, {Runtime} from "webextension-polyfill";
import {__tableNameWallet, checkAndInitDatabase, closeDatabase, databaseAddItem} from "./database";
import {resetStorage, sessionGet, sessionRemove, sessionSet} from "./session_storage";
import {castToMemWallet, MailKey, newWallet, queryCurWallet} from "./wallet";
import {MsgType, WalletStatus} from "./common";
import {decodeMail, encodeMail} from "./bmail_body";
import {testEd2curve, testEdCrypto, testEdCrypto2, testOne, testThree, testTwo} from "./testEncrypt";

const runtime = browser.runtime;
const alarms = browser.alarms;
const tabs = browser.tabs;
const __alarm_name__: string = '__alarm_name__timer__';
const __key_wallet_status: string = '__key_wallet_status';
const __dbKey_cur_key: string = '__dbKey_cur_key__';

const ICON_PATHS = {
    loggedIn: {
        "16": "../file/logo_16.png",
        "48": "../file/logo_48.png",
        "128": "../file/logo_128.png"
    },
    loggedOut: {
        "16": "../file/logo_16_out.png",
        "48": "../file/logo_48_out.png",
        "128": "../file/logo_128_out.png"
    }
};

function updateIcon(isLoggedIn: boolean) {
    const iconPath = isLoggedIn ? ICON_PATHS.loggedIn : ICON_PATHS.loggedOut;
    browser.action.setIcon({path: iconPath});
}

runtime.onMessage.addListener((request: any, sender: Runtime.MessageSender, sendResponse: (response?: any) => void): true | void => {
    console.log("[service work] action :=>", request.action, sender.tab, sender.url);
    testThree();
    switch (request.action) {
        case MsgType.PluginClicked:
            pluginClicked(sendResponse).then(() => {
            }).catch((error: Error) => {
                console.error("[service work] Failed to set value:", error);
                sendResponse({status: false, error: error});
            });
            return true;

        case MsgType.WalletCreate:
            const param = request.data;
            createWallet(param.mnemonic, param.password, sendResponse).then();
            return true;

        case MsgType.WalletOpen:
            openWallet(request.password, sendResponse).then(() => {
            }).catch((error: Error) => {
                console.log("[service work] Failed to open wallets:", error);
                sendResponse({status: false, error: error.message});
            });
            return true;

        case MsgType.WalletClose:
            closeWallet(sendResponse).then(() => {
            });
            return true;

        case  MsgType.BMailInbox:
            browser.action.openPopup().then(() => {
                sendResponse({success: true});
            }).catch((error) => {
                console.error("[service work] bmail inbox action failed:", error);
                sendResponse({success: false, error: error.message});
            });
            return true;

        case  MsgType.EncryptData:
            encryptData(request.receivers, request.data, sendResponse).then();
            return true;
        case MsgType.DecryptData:
            decryptData(request.data, sendResponse).then();
            return true;
        case MsgType.EmailAddrToBmailAddr:
            contactQuery(request.data, sendResponse).then();
            return true;
        case MsgType.CheckIfLogin:
            checkLoginStatus(sendResponse).then();
            return true;

        case MsgType.SignData:
            SigDataInBackground(request.data, sendResponse).then();
            return true;
        default:
            sendResponse({status: false, message: 'unknown action'});
            return;
    }
});

async function createAlarm(): Promise<void> {
    const alarm = await alarms.get(__alarm_name__);
    if (!alarm) {
        alarms.create(__alarm_name__, {
            periodInMinutes: 1
        });
    }
}

alarms.onAlarm.addListener(timerTaskWork);

async function timerTaskWork(alarm: any): Promise<void> {
    if (alarm.name === __alarm_name__) {
        console.log("[service work] Alarm Triggered!");
    }
}

self.addEventListener('install', (event) => {
    console.log('[service work] Service Worker installing...');
    const evt = event as ExtendableEvent;
    evt.waitUntil(createAlarm());
    updateIcon(false);
});

self.addEventListener('activate', (event) => {
    const extendableEvent = event as ExtendableEvent;
    extendableEvent.waitUntil((self as unknown as ServiceWorkerGlobalScope).clients.claim());
    console.log('[service work] Service Worker activating......');
    updateIcon(false);
    resetStorage().then();
});

runtime.onInstalled.addListener((details: Runtime.OnInstalledDetailsType) => {
    console.log("[service work] onInstalled event triggered......");
    if (details.reason === "install") {
        tabs.create({
            url: runtime.getURL("html/home.html#onboarding/welcome")
        }).then(() => {
        });
    }
});

runtime.onStartup.addListener(() => {
    console.log('[service work] Service Worker onStartup......');
});

runtime.onSuspend.addListener(() => {
    console.log('[service work] Browser is shutting down, closing IndexedDB...');
    closeDatabase();
});

async function pluginClicked(sendResponse: (response: any) => void): Promise<void> {
    const availableUrl = await currentTabIsValid();
    console.log(`[service work] current url is ${availableUrl}...`);
    if (!availableUrl) {
        sendResponse({status: WalletStatus.InvalidTarget, message: ''});
        return
    }
    await checkAndInitDatabase();
    let walletStatus = await sessionGet(__key_wallet_status) || WalletStatus.Init;
    if (walletStatus === WalletStatus.Init) {
        const wallet = await queryCurWallet();
        console.log('[service work] queryCurWallet result:', wallet);
        if (!wallet) {
            console.log('[service work] Wallet not found');
            sendResponse({status: WalletStatus.NoWallet, message: ''});
            return;
        }
        sendResponse({status: WalletStatus.Locked, message: ''});
        return;
    }

    if (walletStatus === WalletStatus.Unlocked) {
        const mKey = await sessionGet(__dbKey_cur_key) as Uint8Array;
        if (!mKey) {
            sendResponse({status: WalletStatus.Locked, message: 'no valid key found'});
            return;
        }
        sendResponse({status: walletStatus});
        return;
    }
}

async function createWallet(mnemonic: string, password: string, sendResponse: (response: any) => void): Promise<void> {
    try {
        const wallet = newWallet(mnemonic, password);
        await databaseAddItem(__tableNameWallet, wallet);
        const mKey = castToMemWallet(password, wallet);
        await sessionSet(__key_wallet_status, WalletStatus.Unlocked);
        await sessionSet(__dbKey_cur_key, mKey.rawPriKey());
        sendResponse({success: true, data: wallet})
    } catch (error) {
        console.log("[service work] creating wallet failed:", error);
        sendResponse({status: false, message: 'create wallet failed'});
    }
}

async function openWallet(pwd: string, sendResponse: (response: any) => void): Promise<void> {
    await checkAndInitDatabase();
    const wallet = await queryCurWallet();
    if (!wallet) {
        sendResponse({status: false, error: 'no wallet setup'});
        await sessionSet(__key_wallet_status, WalletStatus.NoWallet);
        return;
    }

    const mKey = castToMemWallet(pwd, wallet);
    await sessionSet(__key_wallet_status, WalletStatus.Unlocked);
    await sessionSet(__dbKey_cur_key, mKey.rawPriKey());
    sendResponse({status: true, message: mKey.address});
    updateIcon(true);
}

async function closeWallet(sendResponse: (response: any) => void): Promise<void> {
    await sessionRemove(__key_wallet_status);
    await sessionRemove(__dbKey_cur_key);
    if (sendResponse) {
        sendResponse({status: true});
    }
}

const urlsToMatch = [
    "https://mail.google.com/*",
    "https://mail.163.com/*",
    "https://wx.mail.qq.com/*",
    "https://mail.126.com/*",
    "https://*.mail.google.com/*",
    "https://*.mail.163.com/*",
    "https://*.mail.qq.com/*",
    "https://*.mail.126.com/*"
];

tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        console.log("[service work] tabs onUpdated =>");
    }
});

tabs.onActivated.addListener(async (activeInfo) => {
    const ok = await checkTabUrl(activeInfo.tabId);
    console.log("[service work] tabs onActivated =>", ok);
});

async function checkTabUrl(tabId: number): Promise<boolean> {
    const tab = await tabs.get(tabId);
    if (!tab.url) {
        return false;
    }

    const matchesPattern = (url: string, pattern: string) => {
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*"));
        return regex.test(url);
    };

    return urlsToMatch.some(pattern => matchesPattern(tab.url!, pattern));
}

async function currentTabIsValid() {
    const tabsList = await tabs.query({active: true, currentWindow: true});
    if (tabsList.length == 0) {
        return false
    }
    if (!tabsList[0].id) {
        return false;
    }
    return checkTabUrl(tabsList[0].id);
}

async function checkWalletStatus(sendResponse: (response: any) => void) {
    let walletStatus = await sessionGet(__key_wallet_status) || WalletStatus.Init;
    const sObj = await sessionGet(__dbKey_cur_key);

    if (walletStatus !== WalletStatus.Unlocked || !sObj) {
        await browser.action.openPopup();
        sendResponse({success: 0, message: "open wallet first please!"});
        return null;
    }
    return new MailKey(new Uint8Array(sObj));
}

async function encryptData(peerAddr: string[], plainTxt: string, sendResponse: (response: any) => void) {
    try {
        const mKey = await checkWalletStatus(sendResponse);
        if (!mKey) {
            return;
        }
        if (peerAddr.length <= 0) {
            sendResponse({success: -1, message: "no valid blockchain address of receivers"});
            return null;
        }

        const mail = encodeMail(peerAddr, plainTxt, mKey)
        console.log("[service work] encrypted mail body =>", mail);
        sendResponse({success: true, data: JSON.stringify(mail)});
    } catch (err) {
        sendResponse({success: -1, message: `internal error: ${err}`});
    }
}

async function decryptData(mail: string, sendResponse: (response: any) => void) {
    try {
        const mKey = await checkWalletStatus(sendResponse);
        if (!mKey) {
            return;
        }
        const mailBody = decodeMail(mail, mKey);
        sendResponse({success: 1, data: mailBody});
    } catch (err) {
        sendResponse({success: -1, message: browser.i18n.getMessage("decrypt_mail_body_failed") + ` error: ${err}`});
    }
}

const contactData: Map<string, string> = new Map([
    ["hopwesley@126.com", 'BM7PkXCywW3pooVJNcZRnKcnZk8bkKku2rMyr9zp8jKo9M'],
    ["ribencong@163.com", 'BMCjb9vVp9DpBSZNUs5c7hvhL1BPUZdesCVh38YPDbVMaq'],
    ["ribencong@126.com", 'BMDCdbe97k8SanmsEwtw6XbHMxAC1ekpnsYXweNM5vTyhk']
]);

async function contactQuery(emailAddr: string, sendResponse: (response: any) => void) {
    try {
        const mKey = await checkWalletStatus(sendResponse);
        if (!mKey) {
            return;
        }

        const bmailAddr = contactData.get(emailAddr);
        if (!bmailAddr) {
            sendResponse({success: -1, message: browser.i18n.getMessage("invalid_bmail_account")});
            return;
        }
        sendResponse({success: 1, data: bmailAddr});
    } catch (err) {
        sendResponse({success: -1, message: `internal error: ${err}`});
    }
}

async function checkLoginStatus(sendResponse: (response: any) => void) {
    const status = await sessionGet(__key_wallet_status) || WalletStatus.Init
    if (status !== WalletStatus.Unlocked) {
        await browser.action.openPopup();
        sendResponse({success: -1});
        return;
    }
    sendResponse({success: 1});
}

async function SigDataInBackground(data: any, sendResponse: (response: any) => void) {
    const status = await sessionGet(__key_wallet_status) || WalletStatus.Init
    if (status !== WalletStatus.Unlocked) {
        sendResponse({success: false, message: "open wallet first"});
        return;
    }
    const priData = await sessionGet(__dbKey_cur_key);
    if (!priData) {
        sendResponse({success: false, message: "private raw data lost"});
        return;
    }
    const signature = MailKey.signData(priData, data);
    if (!signature) {
        sendResponse({success: false, message: "sign data failed"});
        return;
    }

    sendResponse({success: true, data: signature});
}