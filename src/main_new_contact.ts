import {showView} from "./common";
import {router} from "./main_common";

export function initNewContactView(): void {
    const returnBtn = document.getElementById("view-contact-return") as HTMLButtonElement;
    returnBtn.addEventListener('click', async () => {
        showView('#onboarding/main-dashboard', router);
    })

    const addBtn = document.getElementById("contact-new-add-btn") as HTMLButtonElement;
    addBtn.addEventListener('click', async () => {
        await addContactToSrv();
    })
}



async function addContactToSrv(){

}