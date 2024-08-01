import browser from "webextension-polyfill";
import {MsgType, showView, WalletStatus} from "./common";
import {__currentDatabaseVersion, __tableSystemSetting, databaseUpdate, getMaxIdRecord, initDatabase} from "./database";
import {DbWallet} from "./wallet";
class SysSetting {
    id: number;
    address: string;
    network: string;

    constructor(id: number, addr: string, network: string) {
        this.id = id;
        this.address = addr;
        this.network = network;
    }

    async syncToDB(): Promise<void> {
        await databaseUpdate(__tableSystemSetting, this.id, this);
    }

    async changeAddr(addr: string): Promise<void> {
        this.address = addr;
        await databaseUpdate(__tableSystemSetting, this.id, this);
    }
}

let __systemSetting: SysSetting;
let __curWallet: DbWallet;

document.addEventListener("DOMContentLoaded", initDessagePlugin as EventListener);

async function initDessagePlugin(): Promise<void> {
    await initDatabase();
    await loadLastSystemSetting();
    checkBackgroundStatus();
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
    if (path === '#onboarding/dashboard') {
        populateDashboard();
    }
}
function populateDashboard() {

}

async function loadLastSystemSetting(): Promise<void> {
    const ss = await getMaxIdRecord(__tableSystemSetting);
    if (ss) {
        __systemSetting = new SysSetting(ss.id, ss.address, ss.network);
        return;
    }
    __systemSetting = new SysSetting(__currentDatabaseVersion, '', '');
}