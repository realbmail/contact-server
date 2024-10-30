import {hideLoading, isValidUrl, showLoading, showView} from "./common";
import {showToastMessage} from "./main_common";
import {__officialContactSrv, addContactSrv, changeCurrentSrv, getSystemSetting, removeContractSrv} from "./setting";

export function initSetting() {
    const backBtn = document.getElementById("system-back-btn") as HTMLButtonElement;
    backBtn.addEventListener("click", () => {
        showView('#onboarding/main-dashboard');
    });

    const newItemBtn = document.getElementById("contact-server-add") as HTMLButtonElement;
    newItemBtn.addEventListener("click", addNewContactItem);

    const dropdownToggle = document.getElementById('dropdown-toggle') as HTMLButtonElement;
    const dropdownMenu = document.getElementById('server-dropdown-menu') as HTMLDivElement;
    dropdownToggle.addEventListener('click', () => {
        dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', (event) => {
        if (!dropdownToggle.contains(event.target as Node)) {
            dropdownMenu.style.display = "none";
        }
    });
}

export async function populateSystemSetting() {
    const serverListElm = document.getElementById('contact-server-list') as HTMLDivElement;
    const dropdownMenu = serverListElm.querySelector('.dropdown-menu') as HTMLDivElement;
    const selectedItem = document.getElementById('selected-item') as HTMLSpanElement;
    const templateItem = document.getElementById('contact-server-item-template') as HTMLDivElement;

    dropdownMenu.innerHTML = '';
    const setting = await getSystemSetting();

    let selectedValue = setting.contactSrv;
    selectedItem.textContent = selectedValue;

    setting.contactList.forEach((item) => {
        const optionDiv = templateItem.cloneNode(true) as HTMLDivElement;
        optionDiv.style.display = 'flex';
        optionDiv.removeAttribute('id');

        const span = optionDiv.querySelector('.contact-server-item-val') as HTMLSpanElement;
        span.textContent = item;

        if (item === selectedValue) {
            optionDiv.classList.add('selected');
        }

        optionDiv.addEventListener('click', () => contactSrvChanged(item, selectedItem, dropdownMenu, optionDiv));

        const deleteButton = optionDiv.querySelector('.contact-server-item-del-btn') as HTMLButtonElement;
        if (item === __officialContactSrv) {
            deleteButton.style.display = 'none';
        } else {
            deleteButton.addEventListener('click', () => removeContactItem(item, selectedItem, optionDiv, dropdownMenu));
        }
        dropdownMenu.appendChild(optionDiv);
    });
}

async function removeContactItem(srv: string, selectedItem: HTMLSpanElement,
                                 optionDiv: HTMLDivElement, dropdownMenu: HTMLDivElement) {
    showLoading();

    try {
        dropdownMenu.removeChild(optionDiv);

        const newSetting = await removeContractSrv(srv);

        dropdownMenu.querySelectorAll('.contact-server-item').forEach(el => {
            el.classList.remove('selected');
            const val = el.textContent?.trim();
            if (newSetting.contactSrv === val) {
                el.classList.add('selected');
                selectedItem.textContent = val;
            }
        });

        showToastMessage("remove success");

    } catch (e) {
        const err = e as Error;
        showToastMessage(err.message);
    } finally {
        hideLoading();
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

async function contactSrvChanged(selectedValue: string, selectedItem: HTMLSpanElement,
                                 dropdownMenu: HTMLDivElement, optionDiv: HTMLDivElement) {

    showLoading();
    try {
        selectedItem.textContent = selectedValue;
        dropdownMenu.style.display = 'none';
        dropdownMenu.querySelectorAll('.contact-server-item').forEach(el => el.classList.remove('selected'));
        optionDiv.classList.add('selected');
        await changeCurrentSrv(selectedValue);
    } catch (e) {
        const err = e as Error;
        showToastMessage(err.message);
    } finally {
        hideLoading();
    }

}
