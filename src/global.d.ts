export {};
declare global {
    interface Window {
        bmail: {
            version: string;
            connect: () => Promise<any>;
            onEmailQuery: QueryEmailAddr | null;
            encryptMailTxt: (emailAddr: string[], plainTxt: string) => Promise<any>;
            decryptMailTxt: (cipherText: string) => Promise<any>;
        };
    }
}

type QueryEmailAddr = () => string | null | undefined;
