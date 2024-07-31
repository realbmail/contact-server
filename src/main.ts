import browser from "webextension-polyfill";

// Function to send message to background script
function addNewContentScript(urlPattern: string): void {
    browser.runtime.sendMessage({
        action: 'addContentScript',
        urlPattern: urlPattern
    }).then((response: { status: string }) => {
        if (response.status === 'success') {
            console.log(`Request to add content script for ${urlPattern} was successful.`);
        } else {
            console.log(`Failed to add content script for ${urlPattern}.`);
        }
    });
}
