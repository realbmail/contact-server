import {populateDashboard} from "./main_dashboard";

export const __currentAccountAddress = "__current_wallet_storage_key_"
export const __systemSetting = "__system_setting_"
export const __currentAccountData = "__current_account_data_";


export function router(path: string): void {
    if (path === '#onboarding/main-dashboard') {
        populateDashboard().then();
    }
}

export function hideDialog(): void {
    const dialogContainer = document.getElementById('dialog-tips-container') as HTMLDivElement;
    dialogContainer.style.display = 'none';
}

export function showLoading(): void {
    document.body.classList.add('loading');
    document.getElementById("dialog-waiting-overlay")!.style.display = 'flex';
}

export function hideLoading(): void {
    document.body.classList.remove('loading');
    document.getElementById("dialog-waiting-overlay")!.style.display = 'none';
}

export function showDialog(title: string, message: string, confirmButtonText?: string, confirmCallback?: () => boolean): void {
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
