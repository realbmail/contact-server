import browser from "webextension-polyfill";
import {encodeHex, httpApi, MsgType, showView, signData, WalletStatus} from "./common";
import {initDatabase} from "./database";
import {MailAddress} from "./wallet";
import {translateMainPage} from "./local";
import {loadLastSystemSetting} from "./setting";
import {sessionGet, sessionSet} from "./session_storage";
import {BMailAccount, BMReq, Operation, QueryReq} from "./proto/bmail_srv";

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

function router(path: string): void {
    if (path === '#onboarding/main-dashboard') {
        populateDashboard();
    }
}

function populateDashboard() {
    sessionGet(__currentWalletKey).then(mAddr => {
        if (!mAddr) {
            console.log("------>>>fatal logic error, no wallet found!");
            showView('#onboarding/main-login', router);
            return;
        }
        document.getElementById('bmail-address-val')!.textContent = mAddr.bmailAddress;
    })

    browser.tabs.query({active: true, currentWindow: true}).then(tabList => {
        const activeTab = tabList[0];
        if (!activeTab || !activeTab.id) {
            console.log("------>>> invalid tab")
            return;
        }
        browser.tabs.sendMessage(activeTab.id, {action: MsgType.QueryCurEmail}).then(response => {
            if (response && response.value) {
                console.log('------>>>Element Value:', response.value);
                document.getElementById('bmail-email-address-val')!.textContent = response.value;
            } else {
                console.log('------>>>Element not found or has no value');
            }
        });
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
        await sessionSet(__currentWalletKey, mAddr);

        showView('#onboarding/main-dashboard', router);
        return;
    }).catch(error => {
        console.error('Error sending message:', error);
    });
}

function initDashBoard(): void {
    const container = document.getElementById("view-main-dashboard") as HTMLDivElement;
    const reloadBindingBtn = container.querySelector(".bmail-address-query-btn") as HTMLButtonElement;
    reloadBindingBtn.addEventListener('click', reloadBindings);
}

async function reloadBindings() {
    const account = await queryLastAccountInfo();
    if (!account) {
        return;
    }
    const address = document.getElementById('bmail-address-val')?.textContent;

    const template = document.getElementById("binding-email-address-item") as HTMLElement;
    const parent = document.getElementById("binding-email-address-list") as HTMLElement;
    account.emails.forEach((emailAddress) => {
        const clone = template.cloneNode(true) as HTMLElement;
        const unbindBtn = clone.querySelector(".binding-email-unbind-btn") as HTMLElement;
        unbindBtn.addEventListener("click", e => {
            unbindMailFromAccount(emailAddress,address!);
        })
    })
}

async function queryLastAccountInfo(): Promise<BMailAccount | null> {
    const address = document.getElementById('bmail-address-val')?.textContent;
    if (!address) {
        console.log("------>>> no valid address found");
        return null;
    }
    try {
        const parameter = QueryReq.create({
            address:address,
        })
        const message = QueryReq.encode(parameter).finish()
        const signature = await signData(encodeHex(message));
        if(!signature){
            console.log("------>>> sign data failed")
            return null;
        }
        const postData = BMReq.create({
            address:address,
            signature:signature,
            payload:message,
        })

        const rawData = BMReq.encode(postData).finish();
        const bindings = await httpApi("/query_account", rawData)
        return BMailAccount.decode(bindings) as BMailAccount;
    } catch (e) {
        console.log('------>>>reload bindings error:', e);
        return null;
    }
}

function unbindMailFromAccount(emailAddress: string, address: string): void {

}