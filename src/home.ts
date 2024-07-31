import {initDatabase} from "./database";
import {showView} from "./common";
import {translateHomePage} from "./local";

document.addEventListener("DOMContentLoaded", initWelcomePage as EventListener);
async function initWelcomePage(): Promise<void> {
    await initDatabase();
    translateHomePage();
    initWelcomeDiv();

    window.addEventListener('hashchange', function () {
        showView(window.location.hash, router);
    });

    showView(window.location.hash || '#onboarding/welcome', router);

    (window as any).navigateTo = navigateTo;
}

function initWelcomeDiv(): void {
    const agreeCheckbox = document.getElementById('user-consent') as HTMLInputElement;
    const createButton = document.getElementById('create-account-btn') as HTMLButtonElement;
    const importButton = document.getElementById('import-account-btn') as HTMLButtonElement;

    createButton.addEventListener('click', () => {
        navigateTo('#onboarding/create-password');
    });

    createButton.disabled = !agreeCheckbox.checked;
    agreeCheckbox.addEventListener('change', () => {
        createButton.disabled = !agreeCheckbox.checked;
    });

    importButton.addEventListener('click', importWallet);
}
function navigateTo(hash: string): void {
    history.pushState(null, '', hash);
    showView(hash, router);
}

function router(path: string): void {
    if (path === '#onboarding/recovery-phrase') {
        // displayMnemonic();
    }
    if (path === '#onboarding/confirm-recovery') {
        // displayConfirmVal();
    }
    if (path === '#onboarding/import-wallet') {
        // generateRecoveryPhraseInputs();
    }
    if (path === '#onboarding/account-home') {
        // prepareAccountData();
    }
}

function importWallet(): void {
    navigateTo('#onboarding/import-wallet');
    // generateRecoveryPhraseInputs();
}