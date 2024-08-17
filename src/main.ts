import browser from "webextension-polyfill";
import {
    BMRequestToSrv,
    encodeHex,
    MsgType,
    sendMessageToBackground,
    showView, signDataByMessage,
    WalletStatus
} from "./common";
import {initDatabase} from "./database";
import {MailAddress, queryCurWallet} from "./wallet";
import {translateMainPage} from "./local";
import {loadLastSystemSetting} from "./setting";
import {sessionGet, sessionSet} from "./session_storage";
import {BMailAccount, Operation} from "./proto/bmail_srv";

const __currentAccountAddress = "__current_wallet_storage_key_"
const __systemSetting = "__system_setting_"
let __currentAccountData = "__current_account_data_";

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
        populateDashboard().then();
    }
}

async function loadAndSetupAccount(force?: boolean) {
    const accountAddr = await sessionGet(__currentAccountAddress);
    if (!accountAddr) {
        console.log("------>>>fatal logic error, no wallet found!");
        showView('#onboarding/main-login', router);
        return;
    }
    document.getElementById('bmail-address-val')!.textContent = accountAddr.bmail_address;

    const statusRsp = await sendMessageToBackground({
        address: accountAddr.bmail_address,
        force: force === true
    }, MsgType.QueryAccountDetails);
    if (statusRsp.success < 0) {
        console.log("------>>> account detail load failed")
        return;
    }
    const accountData = statusRsp.data as BMailAccount;
    console.log("------>>> account query success:", accountData);
    setupElementByAccountData(accountData);
    await sessionSet(__currentAccountData, accountData);
}

function levelToStr(level: number): string {
    switch (level) {
        case 0:
        default:
            return "未激活";
        case 1:
            return "免费用户";
        case 2:
            return "青铜用户";
        case 3:
            return "白银用户";
        case 4:
            return "金牌用户";
    }
}

function setupElementByAccountData(accountData: BMailAccount) {
    document.getElementById('bmail-account-level-val')!.textContent = levelToStr(accountData.level);
    if (accountData.level === 0) {
        document.getElementById('bmail-active-account')!.style.display = 'block';
    } else {
        document.getElementById('bmail-active-account')!.style.display = 'none';
    }

    if (!accountData.license) {
        document.getElementById('bmail-account-license-val')!.textContent = "无License";
    } else {
        document.getElementById('bmail-account-license-val')!.textContent = "License截止日:";
    }
    if (accountData.emails.length <= 0) {
        return;
    }

    const parentDiv = document.getElementById('binding-email-address-list') as HTMLElement;
    parentDiv.innerHTML = '';
    const templateDiv = document.getElementById('binding-email-address-item') as HTMLElement;
    accountData.emails.forEach(email => {
        const clone = templateDiv.cloneNode(true) as HTMLElement;
        clone.style.display = "block";
        clone.removeAttribute('id');
        const button = clone.querySelector('button') as HTMLElement;
        button.addEventListener('click', async (e) => {
            const success = await emailBindingOperate(true, email);
            if (success) {
                clone.parentNode?.removeChild(clone);
            }
        })
        const emailSpan = clone.querySelector('.binding-email-address-val') as HTMLElement
        emailSpan.innerText = email;
        parentDiv.append(clone);
    });
}

async function emailBindingOperate(isDel: boolean, email: string): Promise<boolean> {
    showLoading();
    try {
        const data = {
            isDel: isDel,
            emails: [email],
        }
        const rsp = await sendMessageToBackground(data, MsgType.EmailBindOp);
        if (rsp.success < 0) {
            showDialog("error", rsp.message);
            return false;
        }
        await loadAndSetupAccount(true);
        if (isDel) {
            queryCurrentEmailAddr();
        }
        return true;
    } catch (e) {
        showDialog("error", JSON.stringify(e));
        return false;
    } finally {
        hideLoading();
    }
}

async function hashEmailAddr(email: string): Promise<boolean> {

    const account = await sessionGet(__currentAccountData) as BMailAccount;
    if (!account) {
        return false;
    }

    if (account.emails.length <= 0) {
        return false;
    }

    for (let i = 0; i < account.emails.length; i++) {
        if (account.emails[i] === email) {
            return true;
        }
    }

    return false;
}

function queryCurrentEmailAddr() {
    browser.tabs.query({active: true, currentWindow: true}).then(tabList => {

        const activeTab = tabList[0];
        if (!activeTab || !activeTab.id) {
            console.log("------>>> invalid tab")
            return;
        }

        browser.tabs.sendMessage(activeTab.id, {action: MsgType.QueryCurEmail}).then(async response => {
            if (response && response.value) {
                console.log('------>>>Element Value:', response.value);
                const currentEmail = response.value;
                document.getElementById('bmail-email-address-val')!.textContent = currentEmail;
                const hasBind = await hashEmailAddr(currentEmail);
                if (hasBind) {
                    return;
                }
                const bindOrUnbindBtn = document.getElementById('current-email-bind-btn') as HTMLElement;
                bindOrUnbindBtn.style.display = "block";
                bindOrUnbindBtn.addEventListener('click', async (e) => {
                    const success = await emailBindingOperate(false, currentEmail);
                    if (success) {
                        bindOrUnbindBtn.style.display = 'none';
                    }
                })
            } else {
                console.log('------>>>Element not found or has no value');
            }
        });
    })
}

