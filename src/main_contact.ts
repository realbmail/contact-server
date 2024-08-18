import {BMRequestToSrv, encodeHex, isValidEmail, showView, signDataByMessage} from "./common";
import {__currentAccountAddress, hideLoading, router, showDialog, showLoading} from "./main_common";
import {MailKey} from "./wallet";
import {ContactOperation, ContactItem, QueryReq, BMailAccount} from "./proto/bmail_srv";
import {sessionGet} from "./session_storage";

export function initContactView(): void {
    const returnBtn = document.getElementById("view-contact-return") as HTMLButtonElement;
    returnBtn.addEventListener('click', async () => {
        showView('#onboarding/main-dashboard');
    })

    const addBtn = document.getElementById("contact-new-add-btn") as HTMLButtonElement;
    const updateBtn = document.getElementById("contact-new-update-btn") as HTMLDivElement;
    const delBtn = document.getElementById("contact-new-del-btn") as HTMLDivElement;

    addBtn.addEventListener('click', async () => {
        await operateContactToSrv(false);
    })

    updateBtn.addEventListener('click', async () => {
        await operateContactToSrv(false);
    })

    delBtn.addEventListener('click', async () => {
        await operateContactToSrv(true);
    })
}

export function initContactBtn(isAdd: boolean, contact?: ContactItem) {
    const addBtn = document.getElementById("contact-new-add-btn") as HTMLButtonElement;
    const updateBtn = document.getElementById("contact-new-update-btn") as HTMLDivElement;
    const delBtn = document.getElementById("contact-new-del-btn") as HTMLDivElement;
    const emailInput = document.getElementById("contact-new-email-val") as HTMLInputElement;
    const bmailInput = document.getElementById("contact-new-account-val") as HTMLInputElement;
    const nickName = document.getElementById("contact-new-nick-val") as HTMLInputElement;
    const remark = document.getElementById("contact-new-remark-val") as HTMLInputElement;

    if (isAdd) {
        addBtn.style.display = "block";
        updateBtn.style.display = "none";
        delBtn.style.display = "none";
        emailInput.readOnly = false;
        emailInput.value  = "";
        bmailInput.value = "";
        nickName.value  = "";
        remark.value  ="";
        return;
    }

    addBtn.style.display = "none";
    updateBtn.style.display = "block";
    delBtn.style.display = "block";
    emailInput.readOnly = true;

    if(!contact) {
        return;
    }

    emailInput.value  = contact.email;
    bmailInput.value = contact.address;
    nickName.value  = contact.nickName;
    remark.value  = contact.remark;
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

async function operateContactToSrv(isDel: boolean) {
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
            isDel: isDel,
            contacts: [contact],
        })
        const message = ContactOperation.encode(operation).finish()
        const signature = await signDataByMessage(encodeHex(message));
        if (!signature) {
            throw new Error("sign data failed")
        }
        await BMRequestToSrv("/operate_contact", address, message, signature);
        showView('#onboarding/main-dashboard');
        await loadContact();
    } catch (error) {
        console.log(error);
        const err = error as Error;
        showDialog("error", err.message);
    } finally {
        hideLoading();
    }
}

export async function loadContact() {
    const accountAddr = await sessionGet(__currentAccountAddress);
    if (!accountAddr) {
        console.log("------>>>fatal logic error, no wallet found!");
        showView('#onboarding/main-login', router);
        return;
    }
    const address = accountAddr.bmail_address;
    //TODO::save last queried email
    const startEmail = "";
    showLoading();
    try {
        const query = QueryReq.create({
            address: address,
            oneEmailAddr: startEmail,
        })
        const message = QueryReq.encode(query).finish()
        const signature = await signDataByMessage(encodeHex(message));
        if (!signature) {
            throw new Error("sign data failed")
        }
        const rspData = await BMRequestToSrv("/query_contact", address, message, signature);
        if (!rspData) {
            console.log("------>>> no contact data")
            return;
        }
        const contacts = ContactOperation.decode(rspData) as ContactOperation;
        populateContactList(contacts.contacts, startEmail.length === 0);
    } catch (e) {
        const err = e as Error;
        console.log(err.message);
        showDialog("error", err.message);
    } finally {
        hideLoading();
    }
}

function populateContactList(contacts: ContactItem[], clean: boolean) {
    const parentDiv = document.getElementById("contact-list") as HTMLElement;
    const template = document.getElementById("contact-item-template") as HTMLElement;

    if (clean) {
        parentDiv.innerHTML = '';
    }

    contacts.forEach(contact => {
        const clone = template.cloneNode(true) as HTMLElement;
        clone.removeAttribute('id');
        clone.style.display = "block";

        clone.querySelector(".contact-detail-address")!.textContent = contact.address;
        clone.querySelector(".contact-detail-email")!.textContent = contact.email;
        clone.querySelector(".contact-detail-nickname")!.textContent = contact.nickName;
        clone.querySelector(".contact-detail-remark")!.textContent = contact.remark;
        const btn = clone.querySelector("button") as HTMLElement;
        btn.addEventListener('click', async (e) => {
            initContactBtn(false, contact);
            showView('#onboarding/contact-operation', router);
        })
        parentDiv.appendChild(clone);
    });
}