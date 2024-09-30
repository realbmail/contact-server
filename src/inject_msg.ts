export const __injectRequests: { [key: string]: InjectRequest } = {}

interface InjectRequest {
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