import {populateDashboard} from "./main_dashboard";
import {populateSystemSetting} from "./main_setting";

export const __currentAccountAddress = "__current_wallet_storage_key_"
export const __currentAccountData = "__current_account_data_";

export enum UserLevel {
    UserLevelInActive = 0,
    UserLevelFree,
    UserLevelBronze,
    UserLevelSilver,
    UserLevelGold
}

export function router(path: string): void {
    if (path === '#onboarding/main-dashboard') {
        populateDashboard().then();
    } else if (path === '#onboarding/network-setting') {
        populateSystemSetting().then();
    }
}

export function hideDialog(): void {
    const dialogContainer = document.getElementById('dialog-tips-container') as HTMLDivElement;
    dialogContainer.style.display = 'none';
}

type dialogAction = () => Promise<boolean>;
let __dialogOkCallback: dialogAction | null | undefined = null;
let __dialogCancelCallback: dialogAction | null | undefined = null;

function dialogOkAction() {

}

function dialogCancelAction() {

}

export function initDialogAction() {
    const closeButton = document.getElementById('dialog-tips-close-button') as HTMLButtonElement;
    closeButton.addEventListener('click', dialogCancelAction);
    const confirmButton = document.getElementById('dialog-tips-confirm-button') as HTMLButtonElement;
    confirmButton.addEventListener('click', dialogOkAction);
}

export function showDialog(title: string, message: string,
                           confirmButtonText?: string, confirmCallback?: dialogAction,
                           cancelCallback?: dialogAction): void {
    const dialogContainer = document.getElementById('dialog-tips-container') as HTMLDivElement;
    const dialogTitle = document.getElementById('dialog-tips-title') as HTMLHeadingElement;
    const dialogMessage = document.getElementById('dialog-tips-message') as HTMLParagraphElement;
    let confirmButton = document.getElementById('dialog-tips-confirm-button') as HTMLButtonElement;

    __dialogOkCallback = confirmCallback;
    __dialogCancelCallback = cancelCallback;

    dialogTitle.innerText = title;
    dialogMessage.innerText = message;
    if (confirmButtonText) {
        confirmButton.innerText = confirmButtonText;
    } else {
        confirmButton.innerText = 'OK';
    }

    confirmButton.replaceWith(confirmButton.cloneNode(true));
    confirmButton = document.getElementById('dialog-tips-confirm-button') as HTMLButtonElement;

    confirmButton.addEventListener('click', async () => {

    });

    dialogContainer.style.display = 'flex';
}

export function showToastMessage(content: string): void {
    const tipElement = document.getElementById('toast-tip-dialog');
    const contentElement = tipElement?.getElementsByClassName('tip-content')[0] as HTMLElement;

    if (contentElement) {
        contentElement.textContent = content;
    }

    if (tipElement) {
        tipElement.style.display = 'block';

        setTimeout(() => {
            tipElement.style.display = 'none';
        }, 2000);
    }
}
