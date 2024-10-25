import browser from "webextension-polyfill";
import {hideLoading, showLoading, showView} from "./common";
import {MailAddress} from "./wallet";
import {sessionSet} from "./session_storage";
import {__currentAccountAddress, router, showDialog} from "./main_common";
import {__tableNameWallet, databaseDeleteByFilter} from "./database";
import {MsgType} from "./consts";

export function initLoginDiv(): void {
    const unlock = document.querySelector(".view-main-login .primary-button") as HTMLButtonElement;
    unlock.addEventListener('click', openAllWallets);


    const newAccBtn = document.querySelector(".view-main-login .secondary-button") as HTMLButtonElement;
    newAccBtn.addEventListener('click', () => {
        showDialog("Warning", "Are you sure to remove the old account", "I'm Sure", newAccountToReplaceCurrent);
    });

    const forgetPwdBtn = document.querySelector(".view-main-login .forget-help") as HTMLButtonElement;
    forgetPwdBtn.addEventListener('click', async () => {
        await browser.tabs.create({
            url: browser.runtime.getURL("html/home.html#onboarding/import-wallet")
        })
    });
}

async function openAllWallets(): Promise<void> {
    try {
        const inputElement = document.querySelector(".view-main-login input") as HTMLInputElement;
        const password = inputElement.value;

        const response = await browser.runtime.sendMessage({
            action: MsgType.WalletOpen,
            password: password
        })

        if (!response.status) {
            const errTips = document.querySelector(".view-main-login .login-error") as HTMLElement;
            console.log("------>>>error:", response.error)
            if (response.error.includes("bad seed size") || response.error.includes("Malformed UTF-8 data")) {
                errTips.innerText = browser.i18n.getMessage('invalid_password');
            } else {
                errTips.innerText = response.error;
            }
            return;
        }

        console.log("------------>>>", response.message);
        const mAddr = response.message as MailAddress;
        await sessionSet(__currentAccountAddress, mAddr);
        inputElement.value = '';
        showView('#onboarding/main-dashboard', router);
    } catch (e) {
        console.log("------------>>> failed to open wallet:=>", e);
    }
}

async function newAccountToReplaceCurrent() {
    showLoading();
    try {
        await databaseDeleteByFilter(__tableNameWallet, (val) => {
            console.log("-------->>> value to remove:", val);
            return true
        });

        await browser.tabs.create({
            url: browser.runtime.getURL("html/home.html#onboarding/welcome")
        })
    } catch (error) {
        console.log('-------->>> action failed:', error);
    } finally {
        hideLoading();
    }
    return true;
}