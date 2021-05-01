/// <reference types="node" />
import * as http from "https";
export declare function conclude(resolve: () => void, reject: (err?: Error | undefined) => void, message?: string): (err?: Error | undefined) => void;
export declare class Requester {
    private URL;
    private BASE_PATH;
    logFileName?: string;
    constructor(URL: string, BASE_PATH: string);
    requerimiento<TRec, T2Send extends {}>(path: string, data2send: T2Send, headers: http.RequestOptions['headers'], tipo?: 'text' | null, method?: 'GET' | 'POST' | null): Promise<TRec>;
}
