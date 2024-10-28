import browser from "webextension-polyfill";
import {
    showView
} from "./common";
import {checkAndInitDatabase, initDatabase} from "./database";
import {translateMainPage} from "./local";
import {loadLastSystemSetting} from "./setting";
import {sessionGet, sessionSet} from "./session_storage";
import {
    __systemSetting, router
} from "./main_common";
import {initLoginDiv} from "./main_login";
import {initDashBoard} from "./main_dashboard";
import {WalletStatus} from "./consts";
import {queryCurWallet} from "./wallet";
import {__dbKey_cur_key, __key_wallet_status} from "./background";
import {initSetting} from "./main_setting";

document.addEventListener("DOMContentLoaded", initBMailExtension as EventListener);

async function initBMailExtension(): Promise<void> {
    await initDatabase();
    loadLastSystemSetting().then(setting => {
        sessionSet(__systemSetting, setting);
    });
    translateMainPage();
    await checkBackgroundStatus();
    initLoginDiv();
    initDashBoard();
    initSetting();
}

async function checkBackgroundStatus(): Promise<void> {

    const status = await checkWalletStatus();

    switch (status) {
        case WalletStatus.NoWallet:
            browser.tabs.create({
                url: browser.runtime.getURL("html/home.html#onboarding/welcome")
            }).then();
            return;

        case WalletStatus.Locked:
        case WalletStatus.Expired:
            showView('#onboarding/main-login', router);
            return;

        case WalletStatus.Unlocked:
            showView('#onboarding/main-dashboard', router);
            return;
    }
}

async function checkWalletStatus(): Promise<WalletStatus> {

    await checkAndInitDatabase();

    let walletStatus = await sessionGet(__key_wallet_status) || WalletStatus.Init;
    if (walletStatus === WalletStatus.Init) {
        const wallet = await queryCurWallet();
        console.log('[service work] queryCurWallet result:', wallet);
        if (!wallet) {
            return WalletStatus.NoWallet;
        }
        return WalletStatus.Locked;
    }

    if (walletStatus === WalletStatus.Unlocked) {
        const mKey = await sessionGet(__dbKey_cur_key) as Uint8Array;
        if (!mKey) {
            return WalletStatus.Locked;
        }
    }

    return walletStatus;
}