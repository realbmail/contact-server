import browser from "webextension-polyfill";

const storage = browser.storage;

export async function sessionSet(key: string, value: any): Promise<void> {
    try {
        await storage.session.set({[key]: value});
    } catch (error: unknown) {
        const err = error as Error;
        console.error("[service work] Failed to set value:", err);
    }
}

export async function sessionGet(key: string): Promise<any> {
    try {
        const result = await storage.session.get(key);
        return result[key];
    } catch (error: unknown) {
        const err = error as Error;
        console.error("[service work] Failed to get value:", err);
        return null;
    }
}

export async function sessionRemove(key: string): Promise<void> {
    try {
        await storage.session.remove(key);
        console.log("[service work] Value was removed successfully.");
    } catch (error) {
        console.error("[service work] Failed to remove value:", error);
    }
}