async function populateDashboard() {
    await loadAndSetupAccount();
    queryCurrentEmailAddr();
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
        await sessionSet(__currentAccountAddress, mAddr);

        showView('#onboarding/main-dashboard', router);
        return;
    }).catch(error => {
        console.error('Error sending message:', error);
    });
}

function initDashBoard(): void {
    const container = document.getElementById("view-main-dashboard") as HTMLDivElement;

    const reloadBindingBtn = container.querySelector(".bmail-address-query-btn") as HTMLButtonElement;
    reloadBindingBtn.addEventListener('click', async () => {
        await loadAndSetupAccount(true);
    });

    const closeButton = document.getElementById('dialog-tips-close-button') as HTMLButtonElement;
    closeButton.addEventListener('click', () => {
        hideDialog();
    });

    const showKeyStore = container.querySelector(".bmail-wallet-export-btn") as HTMLButtonElement
    showKeyStore.addEventListener('click', async () => {
        await showUserKeyStore();
    });
    const activeBtn = document.getElementById('bmail-active-account') as HTMLButtonElement;
    activeBtn.addEventListener('click', async () => {
        await activeCurrentAccount(activeBtn);
    })
}

function showDialog(title: string, message: string, confirmButtonText?: string, confirmCallback?: () => boolean): void {
    const dialogContainer = document.getElementById('dialog-tips-container') as HTMLDivElement;
    const dialogTitle = document.getElementById('dialog-tips-title') as HTMLHeadingElement;
    const dialogMessage = document.getElementById('dialog-tips-message') as HTMLParagraphElement;
    let confirmButton = document.getElementById('dialog-tips-confirm-button') as HTMLButtonElement;

    dialogTitle.innerText = title;
    dialogMessage.innerText = message;
    if (confirmButtonText) {
        confirmButton.innerText = confirmButtonText;
    } else {
        confirmButton.innerText = 'OK';
    }

    // Remove previous event listener to avoid multiple callbacks
    confirmButton.replaceWith(confirmButton.cloneNode(true));
    confirmButton = document.getElementById('dialog-tips-confirm-button') as HTMLButtonElement;

    confirmButton.addEventListener('click', () => {
        if (confirmCallback) {
            const closeTab = confirmCallback();
            if (closeTab) {
                hideDialog();
            }
            return;
        }
        hideDialog();
    });

    dialogContainer.style.display = 'flex';
}

function hideDialog(): void {
    const dialogContainer = document.getElementById('dialog-tips-container') as HTMLDivElement;
    dialogContainer.style.display = 'none';
}

function showLoading(): void {
    document.body.classList.add('loading');
    document.getElementById("dialog-waiting-overlay")!.style.display = 'flex';
}

function hideLoading(): void {
    document.body.classList.remove('loading');
    document.getElementById("dialog-waiting-overlay")!.style.display = 'none';
}

async function showUserKeyStore() {
    try {
        const wallet = await queryCurWallet();
        if (!wallet) {
            throw new Error("Wallet not found");
        }
        const keyStoreStr = JSON.stringify(wallet, null, 4);

        showDialog("key store", keyStoreStr, "Copy", function () {
            navigator.clipboard.writeText(keyStoreStr).then(() => {
                alert("Copy success");
            });
            return true;
        })
    } catch (e) {
        const err = e as Error;
        showDialog("Error", err.message);
    }
}

async function activeCurrentAccount(actBtn: HTMLButtonElement) {
    showLoading();
    try {
        const accountAddr = await sessionGet(__currentAccountAddress);
        if (!accountAddr) {
            console.log("------>>>fatal logic error, no wallet found!");
            showView('#onboarding/main-login', router);
            return;
        }
        const address = accountAddr.bmail_address;
        const payload: Operation = Operation.create({
            isDel: false,
            address: address,
        });

        const message = Operation.encode(payload).finish()
        const signature = await signDataByMessage(encodeHex(message));
        if (!signature) {
            throw new Error("sign data failed")
        }
        const srvRsp = await BMRequestToSrv("/account_create", address, message, signature)
        console.log("------->>>fetch success:=>", srvRsp);
        actBtn.style.display = 'none';
    } catch (e) {
        console.log("------->>>fetch failed:=>", e);
        showDialog("error", JSON.stringify(e));
    } finally {
        hideLoading();
    }
}