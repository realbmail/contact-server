import {Inject_Msg_Flag, Plugin_Request_Timeout} from "./consts";

export const __injectRequests: { [key: string]: InjectRequest } = {}

export interface InjectRequest {
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}

export class BmailError extends Error {
    code: number;

    constructor(code: number, message: string | any) {
        super(message);
        this.code = code;
        this.name = this.constructor.name;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    toJSON() {
        return {
            code: this.code,
            message: this.message,
            name: this.name
        };
    }
}

export class InjectResult {
    success: boolean;
    data: any;
    error?: any;

    constructor(success: boolean, data: any, error?: any) {
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
    toPlugin: boolean;

    constructor(id: string, flag: string, type: string, params: any, toPlugin?: boolean) {
        this.id = id;
        this.flag = flag;
        this.type = type;
        this.params = params;
        this.toPlugin = toPlugin ?? false;
    }
}

export function injectCall(type: string, params: any, fromClientToPlugin?: boolean): Promise<any> {
    const id = Math.random().toString().slice(-4);
    return new Promise((resolve, reject) => {
        __injectRequests[id] = {resolve, reject};
        const event = new EventData(id, Inject_Msg_Flag, type, params, fromClientToPlugin);
        window.postMessage(event, '*');

        setTimeout(() => {
            if (__injectRequests[id]) {
                reject(new Error('Request timed out'));
                delete __injectRequests[id];
            }
        }, Plugin_Request_Timeout);
    });
}

export function wrapResponse(id: string, type: string, response: any, toPlugin?: boolean): EventData {
    let result: InjectResult;
    if (response.success <= 0) {
        const error = new BmailError(response.success, response.data).toJSON();
        result = new InjectResult(false, null, error);
    } else {
        result = new InjectResult(true, response.data);
    }
    return new EventData(id, Inject_Msg_Flag, type, result, toPlugin);
}

