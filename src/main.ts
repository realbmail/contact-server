import browser from "webextension-polyfill";
import {
    MsgType,
    showView, WalletStatus
} from "./common";
import {initDatabase} from "./database";
import {translateMainPage} from "./local";
import {loadLastSystemSetting} from "./setting";
import {sessionSet} from "./session_storage";
import {
    __systemSetting, router
} from "./main_common";
import {initLoginDiv} from "./main_login";
import {initDashBoard} from "./main_dashboard";
import {initNewContactView} from "./main_new_contact";


document.addEventListener("DOMContentLoaded", initDessagePlugin as EventListener);

async function initDessagePlugin(): Promise<void> {
    await initDatabase();
    loadLastSystemSetting().then(setting => {
        sessionSet(__systemSetting, setting);
    });
    translateMainPage();
    checkBackgroundStatus();
    initLoginDiv();
    initDashBoard();
    initNewContactView();
}

function checkBackgroundStatus(): void {
    const request = {action: MsgType.PluginClicked};

    browser.runtime.sendMessage(request).then((response: any) => {
        console.log("request=>", JSON.stringify(request));
        if (!response) {
            console.error('Error: Response is undefined or null.');
            return;
        }
        console.log("------>>>response=>", JSON.stringify(response));

        switch (response.status) {
            case WalletStatus.NoWallet:
                browser.tabs.create({
                    url: browser.runtime.getURL("html/home.html#onboarding/welcome")
                }).then(() => {
                });
                return;
            case WalletStatus.Locked:
            case WalletStatus.Expired:
                showView('#onboarding/main-login', router);
                return;
            case WalletStatus.Unlocked:
                showView('#onboarding/main-dashboard', router);
                return;
            case WalletStatus.Error:
                alert("error:" + response.message);
                return;
            case WalletStatus.InvalidTarget:
                showView('#onboarding/invalid-service-target', router);
                return;
        }
    }).catch((error: any) => {
        console.error('Error sending message:', error);
    });
}
