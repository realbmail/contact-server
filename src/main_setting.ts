import {hideLoading, isValidUrl, showLoading, showView} from "./common";
import {showDialog, showToastMessage} from "./main_common";
import {addContactSrv, changeCurrentSrv, getSystemSetting} from "./setting";

export function initSetting() {
    const backBtn = document.getElementById("system-back-btn") as HTMLButtonElement;
    backBtn.addEventListener("click", () => {
        showView('#onboarding/main-dashboard');
    });

    const serverListElm = document.getElementById('contact-server-list') as HTMLSelectElement;
    serverListElm.addEventListener('change', () => contactSrvChanged(serverListElm));

    const newItemBtn = document.getElementById("contact-server-add") as HTMLButtonElement;
    newItemBtn.addEventListener("click", addNewContactItem);
}

export async function populateSystemSetting() {
    const serverListElm = document.getElementById('contact-server-list') as HTMLSelectElement;
    serverListElm.innerHTML = '';
    const ss = await getSystemSetting();
    const itemElm = document.getElementById('contact-server-item-template')!;

    for (let i = 0; i < ss.contactList.length; i++) {
        const item = ss.contactList[i];
        const clone = itemElm.cloneNode(true) as HTMLOptionElement;
        clone.removeAttribute('id');
        clone.value = item;
        clone.textContent = item;
        serverListElm.appendChild(clone);
        if (item === ss.contactSrv) {
            serverListElm.selectedIndex = i;
        }
    }
}

async function addNewContactItem() {
    const contactSrvInput = document.getElementById('contact-server-val') as HTMLInputElement;
    const serverAddress = contactSrvInput.value;

    if (!isValidUrl(serverAddress)) {
        showToastMessage("invalid url value");
        return;
    }
    showLoading();
    try {
        await addContactSrv(serverAddress);
        await populateSystemSetting();
        showToastMessage("add success");
    } catch (e) {
        const err = e as Error;
        showToastMessage(err.message);
    } finally {
        hideLoading();
    }
}

async function contactSrvChanged(selectElement: HTMLSelectElement) {
    const selectedIndex = selectElement.selectedIndex;
    const options = selectElement.options;
    const contactItem = options[selectedIndex].value;

    showDialog("Tips", "Need sign in again", "sing in again", async () => {
        await changeCurrentSrv(contactItem);
        showView('#onboarding/main-login');
        return true;
    });
}
