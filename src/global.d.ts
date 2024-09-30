export {};
declare global {
    interface Window {
        bmail: {
            version: string;
            connect: () => Promise<any>;
            onEmailQuery: QueryEmailAddr | null;
        };
    }
}
type QueryEmailAddr = () => string | null | undefined;
