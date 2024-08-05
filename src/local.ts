import browser from "webextension-polyfill";

export function translateHomePage() {
    document.title = browser.i18n.getMessage('home_title');
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

    document.getElementById('import-password-label1')!.textContent = browser.i18n.getMessage('home_password_label');
    document.getElementById('import-password-label2')!.textContent = browser.i18n.getMessage('home_password_label');

    let input = document.getElementById('imported-new-password') as HTMLInputElement;
    input!.placeholder = browser.i18n.getMessage('home_password_placeholder');
    input = document.getElementById('imported-confirm-password') as HTMLInputElement;
    input!.placeholder = browser.i18n.getMessage('home_password_placeholder2');
    document.getElementById('import-new-account-btn')!.textContent = browser.i18n.getMessage('home_wallet_create_btn');

    let btn = document.querySelector('#view-recovery-phrase .primary-button') as HTMLButtonElement;
    btn.textContent = browser.i18n.getMessage('home_next_step');

    btn = document.querySelector('#view-confirm-recovery .primary-button') as HTMLButtonElement;
    btn.textContent = browser.i18n.getMessage('home_confirm_import');

    document.getElementById('import-container-tip')!.textContent = browser.i18n.getMessage('import_container_tip');

    btn = document.querySelector('#view-import-wallet .primary-button') as HTMLButtonElement;
    btn.textContent = browser.i18n.getMessage('home_confirm_recovery');

}

export function translateMainPage() {
    document.getElementById('bmail-address-lbl')!.textContent = browser.i18n.getMessage('address_label');
    document.getElementById('bmail-email-address-lbl')!.textContent = browser.i18n.getMessage('email_label');
}