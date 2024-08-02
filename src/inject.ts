interface BMail {
    version: string;
    connect: () => void;
}

function createBmailObj() {
    (window as any).bmail = {
        version: '1.0.0',
        connect: function () {
            console.log('bmail connect function called');
        }
    };
    console.log("++++++>>>bmail initialized");
}

function bmailInfo() {
    console.log('bmail action triggered');
}

createBmailObj();
(window as any).bmailInfo = bmailInfo;

