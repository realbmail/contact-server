import {__tableNameWallet, databaseQueryAll, getMaxIdRecord} from "./database";

export enum MsgType {
    PluginClicked = 'PluginClicked',
    WalletOpen = 'WalletOpen',
    WalletClose = 'WalletClose',
    WalletCreated = 'WalletCreated',
}
export enum WalletStatus {
    Init = 'Init',
    NoWallet = 'NoWallet',
    Locked = 'Locked',
    Unlocked = 'Unlocked',
    Expired = 'Expired',
    Error = 'error'
}
export function showView(hash: string, callback: (hash: string) => void): void {
    const views = document.querySelectorAll<HTMLElement>('.view');
    views.forEach(view => view.style.display = 'none');

    const id = hash.replace('#onboarding/', 'view-');
    const targetView = document.getElementById(id);
    if (targetView) {
        targetView.style.display = 'block';
    }
    callback(hash);
}

export async function queryCurWallet(): Promise<DbWallet|null> {
    const walletObj = await getMaxIdRecord(__tableNameWallet);
    if (!walletObj) {
        return null;
    }
    return walletObj;
}