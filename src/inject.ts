import {Inject_Msg_Flag, MsgType} from "./consts";
import {__injectRequests, EventData, injectCall, procResponse, wrapResponse} from "./inject_msg";

function createBmailObj() {
    window.bmail = {
        version: '1.2.5',
        connect: async function (): Promise<any> {
            return await injectCall(MsgType.QueryCurBMail, {}, true);
        },
        onEmailQuery: null  // 类型已经定义为 QueryEmailAddr | null
    };
    console.log("++++++>>>bmail object inject success");
}

function queryEmailForPlugin(eventData: EventData) {
    let rspEvent: EventData;
    if (!window.bmail || !window.bmail.onEmailQuery) {
        rspEvent = wrapResponse(eventData.id, eventData.type, {
            success: -1,
            data: "no email query callback found"
        }, true);
    } else {
        const email = window.bmail.onEmailQuery();
        rspEvent = wrapResponse(eventData.id, eventData.type, {success: true, data: email}, true);
    }
    window.postMessage(rspEvent, "*");
}

function procPluginRequest(eventData: EventData) {
    switch (eventData.type) {
        case MsgType.QueryCurEmail:
            queryEmailForPlugin(eventData);
            break;
        default:
            return;
    }
}

function dispatchMessage() {
    window.addEventListener("message", (event) => {
        if (event.source !== window || !event.data) return;

        const eventData = event.data as EventData;
        if (!eventData || eventData.flag !== Inject_Msg_Flag || eventData.toPlugin) return;

        console.log("-------->>> got message from background:=>", eventData.type)

        const processor = __injectRequests[eventData.id];
        if (processor) {
            procResponse(processor, eventData);
            return;
        }

        procPluginRequest(eventData);
    });
}

function initBmailInjection() {
    createBmailObj();
    dispatchMessage();
}

initBmailInjection();

