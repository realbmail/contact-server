import browser from "webextension-polyfill";

export function translateHomePage() {
    document.getElementById('user-consent-label')!.textContent = browser.i18n.getMessage('home_user_content');
    document.getElementById('create-account-btn')!.textContent = browser.i18n.getMessage('home_wallet_create');
    document.getElementById('import-account-btn')!.textContent = browser.i18n.getMessage('home_wallet_import');

    document.getElementById('confirm-password-label1')!.textContent = browser.i18n.getMessage('home_password_label');
    document.getElementById('confirm-password-label2')!.textContent = browser.i18n.getMessage('home_password_label');
    let confirmPasswordInput = document.getElementById('home-create-password') as HTMLInputElement;
    confirmPasswordInput!.placeholder = browser.i18n.getMessage('home_password_placeholder');
     confirmPasswordInput = document.getElementById('home-confirm-password') as HTMLInputElement;
    confirmPasswordInput!.placeholder = browser.i18n.getMessage('home_password_placeholder2');
    document.getElementById('create-new-account-btn')!.textContent = browser.i18n.getMessage('home_wallet_create_btn');

}

