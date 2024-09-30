export const __injectRequests: { [key: string]: InjectRequest } = {}

interface InjectRequest {
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}

export class InjectResult {
    success: boolean;
    data: any;
    error?: Error;

    constructor(success: boolean, data: any, error?: Error) {
        this.success = success;
        this.data = data;
        this.error = error;
    }
}

export class EventData {
    id: string;
    flag: string;
    type: string;
    params: any;

    constructor(id: string, flag: string, type: string, params: any) {
        this.id = id;
        this.flag = flag;
        this.type = type;
        this.params = params;
    }
}