import {Inject_Msg_Flag, MsgType} from "./consts";
import {__injectRequests, BmailError, EventData, InjectResult} from "./inject_msg";

function createBmailObj() {
    (window as any).bmail = {
        version: '1.2.5',
        connect: async function (): Promise<any> {
            return await __injectCall(MsgType.QueryCurBMail, {});
        }
    };
    console.log("++++++>>>bmail object inject success");
}

function dispatchMessage() {
    window.addEventListener("message", (event) => {
        if (event.source !== window || !event.data) return;

        const eventData = event.data as EventData;
        if (!eventData || eventData.flag !== Inject_Msg_Flag || eventData.toPlugin) return;

        const processor = __injectRequests[eventData.id];
        if (!processor) return;

        // console.log("------>>> got message:", eventData);
        const result = eventData.params as InjectResult;

        if (!result) {
            const error = new BmailError(-2, "No valid response").toJSON();
            processor.reject(error);
            delete __injectRequests[eventData.id];
            return;
        }

        if (!result.success || result.error) {
            processor.reject(result.error);
        } else {
            processor.resolve(result.data);
        }

        delete __injectRequests[eventData.id];
    });
}

function initBmailInjection() {
    createBmailObj();
    dispatchMessage();
}

initBmailInjection();


function __injectCall(type: string, params: any): Promise<any> {
    const id = Math.random().toString().slice(-4);
    return new Promise((resolve, reject) => {
        __injectRequests[id] = {resolve, reject};
        const event = new EventData(id, Inject_Msg_Flag, type, params, true);
        window.postMessage(event, '*');

        setTimeout(() => {
            if (__injectRequests[id]) {
                reject(new Error('Request timed out'));
                delete __injectRequests[id];
            }
        }, 10000); // 超时处理
    });
}