export {};
declare global {
    interface Window {
        bmail: {
            version: string;
            connect: () => Promise<any>;
            setupEmail: (userEmail: string) => Promise<any>;
            encryptMailTxt: (emailAddr: string[], plainTxt: string) => Promise<any>;
            decryptMailTxt: (cipherText: string) => Promise<any>;
        };
    }
}

