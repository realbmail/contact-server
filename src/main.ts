import browser from "webextension-polyfill";
import {MsgType, showView, WalletStatus} from "./common";
import {initDatabase} from "./database";
import {MemWallet} from "./wallet";
import {translateMainPage} from "./local";
import {loadLastSystemSetting} from "./setting";
import {sessionGet, sessionSet} from "./session_storage";

const __currentWalletKey = "__current_wallet_storage_key_"
const __systemSetting = "__system_setting_"

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
                const obj = JSON.parse(response.message);
                console.log("------>>>response=>", response.message);
                showView('#onboarding/main-dashboard', router);
                return;
            case WalletStatus.Error:
                alert("error:" + response.message);
                return;
        }
    }).catch((error: any) => {
        console.error('Error sending message:', error);
    });
}

function router(path: string): void {
    if (path === '#onboarding/main-dashboard') {
        populateDashboard();
    }
}

function populateDashboard() {
    sessionGet(__currentWalletKey).then(wallet => {
        if (!wallet) {
            //TODO::something wrong with this step.
            console.log("------>>>fatal logic error, no wallet found!")
            return;
        }
        document.getElementById('bmail-address-val')!.textContent = wallet.address;
    })
}

function initLoginDiv(): void {
    const button = document.querySelector(".view-main-login .primary-button") as HTMLButtonElement;
    button.addEventListener('click', openAllWallets);
}

function openAllWallets(): void {
    const inputElement = document.querySelector(".view-main-login input") as HTMLInputElement;
    const password = inputElement.value;

    browser.runtime.sendMessage({action: MsgType.WalletOpen, password: password}).then(async (response: {
        status: boolean;
        message: string
        error: string
    }) => {
        if (!response.status) {
            const errTips = document.querySelector(".view-main-login .login-error") as HTMLElement;
            errTips.innerText = response.error;
        }

        const obj = JSON.parse(response.message);
        console.log("------------>>>", response.message, obj);
        const wallet = new MemWallet(obj.address);
        await sessionSet(__currentWalletKey, wallet);

        showView('#onboarding/main-dashboard', router);
        return;
    }).catch(error => {
        console.error('Error sending message:', error);
    });
}

function initDashBoard(): void {

}