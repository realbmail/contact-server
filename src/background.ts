/// <reference lib="webworker" />
import browser, { Runtime } from "webextension-polyfill";
const runtime = browser.runtime;
const storage = browser.storage;
const alarms = browser.alarms;
const tabs = browser.tabs;

async function sessionSet(key: string, value: any): Promise<void> {
    try {
        await storage.session.set({[key]: value});
        console.log("[service work] Value was set successfully.", value);
    } catch (error: unknown) {
        const err = error as Error;
        console.error("[service work] Failed to set value:", err);
    }
}

async function sessionGet(key: string): Promise<any> {
    try {
        const result = await storage.session.get(key);
        console.log("[service work] Value is:", result[key]);
        return result[key];
    } catch (error: unknown) {
        const err = error as Error;
        console.error("[service work] Failed to get value:", err);
        return null;
    }
}

async function sessionRemove(key: string): Promise<void> {
    try {
        await storage.session.remove(key);
        console.log("[service work] Value was removed successfully.");
    } catch (error) {
        console.error("[service work] Failed to remove value:", error);
    }
}

browser.runtime.onMessage.addListener((message: any, sender: Runtime.MessageSender, sendResponse: (response: any) => void) => {
    if (message.action === 'addContentScript' && message.urlPattern) {
        sendResponse({status: 'success'});
    }
});
