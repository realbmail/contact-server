import {isValidUrl} from "./common";
import {showDialog} from "./main_common";

export function initSetting() {
    const saveContactServerBtn = document.getElementById("contact-server-save") as HTMLButtonElement;
    saveContactServerBtn.addEventListener("click", saveNewContactServer);
}

export async function populateSystemSetting() {
    // const contactSrvInput = document.getElementById('contact-server-val') as HTMLInputElement;
    // contactSrvInput.value = getContactSrv();
}

function saveNewContactServer() {
    const contactSrvInput = document.getElementById('contact-server-val') as HTMLInputElement;
    const serverAddress = contactSrvInput.value;
    if (!isValidUrl(serverAddress)) {
        showDialog("Tips", "invalid url value");
        return;
    }
}