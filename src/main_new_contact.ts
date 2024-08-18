import {BMRequestToSrv, encodeHex, isValidEmail, showView, signDataByMessage} from "./common";
import {__currentAccountAddress, hideLoading, router, showDialog, showLoading} from "./main_common";
import {MailKey} from "./wallet";
import {ContactOperation, ContactItem} from "./proto/bmail_srv";
import {sessionGet} from "./session_storage";

export function initNewContactView(): void {
    const returnBtn = document.getElementById("view-contact-return") as HTMLButtonElement;
    returnBtn.addEventListener('click', async () => {
        showView('#onboarding/main-dashboard');
    })

    const addBtn = document.getElementById("contact-new-add-btn") as HTMLButtonElement;
    addBtn.addEventListener('click', async () => {
        await addContactToSrv();
    })
}

function parseContactValue(): ContactItem | null {
    const emailInput = document.getElementById("contact-new-email-val") as HTMLInputElement;
    const emailError = document.getElementById("contact-new-email-error") as HTMLInputElement;
    if (!isValidEmail(emailInput.value)) {
        emailError.innerText = "Please enter a valid email";
        emailError.style.display = "block";
        return null;
    }
    emailError.style.display = "none";

    const bmailInput = document.getElementById("contact-new-account-val") as HTMLInputElement;
    const bmailError = document.getElementById("contact-new-account-error") as HTMLInputElement;

    if (!MailKey.isValidAddress(bmailInput.value)) {
        bmailError.innerText = "Please enter a valid bmail address";
        bmailError.style.display = "block";
        return null;
    }
    bmailError.style.display = "none";

    const nickName = document.getElementById("contact-new-nick-val") as HTMLInputElement;
    const nickNameVal = nickName.value ?? "";
    const remark = document.getElementById("contact-new-remark-val") as HTMLInputElement;
    const remarkVal = remark.value ?? "";

    return ContactItem.create({
        address: bmailInput.value,
        email: emailInput.value,
        nickName: nickNameVal,
        remark: remarkVal,
    });
}

async function addContactToSrv() {
    const contact = parseContactValue();
    if (!contact) {
        return;
    }

    const accountAddr = await sessionGet(__currentAccountAddress);
    if (!accountAddr) {
        console.log("------>>>fatal logic error, no wallet found!");
        showView('#onboarding/main-login', router);
        return;
    }
    const address = accountAddr.bmail_address;

    showLoading();
    try {
       const operation = ContactOperation.create({
           ownerAddress:address,
           isDel:false,
           contacts:[contact],
        })
        const message = ContactOperation.encode(operation).finish()
        const signature = await signDataByMessage(encodeHex(message));
        if (!signature) {
            throw new Error("sign data failed")
        }
        await BMRequestToSrv("/operate_contact", address, message, signature);
        showView('#onboarding/main-dashboard', router);
    } catch (error) {
        console.log(error);
        const err = error as Error;
        showDialog("error", err.message);
    } finally {
        hideLoading();
    }
}