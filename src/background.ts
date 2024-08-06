/// <reference lib="webworker" />
import browser, {Runtime} from "webextension-polyfill";
import {checkAndInitDatabase, closeDatabase} from "./database";
import {sessionGet, sessionRemove, sessionSet} from "./session_storage";
import {castToMemWallet, queryCurWallet} from "./wallet";
import {MsgType, WalletStatus} from "./common";

const runtime = browser.runtime;
const alarms = browser.alarms;
const tabs = browser.tabs;
const __alarm_name__: string = '__alarm_name__timer__';
const __key_wallet_status: string = '__key_wallet_status';
const __key_wallet_cur: string = '__key_wallet_cur';

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
    switch (request.action) {
        case MsgType.PluginClicked:
            pluginClicked(sendResponse).then(() => {
            }).catch((error: Error) => {
                console.error("[service work] Failed to set value:", error);
                sendResponse({status: false, error: error});
            });
            return true;
        case MsgType.WalletOpen:
            openWallet(request.password, sendResponse).then(() => {
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

        case  MsgType.EncryptMail:
            browser.action.openPopup().then(() => {
                sendResponse({success: true,data:request.data});
            }).catch((error) => {
                console.error("[service work] encrypt mail failed:", error);
                sendResponse({success: false, error: error.message});
            });
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
    console.log(`[service work] Service Worker is ${availableUrl}...`);
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
        const sObj = await sessionGet(__key_wallet_cur);
        let msg = JSON.stringify(sObj);
        sendResponse({status: walletStatus, message: msg});
        return;
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

    const mWallet = castToMemWallet(pwd, wallet);
    await sessionSet(__key_wallet_status, WalletStatus.Unlocked);
    await sessionSet(__key_wallet_cur, wallet);
    sendResponse({status: true, message: JSON.stringify(mWallet)});
    updateIcon(true);
}

async function closeWallet(sendResponse: (response: any) => void): Promise<void> {
    await sessionRemove(__key_wallet_status);
    await sessionRemove(__key_wallet_cur);
    if (sendResponse) {
        sendResponse({status: true});
    }
}

const urlsToMatch = [
    "https://mail.google.com/*",
    "https://mail.163.com/*",
    "https://wx.mail.qq.com/*",
    "https://mail.126.com/*"
];

tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        const ok = await checkTabUrl(tabId);
        console.log("[service work] onUpdated checkTabUrl=>", ok);
    }
});

tabs.onActivated.addListener(async (activeInfo) => {
    const ok = await checkTabUrl(activeInfo.tabId);
    console.log("[service work] onActivated checkTabUrl=>", ok);
});

async function checkTabUrl(tabId: number): Promise<boolean> {
    const tab = await tabs.get(tabId);
    if (!tab.url) {
        return false;
    }
    return urlsToMatch.some(url => new URL(tab.url!).origin.startsWith(new URL(url).origin));
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