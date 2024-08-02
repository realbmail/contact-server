/// <reference lib="webworker" />
import browser, {Runtime} from "webextension-polyfill";
import {checkAndInitDatabase, closeDatabase} from "./database";
import {MsgType, WalletStatus} from "./common";
import {castToMemWallet, queryCurWallet} from "./wallet";

const runtime = browser.runtime;
const storage = browser.storage;
const alarms = browser.alarms;
const tabs = browser.tabs;
const __alarm_name__: string = '__alarm_name__timer__';
const __key_wallet_status: string = '__key_wallet_status';
const __key_wallet_cur: string = '__key_wallet_cur';

async function sessionSet(key: string, value: any): Promise<void> {
    try {
        await storage.session.set({[key]: value});
        console.log("[service work] Value was set successfully.", value);
    } catch (error: unknown) {
        const err = error as Error;
        console.error("[service work] Failed to set value:", err);
    }
}

async function sessionGet(key: string): Promise<any> {
    try {
        const result = await storage.session.get(key);
        console.log("[service work] Value is:", result[key]);
        return result[key];
    } catch (error: unknown) {
        const err = error as Error;
        console.error("[service work] Failed to get value:", err);
        return null;
    }
}

async function sessionRemove(key: string): Promise<void> {
    try {
        await storage.session.remove(key);
        console.log("[service work] Value was removed successfully.");
    } catch (error) {
        console.error("[service work] Failed to remove value:", error);
    }
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

        case  MsgType.EncryptMail:
            browser.action.openPopup().then(() => {
                sendResponse({success: true});
            }).catch((error) => {
                console.error(error);
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

self.addEventListener('install', () => {
    console.log('[service work] Service Worker installing...');
    createAlarm().then(() => {
    });
});

self.addEventListener('activate', (event) => {
    const extendableEvent = event as ExtendableEvent;
    extendableEvent.waitUntil((self as unknown as ServiceWorkerGlobalScope).clients.claim());
    console.log('[service work] Service Worker activating......');
});

runtime.onInstalled.addListener((details: Runtime.OnInstalledDetailsType) => {
    console.log("[service work] onInstalled event triggered......");
    if (details.reason === "install") {
        tabs.create({
            url: runtime.getURL("home.html#onboarding/welcome")
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
}

async function closeWallet(sendResponse: (response: any) => void): Promise<void> {
    await sessionRemove(__key_wallet_status);
    await sessionRemove(__key_wallet_cur);
    if (sendResponse) {
        sendResponse({status: true});
    }
}
