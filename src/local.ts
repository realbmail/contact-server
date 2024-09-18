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

    let btn = document.querySelector('#view-recovery-phrase .primary-button') as HTMLButtonElement;
    btn.textContent = browser.i18n.getMessage('home_next_step');

    document.getElementById('import-password-label1')!.textContent = browser.i18n.getMessage('home_password_label');
    document.getElementById('import-password-label2')!.textContent = browser.i18n.getMessage('home_password_label');

    let input = document.getElementById('imported-new-password') as HTMLInputElement;
    input!.placeholder = browser.i18n.getMessage('home_password_placeholder');
    input = document.getElementById('imported-confirm-password') as HTMLInputElement;
    input!.placeholder = browser.i18n.getMessage('home_password_placeholder2');
    document.getElementById('import-new-account-btn')!.textContent = browser.i18n.getMessage('home_wallet_create_btn');

    btn = document.querySelector('#view-confirm-recovery .primary-button') as HTMLButtonElement;
    btn.textContent = browser.i18n.getMessage('home_confirm_import');

    document.getElementById('import-container-tip')!.textContent = browser.i18n.getMessage('import_container_tip');

    btn = document.querySelector('#view-import-wallet .primary-button') as HTMLButtonElement;
    btn.textContent = browser.i18n.getMessage('home_confirm_recovery');

    document.getElementById("error-message")!.textContent = browser.i18n.getMessage('recover_error_message');
    document.getElementById("current-wallet-address-lbl")!.textContent = browser.i18n.getMessage('wallet_address_lbl');

    document.getElementById("account_level_free")!.textContent = browser.i18n.getMessage('account_level_free');
    document.getElementById("account_level_free_unit")!.textContent = browser.i18n.getMessage('account_level_free_unit');
    document.querySelectorAll(".account_level_p2p_encryption").forEach(div => {
        div.textContent = browser.i18n.getMessage('p2p_encryption');
    });
    document.querySelectorAll(".account_level_bind_address").forEach(div => {
        div.textContent = browser.i18n.getMessage('bind_address');
    });

    document.getElementById("account_level_normal")!.textContent = browser.i18n.getMessage('account_level_normal');
    document.getElementById("account_level_normal_unit")!.innerText = browser.i18n.getMessage('normal_price_label');

    document.querySelectorAll(".attachment_p2p_encryption").forEach(div => {
        div.textContent = browser.i18n.getMessage('attachment_encryption');
    })

    document.getElementById("account_level_plus")!.textContent = browser.i18n.getMessage('account_level_plus');
    document.getElementById("account_level_plus_unit")!.textContent = browser.i18n.getMessage('account_level_plus_unit');

    document.getElementById("account_level_enterprise")!.textContent = browser.i18n.getMessage('account_level_enterprise');
    document.getElementById("account_level_enterprise_unit")!.textContent = browser.i18n.getMessage('account_level_enterprise_unit');

    document.querySelectorAll(".account_level_sdk").forEach(div => {
        div.textContent = browser.i18n.getMessage('account_level_sdk');
    })

    document.querySelectorAll(".bind_address_no_limit").forEach(div => {
        div.textContent = browser.i18n.getMessage('bind_address_no_limit');
    })

    document.querySelectorAll(".ens_address").forEach(div => {
        div.textContent = browser.i18n.getMessage('ens_address');
    })

    document.getElementById("price_val_money_lbl")!.textContent = browser.i18n.getMessage('price_val_money_lbl');
    document.getElementById("price_val_money_unit")!.textContent = browser.i18n.getMessage('price_val_money_unit');
    document.getElementById("price_val_money_action")!.textContent = browser.i18n.getMessage('price_val_money_action');
    document.getElementById("active_account")!.textContent = browser.i18n.getMessage('active_account');

}

export function translateMainPage() {
    document.getElementById('bmail-address-lbl')!.textContent = browser.i18n.getMessage('address_label');
    document.getElementById('bmail-email-address-lbl')!.textContent = browser.i18n.getMessage('email_label');
}