import {__currentDatabaseVersion, __tableSystemSetting, databaseUpdate, getMaxIdRecord} from "./database";

export class SysSetting {
    id: number;
    address: string;
    network: string;

    constructor(id: number, addr: string, network: string) {
        this.id = id;
        this.address = addr;
        this.network = network;
    }

    async syncToDB(): Promise<void> {
        await databaseUpdate(__tableSystemSetting, this.id, this);
    }

    async changeAddr(addr: string): Promise<void> {
        this.address = addr;
        await databaseUpdate(__tableSystemSetting, this.id, this);
    }
}

export async function loadLastSystemSetting(): Promise<SysSetting> {
    const ss = await getMaxIdRecord(__tableSystemSetting);
    if (ss) {
        return new SysSetting(ss.id, ss.address, ss.network);
    }
    return  new SysSetting(__currentDatabaseVersion, '', '');
}
