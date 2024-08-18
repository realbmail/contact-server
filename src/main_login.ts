import browser from "webextension-polyfill";
import {MsgType, showView} from "./common";
import {MailAddress} from "./wallet";
import {sessionSet} from "./session_storage";
import {__currentAccountAddress, router} from "./main_common";

export function initLoginDiv(): void {
    const button = document.querySelector(".view-main-login .primary-button") as HTMLButtonElement;
    button.addEventListener('click', openAllWallets);
}


function openAllWallets(): void {
    const inputElement = document.querySelector(".view-main-login input") as HTMLInputElement;
    const password = inputElement.value;

    browser.runtime.sendMessage({action: MsgType.WalletOpen, password: password}).then(async (response: {
        status: boolean;
        message: MailAddress;
        error: string
    }) => {
        if (!response.status) {
            const errTips = document.querySelector(".view-main-login .login-error") as HTMLElement;
            console.log("------>>>error:", response.error)
            errTips.innerText = response.error;
            return;
        }
        console.log("------------>>>", response.message);
        const mAddr = response.message as MailAddress;
        await sessionSet(__currentAccountAddress, mAddr);

        showView('#onboarding/main-dashboard', router);
        return;
    }).catch(error => {
        console.error('Error sending message:', error);
    });
}
