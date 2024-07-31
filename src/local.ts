import browser from "webextension-polyfill";

export function translateHomePage() {
    document.getElementById('user-consent-label')!.textContent = browser.i18n.getMessage('home_user_content');
    document.getElementById('create-account-btn')!.textContent = browser.i18n.getMessage('home_wallet_create');
    document.getElementById('import-account-btn')!.textContent = browser.i18n.getMessage('home_wallet_import');
}

