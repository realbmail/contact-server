import {BMRequestToSrv, encodeHex, MsgType, sendMessageToBackground, showView, signDataByMessage} from "./common";
import {sessionGet, sessionSet} from "./session_storage";
import {
    __currentAccountAddress,
    __currentAccountData,
    hideDialog, hideLoading,
    router,
    showDialog,
    showLoading
} from "./main_common";
import {AccountOperation, BMailAccount} from "./proto/bmail_srv";
import {queryCurWallet} from "./wallet";
import browser from "webextension-polyfill";
import {initContactBtn} from "./main_contact";

export function initDashBoard(): void {
    const container = document.getElementById("view-main-dashboard") as HTMLDivElement;

    const reloadBindingBtn = container.querySelector(".bmail-address-query-btn") as HTMLButtonElement;
    reloadBindingBtn.addEventListener('click', async () => {
        try {
            showLoading();
            await loadAndSetupAccount(true);
        } catch (error) {
            console.log("------>> load setup account error:=>", error);
        } finally {
            hideLoading();
        }
    });

    const closeButton = document.getElementById('dialog-tips-close-button') as HTMLButtonElement;
    closeButton.addEventListener('click', () => {
        hideDialog();
    });

    const addrValDiv = document.getElementById("bmail-address-val") as HTMLElement;
    addrValDiv.addEventListener('click', () => {
        const address = addrValDiv.innerText.trim();
        if (!address) {
            return;
        }
        navigator.clipboard.writeText(address).then(() => {
            showDialog("Success", "copy success");
        });
    })

    const exitBtn = container.querySelector(".bmail-wallet-exit-btn") as HTMLButtonElement
    exitBtn.addEventListener('click', async () => {
        await quitThisAccount();
    });

    const activeBtn = document.getElementById('bmail-active-account') as HTMLButtonElement;
    activeBtn.addEventListener('click', async () => {
        await activeCurrentAccount(activeBtn);
    });

    const contactAddBtn = document.getElementById("contact-btn-new") as HTMLButtonElement;
    contactAddBtn.addEventListener('click', async () => {
        initContactBtn(true);
        showView('#onboarding/contact-operation', router);
    })
}


export async function loadAndSetupAccount(force?: boolean) {
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


export async function populateDashboard() {
    try {
        showLoading();
        await loadAndSetupAccount();
        queryCurrentEmailAddr();
    } catch (err) {
        console.log("------>>> populate dashboard failed:", err);
    } finally {
        hideLoading();
    }
    // await loadContact();
}

async function quitThisAccount() {
    const rsp = await sendMessageToBackground(null, MsgType.WalletClose);
    if (!rsp || rsp.success <= 0) {
        showDialog("Error", "failed to quit");
        return
    }
    showView('#onboarding/main-login', router);
}

async function showUserKeyStore() {
    try {
        const wallet = await queryCurWallet();
        if (!wallet) {
            throw new Error("Wallet not found");
        }
        const keyStoreStr = JSON.stringify(wallet, null, 4);

        showDialog("key store", keyStoreStr, "Copy", async function () {
            await navigator.clipboard.writeText(keyStoreStr);
            alert("Copy success");
            return true;
        })
    } catch (e) {
        const err = e as Error;
        showDialog("Error", err.message);
    }
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
        const payload: AccountOperation = AccountOperation.create({
            isDel: false,
            address: address,
        });

        const message = AccountOperation.encode(payload).finish()
        const signature = await signDataByMessage(encodeHex(message));
        if (!signature) {
            throw new Error("sign data failed")
        }
        const srvRsp = await BMRequestToSrv("/account_create", address, message, signature)
        console.log("------->>>fetch success:=>", srvRsp);
        actBtn.style.display = 'none';
        await loadAndSetupAccount(true);

    } catch (e) {
        console.log("------->>>fetch failed:=>", e);
        showDialog("error", JSON.stringify(e));
    } finally {
        hideLoading();
    }
}