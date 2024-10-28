import {__currentDatabaseVersion, __tableSystemSetting, databaseUpdate, getMaxIdRecord} from "./database";

export class SysSetting {
    id: number;
    curContactSrv: string;
    contactList: string[];

    constructor(id: number, contact: string, srvList: string[]) {
        this.id = id;
        this.curContactSrv = contact;
        this.contactList = srvList;
    }

    async syncToDB(): Promise<void> {
        await databaseUpdate(__tableSystemSetting, this.id, this);
    }
}

export async function loadLastSystemSetting(): Promise<SysSetting> {
    const ss = await getMaxIdRecord(__tableSystemSetting);
    if (ss) {
        return new SysSetting(ss.id, ss.address, ss.network);
    }
    return new SysSetting(__currentDatabaseVersion, __officialContactSrv, [__officialContactSrv]);
}

// const httpServerUrl = "https://sharp-happy-grouse.ngrok-free.app"
// const httpServerUrl = "http://127.0.0.1:8001"
let __officialContactSrv = "https://bmail.simplenets.org:8443"

export function getContactSrv(): string {
    return __officialContactSrv;
}
